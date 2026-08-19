const rateLimit = require("express-rate-limit");

/**
  Limita tentativas de login e de recuperação de senha para dificultar
  ataques de força bruta (item 33 da especificação).*/

  
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas solicitações de recuperação de senha. Tente novamente mais tarde.",
  },
});

module.exports = { loginLimiter, forgotPasswordLimiter };