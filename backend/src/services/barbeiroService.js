const prisma = require("../config/prismaClient");
const AppError = require("../utils/AppError");

async function validarUsuarioDaBarbearia(
  usuarioId,
  barbeariaId,
) {
  if (!usuarioId || !barbeariaId) {
    throw new AppError(
      "Usuário e barbearia são obrigatórios.",
      400,
    );
  }

  const usuario =
    await prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        barbearia_id:
          barbeariaId,
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cargo: true,
        ativo: true,
        barbearia_id: true,
      },
    });

  if (!usuario) {
    throw new AppError(
      "Usuário não encontrado nesta barbearia.",
      404,
    );
  }

  return usuario;
}

async function listarBarbeiros({
  pagina = 1,
  limite = 20,
  busca = "",
  ativo,
  barbeariaId,
}) {
  if (!barbeariaId) {
    throw new AppError(
      "Usuário não está vinculado a uma barbearia.",
      403,
    );
  }

  const paginaNumerica =
    Math.max(Number(pagina) || 1, 1);

  const limiteNumerica = Math.min(
    Math.max(Number(limite) || 20, 1),
    100,
  );

  const skip =
    (paginaNumerica - 1) *
    limiteNumerica;

  const where = {
    barbearia_id:
      barbeariaId,
  };

  if (ativo !== undefined) {
    where.ativo =
      ativo === true ||
      ativo === "true";
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
        especialidade: {
          contains: termo,
          mode: "insensitive",
        },
      },
    ];
  }

  const [barbeiros, total] =
    await prisma.$transaction([
      prisma.barbeiros.findMany({
        where,

        orderBy: {
          nome: "asc",
        },

        skip,
        take: limiteNumerica,

        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              cargo: true,
              ativo: true,
            },
          },
        },
      }),

      prisma.barbeiros.count({
        where,
      }),
    ]);

  return {
    barbeiros,
    paginacao: {
      pagina:
        paginaNumerica,

      limite:
        limiteNumerica,

      total,

      total_paginas:
        Math.ceil(
          total /
            limiteNumerica,
        ),
    },
  };
}

async function buscarBarbeiroPorId(
  id,
  barbeariaId,
) {
  if (!id || !barbeariaId) {
    return null;
  }

  return prisma.barbeiros.findFirst({
    where: {
      id,

      barbearia_id:
        barbeariaId,
    },

    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cargo: true,
          ativo: true,
        },
      },
    },
  });
}

async function buscarPorUsuarioId(
  usuarioId,
  barbeariaId,
) {
  if (!usuarioId || !barbeariaId) {
    return null;
  }

  return prisma.barbeiros.findFirst({
    where: {
      usuario_id:
        usuarioId,

      barbearia_id:
        barbeariaId,
    },

    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cargo: true,
          ativo: true,
        },
      },
    },
  });
}

async function buscarPorCpf(
  cpf,
  barbeariaId,
) {
  if (!cpf || !barbeariaId) {
    return null;
  }

  return prisma.barbeiros.findFirst({
    where: {
      cpf,

      barbearia_id:
        barbeariaId,
    },
  });
}

async function criarBarbeiro(
  dados,
) {
  if (!dados.barbearia_id) {
    throw new AppError(
      "Barbearia não informada.",
      403,
    );
  }

  await validarUsuarioDaBarbearia(
    dados.usuario_id,
    dados.barbearia_id,
  );

  const barbeiroExistente =
    await prisma.barbeiros.findFirst({
      where: {
        usuario_id:
          dados.usuario_id,

        barbearia_id:
          dados.barbearia_id,
      },
    });

  if (barbeiroExistente) {
    throw new AppError(
      "Este usuário já está cadastrado como barbeiro nesta barbearia.",
      409,
    );
  }

  return prisma.barbeiros.create({
    data: {
      usuario_id:
        dados.usuario_id,

      nome:
        dados.nome.trim(),

      cpf:
        dados.cpf?.trim() ||
        null,

      data_nascimento:
        dados.data_nascimento
          ? new Date(
              dados.data_nascimento,
            )
          : null,

      telefone:
        dados.telefone?.trim() ||
        null,

      whatsapp:
        dados.whatsapp?.trim() ||
        null,

      especialidade:
        dados.especialidade?.trim() ||
        null,

      pix_tipo:
        dados.pix_tipo?.trim() ||
        null,

      pix_chave:
        dados.pix_chave?.trim() ||
        null,

      percentual_comissao:
        dados.percentual_comissao ??
        0,

      ativo: true,

      barbearia_id:
        dados.barbearia_id,
    },

    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cargo: true,
          ativo: true,
        },
      },
    },
  });
}

