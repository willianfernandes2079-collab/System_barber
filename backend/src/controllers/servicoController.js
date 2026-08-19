const servicoService = require("../services/servicoService");

async function listar(req, res) {
  const servicos = await servicoService.listarServicos();

  return res.status(200).json({
    success: true,
    data: servicos,
  });
}

async function buscarPorId(req, res) {
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
}

async function criar(req, res) {
  const { nome, descricao, duracao, preco, percentual_comissao } = req.body;

  if (!nome || !duracao || preco === undefined) {
    return res.status(400).json({
      success: false,
      message: "Nome, duração e preço são obrigatórios.",
    });
  }

  const servico = await servicoService.criarServico({
    nome,
    descricao,
    duracao,
    preco,
    percentual_comissao,
  });

  return res.status(201).json({
    success: true,
    message: "Serviço criado com sucesso.",
    data: servico,
  });
}

async function atualizar(req, res) {
  const { id } = req.params;

  const servicoExistente = await servicoService.buscarServicoPorId(id);

  if (!servicoExistente) {
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
}

async function desativar(req, res) {
  const { id } = req.params;

  const servicoExistente = await servicoService.buscarServicoPorId(id);

  if (!servicoExistente) {
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
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  desativar,
};
