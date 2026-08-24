const { Router } = require("express");
const planoController = require("../controllers/planoController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central (routes/index.js)

router.get("/", planoController.listar);

router.get("/todos", planoController.listarTodos);

router.get("/:id", planoController.buscarPorId);

router.post("/", autorizar("ADMIN", "GERENTE"), planoController.criar);

router.patch("/:id", autorizar("ADMIN", "GERENTE"), planoController.atualizar);

router.delete("/:id", autorizar("ADMIN", "GERENTE"), planoController.desativar);

module.exports = router;
