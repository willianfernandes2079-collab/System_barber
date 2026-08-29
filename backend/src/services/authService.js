const prisma = require("../config/prismaClient");
const userStore = require("../models/userStore");
const sessionStore = require("../models/sessionStore");
const { hashPassword, comparePassword } = require("../utils/hash");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signResetToken,
  verifyResetToken,
} = require("../utils/jwt");
const AppError = require("../utils/AppError");
const auditLogger = require("../utils/auditLogger");
const emailService = require("../services/emailService");

function msParaData(jwtExpiresIn) {
  // Converte "7d" / "30d" / "15m" em Date de expiração aproximada.
  const match = /^(\d+)([smhd])$/.exec(jwtExpiresIn);
  if (!match) return new Date(Date.now() + 15 * 60 * 1000);

  const [, quantidade, unidade] = match;

  const multiplicadores = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  return new Date(
    Date.now() +
      Number(quantidade) *
        multiplicadores[unidade],
  );
}

async function registrar(
  { nome, email, senha, telefone, cargo, barbeariaId },
  { requestUserId, requestUserNome } = {},
) {
  const senha_hash = await hashPassword(senha);

  let usuario;

  try {
    usuario = await userStore.create({
      nome,
      email,
      senha_hash,
      telefone,
      cargo,
      barbearia_id: barbeariaId || null,
    });
  } catch (err) {
    throw new AppError(
      err.message ||
        "Não foi possível criar o usuário.",
      409,
    );
  }

  auditLogger.registrar({
    usuarioId:
      requestUserId ||
      usuario.id,

    usuarioNome:
      requestUserNome ||
      usuario.nome,

    acao: `Usuário "${usuario.nome}" (${usuario.cargo}) foi criado.`,

    registroAfetado:
      `usuarios:${usuario.id}`,
  });

  return userStore.toPublicUser(
    usuario,
  );
}

async function login({
  email,
  senha,
  remember = false,
  userAgent,
  ip,
}) {
  const usuario =
    await userStore.findByEmail(
      email,
    );

  // Mensagem genérica de propósito: não revelar se o e-mail existe ou não.

  if (
    !usuario ||
    !usuario.ativo
  ) {
    throw new AppError(
      "Usuário ou senha inválidos.",
      401,
    );
  }

  const senhaConfere =
    await comparePassword(
      senha,
      usuario.senha_hash,
    );

  if (!senhaConfere) {
    throw new AppError(
      "Usuário ou senha inválidos.",
      401,
    );
  }

  const barbeariaIdInicial =
    usuario.barbearia_id ||
    null;

  const accessToken =
    signAccessToken(
      usuario,
      barbeariaIdInicial,
    );

  const {
    token: refreshToken,
    jti,
    expiresIn,
  } =
    signRefreshToken(usuario, {
      remember,
      barbeariaId:
        barbeariaIdInicial,
    });

  await sessionStore.criarSessao(
    usuario.id,
    jti,
    {
      expiresAt:
        msParaData(
          expiresIn,
        ).toISOString(),

      userAgent,
      ip,

      barbeariaId:
        barbeariaIdInicial,
    },
  );

  auditLogger.registrar({
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    acao: "Login realizado.",
    ip,
  });

  return {
    usuario:
      userStore.toPublicUser(
        usuario,
      ),

    accessToken,

    refreshToken,
  };
}

async function refresh({
  refreshToken,
}) {
  let payload;

  try {
    payload =
      verifyRefreshToken(
        refreshToken,
      );
  } catch {
    throw new AppError(
      "Sessão expirada. Faça login novamente.",
      401,
    );
  }

  const {
    sub: userId,
    jti,
  } = payload;

  const sessao =
    await sessionStore.obterSessaoValida(
      userId,
      jti,
    );

  if (!sessao) {
    throw new AppError(
      "Sessão inválida ou já encerrada.",
      401,
    );
  }

  const usuario =
    await userStore.findById(
      userId,
    );

  if (
    !usuario ||
    !usuario.ativo
  ) {
    throw new AppError(
      "Usuário não encontrado ou inativo.",
      401,
    );
  }

  const barbeariaId =
    sessao.barbearia_id ||
    null;

  const accessToken =
    signAccessToken(
      usuario,
      barbeariaId,
    );

  const usuarioPublico =
    userStore.toPublicUser(
      usuario,
    );

  usuarioPublico.barbearia_id =
    barbeariaId;

  return {
    accessToken,
    usuario: usuarioPublico,
  };
}

