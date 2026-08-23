const prisma = require("../config/prismaClient");
const AppError = require("../utils/appError");
const agendamentoService = require("./agendamentoService");

const FORMAS_PAGAMENTO_VALIDAS = [
  "DINHEIRO",
  "PIX",
  "DEBITO",
  "CREDITO",
  "OUTROS",
];

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
      inicio = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1,
      );
      inicio.setHours(0, 0, 0, 0);
      break;

    case "mes_anterior":
      inicio = new Date(
        agora.getFullYear(),
        agora.getMonth() - 1,
        1,
      );
      inicio.setHours(0, 0, 0, 0);

      fim = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      break;

    default:
      if (data_inicio && data_fim) {
        inicio = new Date(data_inicio);
        inicio.setHours(0, 0, 0, 0);

        fim = new Date(data_fim);
        fim.setHours(23, 59, 59, 999);
      } else {
        inicio = new Date(
          agora.getFullYear(),
          agora.getMonth(),
          1,
        );
        inicio.setHours(0, 0, 0, 0);
      }
  }

  return { inicio, fim };
}

async function gerarComissao(agendamento, valorServico) {
  const servico = agendamento.servicos;

  let percentual = servico?.percentual_comissao;

  if (percentual === null || percentual === undefined) {
    const configuracao = await prisma.configuracao.findFirst();

    percentual = configuracao
      ? Number(configuracao.comissao_padrao)
      : 40;
  } else {
    percentual = Number(percentual);
  }

  const valorComissao = Number(
    (valorServico * (percentual / 100)).toFixed(2),
  );

  const comissao = await prisma.comissao.upsert({
    where: {
      agendamento_id: agendamento.id,
    },

    update: {
      barbeiro_id: agendamento.barbeiro_id,
      valor_servico: valorServico,
      percentual,
      valor_comissao: valorComissao,
    },

    create: {
      barbeiro_id: agendamento.barbeiro_id,
      agendamento_id: agendamento.id,
      valor_servico: valorServico,
      percentual,
      valor_comissao: valorComissao,
      status: "PENDENTE",
    },
  });

  return sanitizarComissao(comissao);
}

async function registrarPagamento({
  agendamento_id,
  forma_pagamento,
  valor,
  observacoes,
}) {
  if (!FORMAS_PAGAMENTO_VALIDAS.includes(forma_pagamento)) {
    throw new AppError(
      `Forma de pagamento inválida. Use uma de: ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.`,
      422,
    );
  }

  const agendamento =
    await agendamentoService.buscarAgendamentoPorId(agendamento_id);

  if (!agendamento) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  const pagamentoExistente =
    await prisma.pagamento.findUnique({
      where: {
        agendamento_id,
      },
    });

  if (pagamentoExistente) {
    throw new AppError(
      "Este agendamento já tem um pagamento registrado.",
      409,
    );
  }

  const valorFinal =
    valor !== undefined && valor !== null
      ? Number(valor)
      : Number(agendamento.valor);

  if (!Number.isFinite(valorFinal) || valorFinal < 0) {
    throw new AppError("Valor de pagamento inválido.", 422);
  }

  const pagamento = await prisma.pagamento.create({
    data: {
      agendamento_id: agendamento.id,
      cliente_id: agendamento.cliente_id,
      valor: valorFinal,
      forma_pagamento,
      status: "PAGO",
      data_pagamento: new Date(),
      observacoes: observacoes || null,
    },

    include: {
      agendamento: {
        include: {
          clientes: true,
          barbeiros: true,
          servicos: true,
        },
      },
      cliente: true,
    },
  });

  await gerarComissao(
    agendamento,
    valorFinal,
  );

  return sanitizarPagamento(pagamento);
}

