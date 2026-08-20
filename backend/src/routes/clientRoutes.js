const { Router } = require("express");

const clientController = require("../controllers/clientController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central (routes/index.js)
router.get("/", clientController.listar);
router.get("/:id", clientController.buscarPorId);
router.post("/", clientController.criar);
router.patch("/:id", clientController.atualizar);
router.delete(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  clientController.desativar,
);

module.exports = router;
