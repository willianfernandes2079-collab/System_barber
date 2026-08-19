const { Router } = require("express");

const authRoutes = require("./authRoutes");
const barbeiroRoutes = require("./barbeiroRoutes");
const clientRoutes = require("./clientRoutes");
const servicoRoutes = require("./servicoRoutes");
const agendamentoRoutes = require("./agendamentoRoutes");

const router = Router();


// HEALTH CHECK


router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API da Barbearia funcionando!",
    status: "online",
  });
});


// AUTENTICAÇÃO


router.use("/auth", authRoutes);


// BARBEIROS


router.use("/barbeiros", barbeiroRoutes);


// CLIENTES


router.use("/clientes", clientRoutes);


// SERVIÇOS


router.use("/servicos", servicoRoutes);


// AGENDAMENTOS


router.use("/agendamentos", agendamentoRoutes);

module.exports = router;