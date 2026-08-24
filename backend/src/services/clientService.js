const prisma = require("../config/prismaClient");

async function listarClientes({
  pagina = 1,
  limite = 20,
  busca = "",
  ativo,
}) {
  const paginaNumerica = Math.max(Number(pagina) || 1, 1);
  const limiteNumerica = Math.min(
    Math.max(Number(limite) || 20, 1),
    100
  );

  const skip = (paginaNumerica - 1) * limiteNumerica;

  const where = {};

  if (ativo !== undefined) {
    where.ativo = ativo === true || ativo === "true";
  }

  if (busca && busca.trim()) {
    const termo = busca.trim();

    where.OR = [
      {
        nome: {
          contains: termo,
          mode: "insensitive",
        },
      },
      {
        telefone: {
          contains: termo,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: termo,
          mode: "insensitive",
        },
      },
    ];
  }

  const [clientes, total] = await prisma.$transaction([
    prisma.cliente.findMany({
      where,
      orderBy: {
        nome: "asc",
      },
      skip,
      take: limiteNumerica,
    }),

    prisma.cliente.count({
      where,
    }),
  ]);

  return {
    clientes,
    paginacao: {
      pagina: paginaNumerica,
      limite: limiteNumerica,
      total,
      total_paginas: Math.ceil(total / limiteNumerica),
    },
  };
}

async function buscarClientePorId(id) {
  return prisma.cliente.findUnique({
    where: {
      id,
    },
  });
}

async function buscarPorEmail(email) {
  if (!email) {
    return null;
  }

  return prisma.cliente.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  });
}

async function buscarPorCpf(cpf) {
  if (!cpf) {
    return null;
  }

  return prisma.cliente.findFirst({
    where: {
      cpf,
    },
  });
}

async function criarCliente(dados) {
  const emailNormalizado = dados.email
    ? dados.email.toLowerCase()
    : null;

  return prisma.cliente.create({
    data: {
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      whatsapp: dados.whatsapp?.trim() || null,
      email: emailNormalizado,
      data_nascimento: dados.data_nascimento
        ? new Date(dados.data_nascimento)
        : null,
      cpf: dados.cpf?.trim() || null,
      observacoes: dados.observacoes?.trim() || null,
      preferencia_barbeiro:
        dados.preferencia_barbeiro?.trim() || null,
      preferencia_servico:
        dados.preferencia_servico?.trim() || null,
      ativo: true,
    },
  });
}

async function atualizarCliente(id, dados) {
  const data = {};

  if (dados.nome !== undefined) {
    data.nome = dados.nome.trim();
  }

  if (dados.telefone !== undefined) {
    data.telefone = dados.telefone.trim();
  }

  if (dados.whatsapp !== undefined) {
    data.whatsapp = dados.whatsapp?.trim() || null;
  }

  if (dados.email !== undefined) {
    data.email = dados.email
      ? dados.email.toLowerCase()
      : null;
  }

  if (dados.data_nascimento !== undefined) {
    data.data_nascimento = dados.data_nascimento
      ? new Date(dados.data_nascimento)
      : null;
  }

  if (dados.cpf !== undefined) {
    data.cpf = dados.cpf?.trim() || null;
  }

  if (dados.observacoes !== undefined) {
    data.observacoes = dados.observacoes?.trim() || null;
  }

  if (dados.preferencia_barbeiro !== undefined) {
    data.preferencia_barbeiro =
      dados.preferencia_barbeiro?.trim() || null;
  }

  if (dados.preferencia_servico !== undefined) {
    data.preferencia_servico =
      dados.preferencia_servico?.trim() || null;
  }

  if (dados.ativo !== undefined) {
    data.ativo = Boolean(dados.ativo);
  }

  return prisma.cliente.update({
    where: {
      id,
    },
    data,
  });
}

async function desativarCliente(id) {
  return prisma.cliente.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

async function ativarCliente(id) {
  return prisma.cliente.update({
    where: {
      id,
    },
    data: {
      ativo: true,
    },
  });
}

module.exports = {
  listarClientes,
  buscarClientePorId,
  buscarPorEmail,
  buscarPorCpf,
  criarCliente,
  atualizarCliente,
  desativarCliente,
  ativarCliente,
};