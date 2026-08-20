const { Router } = require("express");
const servicoController = require("../controllers/servicoController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central (routes/index.js)

router.get("/", servicoController.listar);

router.get("/:id", servicoController.buscarPorId);

router.post(
  "/",
  autorizar("ADMIN", "GERENTE"),
  servicoController.criar
);

router.patch(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  servicoController.atualizar
);

router.delete(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  servicoController.desativar
);

module.exports = router;