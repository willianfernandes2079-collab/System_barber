const prisma = require("../config/prismaClient");

async function criarSessao(
  userId,
  jti,
  {
    expiresAt,
    userAgent = null,
    ip = null,
    barbeariaId = null,
  } = {}
) {
  return prisma.sessao.create({
    data: {
      usuario_id: userId,
      jti,
      barbearia_id: barbeariaId,
      expires_at: new Date(expiresAt),
      user_agent: userAgent,
      ip,
    },
  });
}

async function sessaoValida(userId, jti) {
  const sessao = await prisma.sessao.findFirst({
    where: {
      usuario_id: userId,
      jti,
      expires_at: {
        gt: new Date(),
      },
    },
  });

  return Boolean(sessao);
}

async function obterSessaoValida(userId, jti) {
  return prisma.sessao.findFirst({
    where: {
      usuario_id: userId,
      jti,
      expires_at: {
        gt: new Date(),
      },
    },
  });
}

async function atualizarBarbearia(userId, jti, barbeariaId) {
  return prisma.sessao.updateMany({
    where: {
      usuario_id: userId,
      jti,
      expires_at: {
        gt: new Date(),
      },
    },
    data: {
      barbearia_id: barbeariaId,
    },
  });
}

async function revogarSessao(userId, jti) {
  const resultado = await prisma.sessao.deleteMany({
    where: {
      usuario_id: userId,
      jti,
    },
  });

  return resultado.count > 0;
}

async function revogarTodasSessoes(userId) {
  await prisma.sessao.deleteMany({
    where: {
      usuario_id: userId,
    },
  });
}

async function listarSessoes(userId) {
  const sessoes = await prisma.sessao.findMany({
    where: {
      usuario_id: userId,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return sessoes.map((sessao) => ({
    jti: sessao.jti,
    createdAt: sessao.created_at.toISOString(),
    expiresAt: sessao.expires_at.toISOString(),
    userAgent: sessao.user_agent,
    ip: sessao.ip,
    barbeariaId: sessao.barbearia_id,
  }));
}

module.exports = {
  criarSessao,
  sessaoValida,
  obterSessaoValida,
  atualizarBarbearia,
  revogarSessao,
  revogarTodasSessoes,
  listarSessoes,
};