async function selecionarBarbearia({
  userId,
  refreshToken,
  barbeariaId,
}) {
  if (!barbeariaId) {
    throw new AppError(
      "Barbearia não informada.",
      422,
    );
  }

  let payload;

  try {
    payload =
      verifyRefreshToken(
        refreshToken,
      );
  } catch {
    throw new AppError(
      "Sessão expirada. Faça login novamente.",
      401,
    );
  }

  if (
    payload.sub !== userId
  ) {
    throw new AppError(
      "Sessão inválida.",
      401,
    );
  }

  const sessao =
    await sessionStore.obterSessaoValida(
      userId,
      payload.jti,
    );

  if (!sessao) {
    throw new AppError(
      "Sessão inválida ou já encerrada.",
      401,
    );
  }

  const usuario =
    await userStore.findById(
      userId,
    );

  if (
    !usuario ||
    !usuario.ativo
  ) {
    throw new AppError(
      "Usuário não encontrado ou inativo.",
      401,
    );
  }

  if (
    usuario.cargo !==
    "CLIENTE"
  ) {
    throw new AppError(
      "Somente clientes podem selecionar uma barbearia por este recurso.",
      403,
    );
  }

  const cliente =
    await prisma.cliente.findFirst({
      where: {
        email:
          usuario.email,

        ativo: true,

        vinculos_barbearias: {
          some: {
            barbearia_id:
              barbeariaId,

            ativo: true,

            barbearia: {
              ativo: true,
            },
          },
        },
      },

      select: {
        id: true,
        nome: true,
      },
    });

  if (!cliente) {
    throw new AppError(
      "Você não possui vínculo ativo com esta barbearia.",
      403,
    );
  }

  const barbearia =
    await prisma.barbearia.findFirst({
      where: {
        id: barbeariaId,
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
        ativo: true,
      },
    });

  if (!barbearia) {
    throw new AppError(
      "Barbearia não encontrada ou inativa.",
      404,
    );
  }

  const atualizada =
    await sessionStore.atualizarBarbearia(
      userId,
      payload.jti,
      barbeariaId,
    );

  if (!atualizada.count) {
    throw new AppError(
      "Não foi possível atualizar o contexto da sessão.",
      401,
    );
  }

  const accessToken =
    signAccessToken(
      usuario,
      barbeariaId,
    );

  auditLogger.registrar({
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    acao: `Barbearia "${barbearia.nome}" selecionada.`,
    registroAfetado:
      `barbearias:${barbearia.id}`,
  });

  return {
    accessToken,

    usuario:
      userStore.toPublicUser(
        usuario,
      ),

    barbearia,
  };
}

async function logout({
  refreshToken,
}) {
  try {
    const payload =
      verifyRefreshToken(
        refreshToken,
      );

    await sessionStore.revogarSessao(
      payload.sub,
      payload.jti,
    );
  } catch {
    // Token já inválido/expirado — nada a revogar, mas não é um erro fatal
    // para quem está tentando sair.
  }

  return true;
}

async function logoutTodasSessoes({
  userId,
  userNome,
}) {
  await sessionStore.revogarTodasSessoes(
    userId,
  );

  auditLogger.registrar({
    usuarioId: userId,
    usuarioNome: userNome,
    acao:
      "Todas as sessões foram encerradas.",
  });

  return true;
}

async function atualizarPerfil({
  userId,
  userNome,
  nome,
  telefone,
}) {
  const usuario =
    await userStore.findById(
      userId,
    );

  if (!usuario) {
    throw new AppError(
      "Usuário não encontrado.",
      404,
    );
  }

  const dados = {};

  if (nome !== undefined) {
    dados.nome =
      nome.trim();
  }

  if (telefone !== undefined) {
    dados.telefone =
      telefone.trim() ||
      null;
  }

  const atualizado =
    await userStore.updatePerfil(
      userId,
      dados,
    );

  auditLogger.registrar({
    usuarioId:
      userId,

    usuarioNome:
      userNome ||
      atualizado.nome,

    acao:
      "Perfil atualizado pelo próprio usuário.",
  });

  return userStore.toPublicUser(
    atualizado,
  );
}

async function alterarSenha({
  userId,
  userNome,
  senhaAtual,
  novaSenha,
}) {
  const usuario =
    await userStore.findById(
      userId,
    );

  if (!usuario) {
    throw new AppError(
      "Usuário não encontrado.",
      404,
    );
  }

  const senhaConfere =
    await comparePassword(
      senhaAtual,
      usuario.senha_hash,
    );

  if (!senhaConfere) {
    throw new AppError(
      "Senha atual incorreta.",
      401,
    );
  }

  const novoHash =
    await hashPassword(
      novaSenha,
    );

  await userStore.updateSenha(
    userId,
    novoHash,
  );

  // Por segurança, trocar a senha derruba todas as sessões existentes.

  await sessionStore.revogarTodasSessoes(
    userId,
  );

  auditLogger.registrar({
    usuarioId: userId,
    usuarioNome: userNome,
    acao:
      "Senha alterada pelo próprio usuário.",
  });

  return true;
}

async function solicitarRecuperacaoSenha({
  email,
}) {
  const usuario =
    await userStore.findByEmail(
      email,
    );

  // Mesma resposta independentemente do e-mail existir, para não vazar
  // quais e-mails estão cadastrados.

  if (!usuario) {
    return true;
  }

  const token =
    signResetToken(usuario);

  const linkReset =
    `/reset-password?token=${token}`;

  await emailService.enviarEmail({
    to: usuario.email,

    subject:
      "Recuperação de senha — Sistema da Barbearia",

    body: `Olá, ${usuario.nome}. Use o link a seguir para redefinir sua senha (válido por 15 minutos): ${linkReset}`,
  });

  auditLogger.registrar({
    usuarioId:
      usuario.id,

    usuarioNome:
      usuario.nome,

    acao:
      "Recuperação de senha solicitada.",
  });

  return true;
}

async function redefinirSenha({
  token,
  novaSenha,
}) {
  let payload;

  try {
    payload =
      verifyResetToken(
        token,
      );
  } catch {
    throw new AppError(
      "Link de recuperação inválido ou expirado.",
      400,
    );
  }

  const usuario =
    await userStore.findById(
      payload.sub,
    );

  if (!usuario) {
    throw new AppError(
      "Usuário não encontrado.",
      404,
    );
  }

  const novoHash =
    await hashPassword(
      novaSenha,
    );

  await userStore.updateSenha(
    usuario.id,
    novoHash,
  );

  await sessionStore.revogarTodasSessoes(
    usuario.id,
  );

  auditLogger.registrar({
    usuarioId:
      usuario.id,

    usuarioNome:
      usuario.nome,

    acao:
      "Senha redefinida via link de recuperação.",
  });

  return true;
}

module.exports = {
  registrar,
  login,
  refresh,
  selecionarBarbearia,
  logout,
  logoutTodasSessoes,
  atualizarPerfil,
  alterarSenha,
  solicitarRecuperacaoSenha,
  redefinirSenha,
};

