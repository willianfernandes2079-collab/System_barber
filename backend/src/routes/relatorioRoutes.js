const { Router } = require("express");
const relatorioController = require("../controllers/relatorioController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

// autenticar já é aplicado no mount central (routes/index.js).
// Só ADMIN e GERENTE têm "ver relatórios" na lista de permissões (item 7).
router.use(autorizar("ADMIN", "GERENTE"));

router.get("/faturamento", relatorioController.faturamento);
router.get("/servicos", relatorioController.servicos);
router.get("/barbeiros", relatorioController.barbeiros);
router.get("/cancelamentos", relatorioController.cancelamentos);
router.get("/clientes", relatorioController.clientes);
router.get("/clientes-retorno", relatorioController.clientesRetorno);
router.get("/comissoes", relatorioController.comissoes);
router.get("/formas-pagamento", relatorioController.formasPagamento);

module.exports = router;