const { Router } = require("express");

const servicoController = require("../controllers/servicoController");

const router = Router();

router.get("/", servicoController.listar);

router.get("/:id", servicoController.buscarPorId);

router.post("/", servicoController.criar);

router.patch("/:id", servicoController.atualizar);

router.delete("/:id", servicoController.desativar);

module.exports = router;