async function atualizarBarbeiro(
  id,
  dados,
  barbeariaId,
) {
  const barbeiroExistente =
    await buscarBarbeiroPorId(
      id,
      barbeariaId,
    );

  if (!barbeiroExistente) {
    return null;
  }

  const data = {};

  if (dados.usuario_id !== undefined) {
    await validarUsuarioDaBarbearia(
      dados.usuario_id,
      barbeariaId,
    );

    const outroBarbeiro =
      await prisma.barbeiros.findFirst({
        where: {
          usuario_id:
            dados.usuario_id,

          barbearia_id:
            barbeariaId,

          id: {
            not: id,
          },
        },
      });

    if (outroBarbeiro) {
      throw new AppError(
        "Este usuário já está cadastrado como barbeiro nesta barbearia.",
        409,
      );
    }

    data.usuario_id =
      dados.usuario_id;
  }

  if (dados.nome !== undefined) {
    data.nome =
      dados.nome.trim();
  }

  if (dados.cpf !== undefined) {
    data.cpf =
      dados.cpf?.trim() ||
      null;
  }

  if (
    dados.data_nascimento !==
    undefined
  ) {
    data.data_nascimento =
      dados.data_nascimento
        ? new Date(
            dados.data_nascimento,
          )
        : null;
  }

  if (dados.telefone !== undefined) {
    data.telefone =
      dados.telefone?.trim() ||
      null;
  }

  if (dados.whatsapp !== undefined) {
    data.whatsapp =
      dados.whatsapp?.trim() ||
      null;
  }

  if (
    dados.especialidade !==
    undefined
  ) {
    data.especialidade =
      dados.especialidade?.trim() ||
      null;
  }

  if (dados.pix_tipo !== undefined) {
    data.pix_tipo =
      dados.pix_tipo?.trim() ||
      null;
  }

  if (dados.pix_chave !== undefined) {
    data.pix_chave =
      dados.pix_chave?.trim() ||
      null;
  }

  if (
    dados.percentual_comissao !==
    undefined
  ) {
    data.percentual_comissao =
      dados.percentual_comissao;
  }

  if (dados.ativo !== undefined) {
    data.ativo =
      dados.ativo === true ||
      dados.ativo === "true";
  }

  return prisma.barbeiros.update({
    where: {
      id,
    },

    data,

    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cargo: true,
          ativo: true,
        },
      },
    },
  });
}

async function desativarBarbeiro(
  id,
  barbeariaId,
) {
  const barbeiro =
    await buscarBarbeiroPorId(
      id,
      barbeariaId,
    );

  if (!barbeiro) {
    return null;
  }

  return prisma.barbeiros.update({
    where: {
      id,
    },

    data: {
      ativo: false,
    },
  });
}

async function ativarBarbeiro(
  id,
  barbeariaId,
) {
  const barbeiro =
    await buscarBarbeiroPorId(
      id,
      barbeariaId,
    );

  if (!barbeiro) {
    return null;
  }

  return prisma.barbeiros.update({
    where: {
      id,
    },

    data: {
      ativo: true,
    },
  });
}

module.exports = {
  listarBarbeiros,
  buscarBarbeiroPorId,
  buscarPorUsuarioId,
  buscarPorCpf,
  criarBarbeiro,
  atualizarBarbeiro,
  desativarBarbeiro,
  ativarBarbeiro,
};

