const { verifyAccessToken } = require("../utils/jwt");
const { fail } = require("../utils/apiResponse");

/*
  Exige um access token JWT válido no header:
  Authorization: Bearer <token>
  Preenche req.user com { sub, cargo, nome } em caso de sucesso.*/

  
function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return fail(res, {
      message: "Não autenticado. Faça login novamente.",
      status: 401,
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // { sub, cargo, nome, iat, exp }
    return next();
  } catch {
    return fail(res, { message: "Token inválido ou expirado.", status: 401 });
  }
}

module.exports = autenticar;
