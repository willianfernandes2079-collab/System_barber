const jwt = require("jsonwebtoken");

const env = require("../config/env");

function signAccessToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      cargo: usuario.cargo,
      nome: usuario.nome,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  );
}

function signRefreshToken(usuario, { remember = false } = {}) {
  const expiresIn = remember
    ? env.JWT_REFRESH_EXPIRES_IN_REMEMBER
    : env.JWT_REFRESH_EXPIRES_IN;

  const token = jwt.sign(
    {
      sub: usuario.id,
      cargo: usuario.cargo,
      nome: usuario.nome,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn,
      jwtid: `${usuario.id}-${Date.now()}`,
    },
  );

  return {
    token,
    jti: jwt.decode(token).jti,
    expiresIn,
  };
}

function signResetToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
    },
    env.JWT_RESET_SECRET,
    {
      expiresIn: env.JWT_RESET_EXPIRES_IN,
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

function verifyResetToken(token) {
  return jwt.verify(token, env.JWT_RESET_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signResetToken,
  verifyResetToken,
};
