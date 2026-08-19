const agendamentoService = require("../services/agendamentoService");

async function listar(req, res, next) {
  try {
    const agendamentos = await agendamentoService.listarAgendamentos();

    return res.status(200).json({
      success: true,
      data: agendamentos,
    });
  } catch (error) {
    next(error);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const { id } = req.params;

    const agendamento = await agendamentoService.buscarAgendamentoPorId(id);

    if (!agendamento) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      data: agendamento,
    });
  } catch (error) {
    next(error);
  }
}

async function criar(req, res, next) {
  try {
    const {
      cliente_id,
      barbeiro_id,
      servico_id,
      data,
      horario_inicio,
      horario_fim,
      status,
      observacoes,
      valor,
      forma_pagamento,
    } = req.body;

    if (
      !cliente_id ||
      !barbeiro_id ||
      !servico_id ||
      !data ||
      !horario_inicio ||
      !horario_fim ||
      valor === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Dados obrigatórios não informados.",
      });
    }

    const agendamento = await agendamentoService.criarAgendamento({
      cliente_id,
      barbeiro_id,
      servico_id,
      data,
      horario_inicio,
      horario_fim,
      status,
      observacoes,
      valor,
      forma_pagamento,
    });

    return res.status(201).json({
      success: true,
      data: agendamento,
    });
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;

    const agendamento = await agendamentoService.atualizarAgendamento(
      id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      data: agendamento,
    });
  } catch (error) {
    next(error);
  }
}

async function cancelar(req, res, next) {
  try {
    const { id } = req.params;

    const agendamento = await agendamentoService.cancelarAgendamento(id);

    return res.status(200).json({
      success: true,
      data: agendamento,
      message: "Agendamento cancelado com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  cancelar,
};
