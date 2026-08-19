const prisma = require("../config/prismaClient");

async function listarServicos() {
  return prisma.servicos.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
  });
}

async function buscarServicoPorId(id) {
  return prisma.servicos.findUnique({
    where: {
      id,
    },
  });
}

async function criarServico({
  nome,
  descricao,
  duracao,
  preco,
  percentual_comissao,
}) {
  return prisma.servicos.create({
    data: {
      nome,
      descricao: descricao || null,
      duracao,
      preco,
      percentual_comissao:
        percentual_comissao !== undefined ? percentual_comissao : null,
    },
  });
}

async function atualizarServico(id, dados) {
  return prisma.servicos.update({
    where: {
      id,
    },
    data: dados,
  });
}

async function desativarServico(id) {
  return prisma.servicos.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

module.exports = {
  listarServicos,
  buscarServicoPorId,
  criarServico,
  atualizarServico,
  desativarServico,
};
