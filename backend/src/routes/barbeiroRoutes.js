const { Router } = require("express");

const {
  listarBarbeiros,
  buscarBarbeiroPorId,
  criarBarbeiro,
  atualizarBarbeiro,
  desativarBarbeiro,
  ativarBarbeiro,
} = require("../controllers/barbeiroController");

const autorizar =
  require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central (routes/index.js)

router.get(
  "/",
  listarBarbeiros,
);

router.get(
  "/:id",
  buscarBarbeiroPorId,
);

router.post(
  "/",
  autorizar("ADMIN", "GERENTE"),
  criarBarbeiro,
);

router.put(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  atualizarBarbeiro,
);

router.patch(
  "/:id/ativar",
  autorizar("ADMIN", "GERENTE"),
  ativarBarbeiro,
);

router.delete(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  desativarBarbeiro,
);

module.exports = router;