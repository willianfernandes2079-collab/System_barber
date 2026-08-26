const clientService = require("../services/clientService");
const userStore = require("../models/userStore");

async function listar(req, res) {
  const {
    pagina = 1,
    limite = 20,
    busca = "",
    ativo,
  } = req.query;

  const resultado =
    await clientService.listarClientes({
      pagina,
      limite,
      busca,
      ativo,
    });

  return res.status(200).json({
    success: true,
    data: resultado.clientes,
    paginacao: resultado.paginacao,
  });
}

async function buscarPorId(req, res) {
  const { id } = req.params;

  const cliente =
    await clientService.buscarClientePorId(id);

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message: "Cliente não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    data: cliente,
  });
}

async function buscarHistorico(req, res) {
  const { id } = req.params;

  const resultado =
    await clientService.buscarHistoricoCliente(id);

  if (!resultado) {
    return res.status(404).json({
      success: false,
      message: "Cliente não encontrado.",
    });
  }

  return res.status(200).json({
    success: true,
    message:
      "Histórico do cliente carregado com sucesso.",
    data: resultado,
  });
}

async function meuCliente(req, res) {
  const usuario =
    await userStore.findById(req.user.sub);

  if (!usuario) {
    return res.status(404).json({
      success: false,
      message: "Usuário não encontrado.",
    });
  }

  const cliente =
    await clientService.buscarPorEmail(
      usuario.email,
    );

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message:
        "Nenhum cliente vinculado ao usuário autenticado.",
    });
  }

  if (!cliente.ativo) {
    return res.status(403).json({
      success: false,
      message:
        "O cadastro do cliente está inativo.",
    });
  }

  return res.status(200).json({
    success: true,
    data: cliente,
  });
}

async function criar(req, res) {
  const {
    nome,
    telefone,
    whatsapp,
    email,
    data_nascimento,
    cpf,
    observacoes,
    preferencia_barbeiro,
    preferencia_servico,
  } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      success: false,
      message:
        "O nome do cliente é obrigatório.",
    });
  }

  if (!telefone || !telefone.trim()) {
    return res.status(400).json({
      success: false,
      message:
        "O telefone do cliente é obrigatório.",
    });
  }

  if (email) {
    const clienteComEmail =
      await clientService.buscarPorEmail(
        email,
      );

    if (clienteComEmail) {
      return res.status(409).json({
        success: false,
        message:
          "Já existe um cliente cadastrado com este e-mail.",
      });
    }
  }

  if (cpf) {
    const clienteComCpf =
      await clientService.buscarPorCpf(cpf);

    if (clienteComCpf) {
      return res.status(409).json({
        success: false,
        message:
          "Já existe um cliente cadastrado com este CPF.",
      });
    }
  }

  const cliente =
    await clientService.criarCliente({
      nome,
      telefone,
      whatsapp,
      email,
      data_nascimento,
      cpf,
      observacoes,
      preferencia_barbeiro,
      preferencia_servico,
    });

  return res.status(201).json({
    success: true,
    message:
      "Cliente cadastrado com sucesso.",
    data: cliente,
  });
}

async function atualizar(req, res) {
  const { id } = req.params;

  const clienteExistente =
    await clientService.buscarClientePorId(id);

  if (!clienteExistente) {
    return res.status(404).json({
      success: false,
      message: "Cliente não encontrado.",
    });
  }

  const { email, cpf } = req.body;

  if (email) {
    const clienteComEmail =
      await clientService.buscarPorEmail(
        email,
      );

    if (
      clienteComEmail &&
      clienteComEmail.id !== id
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Já existe outro cliente com este e-mail.",
      });
    }
  }

  if (cpf) {
    const clienteComCpf =
      await clientService.buscarPorCpf(cpf);

    if (
      clienteComCpf &&
      clienteComCpf.id !== id
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Já existe outro cliente com este CPF.",
      });
    }
  }

  const cliente =
    await clientService.atualizarCliente(
      id,
      req.body,
    );

  return res.status(200).json({
    success: true,
    message:
      "Cliente atualizado com sucesso.",
    data: cliente,
  });
}

async function desativar(req, res) {
  const { id } = req.params;

  const clienteExistente =
    await clientService.buscarClientePorId(id);

  if (!clienteExistente) {
    return res.status(404).json({
      success: false,
      message: "Cliente não encontrado.",
    });
  }

  await clientService.desativarCliente(id);

  return res.status(200).json({
    success: true,
    message:
      "Cliente desativado com sucesso.",
  });
}

async function ativar(req, res) {
  const { id } = req.params;

  const clienteExistente =
    await clientService.buscarClientePorId(id);

  if (!clienteExistente) {
    return res.status(404).json({
      success: false,
      message: "Cliente não encontrado.",
    });
  }

  await clientService.ativarCliente(id);

  return res.status(200).json({
    success: true,
    message:
      "Cliente ativado com sucesso.",
  });
}

module.exports = {
  listar,
  buscarPorId,
  buscarHistorico,
  meuCliente,
  criar,
  atualizar,
  desativar,
  ativar,
};

