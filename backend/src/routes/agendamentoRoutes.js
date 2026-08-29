const { Router } = require("express");

const agendamentoController = require("../controllers/agendamentoController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// Leitura da agenda
router.get(
  "/",
  autorizar("ADMIN", "GERENTE", "BARBEIRO", "RECEPCIONISTA", "CLIENTE"),
  agendamentoController.listar,
);

router.get(
  "/disponiveis",
  autorizar("ADMIN", "GERENTE", "BARBEIRO", "RECEPCIONISTA", "CLIENTE"),
  agendamentoController.listarHorariosDisponiveis,
);

router.get(
  "/:id",
  autorizar("ADMIN", "GERENTE", "BARBEIRO", "RECEPCIONISTA", "CLIENTE"),
  agendamentoController.buscarPorId,
);

// Criar agendamento
router.post(
  "/",
  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA", "CLIENTE"),
  agendamentoController.criar,
);

// Reagendar
router.patch(
  "/:id/reagendar",
  autorizar("ADMIN", "GERENTE", "BARBEIRO", "RECEPCIONISTA", "CLIENTE"),
  agendamentoController.reagendar,
);

// Concluir atendimento
router.patch(
  "/:id/concluir",
  autorizar("ADMIN", "GERENTE", "BARBEIRO"),
  agendamentoController.concluir,
);

// Marcar falta
router.patch(
  "/:id/faltou",
  autorizar("ADMIN", "GERENTE", "BARBEIRO"),
  agendamentoController.marcarFalta,
);

// Cancelar
router.delete(
  "/:id",
  autorizar("ADMIN", "GERENTE", "BARBEIRO", "RECEPCIONISTA", "CLIENTE"),
  agendamentoController.cancelar,
);

module.exports = router;