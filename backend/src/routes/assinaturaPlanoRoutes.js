const { Router } = require("express");

const assinaturaPlanoController =
  require("../controllers/assinaturaPlanoController");

const autorizar =
  require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central
// (routes/index.js)

router.get(
  "/cliente/:cliente_id",
  assinaturaPlanoController.listarPorCliente,
);

router.get(
  "/cliente/:cliente_id/ativas",
  assinaturaPlanoController.listarAtivas,
);

router.get(
  "/:id",
  assinaturaPlanoController.buscarPorId,
);

router.post(
  "/",
  autorizar(
    "ADMIN",
    "GERENTE",
    "RECEPCIONISTA",
  ),
  assinaturaPlanoController.contratar,
);

router.patch(
  "/:id/cancelar",
  autorizar(
    "ADMIN",
    "GERENTE",
    "RECEPCIONISTA",
  ),
  assinaturaPlanoController.cancelar,
);

router.post(
  "/:id/utilizar",
  autorizar(
    "ADMIN",
    "GERENTE",
    "RECEPCIONISTA",
  ),
  assinaturaPlanoController.utilizar,
);

module.exports = router;