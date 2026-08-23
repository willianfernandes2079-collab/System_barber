const prisma = require("../config/prismaClient");

async function listarBarbeiros({ pagina = 1, limite = 20, busca = "", ativo }) {
  const paginaNumerica = Math.max(Number(pagina) || 1, 1);

  const limiteNumerico = Math.min(Math.max(Number(limite) || 20, 1), 100);

  const skip = (paginaNumerica - 1) * limiteNumerico;

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
        especialidade: {
          contains: termo,
          mode: "insensitive",
        },
      },
    ];
  }

  const [barbeiros, total] = await prisma.$transaction([
    prisma.barbeiro.findMany({
      where,
      orderBy: {
        nome: "asc",
      },
      skip,
      take: limiteNumerico,
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

    prisma.barbeiro.count({
      where,
    }),
  ]);

  return {
    barbeiros,
    paginacao: {
      pagina: paginaNumerica,
      limite: limiteNumerico,
      total,
      total_paginas: Math.ceil(total / limiteNumerico),
    },
  };
}

async function buscarBarbeiroPorId(id) {
  return prisma.barbeiro.findUnique({
    where: {
      id,
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

async function buscarPorUsuarioId(usuarioId) {
  return prisma.barbeiro.findUnique({
    where: {
      usuario_id: usuarioId,
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

async function criarBarbeiro(dados) {
  return prisma.barbeiro.create({
    data: {
      usuario_id: dados.usuario_id,
      nome: dados.nome.trim(),
      telefone: dados.telefone?.trim() || null,
      especialidade: dados.especialidade?.trim() || null,
      percentual_comissao: dados.percentual_comissao ?? 0,
      ativo: true,
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

async function atualizarBarbeiro(id, dados) {
  const data = {};

  if (dados.usuario_id !== undefined) {
    data.usuario_id = dados.usuario_id;
  }

  if (dados.nome !== undefined) {
    data.nome = dados.nome.trim();
  }

  if (dados.telefone !== undefined) {
    data.telefone = dados.telefone?.trim() || null;
  }

  if (dados.especialidade !== undefined) {
    data.especialidade = dados.especialidade?.trim() || null;
  }

  if (dados.percentual_comissao !== undefined) {
    data.percentual_comissao = dados.percentual_comissao;
  }

  if (dados.ativo !== undefined) {
    data.ativo = dados.ativo === true || dados.ativo === "true";
  }

  return prisma.barbeiro.update({
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

async function desativarBarbeiro(id) {
  return prisma.barbeiro.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

module.exports = {
  listarBarbeiros,
  buscarBarbeiroPorId,
  buscarPorUsuarioId,
  criarBarbeiro,
  atualizarBarbeiro,
  desativarBarbeiro,
};
