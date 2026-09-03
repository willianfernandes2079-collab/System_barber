const prisma = require("../config/prismaClient");
const AppError = require("../utils/AppError");

const FORMAS_PAGAMENTO_VALIDAS = [
  "DINHEIRO",
  "PIX",
  "DEBITO",
  "CREDITO",
  "OUTROS",
];

function validarBarbeariaId(barbeariaId) {
  if (!barbeariaId) {
    throw new AppError("Usúario não está vinculado á uma barbearia.", 403);
  }

  return barbeariaId;
}

function sanitizarPagamento(pagamento) {
  if (!pagamento) return pagamento;

  return {
    ...pagamento,
    valor: Number(pagamento.valor),
  };
}

function sanitizarComissao(comissao) {
  if (!comissao) return comissao;

  return {
    ...comissao,
    valor_servico: Number(comissao.valor_servico),
    percentual: Number(comissao.percentual),
    valor_comissao: Number(comissao.valor_comissao),
  };
}

function calcularIntervalo(periodo, data_inicio, data_fim) {
  const agora = new Date();

  let inicio;
  let fim = new Date(agora);

  fim.setHours(23, 59, 59, 999);

  switch (periodo) {
    case "hoje":
      inicio = new Date(agora);
      inicio.setHours(0, 0, 0, 0);
      break;

    case "ontem":
      inicio = new Date(agora);
      inicio.setDate(inicio.getDate() - 1);
      inicio.setHours(0, 0, 0, 0);

      fim = new Date(inicio);
      fim.setHours(23, 59, 59, 999);
      break;

    case "7dias":
      inicio = new Date(agora);
      inicio.setDate(inicio.getDate() - 6);
      inicio.setHours(0, 0, 0, 0);
      break;

    case "30dias":
      inicio = new Date(agora);
      inicio.setDate(inicio.getDate() - 29);
      inicio.setHours(0, 0, 0, 0);
      break;

    case "mes_atual":
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      inicio.setHours(0, 0, 0, 0);
      break;

    case "mes_anterior":
      inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      inicio.setHours(0, 0, 0, 0);

      fim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);
      break;

    default:
      if (data_inicio && data_fim) {
        inicio = new Date(data_inicio);
        inicio.setHours(0, 0, 0, 0);

        fim = new Date(data_fim);
        fim.setHours(23, 59, 59, 999);
      } else {
        inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
      }
  }

  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    throw new AppError("Período de datas inválido.", 422);
  }

  if (inicio > fim) {
    throw new AppError(
      "A data inicial não pode ser posterior á  data final.",
      422,
    );
  }

  return {
    inicio,
    fim,
  };
}

async function gerarComissao(
  agendamento,
  valorServico,
  barbeariaId,
  prismaClient = prisma,
) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const servico = agendamento.servicos;

  let percentual = servico?.percentual_comissao;

  if (percentual === null || percentual === undefined) {
    const configuracao = await prismaClient.configuracao.findFirst({
      where: {
        barbearia_id: barbeariaId,
      },
    });

    percentual = configuracao ? Number(configuracao.comissao_padrao) : 40;
  } else {
    percentual = Number(percentual);
  }

  const valorComissao = Number((valorServico * (percentual / 100)).toFixed(2));

  const comissao = await prismaClient.comissao.upsert({
    where: {
      agendamento_id: agendamento.id,
    },

    update: {
      barbeiro_id: agendamento.barbeiro_id,
      valor_servico: valorServico,
      percentual,
      valor_comissao: valorComissao,
      barbearia_id: barbeariaId,
    },

    create: {
      barbeiro_id: agendamento.barbeiro_id,
      agendamento_id: agendamento.id,
      valor_servico: valorServico,
      percentual,
      valor_comissao: valorComissao,
      status: "PENDENTE",
      barbearia_id: barbeariaId,
    },
  });

  return sanitizarComissao(comissao);
}

async function listarAgendamentosParaPagamento(barbeariaId) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const agendamentos = await prisma.agendamentos.findMany({
    where: {
      barbearia_id: barbeariaId,

      status: {
        notIn: ["CANCELADO", "FINALIZADO"],
      },

      pagamento: null,
    },

    orderBy: {
      horario_inicio: "asc",
    },

    select: {
      id: true,
      status: true,
      horario_inicio: true,
      valor: true,

      clientes: {
        select: {
          id: true,
          nome: true,
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
        },
      },
    },
  });

  return agendamentos.map((agendamento) => ({
    id: agendamento.id,

    status: agendamento.status,

    horario_inicio: agendamento.horario_inicio,

    valor: Number(agendamento.valor),

    clientes: agendamento.clientes
      ? {
          id: agendamento.clientes.id,
          nome: agendamento.clientes.nome,
        }
      : null,

    barbeiros: agendamento.barbeiros
      ? {
          id: agendamento.barbeiros.id,
          nome: agendamento.barbeiros.nome,
        }
      : null,

    servicos: agendamento.servicos
      ? {
          id: agendamento.servicos.id,
          nome: agendamento.servicos.nome,
        }
      : null,
  }));
}

