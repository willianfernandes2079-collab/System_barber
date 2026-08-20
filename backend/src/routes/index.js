const { Router } = require("express");
const authRoutes = require("./authRoutes");
const clientRoutes = require("./clientRoutes");
const barbeiroRoutes = require("./barbeiroRoutes");
const servicoRoutes = require("./servicoRoutes");
const agendamentoRoutes = require("./agendamentoRoutes");
const configuracaoRoutes = require("./configuracaoRoutes");
const autenticar = require("../middlewares/authMiddleware");

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API da Barbearia funcionando!",
    status: "online",
  });
});

// Pública
router.use("/auth", authRoutes);

// A partir daqui, toda rota exige um access token válido.
// Regras mais finas de cargo (ADMIN/GERENTE etc.) ficam dentro de cada
// arquivo de rotas, via o middleware `autorizar`.
router.use("/clientes", autenticar, clientRoutes);
router.use("/barbeiros", autenticar, barbeiroRoutes);
router.use("/servicos", autenticar, servicoRoutes);
router.use("/agendamentos", autenticar, agendamentoRoutes);
router.use("/configuracoes", autenticar, configuracaoRoutes);

// Próximas fases: router.use('/financeiro', autenticar, financeiroRoutes);
// router.use('/relatorios', autenticar, relatorioRoutes);

module.exports = router;