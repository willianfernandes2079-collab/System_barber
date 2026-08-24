const planoService = require("../services/planoService");
const asyncHandler = require("../utils/asyncHandler");
const { isNonEmptyString } = require("../utils/validators");

const listar = asyncHandler(async (req, res) => {
  const planos = await planoService.listarPlanos();

  return res.status(200).json({
    success: true,
    data: planos,
  });
});

const listarTodos = asyncHandler(async (req, res) => {
  const planos = await planoService.listarTodosPlanos();

  return res.status(200).json({
    success: true,
    data: planos,
  });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plano = await planoService.buscarPlanoPorId(id);

  if (!plano) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    data: plano,
  });
});

const criar = asyncHandler(async (req, res) => {
  const {
    nome,
    descricao,
    servico_id,
    quantidade,
    preco,
    validade_dias,
  } = req.body;

  if (!isNonEmptyString(nome)) {
    return res.status(400).json({
      success: false,
      message: "O nome do plano é obrigatório.",
    });
  }

  if (!isNonEmptyString(servico_id)) {
    return res.status(400).json({
      success: false,
      message: "O serviço do plano é obrigatório.",
    });
  }

  if (
    !Number.isInteger(Number(quantidade)) ||
    Number(quantidade) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Informe uma quantidade válida de utilizações.",
    });
  }

  if (
    !Number.isFinite(Number(preco)) ||
    Number(preco) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Informe um preço válido.",
    });
  }

  if (
    !Number.isInteger(Number(validade_dias)) ||
    Number(validade_dias) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Informe uma validade válida em dias.",
    });
  }

  const servico =
    await require("../config/prismaClient").servicos.findUnique({
      where: {
        id: servico_id,
      },
    });

  if (!servico) {
    return res.status(404).json({
      success: false,
      message: "Serviço não encontrado.",
    });
  }

  if (!servico.ativo) {
    return res.status(400).json({
      success: false,
      message: "Não é possível criar um plano com serviço inativo.",
    });
  }

  const plano = await planoService.criarPlano({
    nome: nome.trim(),
    descricao: descricao || null,
    servico_id,
    quantidade: Number(quantidade),
    preco: Number(preco),
    validade_dias: Number(validade_dias),
  });

  return res.status(201).json({
    success: true,
    message: "Plano criado com sucesso.",
    data: plano,
  });
});

const atualizar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente =
    await planoService.buscarPlanoPorId(id);

  if (!existente) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  const dados = { ...req.body };

  if (dados.nome !== undefined) {
    if (!isNonEmptyString(dados.nome)) {
      return res.status(400).json({
        success: false,
        message: "O nome do plano é obrigatório.",
      });
    }

    dados.nome = dados.nome.trim();
  }

  if (dados.quantidade !== undefined) {
    if (
      !Number.isInteger(Number(dados.quantidade)) ||
      Number(dados.quantidade) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Informe uma quantidade válida de utilizações.",
      });
    }

    dados.quantidade = Number(dados.quantidade);
  }

  if (dados.preco !== undefined) {
    if (
      !Number.isFinite(Number(dados.preco)) ||
      Number(dados.preco) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Informe um preço válido.",
      });
    }

    dados.preco = Number(dados.preco);
  }

  if (dados.validade_dias !== undefined) {
    if (
      !Number.isInteger(Number(dados.validade_dias)) ||
      Number(dados.validade_dias) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Informe uma validade válida em dias.",
      });
    }

    dados.validade_dias = Number(dados.validade_dias);
  }

  if (dados.servico_id !== undefined) {
    if (!isNonEmptyString(dados.servico_id)) {
      return res.status(400).json({
        success: false,
        message: "O serviço do plano é obrigatório.",
      });
    }

    const servico =
      await require("../config/prismaClient").servicos.findUnique({
        where: {
          id: dados.servico_id,
        },
      });

    if (!servico) {
      return res.status(404).json({
        success: false,
        message: "Serviço não encontrado.",
      });
    }

    if (!servico.ativo) {
      return res.status(400).json({
        success: false,
        message: "Não é possível vincular um serviço inativo ao plano.",
      });
    }
  }

  const plano =
    await planoService.atualizarPlano(
      id,
      dados,
    );

  return res.status(200).json({
    success: true,
    message: "Plano atualizado com sucesso.",
    data: plano,
  });
});

const desativar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente =
    await planoService.buscarPlanoPorId(id);

  if (!existente) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  await planoService.desativarPlano(id);

  return res.status(200).json({
    success: true,
    message: "Plano desativado com sucesso.",
  });
});

module.exports = {
  listar,
  listarTodos,
  buscarPorId,
  criar,
  atualizar,
  desativar,
};
