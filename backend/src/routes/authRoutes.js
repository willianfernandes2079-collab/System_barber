const { Router } = require("express");
const authController = require("../controllers/authController");
const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/permissionMiddleware");
const {
  loginLimiter,
  forgotPasswordLimiter,
  forgotPasswordDailyLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = Router();

// Rotas públicas
router.post("/login", loginLimiter, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordDailyLimiter,
  authController.esqueciSenha,
);
router.post("/reset-password", authController.redefinirSenha);

// Rotas autenticadas
router.get("/me", autenticar, authController.me);
router.patch("/me", autenticar, authController.atualizarPerfil);
router.post("/change-password", autenticar, authController.alterarSenha);
router.post("/logout-all", autenticar, authController.logoutTodasSessoes);

// Criar usuário: só ADMIN e GERENTE podem cadastrar novos usuários do
// sistema (item 7). Exceção: se ainda não existir nenhum usuário no
// sistema (primeiro boot), a rota fica aberta para criar o admin inicial —
// isso é resolvido pelo seed, então aqui a rota já nasce protegida.
router.post(
  "/register",
  autenticar,
  autorizar("ADMIN", "GERENTE"),
  authController.registrar,
);

module.exports = router;
