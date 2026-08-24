const prisma = require("../config/prismaClient");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

function obterDiaSemana(data) {
  const dataObj = new Date(`${data}T00:00:00`);

  if (isNaN(dataObj.getTime())) {
    throw new AppError("Data inválida.", 400);
  }

  const dias = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

  return dias[dataObj.getDay()];
}

function horarioParaMinutos(horario) {
  if (!horario || !/^\d{2}:\d{2}$/.test(horario)) {
    return null;
  }

  const [hora, minuto] = horario.split(":").map(Number);

  if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
    return null;
  }

  return hora * 60 + minuto;
}

function minutosParaHorario(minutos) {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  return (
    String(horas).padStart(2, "0") +
    ":" +
    String(minutosRestantes).padStart(2, "0")
  );
}

function obterMinutosHorarioSaoPaulo(data) {
  const dataObj = new Date(data);

  if (isNaN(dataObj.getTime())) {
    return null;
  }

  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(dataObj);

  const hora = Number(partes.find((parte) => parte.type === "hour")?.value);

  const minuto = Number(partes.find((parte) => parte.type === "minute")?.value);

  if (!Number.isInteger(hora) || !Number.isInteger(minuto)) {
    return null;
  }

  return hora * 60 + minuto;
}

/**
 * Formata qualquer Date/string de data-hora como "HH:mm" NO HORÁRIO DE
 * SÃO PAULO — usando o Intl.DateTimeFormat acima, nunca substring ou
 * toISOString() (que é sempre UTC e desalinha 3h do horário local).
 * Use esta função em qualquer lugar que precise comparar um horário de
 * agendamento com o horário de funcionamento da barbearia.
 */
function formatarHorarioSaoPaulo(dataOuTexto) {
  const minutos = obterMinutosHorarioSaoPaulo(dataOuTexto);
  return minutos === null ? null : minutosParaHorario(minutos);
}

function criarDataInicioDoDiaSaoPaulo(data) {
  const dataObj = new Date(`${data}T00:00:00`);

  if (isNaN(dataObj.getTime())) {
    return null;
  }

  const ano = dataObj.getFullYear();
  const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
  const dia = String(dataObj.getDate()).padStart(2, "0");

  return new Date(`${ano}-${mes}-${dia}T03:00:00.000Z`);
}

async function validarHorarioFuncionamento(data, horarioInicio, horarioFim) {
  const configuracao = await prisma.configuracao.findFirst();

  if (!configuracao) {
    return;
  }

  const temDiasConfigurados = Boolean(configuracao.dias_funcionamento?.trim());

  const temHorarioConfigurado =
    Boolean(configuracao.horario_abertura) &&
    Boolean(configuracao.horario_fechamento);

  if (!temDiasConfigurados && !temHorarioConfigurado) {
    return;
  }

  const diaSemana = obterDiaSemana(data);

  if (temDiasConfigurados) {
    const diasPermitidos = configuracao.dias_funcionamento
      .split(",")
      .map((dia) => dia.trim().toUpperCase())
      .filter(Boolean);

    if (!diasPermitidos.includes(diaSemana)) {
      throw new AppError(`A barbearia não funciona aos ${diaSemana}.`, 400);
    }
  }

  if (temHorarioConfigurado) {
    const inicioFuncionamento = horarioParaMinutos(
      configuracao.horario_abertura,
    );

    const fimFuncionamento = horarioParaMinutos(
      configuracao.horario_fechamento,
    );

    const inicioAgendamento = horarioParaMinutos(horarioInicio);
    const fimAgendamento = horarioParaMinutos(horarioFim);

    if (
      inicioFuncionamento === null ||
      fimFuncionamento === null ||
      inicioAgendamento === null ||
      fimAgendamento === null
    ) {
      throw new AppError(
        "Horário de funcionamento ou agendamento inválido.",
        400,
      );
    }

    if (
      inicioAgendamento < inicioFuncionamento ||
      fimAgendamento > fimFuncionamento
    ) {
      throw new AppError(
        `O agendamento deve ocorrer entre ${configuracao.horario_abertura} e ${configuracao.horario_fechamento}.`,
        400,
      );
    }
  }
}

// LISTAR HORÁRIOS DISPONÍVEIS

