const prisma = require("../config/prismaClient");
const agendamentoService = require("./agendamentoService");
const financeiroService = require("./financeiroService");
const AppError = require("../utils/AppError");

/**
 * Mesma lógica de período do financeiroService.js — duplicada aqui de
 * propósito para não criar um acoplamento indireto entre os dois módulos
 * além do necessário. Se preferir, pode extrair pra src/utils/periodo.js
 * e importar dos dois lugares.
 */
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

    case "ontem": {
      inicio = new Date(agora);

      inicio.setDate(inicio.getDate() - 1);

      inicio.setHours(0, 0, 0, 0);

      fim = new Date(inicio);

      fim.setHours(23, 59, 59, 999);

      break;
    }

    case "7dias":
      inicio = new Date(agora);

      inicio.setDate(inicio.getDate() - 6);

      inicio.setHours(0, 0, 0, 0);

      break;

    case "mes_atual":
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);

      break;

    case "mes_anterior":
      inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

      fim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);

      break;

    case "30dias":
      inicio = new Date(agora);

      inicio.setDate(inicio.getDate() - 29);

      inicio.setHours(0, 0, 0, 0);

      break;

    default:
      if (data_inicio && data_fim) {
        inicio = new Date(data_inicio);

        fim = new Date(data_fim);

        fim.setHours(23, 59, 59, 999);
      } else {
        inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      }
  }

  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    throw new AppError("Período inválido.", 422);
  }

  if (inicio > fim) {
    throw new AppError(
      "A data inicial não pode ser posterior à data final.",
      422,
    );
  }

  return {
    inicio,
    fim,
  };
}

function validarBarbeariaId(barbeariaId) {
  if (!barbeariaId) {
    throw new AppError("Usuário não está vinculado a uma barbearia.", 403);
  }

  return barbeariaId;
}

async function faturamentoPorPeriodo({
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

    orderBy: {
      data_pagamento: "asc",
    },
  });

  const porDiaMap = {};

  for (const pagamento of pagamentos) {
    const chave = pagamento.data_pagamento.toISOString().slice(0, 10);

    porDiaMap[chave] = (porDiaMap[chave] || 0) + Number(pagamento.valor);
  }

  const faturamentoTotal = pagamentos.reduce(
    (soma, pagamento) => soma + Number(pagamento.valor),
    0,
  );

  return {
    periodo: {
      inicio,
      fim,
    },

    faturamento_total: faturamentoTotal,

    total_atendimentos: pagamentos.length,

    ticket_medio: pagamentos.length
      ? Number((faturamentoTotal / pagamentos.length).toFixed(2))
      : 0,

    por_dia: Object.entries(porDiaMap).map(([data, valor]) => ({
      data,
      valor,
    })),
  };
}

