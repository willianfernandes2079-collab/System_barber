const prisma = require("../config/prismaClient");
const AppError = require("../utils/AppError");

function validarBarbeariaId(barbeariaId) {
  if (!barbeariaId) {
    throw new AppError(
      "Usuário não está vinculado a uma barbearia.",
      403,
    );
  }

  return barbeariaId;
}

async function listarServicos(barbeariaId) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.servicos.findMany({
    where: {
      ativo: true,
      barbearia_id: barbeariaId,
    },
    orderBy: {
      nome: "asc",
    },
  });
}

async function buscarServicoPorId(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.servicos.findFirst({
    where: {
      id,
      barbearia_id: barbeariaId,
    },
  });
}

async function criarServico({
  nome,
  descricao,
  duracao,
  preco,
  percentual_comissao,
  barbeariaId,
}) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.servicos.create({
    data: {
      nome,
      descricao: descricao || null,
      duracao,
      preco,
      percentual_comissao:
        percentual_comissao !== undefined
          ? percentual_comissao
          : null,
      barbearia_id: barbeariaId,
    },
  });
}

async function atualizarServico(
  id,
  dados,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const existente =
    await prisma.servicos.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
    });

  if (!existente) {
    return null;
  }

  return prisma.servicos.update({
    where: {
      id,
    },
    data: dados,
  });
}

async function desativarServico(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const existente =
    await prisma.servicos.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
    });

  if (!existente) {
    return null;
  }

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