async function listarHorariosDisponiveis({ barbeiro_id, servico_id, data }) {
  if (!barbeiro_id || !servico_id || !data) {
    throw new AppError("Barbeiro, serviço e data são obrigatórios.", 400);
  }

  const dataInicio = criarDataInicioDoDiaSaoPaulo(data);

  if (!dataInicio) {
    throw new AppError("Data inválida.", 400);
  }

  const dataFim = new Date(dataInicio);
  dataFim.setUTCDate(dataFim.getUTCDate() + 1);

  const servico = await prisma.servicos.findUnique({
    where: {
      id: servico_id,
    },
  });

  if (!servico) {
    throw new AppError("Serviço não encontrado.", 404);
  }

  if (!servico.ativo) {
    throw new AppError("Este serviço está inativo.", 400);
  }

  const barbeiro = await prisma.barbeiro.findUnique({
    where: {
      id: barbeiro_id,
    },
  });

  if (!barbeiro) {
    throw new AppError("Barbeiro não encontrado.", 404);
  }

  if (!barbeiro.ativo) {
    throw new AppError("Este barbeiro está inativo.", 400);
  }

  const configuracao = await prisma.configuracao.findFirst();

  if (!configuracao) {
    throw new AppError("Configuração da barbearia não encontrada.", 400);
  }

  const inicioFuncionamento = horarioParaMinutos(configuracao.horario_abertura);

  const fimFuncionamento = horarioParaMinutos(configuracao.horario_fechamento);

  if (inicioFuncionamento === null || fimFuncionamento === null) {
    throw new AppError("Horário de funcionamento não configurado.", 400);
  }

  const diaSemana = obterDiaSemana(data);

  if (configuracao.dias_funcionamento) {
    const diasPermitidos = configuracao.dias_funcionamento
      .split(",")
      .map((dia) => dia.trim().toUpperCase())
      .filter(Boolean);

    if (!diasPermitidos.includes(diaSemana)) {
      return [];
    }
  }

  const agendamentos = await prisma.agendamentos.findMany({
    where: {
      barbeiro_id,

      status: {
        not: "CANCELADO",
      },

      horario_inicio: {
        gte: dataInicio,
        lt: dataFim,
      },
    },

    select: {
      horario_inicio: true,
      horario_fim: true,
    },

    orderBy: {
      horario_inicio: "asc",
    },
  });

  const duracao = Number(servico.duracao);

  if (!Number.isFinite(duracao) || duracao <= 0) {
    throw new AppError("Duração do serviço inválida.", 400);
  }

  const horariosDisponiveis = [];

  // Os horários serão oferecidos de 30 em 30 minutos.
  const intervalo = 30;

  for (
    let inicio = inicioFuncionamento;
    inicio + duracao <= fimFuncionamento;
    inicio += intervalo
  ) {
    const fim = inicio + duracao;

    const conflito = agendamentos.some((agendamento) => {
      const inicioAgendamento = obterMinutosHorarioSaoPaulo(
        agendamento.horario_inicio,
      );

      const fimAgendamento = obterMinutosHorarioSaoPaulo(
        agendamento.horario_fim,
      );

      if (inicioAgendamento === null || fimAgendamento === null) {
        return false;
      }

      return inicio < fimAgendamento && fim > inicioAgendamento;
    });

    if (!conflito) {
      horariosDisponiveis.push(minutosParaHorario(inicio));
    }
  }

  return horariosDisponiveis;
}

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

      assinatura_plano: {
        select: {
          id: true,
          quantidade_total: true,
          quantidade_utilizada: true,
          status: true,
          data_inicio: true,
          data_fim: true,
          plano: {
            select: {
              id: true,
              nome: true,
              preco: true,
            },
          },
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

      assinatura_plano: {
        include: {
          plano: true,
        },
      },
    },
  });
}

// CRIAR AGENDAMENTO

