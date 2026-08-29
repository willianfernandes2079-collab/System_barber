const { Router } = require("express");

const clientController = require("../controllers/clientController");

const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central (routes/index.js)

router.get(
  "/",
  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),
  clientController.listar,
);

router.get("/me", clientController.meuCliente);

router.get(
  "/:id/historico",
  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),
  clientController.buscarHistorico,
);

router.get(
  "/:id",
  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),
  clientController.buscarPorId,
);

router.post(
  "/",

  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),

  clientController.criar,
);

router.patch(
  "/:id",

  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),

  clientController.atualizar,
);

router.patch(
  "/:id/ativar",

  autorizar("ADMIN", "GERENTE"),

  clientController.ativar,
);

router.delete(
  "/:id",

  autorizar("ADMIN", "GERENTE"),

  clientController.desativar,
);

module.exports = router;
