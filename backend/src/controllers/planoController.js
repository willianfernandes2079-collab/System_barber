const planoService = require("../services/planoService");
const asyncHandler = require("../utils/asyncHandler");
const { isNonEmptyString } = require("../utils/validators");

const listar = asyncHandler(async (req, res) => {
  const planos =
    await planoService.listarPlanos(
      req.user.barbearia_id,
    );

  return res.status(200).json({
    success: true,
    data: planos,
  });
});

const listarTodos = asyncHandler(async (req, res) => {
  const planos =
    await planoService.listarTodosPlanos(
      req.user.barbearia_id,
    );

  return res.status(200).json({
    success: true,
    data: planos,
  });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plano =
    await planoService.buscarPlanoPorId(
      id,
      req.user.barbearia_id,
    );

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
      message:
        "Informe uma quantidade válida de utilizações.",
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
      message:
        "Informe uma validade válida em dias.",
    });
  }

  const plano =
    await planoService.criarPlano({
      nome: nome.trim(),
      descricao: descricao || null,
      servico_id,
      quantidade:
        Number(quantidade),
      preco: Number(preco),
      validade_dias:
        Number(validade_dias),
      barbearia_id:
        req.user.barbearia_id,
    });

  return res.status(201).json({
    success: true,
    message:
      "Plano criado com sucesso.",
    data: plano,
  });
});

const atualizar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente =
    await planoService.buscarPlanoPorId(
      id,
      req.user.barbearia_id,
    );

  if (!existente) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  const dados = {};

  const camposPermitidos = [
    "nome",
    "descricao",
    "servico_id",
    "quantidade",
    "preco",
    "validade_dias",
    "ativo",
  ];

  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) {
      dados[campo] =
        req.body[campo];
    }
  }

  if (dados.nome !== undefined) {
    if (
      !isNonEmptyString(
        dados.nome,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "O nome do plano é obrigatório.",
      });
    }

    dados.nome =
      dados.nome.trim();
  }

  if (dados.quantidade !== undefined) {
    if (
      !Number.isInteger(
        Number(dados.quantidade),
      ) ||
      Number(dados.quantidade) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Informe uma quantidade válida de utilizações.",
      });
    }

    dados.quantidade =
      Number(dados.quantidade);
  }

  if (dados.preco !== undefined) {
    if (
      !Number.isFinite(
        Number(dados.preco),
      ) ||
      Number(dados.preco) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Informe um preço válido.",
      });
    }

    dados.preco =
      Number(dados.preco);
  }

  if (
    dados.validade_dias !==
    undefined
  ) {
    if (
      !Number.isInteger(
        Number(
          dados.validade_dias,
        ),
      ) ||
      Number(
        dados.validade_dias,
      ) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Informe uma validade válida em dias.",
      });
    }

    dados.validade_dias =
      Number(
        dados.validade_dias,
      );
  }

  if (
    dados.servico_id !==
    undefined
  ) {
    if (
      !isNonEmptyString(
        dados.servico_id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "O serviço do plano é obrigatório.",
      });
    }
  }

  if (dados.ativo !== undefined) {
    dados.ativo =
      dados.ativo === true ||
      dados.ativo === "true";
  }

  const plano =
    await planoService.atualizarPlano(
      id,
      dados,
      req.user.barbearia_id,
    );

  if (!plano) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    message:
      "Plano atualizado com sucesso.",
    data: plano,
  });
});

const desativar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente =
    await planoService.buscarPlanoPorId(
      id,
      req.user.barbearia_id,
    );

  if (!existente) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  const plano =
    await planoService.desativarPlano(
      id,
      req.user.barbearia_id,
    );

  if (!plano) {
    return res.status(404).json({
      success: false,
      message: "Plano não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    message:
      "Plano desativado com sucesso.",
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