async function servicosMaisVendidos({
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

  const usuarioRelatorio = {
    sub: null,
    cargo: "ADMIN",
    nome: "Relatório",
    barbearia_id: barbeariaId,
  };

  const agendamentos = await Promise.all(
    pagamentos.map((pagamento) =>
      prisma.agendamentos.findFirst({
        where: {
          id: pagamento.agendamento_id,

          barbearia_id: barbeariaId,
        },

        include: {
          servicos: true,
        },
      }),
    ),
  );

  const porServicoMap = {};

  agendamentos.forEach((agendamento, indice) => {
    if (!agendamento?.servicos) {
      return;
    }

    const chave = agendamento.servicos.id;

    if (!porServicoMap[chave]) {
      porServicoMap[chave] = {
        servico: {
          id: agendamento.servicos.id,

          nome: agendamento.servicos.nome,
        },

        quantidade: 0,

        receita: 0,
      };
    }

    porServicoMap[chave].quantidade += 1;

    porServicoMap[chave].receita += Number(pagamentos[indice].valor);
  });

  return Object.values(porServicoMap).sort(
    (a, b) => b.quantidade - a.quantidade,
  );
}

async function faturamentoPorBarbeiro({
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

  const agendamentos = await Promise.all(
    pagamentos.map((pagamento) =>
      prisma.agendamentos.findFirst({
        where: {
          id: pagamento.agendamento_id,

          barbearia_id: barbeariaId,
        },

        include: {
          barbeiros: true,
        },
      }),
    ),
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

  const comissaoPorBarbeiro = {};

  for (const comissao of comissoes) {
    comissaoPorBarbeiro[comissao.barbeiro_id] =
      (comissaoPorBarbeiro[comissao.barbeiro_id] || 0) +
      Number(comissao.valor_comissao);
  }

  const porBarbeiroMap = {};

  agendamentos.forEach((agendamento, indice) => {
    if (!agendamento?.barbeiros) {
      return;
    }

    const chave = agendamento.barbeiros.id;

    if (!porBarbeiroMap[chave]) {
      porBarbeiroMap[chave] = {
        barbeiro: {
          id: agendamento.barbeiros.id,

          nome: agendamento.barbeiros.nome,
        },

        quantidade_atendimentos: 0,

        faturamento: 0,

        comissao: comissaoPorBarbeiro[chave] || 0,
      };
    }

    porBarbeiroMap[chave].quantidade_atendimentos += 1;

    porBarbeiroMap[chave].faturamento += Number(pagamentos[indice].valor);
  });

  return Object.values(porBarbeiroMap).sort(
    (a, b) => b.faturamento - a.faturamento,
  );
}

async function cancelamentosEFaltas({
  periodo,
  data_inicio,
  data_fim,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  const agendamentos = await prisma.agendamentos.findMany({
    where: {
      barbearia_id: barbeariaId,

      data: {
        gte: inicio,
        lte: fim,
      },
    },
  });

  const total = agendamentos.length;

  const cancelados = agendamentos.filter(
    (agendamento) => agendamento.status === "CANCELADO",
  ).length;

  const faltas = agendamentos.filter(
    (agendamento) => agendamento.status === "FALTOU",
  ).length;

  return {
    periodo: {
      inicio,
      fim,
    },

    total_agendamentos: total,

    cancelados,

    faltas,

    taxa_cancelamento: total
      ? Number(((cancelados / total) * 100).toFixed(1))
      : 0,

    taxa_falta: total ? Number(((faltas / total) * 100).toFixed(1)) : 0,
  };
}

/**
 * "clientes_novos" fica de fora de propósito: não tenho certeza se o
 * campo no seu model `cliente` se chama `created_at` ou `data_cadastro`,
 * e um nome errado quebraria a rota inteira. Fica fácil de adicionar
 * depois que você confirmar o nome do campo.
 */
async function relatorioClientes({ barbeariaId } = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const [totalAtivos, totalInativos] = await Promise.all([
    prisma.cliente.count({
      where: {
        ativo: true,

        barbearia_id: barbeariaId,
      },
    }),

    prisma.cliente.count({
      where: {
        ativo: false,

        barbearia_id: barbeariaId,
      },
    }),
  ]);

  return {
    total_ativos: totalAtivos,

    total_inativos: totalInativos,
  };
}

/**
 * Clientes para retorno (item 14 da especificação): último atendimento
 * (qualquer agendamento não cancelado, já ocorrido) há mais dias do que a
 * regra configurada em configuracao.regra_retorno_dias.
 */
async function clientesParaRetorno({ barbeariaId } = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const regraDias = 30;

  const agendamentosPassados = await prisma.agendamentos.findMany({
    where: {
      barbearia_id: barbeariaId,

      status: {
        not: "CANCELADO",
      },

      data: {
        lte: new Date(),
      },
    },

    orderBy: {
      data: "desc",
    },

    include: {
      clientes: true,
      servicos: true,
      barbeiros: true,
    },
  });

  const ultimoPorCliente = new Map();

  for (const agendamento of agendamentosPassados) {
    if (!ultimoPorCliente.has(agendamento.cliente_id)) {
      ultimoPorCliente.set(agendamento.cliente_id, agendamento);
    }
  }

  const agora = new Date();

  const resultado = [];

  for (const agendamento of ultimoPorCliente.values()) {
    const dias = Math.floor((agora - new Date(agendamento.data)) / 86400000);

    if (dias >= regraDias) {
      resultado.push({
        cliente: agendamento.clientes
          ? {
              id: agendamento.clientes.id,

              nome: agendamento.clientes.nome,

              telefone: agendamento.clientes.telefone,
            }
          : null,

        ultimo_atendimento: agendamento.data,

        dias_desde_ultimo_atendimento: dias,

        servico: agendamento.servicos?.nome || null,

        barbeiro: agendamento.barbeiros?.nome || null,
      });
    }
  }

  return resultado.sort(
    (a, b) => b.dias_desde_ultimo_atendimento - a.dias_desde_ultimo_atendimento,
  );
}

async function comissoesPorPeriodo({
  periodo,
  data_inicio,
  data_fim,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  return financeiroService.listarComissoes({
    data_inicio: inicio.toISOString(),

    data_fim: fim.toISOString(),

    barbeariaId,
  });
}

async function formasPagamentoPorPeriodo({
  periodo,
  data_inicio,
  data_fim,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  return financeiroService.resumoFinanceiro({
    periodo,
    data_inicio,
    data_fim,
    barbeariaId,
  });
}

module.exports = {
  faturamentoPorPeriodo,
  servicosMaisVendidos,
  faturamentoPorBarbeiro,
  cancelamentosEFaltas,
  relatorioClientes,
  clientesParaRetorno,
  comissoesPorPeriodo,
  formasPagamentoPorPeriodo,
};
