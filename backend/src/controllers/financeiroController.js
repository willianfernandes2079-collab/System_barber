const financeiroService = require("../services/financeiroService");
const barbeiroService = require("../services/barbeiroService");
const asyncHandler = require("../utils/asyncHandler");
const auditLogger = require("../utils/auditLogger");

const registrarPagamento = asyncHandler(async (req, res) => {
  const {
    agendamento_id,
    forma_pagamento,
    valor,
    observacoes,
  } = req.body;

  if (!agendamento_id || !forma_pagamento) {
    return res.status(400).json({
      success: false,
      message: "Informe agendamento_id e forma_pagamento.",
    });
  }

  const pagamento =
    await financeiroService.registrarPagamento({
      agendamento_id,
      forma_pagamento,
      valor,
      observacoes,
      barbeariaId:
        req.user.barbearia_id,
    });

  auditLogger.registrar({
    usuarioId: req.user.sub,
    usuarioNome: req.user.nome,
    acao: `Pagamento registrado para o agendamento ${agendamento_id}.`,
    registroAfetado: `pagamento:${pagamento.id}`,
  });

  return res.status(201).json({
    success: true,
    message: "Pagamento registrado com sucesso.",
    data: pagamento,
  });
});

const listarPagamentos = asyncHandler(async (req, res) => {
  const {
    pagina,
    limite,
    data_inicio,
    data_fim,
    forma_pagamento,
  } = req.query;

  const resultado =
    await financeiroService.listarPagamentos({
      pagina,
      limite,
      data_inicio,
      data_fim,
      forma_pagamento,
      barbeariaId:
        req.user.barbearia_id,
    });

  return res.status(200).json({
    success: true,
    data: resultado.pagamentos,
    paginacao: resultado.paginacao,
  });
});

const listarAgendamentosParaPagamento =
  asyncHandler(async (req, res) => {
    const agendamentos =
      await financeiroService.listarAgendamentosParaPagamento(
        req.user.barbearia_id,
      );

    return res.status(200).json({
      success: true,
      data: agendamentos,
    });
  });

const resumo = asyncHandler(async (req, res) => {
  const {
    periodo,
    data_inicio,
    data_fim,
  } = req.query;

  const dados =
    await financeiroService.resumoFinanceiro({
      periodo,
      data_inicio,
      data_fim,
      barbeariaId:
        req.user.barbearia_id,
    });

  return res.status(200).json({
    success: true,
    data: dados,
  });
});

const listarComissoes = asyncHandler(async (req, res) => {
  const {
    status,
    data_inicio,
    data_fim,
  } = req.query;

  let { barbeiro_id } = req.query;

  if (req.user.cargo === "BARBEIRO") {
    const barbeiro =
      await barbeiroService.buscarPorUsuarioId(
        req.user.sub,
        req.user.barbearia_id,
      );

    if (!barbeiro) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    barbeiro_id = barbeiro.id;
  }

  const comissoes =
    await financeiroService.listarComissoes({
      barbeiro_id,
      status,
      data_inicio,
      data_fim,
      barbeariaId:
        req.user.barbearia_id,
    });

  return res.status(200).json({
    success: true,
    data: comissoes,
  });
});

const marcarComissaoPaga = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comissao =
    await financeiroService.marcarComissaoPaga(
      id,
      req.user.barbearia_id,
    );

  auditLogger.registrar({
    usuarioId: req.user.sub,
    usuarioNome: req.user.nome,
    acao: `Comissão ${id} marcada como paga.`,
  });

  return res.status(200).json({
    success: true,
    message: "Comissão marcada como paga.",
    data: comissao,
  });
});

module.exports = {
  registrarPagamento,
  listarPagamentos,
  listarAgendamentosParaPagamento,
  resumo,
  listarComissoes,
  marcarComissaoPaga,
};