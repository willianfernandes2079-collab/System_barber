const prisma = require("../config/prismaClient");

async function listarClientes({ pagina = 1, limite = 20, busca = "", ativo }) {
  const paginaNumerica = Math.max(Number(pagina) || 1, 1);
  const limiteNumerica = Math.min(Math.max(Number(limite) || 20, 1), 100);

  const skip = (paginaNumerica - 1) * limiteNumerica;

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
        email: {
          contains: termo,
          mode: "insensitive",
        },
      },
    ];
  }

  const [clientes, total] = await prisma.$transaction([
    prisma.cliente.findMany({
      where,
      orderBy: {
        nome: "asc",
      },
      skip,
      take: limiteNumerica,
    }),

    prisma.cliente.count({
      where,
    }),
  ]);

  return {
    clientes,
    paginacao: {
      pagina: paginaNumerica,
      limite: limiteNumerica,
      total,
      total_paginas: Math.ceil(total / limiteNumerica),
    },
  };
}

async function buscarClientePorId(id) {
  return prisma.cliente.findUnique({
    where: {
      id,
    },
  });
}

async function buscarHistoricoCliente(cliente_id) {
  const cliente = await prisma.cliente.findUnique({
    where: {
      id: cliente_id,
    },
  });

  if (!cliente) {
    return null;
  }

  const [agendamentos, pagamentos] = await prisma.$transaction([
    prisma.agendamentos.findMany({
      where: {
        cliente_id,
      },
      include: {
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
          },
        },
      },
      orderBy: {
        horario_inicio: "desc",
      },
    }),

    prisma.pagamento.findMany({
      where: {
        cliente_id,
        status: "PAGO",
        valor: {
          gt: 0,
        },
      },
      orderBy: {
        data_pagamento: "desc",
      },
    }),
  ]);

  const concluidos = agendamentos.filter(
    (agendamento) => agendamento.status === "CONCLUIDO",
  );

  const agendamentoConcluidoIds = new Set(
    concluidos.map((agendamento) => agendamento.id),
  );

  const pagamentosValidos = pagamentos.filter((pagamento) =>
    agendamentoConcluidoIds.has(pagamento.agendamento_id),
  );

  const pagamentosPorAgendamento = new Map(
    pagamentosValidos.map((pagamento) => [pagamento.agendamento_id, pagamento]),
  );

  const totalGasto = pagamentosValidos.reduce(
    (soma, pagamento) => soma + Number(pagamento.valor),
    0,
  );

  const ticketMedio = pagamentosValidos.length
    ? totalGasto / pagamentosValidos.length
    : 0;

  const ultimoAtendimento = concluidos[0]?.horario_inicio || null;

  const contagemServico = {};
  const contagemBarbeiro = {};

  for (const agendamento of concluidos) {
    if (agendamento.servicos) {
      const chave = agendamento.servicos.id;

      if (!contagemServico[chave]) {
        contagemServico[chave] = {
          id: agendamento.servicos.id,
          nome: agendamento.servicos.nome,
          quantidade: 0,
        };
      }

      contagemServico[chave].quantidade += 1;
    }

    if (agendamento.barbeiros) {
      const chave = agendamento.barbeiros.id;

      if (!contagemBarbeiro[chave]) {
        contagemBarbeiro[chave] = {
          id: agendamento.barbeiros.id,
          nome: agendamento.barbeiros.nome,
          quantidade: 0,
        };
      }

      contagemBarbeiro[chave].quantidade += 1;
    }
  }

  const servicoMaisUtilizado =
    Object.values(contagemServico).sort(
      (a, b) => b.quantidade - a.quantidade,
    )[0] || null;

  const barbeiroMaisUtilizado =
    Object.values(contagemBarbeiro).sort(
      (a, b) => b.quantidade - a.quantidade,
    )[0] || null;

  return {
    cliente,

    estatisticas: {
      quantidade_visitas: concluidos.length,

      total_gasto: Number(totalGasto.toFixed(2)),

      ticket_medio: Number(ticketMedio.toFixed(2)),

      ultimo_atendimento: ultimoAtendimento,

      servico_mais_utilizado: servicoMaisUtilizado,

      barbeiro_mais_utilizado: barbeiroMaisUtilizado,
    },

    historico: agendamentos.map((agendamento) => {
      const pagamento = pagamentosPorAgendamento.get(agendamento.id);

      return {
        id: agendamento.id,

        data: agendamento.data,

        horario_inicio: agendamento.horario_inicio,

        horario_fim: agendamento.horario_fim,

        status: agendamento.status,

        servico: agendamento.servicos,

        barbeiro: agendamento.barbeiros,

        valor: Number(agendamento.valor),

        valor_pago: pagamento ? Number(pagamento.valor) : null,

        forma_pagamento: pagamento ? pagamento.forma_pagamento : null,

        data_pagamento: pagamento ? pagamento.data_pagamento : null,

        observacoes: agendamento.observacoes,
      };
    }),
  };
}

