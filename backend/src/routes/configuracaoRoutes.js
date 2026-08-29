const { Router } = require("express");

const configuracaoController = require("../controllers/configuracaoController");

const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

router.get("/", configuracaoController.buscar);

router.put(
  "/",
  autorizar("ADMIN", "GERENTE"),
  configuracaoController.atualizar,
);

module.exports = router;

