const { Router } = require("express");
const financeiroController = require("../controllers/financeiroController");
const autorizar = require("../middlewares/permissionMiddleware");

const router = Router();

router.get(
  "/resumo",
  autorizar("ADMIN", "GERENTE"),
  financeiroController.resumo,
);

router.get(
  "/pagamentos",
  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),
  financeiroController.listarPagamentos,
);

router.post(
  "/pagamentos",
  autorizar("ADMIN", "GERENTE", "RECEPCIONISTA"),
  financeiroController.registrarPagamento,
);

router.get(
  "/comissoes",
  autorizar("ADMIN", "GERENTE", "BARBEIRO"),
  financeiroController.listarComissoes,
);

router.patch(
  "/comissoes/:id/pagar",
  autorizar("ADMIN", "GERENTE"),
  financeiroController.marcarComissaoPaga,
);

module.exports = router;