async function listarPagamentos({
  pagina = 1,
  limite = 20,
  data_inicio,
  data_fim,
  forma_pagamento,
} = {}) {
  const paginaNumerica = Math.max(
    Number(pagina) || 1,
    1,
  );

  const limiteNumerico = Math.min(
    Math.max(Number(limite) || 20, 1),
    100,
  );

  const skip =
    (paginaNumerica - 1) * limiteNumerico;

  const where = {};

  if (forma_pagamento) {
    where.forma_pagamento = forma_pagamento;
  }

  if (data_inicio || data_fim) {
    where.data_pagamento = {};

    if (data_inicio) {
      const inicio = new Date(data_inicio);
      inicio.setHours(0, 0, 0, 0);

      where.data_pagamento.gte = inicio;
    }

    if (data_fim) {
      const fim = new Date(data_fim);
      fim.setHours(23, 59, 59, 999);

      where.data_pagamento.lte = fim;
    }
  }

  const [pagamentos, total] =
    await prisma.$transaction([
      prisma.pagamento.findMany({
        where,
        orderBy: {
          data_pagamento: "desc",
        },
        skip,
        take: limiteNumerico,

        include: {
          cliente: true,
          agendamento: {
            include: {
              barbeiros: true,
              servicos: true,
            },
          },
        },
      }),

      prisma.pagamento.count({ where }),
    ]);

  const detalhados = pagamentos.map((pagamento) => ({
    ...sanitizarPagamento(pagamento),

    cliente: pagamento.cliente,

    barbeiro:
      pagamento.agendamento?.barbeiros || null,

    servico:
      pagamento.agendamento?.servicos || null,
  }));

  return {
    pagamentos: detalhados,

    paginacao: {
      pagina: paginaNumerica,
      limite: limiteNumerico,
      total,
      total_paginas: Math.ceil(
        total / limiteNumerico,
      ),
    },
  };
}

async function resumoFinanceiro({
  periodo,
  data_inicio,
  data_fim,
} = {}) {
  const { inicio, fim } =
    calcularIntervalo(
      periodo,
      data_inicio,
      data_fim,
    );

  const pagamentos =
    await prisma.pagamento.findMany({
      where: {
        data_pagamento: {
          gte: inicio,
          lte: fim,
        },
        status: "PAGO",
      },
    });

  const faturamento = pagamentos.reduce(
    (soma, pagamento) =>
      soma + Number(pagamento.valor),
    0,
  );

  const ticketMedio = pagamentos.length
    ? faturamento / pagamentos.length
    : 0;

  const porFormaMap = {};

  for (const pagamento of pagamentos) {
    const forma =
      pagamento.forma_pagamento;

    porFormaMap[forma] =
      (porFormaMap[forma] || 0) +
      Number(pagamento.valor);
  }

  const porForma = Object.entries(
    porFormaMap,
  ).map(([forma_pagamento, valor]) => ({
    forma_pagamento,
    valor,
    percentual: faturamento
      ? Number(
          ((valor / faturamento) * 100).toFixed(1),
        )
      : 0,
  }));

  const comissoes =
    await prisma.comissao.findMany({
      where: {
        data: {
          gte: inicio,
          lte: fim,
        },
      },
    });

  const comissoesTotal =
    comissoes.reduce(
      (soma, comissao) =>
        soma + Number(comissao.valor_comissao),
      0,
    );

  return {
    periodo: {
      inicio,
      fim,
    },

    faturamento,

    ticket_medio:
      Number(ticketMedio.toFixed(2)),

    total_atendimentos:
      pagamentos.length,

    comissoes_total:
      comissoesTotal,

    por_forma_pagamento:
      porForma,
  };
}

async function listarComissoes({
  barbeiro_id,
  status,
  data_inicio,
  data_fim,
} = {}) {
  const where = {};

  if (barbeiro_id) {
    where.barbeiro_id = barbeiro_id;
  }

  if (status) {
    where.status = status;
  }

  if (data_inicio || data_fim) {
    where.data = {};

    if (data_inicio) {
      const inicio = new Date(data_inicio);
      inicio.setHours(0, 0, 0, 0);

      where.data.gte = inicio;
    }

    if (data_fim) {
      const fim = new Date(data_fim);
      fim.setHours(23, 59, 59, 999);

      where.data.lte = fim;
    }
  }

  const comissoes =
    await prisma.comissao.findMany({
      where,

      orderBy: {
        data: "desc",
      },

      include: {
        barbeiro: {
          select: {
            id: true,
            nome: true,
          },
        },

        agendamento: {
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
    barbeiro: comissao.barbeiro,
    cliente:
      comissao.agendamento?.clientes || null,
    servico:
      comissao.agendamento?.servicos || null,
  }));
}

async function marcarComissaoPaga(id) {
  const comissao =
    await prisma.comissao.findUnique({
      where: { id },
    });

  if (!comissao) {
    throw new AppError(
      "Comissão não encontrada.",
      404,
    );
  }

  const atualizada =
    await prisma.comissao.update({
      where: { id },

      data: {
        status: "PAGA",
      },
    });

  return sanitizarComissao(atualizada);
}

module.exports = {
  registrarPagamento,
  listarPagamentos,
  resumoFinanceiro,
  listarComissoes,
  marcarComissaoPaga,
  FORMAS_PAGAMENTO_VALIDAS,
};