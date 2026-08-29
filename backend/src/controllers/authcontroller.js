const authService = require("../services/authService");

const userStore = require("../models/userStore");

const asyncHandler = require("../utils/asyncHandler");

const { success, fail } = require("../utils/apiResponse");

const AppError = require("../utils/AppError");

const {
  isValidEmail,
  isValidPassword,
  isNonEmptyString,
  isValidCargo,
} = require("../utils/validators");

const registrar = asyncHandler(async (req, res) => {
  const { nome, email, senha, telefone, cargo } = req.body;

  const erros = [];

  if (!isNonEmptyString(nome)) erros.push("Informe o nome.");

  if (!isValidEmail(email)) erros.push("Informe um e-mail válido.");

  if (!isValidPassword(senha)) {
    erros.push("A senha deve ter ao menos 8 caracteres, com letras e números.");
  }

  if (!isValidCargo(cargo)) {
    erros.push("Cargo inválido. Use ADMIN, GERENTE, BARBEIRO ou RECEPCIONISTA.");
  }

  if (erros.length) {
    return fail(res, {
      message: "Dados inválidos.",
      status: 422,
      errors: erros,
    });
  }

  const usuario = await authService.registrar(
    {
      nome,
      email,
      senha,
      telefone,
      cargo,
      barbeariaId: req.user?.barbearia_id,
    },
    {
      requestUserId: req.user?.sub,
      requestUserNome: req.user?.nome,
    },
  );

  return success(res, {
    message: "Usuário criado com sucesso.",
    data: usuario,
    status: 201,
  });
});

const login = asyncHandler(async (req, res) => {
  const { usuario, email, senha, manterConectado } = req.body;

  const loginEmail = email || usuario;

  if (!isValidEmail(loginEmail) || !isNonEmptyString(senha)) {
    return fail(res, {
      message: "Informe e-mail e senha válidos.",
      status: 422,
    });
  }

  const resultado = await authService.login({
    email: loginEmail,
    senha,
    remember: Boolean(manterConectado),
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  const {
    accessToken,
    refreshToken,
    usuario: usuarioLogado,
  } = resultado;

  const secureCookie = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: (manterConectado ? 30 : 7) * 24 * 60 * 60 * 1000,
  });

  return success(res, {
    message: "Login realizado com sucesso!",
    data: {
      usuario: usuarioLogado,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!isNonEmptyString(refreshToken)) {
    return fail(res, {
      message: "Refresh token não informado.",
      status: 422,
    });
  }

  const resultado = await authService.refresh({ refreshToken });

  const {
    accessToken,
    usuario,
  } = resultado;

  const secureCookie = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  return success(res, {
    message: "Token renovado.",
    data: {
      usuario,
    },
  });
});

const selecionarBarbearia = asyncHandler(async (req, res) => {
  const { barbeariaId } = req.body;

  if (!isNonEmptyString(barbeariaId)) {
    return fail(res, {
      message: "Informe o ID da barbearia.",
      status: 422,
    });
  }

  const refreshToken = req.cookies?.refreshToken;

  if (!isNonEmptyString(refreshToken)) {
    return fail(res, {
      message: "Sessão inválida. Faça login novamente.",
      status: 401,
    });
  }

  const resultado = await authService.selecionarBarbearia({
    userId: req.user.sub,
    refreshToken,
    barbeariaId,
  });

  const secureCookie = process.env.NODE_ENV === "production";

  res.cookie("accessToken", resultado.accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  return success(res, {
    message: "Barbearia selecionada com sucesso.",
    data: {
      usuario: resultado.usuario,
      barbearia: resultado.barbearia,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (isNonEmptyString(refreshToken)) {
    await authService.logout({ refreshToken });
  }

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });

  return success(res, {
    message: "Logout realizado com sucesso.",
  });
});

const logoutTodasSessoes = asyncHandler(async (req, res) => {
  await authService.logoutTodasSessoes({
    userId: req.user.sub,
    userNome: req.user.nome,
  });

  return success(res, {
    message: "Todas as sessões foram encerradas.",
  });
});

const me = asyncHandler(async (req, res) => {
  const usuario = await userStore.findById(req.user.sub);

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  const usuarioPublico =
    userStore.toPublicUser(usuario);

  usuarioPublico.barbearia_id =
    req.user.barbearia_id || null;

  return success(res, {
    data: usuarioPublico,
  });
});

const atualizarPerfil = asyncHandler(async (req, res) => {
  const { nome, telefone } = req.body;

  if (nome !== undefined && !isNonEmptyString(nome)) {
    return fail(res, {
      message: "Nome inválido.",
      status: 422,
    });
  }

  const usuario = await authService.atualizarPerfil({
    userId: req.user.sub,
    userNome: req.user.nome,
    nome,
    telefone,
  });

  return success(res, {
    message: "Perfil atualizado com sucesso.",
    data: usuario,
  });
});

const alterarSenha = asyncHandler(async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!isNonEmptyString(senhaAtual) || !isValidPassword(novaSenha)) {
    return fail(res, {
      message:
        "Informe a senha atual e uma nova senha com ao menos 8 caracteres, letras e números.",
      status: 422,
    });
  }

  await authService.alterarSenha({
    userId: req.user.sub,
    userNome: req.user.nome,
    senhaAtual,
    novaSenha,
  });

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });

  return success(res, {
    message: "Senha alterada com sucesso. Faça login novamente.",
  });
});

const esqueciSenha = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return fail(res, {
      message: "Informe um e-mail válido.",
      status: 422,
    });
  }

  await authService.solicitarRecuperacaoSenha({ email });

  // Mesma resposta sempre, para não revelar se o e-mail existe.
  return success(res, {
    message:
      "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
  });
});

const redefinirSenha = asyncHandler(async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!isNonEmptyString(token) || !isValidPassword(novaSenha)) {
    return fail(res, {
      message:
        "Link inválido ou nova senha fraca (mínimo 8 caracteres, letras e números).",
      status: 422,
    });
  }

  await authService.redefinirSenha({
    token,
    novaSenha,
  });

  return success(res, {
    message: "Senha redefinida com sucesso. Faça login.",
  });
});

module.exports = {
  registrar,
  login,
  refresh,
  selecionarBarbearia,
  logout,
  logoutTodasSessoes,
  me,
  atualizarPerfil,
  alterarSenha,
  esqueciSenha,
  redefinirSenha,
};

