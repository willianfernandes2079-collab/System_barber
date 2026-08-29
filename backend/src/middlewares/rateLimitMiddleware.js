const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Muitas tentativas de login. Tente novamente em alguns minutos.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Você já solicitou uma recuperação. Tente novamente em 15 minutos.",
  },
});

const forgotPasswordDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Limite diário de recuperação atingido. Tente novamente amanhã.",
  },
});

const apiWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => {
    return ["GET", "HEAD", "OPTIONS"].includes(
      req.method,
    );
  },

  message: {
    success: false,
    message:
      "Muitas operações em pouco tempo. Tente novamente em alguns minutos.",
  },
});

module.exports = {
  loginLimiter,
  forgotPasswordLimiter,
  forgotPasswordDailyLimiter,
  apiWriteLimiter,
};