async function buscarPorEmail(email) {
  if (!email) {
    return null;
  }

  return prisma.cliente.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  });
}

async function buscarPorCpf(cpf) {
  if (!cpf) {
    return null;
  }

  return prisma.cliente.findFirst({
    where: {
      cpf,
    },
  });
}

async function criarCliente(dados) {
  const emailNormalizado = dados.email ? dados.email.toLowerCase() : null;

  return prisma.cliente.create({
    data: {
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      whatsapp: dados.whatsapp?.trim() || null,
      email: emailNormalizado,
      data_nascimento: dados.data_nascimento
        ? new Date(dados.data_nascimento)
        : null,
      cpf: dados.cpf?.trim() || null,
      observacoes: dados.observacoes?.trim() || null,
      preferencia_barbeiro: dados.preferencia_barbeiro?.trim() || null,
      preferencia_servico: dados.preferencia_servico?.trim() || null,
      ativo: true,
    },
  });
}

async function atualizarCliente(id, dados) {
  const data = {};

  if (dados.nome !== undefined) {
    data.nome = dados.nome.trim();
  }

  if (dados.telefone !== undefined) {
    data.telefone = dados.telefone.trim();
  }

  if (dados.whatsapp !== undefined) {
    data.whatsapp = dados.whatsapp?.trim() || null;
  }

  if (dados.email !== undefined) {
    data.email = dados.email ? dados.email.toLowerCase() : null;
  }

  if (dados.data_nascimento !== undefined) {
    data.data_nascimento = dados.data_nascimento
      ? new Date(dados.data_nascimento)
      : null;
  }

  if (dados.cpf !== undefined) {
    data.cpf = dados.cpf?.trim() || null;
  }

  if (dados.observacoes !== undefined) {
    data.observacoes = dados.observacoes?.trim() || null;
  }

  if (dados.preferencia_barbeiro !== undefined) {
    data.preferencia_barbeiro = dados.preferencia_barbeiro?.trim() || null;
  }

  if (dados.preferencia_servico !== undefined) {
    data.preferencia_servico = dados.preferencia_servico?.trim() || null;
  }

  if (dados.ativo !== undefined) {
    data.ativo = Boolean(dados.ativo);
  }

  return prisma.cliente.update({
    where: {
      id,
    },
    data,
  });
}

async function desativarCliente(id) {
  return prisma.cliente.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

async function ativarCliente(id) {
  return prisma.cliente.update({
    where: {
      id,
    },
    data: {
      ativo: true,
    },
  });
}

module.exports = {
  listarClientes,
  buscarClientePorId,
  buscarHistoricoCliente,
  buscarPorEmail,
  buscarPorCpf,
  criarCliente,
  atualizarCliente,
  desativarCliente,
  ativarCliente,
};
