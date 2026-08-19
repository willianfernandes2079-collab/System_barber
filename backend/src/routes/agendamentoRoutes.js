const { Router } = require("express");
const agendamentoController = require("../controllers/agendamentoController");

const router = Router();

router.get("/", agendamentoController.listar);

router.get("/:id", agendamentoController.buscarPorId);

router.post("/", agendamentoController.criar);

router.patch("/:id", agendamentoController.atualizar);

router.delete("/:id", agendamentoController.cancelar);

module.exports = router;