async function criarAgendamento({
  cliente_id,
  barbeiro_id,
  servico_id,
  assinatura_plano_id,
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

  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    throw new AppError("Data ou horário inválido.", 400);
  }

  if (fim <= inicio) {
    throw new AppError(
      "O horário de término deve ser posterior ao horário de início.",
      400,
    );
  }

  // FIX: usar o horário em São Paulo (derivado do Date já parseado),
  // não a substring literal da string recebida — que pode estar em UTC
  // (ex.: terminando em "Z") e desalinhar 3h da hora local real.
  await validarHorarioFuncionamento(
    data,
    formatarHorarioSaoPaulo(inicio),
    formatarHorarioSaoPaulo(fim),
  );

  const usarPlano = Boolean(assinatura_plano_id);

  if (usarPlano && status === "CANCELADO") {
    throw new AppError(
      "Não é possível utilizar um plano em um agendamento cancelado.",
      400,
    );
  }

  const conflito = await prisma.agendamentos.findFirst({
    where: {
      barbeiro_id,

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
      "O barbeiro já possui um agendamento nesse horário.",
      409,
    );
  }

  if (!usarPlano) {
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

  return prisma.$transaction(async (tx) => {
    const assinatura = await tx.assinaturaPlano.findUnique({
      where: {
        id: assinatura_plano_id,
      },

      include: {
        plano: {
          include: {
            servico: true,
          },
        },
      },
    });

    if (!assinatura) {
      throw new AppError("Assinatura de plano não encontrada.", 404);
    }

    if (assinatura.cliente_id !== cliente_id) {
      throw new AppError(
        "A assinatura de plano não pertence a este cliente.",
        403,
      );
    }

    if (assinatura.status !== "ATIVO") {
      throw new AppError("A assinatura de plano não está ativa.", 409);
    }

    const agora = new Date();

    if (assinatura.data_fim < agora) {
      await tx.assinaturaPlano.update({
        where: {
          id: assinatura.id,
        },
        data: {
          status: "VENCIDO",
        },
      });

      throw new AppError("A assinatura de plano está vencida.", 409);
    }

    if (assinatura.quantidade_utilizada >= assinatura.quantidade_total) {
      throw new AppError(
        "O cliente não possui mais cortes disponíveis neste plano.",
        409,
      );
    }

    if (assinatura.plano.servico_id !== servico_id) {
      throw new AppError("O serviço escolhido não faz parte deste plano.", 409);
    }

    const agendamento = await tx.agendamentos.create({
      data: {
        id: crypto.randomUUID(),

        cliente_id,
        barbeiro_id,
        servico_id,

        assinatura_plano_id: assinatura.id,

        data: new Date(data),

        horario_inicio: inicio,
        horario_fim: fim,

        status: status || "AGENDADO",

        observacoes: observacoes || null,

        // O serviço já foi pago na contratação do plano.
        valor: 0,

        forma_pagamento: forma_pagamento || null,
      },

      include: {
        clientes: true,
        barbeiros: true,
        servicos: true,

        assinatura_plano: {
          include: {
            plano: true,
          },
        },
      },
    });

    await tx.assinaturaPlano.update({
      where: {
        id: assinatura.id,
      },

      data: {
        quantidade_utilizada: {
          increment: 1,
        },
      },
    });

    return agendamento;
  });
}

// ATUALIZAR AGENDAMENTO

async function atualizarAgendamento(id, dados) {
  const dadosAtualizados = { ...dados };

  if (dadosAtualizados.data) {
    dadosAtualizados.data = new Date(dadosAtualizados.data);
  }

  if (dadosAtualizados.horario_inicio) {
    dadosAtualizados.horario_inicio = new Date(dadosAtualizados.horario_inicio);
  }

  if (dadosAtualizados.horario_fim) {
    dadosAtualizados.horario_fim = new Date(dadosAtualizados.horario_fim);
  }

  if (
    dadosAtualizados.data ||
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

    const dataAgendamento =
      dados.data || agendamentoAtual.data.toISOString().slice(0, 10);

    if (fim <= inicio) {
      throw new AppError(
        "O horário de término deve ser posterior ao horário de início.",
        400,
      );
    }

    // FIX: mesmo problema do criarAgendamento — toISOString() é sempre
    // UTC, então a substring pegava a hora UTC (3h à frente da hora real
    // de São Paulo) em vez da hora local.
    await validarHorarioFuncionamento(
      dataAgendamento,
      formatarHorarioSaoPaulo(inicio),
      formatarHorarioSaoPaulo(fim),
    );

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
    throw new AppError(
      "Não é possível concluir um agendamento cancelado.",
      409,
    );
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
    throw new AppError(
      "Não é possível marcar falta em um agendamento cancelado.",
      409,
    );
  }

  if (agendamento.status === "CONCLUIDO") {
    throw new AppError(
      "Este agendamento já foi concluído — não é possível marcar falta.",
      409,
    );
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
  listarHorariosDisponiveis,
  criarAgendamento,
  atualizarAgendamento,
  cancelarAgendamento,
  concluirAgendamento,
  marcarFalta,
};