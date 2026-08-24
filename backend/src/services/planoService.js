const prisma = require("../config/prismaClient");

async function listarPlanos() {
  return prisma.plano.findMany({
    where: {
      ativo: true,
    },
    include: {
      servico: {
        select: {
          id: true,
          nome: true,
          duracao: true,
          preco: true,
        },
      },
    },
    orderBy: {
      nome: "asc",
    },
  });
}

async function listarTodosPlanos() {
  return prisma.plano.findMany({
    include: {
      servico: {
        select: {
          id: true,
          nome: true,
          duracao: true,
          preco: true,
        },
      },
    },
    orderBy: {
      nome: "asc",
    },
  });
}

async function buscarPlanoPorId(id) {
  return prisma.plano.findUnique({
    where: {
      id,
    },
    include: {
      servico: {
        select: {
          id: true,
          nome: true,
          duracao: true,
          preco: true,
        },
      },
    },
  });
}

async function criarPlano({
  nome,
  descricao,
  servico_id,
  quantidade,
  preco,
  validade_dias,
}) {
  return prisma.plano.create({
    data: {
      nome,
      descricao: descricao || null,
      servico_id,
      quantidade,
      preco,
      validade_dias,
    },
    include: {
      servico: true,
    },
  });
}

async function atualizarPlano(id, dados) {
  return prisma.plano.update({
    where: {
      id,
    },
    data: dados,
    include: {
      servico: true,
    },
  });
}

async function desativarPlano(id) {
  return prisma.plano.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

module.exports = {
  listarPlanos,
  listarTodosPlanos,
  buscarPlanoPorId,
  criarPlano,
  atualizarPlano,
  desativarPlano,
};