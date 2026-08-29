const relatorioService = require("../services/relatorioService");
const asyncHandler = require("../utils/asyncHandler");

function pegarPeriodo(req) {
  const {
    periodo,
    data_inicio,
    data_fim,
  } = req.query;

  return {
    periodo,
    data_inicio,
    data_fim,
    barbeariaId:
      req.user.barbearia_id,
  };
}

const faturamento = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.faturamentoPorPeriodo(
        pegarPeriodo(req),
      );

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const servicos = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.servicosMaisVendidos(
        pegarPeriodo(req),
      );

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const barbeiros = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.faturamentoPorBarbeiro(
        pegarPeriodo(req),
      );

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const cancelamentos = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.cancelamentosEFaltas(
        pegarPeriodo(req),
      );

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const clientes = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.relatorioClientes({
        barbeariaId:
          req.user.barbearia_id,
      });

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const clientesRetorno = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.clientesParaRetorno({
        barbeariaId:
          req.user.barbearia_id,
      });

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const comissoes = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.comissoesPorPeriodo(
        pegarPeriodo(req),
      );

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

const formasPagamento = asyncHandler(
  async (req, res) => {
    const dados =
      await relatorioService.formasPagamentoPorPeriodo(
        pegarPeriodo(req),
      );

    return res.status(200).json({
      success: true,
      data: dados,
    });
  },
);

module.exports = {
  faturamento,
  servicos,
  barbeiros,
  cancelamentos,
  clientes,
  clientesRetorno,
  comissoes,
  formasPagamento,
};