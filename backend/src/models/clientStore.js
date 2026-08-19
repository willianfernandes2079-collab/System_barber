const prisma = require("../config/prismaClient");

function toPublicClient(cliente) {
  if (!cliente) return null;

  return cliente;
}

async function findById(id) {
  return prisma.cliente.findUnique({
    where: {
      id,
    },
  });
}

async function create({
  nome,
  telefone,
  whatsapp = null,
  email = null,
  data_nascimento = null,
  cpf = null,
  observacoes = null,
  preferencia_barbeiro = null,
  preferencia_servico = null,
}) {
  return prisma.cliente.create({
    data: {
      nome,
      telefone,
      whatsapp,
      email,
      data_nascimento,
      cpf,
      observacoes,
      preferencia_barbeiro,
      preferencia_servico,
      ativo: true,
    },
  });
}

async function update(id, dados) {
  return prisma.cliente.update({
    where: {
      id,
    },
    data: dados,
  });
}

async function deactivate(id) {
  return prisma.cliente.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

async function listAll() {
  return prisma.cliente.findMany({
    orderBy: {
      nome: "asc",
    },
  });
}

async function search(termo) {
  return prisma.cliente.findMany({
    where: {
      OR: [
        {
          nome: {
            contains: termo,
            mode: "insensitive",
          },
        },
        {
          telefone: {
            contains: termo,
          },
        },
        {
          email: {
            contains: termo,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      nome: "asc",
    },
  });
}

module.exports = {
  findById,
  create,
  update,
  deactivate,
  listAll,
  search,
  toPublicClient,
};