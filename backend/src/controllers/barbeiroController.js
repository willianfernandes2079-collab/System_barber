const barbeiroService = require("../services/barbeiroService");
const asyncHandler = require("../utils/asyncHandler");

const listarBarbeiros = asyncHandler(async (req, res) => {
  const { pagina, limite, busca, ativo } = req.query;

  const resultado = await barbeiroService.listarBarbeiros({
    pagina,
    limite,
    busca,
    ativo,
  });

  return res.status(200).json({
    success: true,
    data: resultado.barbeiros,
    paginacao: resultado.paginacao,
  });
});

const buscarBarbeiroPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const barbeiro = await barbeiroService.buscarBarbeiroPorId(id);

  if (!barbeiro) {
    return res.status(404).json({
      success: false,
      message: "Barbeiro não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    data: barbeiro,
  });
});

const criarBarbeiro = asyncHandler(async (req, res) => {
  const { usuario_id, nome, telefone, especialidade, percentual_comissao } =
    req.body;

  if (!usuario_id) {
    return res.status(400).json({
      success: false,
      message: "O usuário do barbeiro é obrigatório.",
    });
  }

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      success: false,
      message: "O nome do barbeiro é obrigatório.",
    });
  }

  const barbeiro = await barbeiroService.criarBarbeiro({
    usuario_id,
    nome,
    telefone,
    especialidade,
    percentual_comissao,
  });

  return res.status(201).json({
    success: true,
    message: "Barbeiro criado com sucesso.",
    data: barbeiro,
  });
});

const atualizarBarbeiro = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const barbeiroExistente = await barbeiroService.buscarBarbeiroPorId(id);

  if (!barbeiroExistente) {
    return res.status(404).json({
      success: false,
      message: "Barbeiro não encontrado.",
    });
  }

  const barbeiro = await barbeiroService.atualizarBarbeiro(id, req.body);

  return res.status(200).json({
    success: true,
    message: "Barbeiro atualizado com sucesso.",
    data: barbeiro,
  });
});

const desativarBarbeiro = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const barbeiroExistente = await barbeiroService.buscarBarbeiroPorId(id);

  if (!barbeiroExistente) {
    return res.status(404).json({
      success: false,
      message: "Barbeiro não encontrado.",
    });
  }

  await barbeiroService.desativarBarbeiro(id);

  return res.status(200).json({
    success: true,
    message: "Barbeiro desativado com sucesso.",
  });
});

module.exports = {
  listarBarbeiros,
  buscarBarbeiroPorId,
  criarBarbeiro,
  atualizarBarbeiro,
  desativarBarbeiro,
};
