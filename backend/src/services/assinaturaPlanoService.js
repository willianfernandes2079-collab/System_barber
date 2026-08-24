const prisma = require("../config/prismaClient");

async function buscarPlanoPorId(plano_id) {
  return prisma.plano.findUnique({
    where: {
      id: plano_id,
    },
    include: {
      servico: true,
    },
  });
}

async function buscarClientePorId(cliente_id) {
  return prisma.cliente.findUnique({
    where: {
      id: cliente_id,
    },
  });
}

async function listarAssinaturasCliente(cliente_id) {
  return prisma.assinaturaPlano.findMany({
    where: {
      cliente_id,
    },
    include: {
      plano: {
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
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

async function listarAssinaturasAtivas(cliente_id) {
  const agora = new Date();

  const assinaturas =
    await prisma.assinaturaPlano.findMany({
      where: {
        cliente_id,
        status: "ATIVO",
        data_fim: {
          gte: agora,
        },
      },

      include: {
        plano: {
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
        },
      },

      orderBy: {
        data_fim: "asc",
      },
    });

  return assinaturas.filter(
    (assinatura) =>
      assinatura.quantidade_utilizada <
      assinatura.quantidade_total,
  );
}

async function buscarAssinaturaPorId(id) {
  return prisma.assinaturaPlano.findUnique({
    where: {
      id,
    },
    include: {
      cliente: true,
      plano: {
        include: {
          servico: true,
        },
      },
      agendamentos: {
        orderBy: {
          horario_inicio: "desc",
        },
      },
    },
  });
}

async function contratarPlano({
  cliente_id,
  plano_id,
  valor_pago,
  data_inicio,
}) {
  const plano = await buscarPlanoPorId(plano_id);

  if (!plano) {
    throw new Error("Plano não encontrado.");
  }

  if (!plano.ativo) {
    throw new Error("Este plano está inativo.");
  }

  const cliente = await buscarClientePorId(cliente_id);

  if (!cliente) {
    throw new Error("Cliente não encontrado.");
  }

  if (!cliente.ativo) {
    throw new Error("Este cliente está inativo.");
  }

  const inicio = data_inicio ? new Date(data_inicio) : new Date();

  if (isNaN(inicio.getTime())) {
    throw new Error("Data de início inválida.");
  }

  const fim = new Date(inicio);

  fim.setDate(fim.getDate() + Number(plano.validade_dias));

  return prisma.assinaturaPlano.create({
    data: {
      cliente_id,
      plano_id,

      quantidade_total: Number(plano.quantidade),

      quantidade_utilizada: 0,

      valor_pago:
        valor_pago !== undefined && valor_pago !== null
          ? valor_pago
          : plano.preco,

      data_inicio: inicio,

      data_fim: fim,

      status: "ATIVO",
    },

    include: {
      cliente: true,

      plano: {
        include: {
          servico: true,
        },
      },
    },
  });
}

async function atualizarAssinatura(id, dados) {
  return prisma.assinaturaPlano.update({
    where: {
      id,
    },
    data: dados,
    include: {
      cliente: true,
      plano: {
        include: {
          servico: true,
        },
      },
    },
  });
}

async function cancelarAssinatura(id) {
  return prisma.assinaturaPlano.update({
    where: {
      id,
    },
    data: {
      status: "CANCELADO",
    },
  });
}

async function utilizarAssinatura(id) {
  return prisma.$transaction(async (tx) => {
    const assinatura = await tx.assinaturaPlano.findUnique({
      where: {
        id,
      },
    });

    if (!assinatura) {
      throw new Error("Assinatura de plano não encontrada.");
    }

    if (assinatura.status !== "ATIVO") {
      throw new Error("Esta assinatura não está ativa.");
    }

    const agora = new Date();

    if (assinatura.data_fim < agora) {
      await tx.assinaturaPlano.update({
        where: {
          id,
        },
        data: {
          status: "VENCIDO",
        },
      });

      throw new Error("A assinatura deste plano está vencida.");
    }

    if (assinatura.quantidade_utilizada >= assinatura.quantidade_total) {
      throw new Error("Não há mais utilizações disponíveis neste plano.");
    }

    return tx.assinaturaPlano.update({
      where: {
        id,
      },
      data: {
        quantidade_utilizada: {
          increment: 1,
        },
      },
      include: {
        cliente: true,
        plano: {
          include: {
            servico: true,
          },
        },
      },
    });
  });
}

module.exports = {
  buscarPlanoPorId,
  buscarClientePorId,
  listarAssinaturasCliente,
  listarAssinaturasAtivas,
  buscarAssinaturaPorId,
  contratarPlano,
  atualizarAssinatura,
  cancelarAssinatura,
  utilizarAssinatura,
};