async function registrarPagamento({
  agendamento_id,
  forma_pagamento,
  valor,
  observacoes,
  barbeariaId,
}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  if (!FORMAS_PAGAMENTO_VALIDAS.includes(forma_pagamento)) {
    throw new AppError(
      `Forma de pagamento inválida. Use uma de: ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.`,
      422,
    );
  }

  const agendamento = await prisma.agendamentos.findFirst({
    where: {
      id: agendamento_id,
      barbearia_id: barbeariaId,
    },
    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
      assinatura_plano: true,
    },
  });

  if (!agendamento) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  if (agendamento.status === "CANCELADO") {
    throw new AppError(
      "Não é possível registrar pagamento de um agendamento cancelado.",
      409,
    );
  }

  const pagamentoExistente = await prisma.pagamento.findFirst({
    where: {
      agendamento_id,
      barbearia_id: barbeariaId,
    },
  });

  if (pagamentoExistente) {
    throw new AppError("Este agendamento já tem um pagamento registrado.", 409);
  }

  const valorAgendamento = Number(agendamento.valor);

  if (!Number.isFinite(valorAgendamento) || valorAgendamento < 0) {
    throw new AppError("O valor do agendamento é inválido.", 422);
  }

  if (valor !== undefined && valor !== null) {
    const valorInformado = Number(valor);

    if (!Number.isFinite(valorInformado) || valorInformado < 0) {
      throw new AppError("Valor de pagamento inválido.", 422);
    }

    if (
      Number(valorInformado.toFixed(2)) !== Number(valorAgendamento.toFixed(2))
    ) {
      throw new AppError(
        "O valor do pagamento deve corresponder ao valor do agendamento.",
        422,
      );
    }
  }

  const valorFinal = valorAgendamento;

  let pagamento;

  try {
    pagamento = await prisma.$transaction(async (tx) => {
      let novoPagamento;

      try {
        novoPagamento = await tx.pagamento.create({
          data: {
            id: require("crypto").randomUUID(),

            agendamento_id: agendamento.id,

            cliente_id: agendamento.cliente_id,

            valor: valorFinal,

            forma_pagamento,

            status: "PAGO",

            data_pagamento: new Date(),

            observacoes: observacoes || null,

            barbearia_id: barbeariaId,
          },

          include: {
            agendamentos: {
              include: {
                clientes: true,
                barbeiros: true,
                servicos: true,
              },
            },

            clientes: true,
          },
        });
      } catch (erro) {
        if (erro?.code === "P2002") {
          throw new AppError(
            "Este agendamento já tem um pagamento registrado.",
            409,
          );
        }

        throw erro;
      }

      await gerarComissao(agendamento, valorFinal, barbeariaId, tx);

      await tx.movimentacaoFinanceira.create({
        data: {
          tipo: "RECEITA",

          categoria: "SERVICO",

          descricao: `Pagamento do agendamento ${agendamento.id}`,

          valor: valorFinal,

          forma_pagamento,

          data: novoPagamento.data_pagamento,

          status: "CONFIRMADA",

          observacoes: observacoes || null,

          usuario_id: null,

          cliente_id: agendamento.cliente_id,

          barbeiro_id: agendamento.barbeiro_id,

          pagamento_id: novoPagamento.id,

          barbearia_id: barbeariaId,
        },
      });

      return novoPagamento;
    });
  } catch (erro) {
    throw erro;
  }

  return sanitizarPagamento(pagamento);
}

