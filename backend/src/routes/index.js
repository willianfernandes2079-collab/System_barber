const { Router } = require("express");
const authRoutes = require("./authRoutes");

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API da Barbearia funcionando!",
    status: "online",
  });
});

router.use("/auth", authRoutes);

// Próximas fases: router.use('/clientes', clienteRoutes); etc.

module.exports = router;