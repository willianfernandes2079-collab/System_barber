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

async function buscarPlanoPorId(
  plano_id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.plano.findFirst({
    where: {
      id: plano_id,
      barbearia_id:
        barbeariaId,
    },

    include: {
      servico: true,
    },
  });
}

async function buscarClientePorId(
  cliente_id,
  barbeariaId,
) {
  if (!cliente_id || !barbeariaId) {
    return null;
  }

  return prisma.cliente.findFirst({
    where: {
      id: cliente_id,
      ativo: true,

      vinculos_barbearias: {
        some: {
          barbearia_id:
            barbeariaId,

          ativo: true,

          barbearia: {
            ativo: true,
          },
        },
      },
    },
  });
}

async function listarAssinaturasCliente(
  cliente_id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const cliente =
    await buscarClientePorId(
      cliente_id,
      barbeariaId,
    );

  if (!cliente) {
    return [];
  }

  return prisma.assinaturaPlano.findMany({
    where: {
      cliente_id,

      barbearia_id:
        barbeariaId,
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

async function listarAssinaturasAtivas(
  cliente_id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const cliente =
    await buscarClientePorId(
      cliente_id,
      barbeariaId,
    );

  if (!cliente) {
    return [];
  }

  const agora = new Date();

  const assinaturas =
    await prisma.assinaturaPlano.findMany({
      where: {
        cliente_id,

        barbearia_id:
          barbeariaId,

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

async function buscarAssinaturaPorId(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.assinaturaPlano.findFirst({
    where: {
      id,

      barbearia_id:
        barbeariaId,
    },

    include: {
      cliente: true,

      plano: {
        include: {
          servico: true,
        },
      },

      agendamentos: {
        where: {
          barbearia_id:
            barbeariaId,
        },

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
  barbeariaId,
}) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const plano =
    await buscarPlanoPorId(
      plano_id,
      barbeariaId,
    );

  if (!plano) {
    throw new AppError(
      "Plano não encontrado.",
      404,
    );
  }

  if (!plano.ativo) {
    throw new AppError(
      "Este plano está inativo.",
      409,
    );
  }

  if (
    !plano.servico ||
    plano.servico.barbearia_id !==
      barbeariaId
  ) {
    throw new AppError(
      "O serviço do plano não pertence a esta barbearia.",
      403,
    );
  }

  const cliente =
    await buscarClientePorId(
      cliente_id,
      barbeariaId,
    );

  if (!cliente) {
    throw new AppError(
      "Cliente não encontrado.",
      404,
    );
  }

  const inicio = data_inicio
    ? new Date(data_inicio)
    : new Date();

  if (isNaN(inicio.getTime())) {
    throw new AppError(
      "Data de início inválida.",
      422,
    );
  }

  const fim = new Date(inicio);

  fim.setDate(
    fim.getDate() +
      Number(plano.validade_dias),
  );

  return prisma.assinaturaPlano.create({
    data: {
      cliente_id,
      plano_id,

      barbearia_id:
        barbeariaId,

      quantidade_total:
        Number(plano.quantidade),

      quantidade_utilizada: 0,

      valor_pago:
        valor_pago !== undefined &&
        valor_pago !== null
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

async function atualizarAssinatura(
  id,
  dados,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const existente =
    await buscarAssinaturaPorId(
      id,
      barbeariaId,
    );

  if (!existente) {
    return null;
  }

  const data = {
    ...dados,
  };

  delete data.barbearia_id;
  delete data.cliente_id;
  delete data.plano_id;

  return prisma.assinaturaPlano.update({
    where: {
      id,
    },

    data,

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

async function cancelarAssinatura(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const existente =
    await buscarAssinaturaPorId(
      id,
      barbeariaId,
    );

  if (!existente) {
    return null;
  }

  if (existente.status === "CANCELADO") {
    throw new AppError(
      "Esta assinatura já está cancelada.",
      409,
    );
  }

  return prisma.assinaturaPlano.update({
    where: {
      id,
    },

    data: {
      status: "CANCELADO",
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

async function utilizarAssinatura(
  id,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  return prisma.$transaction(
    async (tx) => {
      const agora = new Date();

      const assinatura =
        await tx.assinaturaPlano.findFirst({
          where: {
            id,

            barbearia_id:
              barbeariaId,
          },
        });

      if (!assinatura) {
        throw new AppError(
          "Assinatura de plano não encontrada.",
          404,
        );
      }

      if (
        assinatura.status !== "ATIVO"
      ) {
        throw new AppError(
          "Esta assinatura não está ativa.",
          409,
        );
      }

      if (
        assinatura.data_fim < agora
      ) {
        await tx.assinaturaPlano.update({
          where: {
            id,
          },

          data: {
            status: "VENCIDO",
          },
        });

        throw new AppError(
          "A assinatura deste plano está vencida.",
          409,
        );
      }

      const resultado =
        await tx.assinaturaPlano.updateMany({
          where: {
            id,

            barbearia_id:
              barbeariaId,

            status: "ATIVO",

            data_fim: {
              gte: agora,
            },

            quantidade_utilizada: {
              lt:
                assinatura.quantidade_total,
            },
          },

          data: {
            quantidade_utilizada: {
              increment: 1,
            },
          },
        });

      if (resultado.count !== 1) {
        throw new AppError(
          "Não há mais utilizações disponíveis neste plano.",
          409,
        );
      }

      return tx.assinaturaPlano.findFirst({
        where: {
          id,

          barbearia_id:
            barbeariaId,
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
    },
  );
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