async function listarPagamentos({
  pagina = 1,
  limite = 20,
  data_inicio,
  data_fim,
  forma_pagamento,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const paginaNumerica = Math.max(Number(pagina) || 1, 1);

  const limiteNumerico = Math.min(Math.max(Number(limite) || 20, 1), 100);

  const skip = (paginaNumerica - 1) * limiteNumerico;

  const where = {
    barbearia_id: barbeariaId,
  };

  if (forma_pagamento) {
    where.forma_pagamento = forma_pagamento;
  }

  if (data_inicio || data_fim) {
    where.data_pagamento = {};

    if (data_inicio) {
      const inicio = new Date(data_inicio);

      if (isNaN(inicio.getTime())) {
        throw new AppError("Data inicial inválida.", 422);
      }

      inicio.setHours(0, 0, 0, 0);

      where.data_pagamento.gte = inicio;
    }

    if (data_fim) {
      const fim = new Date(data_fim);

      if (isNaN(fim.getTime())) {
        throw new AppError("Data final inválida.", 422);
      }

      fim.setHours(23, 59, 59, 999);

      where.data_pagamento.lte = fim;
    }

    if (
      where.data_pagamento.gte &&
      where.data_pagamento.lte &&
      where.data_pagamento.gte > where.data_pagamento.lte
    ) {
      throw new AppError(
        "A data inicial não pode ser posterior á data final.",
        422,
      );
    }
  }

  const [pagamentos, total] = await prisma.$transaction([
    prisma.pagamento.findMany({
      where,

      orderBy: {
        data_pagamento: "desc",
      },

      skip,
      take: limiteNumerico,

      include: {
        clientes: true,

        agendamentos: {
          include: {
            barbeiros: true,
            servicos: true,
          },
        },
      },
    }),

    prisma.pagamento.count({
      where,
    }),
  ]);

  const detalhados = pagamentos.map((pagamento) => ({
    ...sanitizarPagamento(pagamento),

    cliente: pagamento.clientes,

    barbeiro: pagamento.agendamentos?.barbeiros || null,

    servico: pagamento.agendamentos?.servicos || null,
  }));

  return {
    pagamentos: detalhados,

    paginacao: {
      pagina: paginaNumerica,

      limite: limiteNumerico,

      total,

      total_paginas: Math.ceil(total / limiteNumerico),
    },
  };
}

async function resumoFinanceiro({
  periodo,
  data_inicio,
  data_fim,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      barbearia_id: barbeariaId,

      data_pagamento: {
        gte: inicio,
        lte: fim,
      },

      status: "PAGO",
    },
  });

  const faturamento = pagamentos.reduce(
    (soma, pagamento) => soma + Number(pagamento.valor),
    0,
  );

  const ticketMedio = pagamentos.length ? faturamento / pagamentos.length : 0;

  const porFormaMap = {};

  for (const pagamento of pagamentos) {
    const forma = pagamento.forma_pagamento;

    porFormaMap[forma] = (porFormaMap[forma] || 0) + Number(pagamento.valor);
  }

  const porForma = Object.entries(porFormaMap).map(
    ([forma_pagamento, valor]) => ({
      forma_pagamento,
      valor,
      percentual: faturamento
        ? Number(((valor / faturamento) * 100).toFixed(1))
        : 0,
    }),
  );

  const comissoes = await prisma.comissao.findMany({
    where: {
      barbearia_id: barbeariaId,

      data: {
        gte: inicio,
        lte: fim,
      },
    },
  });

  const comissoesTotal = comissoes.reduce(
    (soma, comissao) => soma + Number(comissao.valor_comissao),
    0,
  );

  return {
    periodo: {
      inicio,
      fim,
    },

    faturamento,

    ticket_medio: Number(ticketMedio.toFixed(2)),

    total_atendimentos: pagamentos.length,

    comissoes_total: comissoesTotal,

    por_forma_pagamento: porForma,
  };
}

async function listarComissoes({
  barbeiro_id,
  status,
  data_inicio,
  data_fim,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const where = {
    barbearia_id: barbeariaId,
  };

  if (barbeiro_id) {
    const barbeiro = await prisma.barbeiros.findFirst({
      where: {
        id: barbeiro_id,
        barbearia_id: barbeariaId,
      },
    });

    if (!barbeiro) {
      return [];
    }

    where.barbeiro_id = barbeiro_id;
  }

  if (status) {
    where.status = status;
  }

  if (data_inicio || data_fim) {
    where.data = {};

    if (data_inicio) {
      const inicio = new Date(data_inicio);

      if (isNaN(inicio.getTime())) {
        throw new AppError("Data inicial inválida.", 422);
      }

      inicio.setHours(0, 0, 0, 0);

      where.data.gte = inicio;
    }

    if (data_fim) {
      const fim = new Date(data_fim);

      if (isNaN(fim.getTime())) {
        throw new AppError("Data final inválida.", 422);
      }

      fim.setHours(23, 59, 59, 999);

      where.data.lte = fim;
    }

    if (where.data.gte && where.data.lte && where.data.gte > where.data.lte) {
      throw new AppError(
        "A data inicial não pode ser posterior à data final.",
        422,
      );
    }
  }

  const comissoes = await prisma.comissao.findMany({
    where,

    orderBy: {
      data: "desc",
    },

    include: {
      barbeiros: {
        select: {
          id: true,
          nome: true,
        },
      },

      agendamentos: {
        include: {
          clientes: {
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
      },
    },
  });

  return comissoes.map((comissao) => ({
    ...sanitizarComissao(comissao),

    barbeiro: comissao.barbeiros,

    cliente: comissao.agendamentos?.clientes || null,

    servico: comissao.agendamentos?.servicos || null,
  }));
}

async function marcarComissaoPaga(id, barbeariaId) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const comissao = await prisma.comissao.findFirst({
    where: {
      id,
      barbearia_id: barbeariaId,
    },
  });

  if (!comissao) {
    throw new AppError("Comissão não encontrada.", 404);
  }

  const resultado = await prisma.comissao.updateMany({
    where: {
      id,
      barbearia_id: barbeariaId,
      status: "PENDENTE",
    },

    data: {
      status: "PAGA",
    },
  });

  if (resultado.count !== 1) {
    if (comissao.status === "PAGA") {
      throw new AppError("Esta comissão já está marcada como paga.", 409);
    }

    throw new AppError(
      "A comissão não pode ser marcada como paga neste estado.",
      409,
    );
  }

  const atualizada = await prisma.comissao.findFirst({
    where: {
      id,
      barbearia_id: barbeariaId,
    },
  });

  return sanitizarComissao(atualizada);
}

module.exports = {
  registrarPagamento,
  listarPagamentos,
  listarAgendamentosParaPagamento,
  resumoFinanceiro,
  listarComissoes,
  marcarComissaoPaga,
  FORMAS_PAGAMENTO_VALIDAS,
};
