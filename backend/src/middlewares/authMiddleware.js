const { verifyAccessToken } = require("../utils/jwt");
const { fail } = require("../utils/apiResponse");

/*
Exige um access token JWT válido no cookie HttpOnly "accessToken".

Preenche req.user com os dados do token:
{ sub, cargo, nome, barbearia_id, iat, exp }
*/

function autenticar(req, res, next) {
const token = req.cookies?.accessToken;

if (!token) {
return fail(res, {
message: "Não autenticado. Faça login novamente.",
status: 401,
});
}

try {
const payload = verifyAccessToken(token);


req.user = payload;

return next();


} catch {
return fail(res, {
message: "Token inválido ou expirado.",
status: 401,
});
}
}

module.exports = autenticar;
