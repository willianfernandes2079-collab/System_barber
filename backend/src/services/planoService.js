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

async function listarPlanos(barbeariaId) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.plano.findMany({
    where: {
      ativo: true,
      barbearia_id: barbeariaId,
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

async function listarTodosPlanos(
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.plano.findMany({
    where: {
      barbearia_id: barbeariaId,
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

async function buscarPlanoPorId(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.plano.findFirst({
    where: {
      id,
      barbearia_id: barbeariaId,
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
  barbearia_id,
}) {
  barbearia_id =
    validarBarbeariaId(barbearia_id);

  const servico =
    await prisma.servicos.findFirst({
      where: {
        id: servico_id,
        barbearia_id,
      },
    });

  if (!servico) {
    throw new AppError(
      "Serviço não encontrado nesta barbearia.",
      404,
    );
  }

  if (!servico.ativo) {
    throw new AppError(
      "Não é possível criar um plano com serviço inativo.",
      400,
    );
  }

  return prisma.plano.create({
    data: {
      nome,
      descricao: descricao || null,
      servico_id,
      quantidade,
      preco,
      validade_dias,
      barbearia_id,
    },

    include: {
      servico: true,
    },
  });
}

async function atualizarPlano(
  id,
  dados,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const planoExistente =
    await buscarPlanoPorId(
      id,
      barbeariaId,
    );

  if (!planoExistente) {
    return null;
  }

  const data = {};

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
    if (dados[campo] !== undefined) {
      data[campo] = dados[campo];
    }
  }

  if (data.servico_id !== undefined) {
    const servico =
      await prisma.servicos.findFirst({
        where: {
          id: data.servico_id,
          barbearia_id: barbeariaId,
        },
      });

    if (!servico) {
      throw new AppError(
        "Serviço não encontrado nesta barbearia.",
        404,
      );
    }

    if (!servico.ativo) {
      throw new AppError(
        "Não é possível vincular um serviço inativo ao plano.",
        400,
      );
    }
  }

  return prisma.plano.update({
    where: {
      id,
    },

    data,

    include: {
      servico: true,
    },
  });
}

async function desativarPlano(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const planoExistente =
    await buscarPlanoPorId(
      id,
      barbeariaId,
    );

  if (!planoExistente) {
    return null;
  }

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