const { Router } = require("express");
const bloqueioAgendaController = require("../controllers/bloqueioAgendaController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// Autenticação já é aplicada no mount central (routes/index.js).
// Leitura: qualquer usuário autenticado pode consultar os bloqueios,
// pois a agenda precisa saber quais horários estão indisponíveis.
router.get("/", bloqueioAgendaController.listar);
router.get("/:id", bloqueioAgendaController.buscarPorId);

// Escrita: somente ADMIN e GERENTE podem gerenciar bloqueios.
router.post("/", autorizar("ADMIN", "GERENTE"), bloqueioAgendaController.criar);

router.patch(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  bloqueioAgendaController.atualizar,
);

router.patch(
  "/:id/ativar",
  autorizar("ADMIN", "GERENTE"),
  bloqueioAgendaController.ativar,
);

router.patch(
  "/:id/desativar",
  autorizar("ADMIN", "GERENTE"),
  bloqueioAgendaController.desativar,
);

router.delete(
  "/:id",
  autorizar("ADMIN", "GERENTE"),
  bloqueioAgendaController.excluir,
);

module.exports = router;
