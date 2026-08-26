const bloqueioAgendaService = require("../services/bloqueioAgendaService");
const asyncHandler = require("../utils/asyncHandler");

const criar = asyncHandler(async (req, res) => {
  const {
    barbeiro_id,
    data,
    horario_inicio,
    horario_fim,
    motivo,
    observacoes,
  } = req.body;

  const bloqueio = await bloqueioAgendaService.criarBloqueio({
    barbeiro_id,
    data,
    horario_inicio,
    horario_fim,
    motivo,
    observacoes,
  });

  return res.status(201).json({
    success: true,
    message: "Bloqueio criado com sucesso.",
    data: bloqueio,
  });
});

const listar = asyncHandler(async (req, res) => {
  const { data, barbeiro_id, ativo } = req.query;

  const bloqueios = await bloqueioAgendaService.listarBloqueios({
    data,
    barbeiro_id,
    ativo,
  });

  return res.status(200).json({
    success: true,
    data: bloqueios,
  });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bloqueio = await bloqueioAgendaService.buscarBloqueioPorId(id);

  return res.status(200).json({
    success: true,
    data: bloqueio,
  });
});

const atualizar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bloqueio = await bloqueioAgendaService.atualizarBloqueio(id, req.body);

  return res.status(200).json({
    success: true,
    message: "Bloqueio atualizado com sucesso.",
    data: bloqueio,
  });
});

const desativar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await bloqueioAgendaService.desativarBloqueio(id);

  return res.status(200).json({
    success: true,
    message: "Bloqueio desativado com sucesso.",
  });
});

const ativar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await bloqueioAgendaService.ativarBloqueio(id);

  return res.status(200).json({
    success: true,
    message: "Bloqueio ativado com sucesso.",
  });
});

const excluir = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await bloqueioAgendaService.excluirBloqueio(id);

  return res.status(200).json({
    success: true,
    message: "Bloqueio excluído com sucesso.",
  });
});

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  desativar,
  ativar,
  excluir,
};
