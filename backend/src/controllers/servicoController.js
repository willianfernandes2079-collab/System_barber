const servicoService = require("../services/servicoService");
const asyncHandler = require("../utils/asyncHandler");
const { isNonEmptyString } = require("../utils/validators");

const listar = asyncHandler(async (req, res) => {
  const servicos = await servicoService.listarServicos();

  return res.status(200).json({
    success: true,
    data: servicos,
  });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const servico = await servicoService.buscarServicoPorId(id);

  if (!servico) {
    return res.status(404).json({
      success: false,
      message: "Serviço não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    data: servico,
  });
});

const criar = asyncHandler(async (req, res) => {
  const { nome, descricao, duracao, preco, percentual_comissao } = req.body;

  if (!isNonEmptyString(nome)) {
    return res.status(400).json({
      success: false,
      message: "O nome do serviço é obrigatório.",
    });
  }

  if (!Number.isFinite(Number(duracao)) || Number(duracao) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Informe uma duração válida, em minutos.",
    });
  }

  if (!Number.isFinite(Number(preco)) || Number(preco) < 0) {
    return res.status(400).json({
      success: false,
      message: "Informe um preço válido.",
    });
  }

  const servico = await servicoService.criarServico({
    nome: nome.trim(),
    descricao: descricao || null,
    duracao: Number(duracao),
    preco: Number(preco),
    percentual_comissao:
      percentual_comissao !== undefined && percentual_comissao !== null
        ? Number(percentual_comissao)
        : undefined,
  });

  return res.status(201).json({
    success: true,
    message: "Serviço criado com sucesso.",
    data: servico,
  });
});

const atualizar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente = await servicoService.buscarServicoPorId(id);

  if (!existente) {
    return res.status(404).json({
      success: false,
      message: "Serviço não encontrado.",
    });
  }

  const servico = await servicoService.atualizarServico(id, req.body);

  return res.status(200).json({
    success: true,
    message: "Serviço atualizado com sucesso.",
    data: servico,
  });
});

const desativar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente = await servicoService.buscarServicoPorId(id);

  if (!existente) {
    return res.status(404).json({
      success: false,
      message: "Serviço não encontrado.",
    });
  }

  await servicoService.desativarServico(id);

  return res.status(200).json({
    success: true,
    message: "Serviço desativado com sucesso.",
  });
});

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  desativar,
};
