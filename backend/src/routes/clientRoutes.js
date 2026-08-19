const { Router } = require("express");

const clientController = require("../controllers/clientController");

const router = Router();

router.get("/", clientController.listar);

router.get("/:id", clientController.buscarPorId);

router.post("/", clientController.criar);

router.patch("/:id", clientController.atualizar);

router.delete("/:id", clientController.desativar);

module.exports = router;