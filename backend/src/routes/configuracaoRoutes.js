const { Router } = require("express");
const configuracaoController = require("../controllers/configuracaoController");

const router = Router();

router.get("/", configuracaoController.buscar);
router.put("/", configuracaoController.atualizar);

module.exports = router;