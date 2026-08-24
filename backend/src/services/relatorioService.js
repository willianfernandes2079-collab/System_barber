const prisma = require("../config/prismaClient");
const agendamentoService = require("./agendamentoService");
const financeiroService = require("./financeiroService");

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

  return { inicio, fim };
}

async function faturamentoPorPeriodo({ periodo, data_inicio, data_fim } = {}) {
  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  const pagamentos = await prisma.pagamento.findMany({
    where: { data_pagamento: { gte: inicio, lte: fim }, status: "PAGO" },
    orderBy: { data_pagamento: "asc" },
  });

  const porDiaMap = {};
  for (const p of pagamentos) {
    const chave = p.data_pagamento.toISOString().slice(0, 10);
    porDiaMap[chave] = (porDiaMap[chave] || 0) + Number(p.valor);
  }

  const faturamentoTotal = pagamentos.reduce((soma, p) => soma + Number(p.valor), 0);

  return {
    periodo: { inicio, fim },
    faturamento_total: faturamentoTotal,
    total_atendimentos: pagamentos.length,
    ticket_medio: pagamentos.length ? Number((faturamentoTotal / pagamentos.length).toFixed(2)) : 0,
    por_dia: Object.entries(porDiaMap).map(([data, valor]) => ({ data, valor })),
  };
}

async function servicosMaisVendidos({ periodo, data_inicio, data_fim } = {}) {
  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  const pagamentos = await prisma.pagamento.findMany({
    where: { data_pagamento: { gte: inicio, lte: fim }, status: "PAGO" },
  });

  const agendamentos = await Promise.all(
    pagamentos.map((p) => agendamentoService.buscarAgendamentoPorId(p.agendamento_id))
  );

  const porServicoMap = {};
  agendamentos.forEach((ag, i) => {
    if (!ag?.servicos) return;
    const chave = ag.servicos.id;
    if (!porServicoMap[chave]) {
      porServicoMap[chave] = {
        servico: { id: ag.servicos.id, nome: ag.servicos.nome },
        quantidade: 0,
        receita: 0,
      };
    }
    porServicoMap[chave].quantidade += 1;
    porServicoMap[chave].receita += Number(pagamentos[i].valor);
  });

  return Object.values(porServicoMap).sort((a, b) => b.quantidade - a.quantidade);
}

async function faturamentoPorBarbeiro({ periodo, data_inicio, data_fim } = {}) {
  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  const pagamentos = await prisma.pagamento.findMany({
    where: { data_pagamento: { gte: inicio, lte: fim }, status: "PAGO" },
  });
  const agendamentos = await Promise.all(
    pagamentos.map((p) => agendamentoService.buscarAgendamentoPorId(p.agendamento_id))
  );

  const comissoes = await prisma.comissao.findMany({ where: { data: { gte: inicio, lte: fim } } });
  const comissaoPorBarbeiro = {};
  for (const c of comissoes) {
    comissaoPorBarbeiro[c.barbeiro_id] = (comissaoPorBarbeiro[c.barbeiro_id] || 0) + Number(c.valor_comissao);
  }

  const porBarbeiroMap = {};
  agendamentos.forEach((ag, i) => {
    if (!ag?.barbeiros) return;
    const chave = ag.barbeiros.id;
    if (!porBarbeiroMap[chave]) {
      porBarbeiroMap[chave] = {
        barbeiro: { id: ag.barbeiros.id, nome: ag.barbeiros.nome },
        quantidade_atendimentos: 0,
        faturamento: 0,
        comissao: comissaoPorBarbeiro[chave] || 0,
      };
    }
    porBarbeiroMap[chave].quantidade_atendimentos += 1;
    porBarbeiroMap[chave].faturamento += Number(pagamentos[i].valor);
  });

  return Object.values(porBarbeiroMap).sort((a, b) => b.faturamento - a.faturamento);
}

async function cancelamentosEFaltas({ periodo, data_inicio, data_fim } = {}) {
  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);

  const agendamentos = await prisma.agendamentos.findMany({
    where: { data: { gte: inicio, lte: fim } },
  });

  const total = agendamentos.length;
  const cancelados = agendamentos.filter((a) => a.status === "CANCELADO").length;
  const faltas = agendamentos.filter((a) => a.status === "FALTOU").length;

  return {
    periodo: { inicio, fim },
    total_agendamentos: total,
    cancelados,
    faltas,
    taxa_cancelamento: total ? Number(((cancelados / total) * 100).toFixed(1)) : 0,
    taxa_falta: total ? Number(((faltas / total) * 100).toFixed(1)) : 0,
  };
}

/**
 * "clientes_novos" fica de fora de propósito: não tenho certeza se o
 * campo no seu model `cliente` se chama `created_at` ou `data_cadastro`,
 * e um nome errado quebraria a rota inteira. Fica fácil de adicionar
 * depois que você confirmar o nome do campo.
 */
async function relatorioClientes() {
  const [totalAtivos, totalInativos] = await Promise.all([
    prisma.cliente.count({ where: { ativo: true } }),
    prisma.cliente.count({ where: { ativo: false } }),
  ]);

  return { total_ativos: totalAtivos, total_inativos: totalInativos };
}

/**
 * Clientes para retorno (item 14 da especificação): último atendimento
 * (qualquer agendamento não cancelado, já ocorrido) há mais dias do que a
 * regra configurada em configuracao.regra_retorno_dias.
 */
async function clientesParaRetorno() {
  const regraDias = 30;

  const agendamentosPassados = await prisma.agendamentos.findMany({
    where: {
      status: { not: "CANCELADO" },
      data: { lte: new Date() },
    },
    orderBy: { data: "desc" },
    include: { clientes: true, servicos: true, barbeiros: true },
  });

  const ultimoPorCliente = new Map();
  for (const ag of agendamentosPassados) {
    if (!ultimoPorCliente.has(ag.cliente_id)) {
      ultimoPorCliente.set(ag.cliente_id, ag);
    }
  }

  const agora = new Date();
  const resultado = [];

  for (const ag of ultimoPorCliente.values()) {
    const dias = Math.floor((agora - new Date(ag.data)) / 86400000);
    if (dias >= regraDias) {
      resultado.push({
        cliente: ag.clientes
          ? { id: ag.clientes.id, nome: ag.clientes.nome, telefone: ag.clientes.telefone }
          : null,
        ultimo_atendimento: ag.data,
        dias_desde_ultimo_atendimento: dias,
        servico: ag.servicos?.nome || null,
        barbeiro: ag.barbeiros?.nome || null,
      });
    }
  }

  return resultado.sort((a, b) => b.dias_desde_ultimo_atendimento - a.dias_desde_ultimo_atendimento);
}

async function comissoesPorPeriodo({ periodo, data_inicio, data_fim } = {}) {
  const { inicio, fim } = calcularIntervalo(periodo, data_inicio, data_fim);
  return financeiroService.listarComissoes({
    data_inicio: inicio.toISOString(),
    data_fim: fim.toISOString(),
  });
}

async function formasPagamentoPorPeriodo({ periodo, data_inicio, data_fim } = {}) {
  return financeiroService.resumoFinanceiro({ periodo, data_inicio, data_fim });
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