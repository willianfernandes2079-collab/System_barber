const prisma = require("../config/prismaClient");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

// LISTAR AGENDAMENTOS

async function listarAgendamentos() {
  return prisma.agendamentos.findMany({
    include: {
      clientes: {
        select: {
          id: true,
          nome: true,
          telefone: true,
        },
      },

      barbeiros: {
        select: {
          id: true,
          nome: true,
        },
      },

      servicos: {
        select: {
          id: true,
          nome: true,
          duracao: true,
          preco: true,
        },
      },
    },

    orderBy: {
      horario_inicio: "asc",
    },
  });
}

// BUSCAR AGENDAMENTO POR ID

async function buscarAgendamentoPorId(id) {
  return prisma.agendamentos.findUnique({
    where: {
      id,
    },

    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
    },
  });
}

// CRIAR AGENDAMENTO

async function criarAgendamento({
  cliente_id,
  barbeiro_id,
  servico_id,
  data,
  horario_inicio,
  horario_fim,
  status,
  observacoes,
  valor,
  forma_pagamento,
}) {
  const inicio = new Date(horario_inicio);
  const fim = new Date(horario_fim);

  // VALIDAR DATAS

  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    throw new AppError("Data ou horário inválido.", 400);
  }

  // VALIDAR HORÁRIO

  if (fim <= inicio) {
    throw new AppError(
      "O horário de término deve ser posterior ao horário de início.",
      400,
    );
  }

  // VERIFICAR CONFLITO

  const conflito = await prisma.agendamentos.findFirst({
    where: {
      barbeiro_id,

      // Agendamentos cancelados não bloqueiam o horário

      status: {
        not: "CANCELADO",
      },

      // Existe conflito quando:
      // início existente < fim novo
      // E
      // fim existente > início novo
      horario_inicio: {
        lt: fim,
      },

      horario_fim: {
        gt: inicio,
      },
    },
  });

  if (conflito) {
    throw new AppError(
      "O barbeiro já possui um agendamento nesse horário.",
      409,
    );
  }

  // CRIAR AGENDAMENTO

  return prisma.agendamentos.create({
    data: {
      id: crypto.randomUUID(),

      cliente_id,
      barbeiro_id,
      servico_id,

      data: new Date(data),

      horario_inicio: inicio,
      horario_fim: fim,

      status: status || "AGENDADO",

      observacoes: observacoes || null,

      valor,

      forma_pagamento: forma_pagamento || null,
    },

    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
    },
  });
}

// ATUALIZAR AGENDAMENTO

async function atualizarAgendamento(id, dados) {
  const dadosAtualizados = { ...dados };

  // CONVERTER DATAS

  if (dadosAtualizados.data) {
    dadosAtualizados.data = new Date(dadosAtualizados.data);
  }

  if (dadosAtualizados.horario_inicio) {
    dadosAtualizados.horario_inicio = new Date(dadosAtualizados.horario_inicio);
  }

  if (dadosAtualizados.horario_fim) {
    dadosAtualizados.horario_fim = new Date(dadosAtualizados.horario_fim);
  }

  // VERIFICAR CONFLITO SE ALTERAR HORÁRIO

  if (
    dadosAtualizados.horario_inicio ||
    dadosAtualizados.horario_fim ||
    dadosAtualizados.barbeiro_id
  ) {
    const agendamentoAtual = await prisma.agendamentos.findUnique({
      where: {
        id,
      },
    });

    if (!agendamentoAtual) {
      throw new AppError("Agendamento não encontrado.", 404);
    }

    const barbeiroId =
      dadosAtualizados.barbeiro_id || agendamentoAtual.barbeiro_id;

    const inicio =
      dadosAtualizados.horario_inicio || agendamentoAtual.horario_inicio;

    const fim = dadosAtualizados.horario_fim || agendamentoAtual.horario_fim;

    // VALIDAR HORÁRIO

    if (fim <= inicio) {
      throw new AppError(
        "O horário de término deve ser posterior ao horário de início.",
        400,
      );
    }

    // PROCURAR CONFLITO
  

    const conflito = await prisma.agendamentos.findFirst({
      where: {
        id: {
          not: id,
        },

        barbeiro_id: barbeiroId,

        status: {
          not: "CANCELADO",
        },

        horario_inicio: {
          lt: fim,
        },

        horario_fim: {
          gt: inicio,
        },
      },
    });

    if (conflito) {
      throw new AppError(
        "O barbeiro já possui outro agendamento nesse horário.",
        409,
      );
    }
  }

  // ATUALIZAR

  return prisma.agendamentos.update({
    where: {
      id,
    },

    data: dadosAtualizados,

    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
    },
  });
}

// CANCELAR AGENDAMENTO

async function cancelarAgendamento(id) {
  const agendamento = await prisma.agendamentos.findUnique({
    where: {
      id,
    },
  });

  if (!agendamento) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  return prisma.agendamentos.update({
    where: {
      id,
    },

    data: {
      status: "CANCELADO",
    },
  });
}

// CONCLUIR ATENDIMENTO

async function concluirAgendamento(id) {
  const agendamento = await prisma.agendamentos.findUnique({
    where: { id },
  });

  if (!agendamento) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  if (agendamento.status === "CANCELADO") {
    throw new AppError("Não é possível concluir um agendamento cancelado.", 409);
  }

  if (agendamento.status === "CONCLUIDO") {
    throw new AppError("Este agendamento já está marcado como concluído.", 409);
  }

  return prisma.agendamentos.update({
    where: { id },
    data: { status: "CONCLUIDO" },
    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
    },
  });
}

// MARCAR FALTA DO CLIENTE

async function marcarFalta(id) {
  const agendamento = await prisma.agendamentos.findUnique({
    where: { id },
  });

  if (!agendamento) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  if (agendamento.status === "CANCELADO") {
    throw new AppError("Não é possível marcar falta em um agendamento cancelado.", 409);
  }

  if (agendamento.status === "CONCLUIDO") {
    throw new AppError("Este agendamento já foi concluído — não é possível marcar falta.", 409);
  }

  return prisma.agendamentos.update({
    where: { id },
    data: { status: "FALTOU" },
    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
    },
  });
}

// EXPORTAÇÕES

module.exports = {
  listarAgendamentos,
  buscarAgendamentoPorId,
  criarAgendamento,
  atualizarAgendamento,
  cancelarAgendamento,
  concluirAgendamento,
  marcarFalta,
};