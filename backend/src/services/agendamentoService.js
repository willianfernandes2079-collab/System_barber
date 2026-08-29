const prisma = require("../config/prismaClient");
const crypto = require("crypto");
const AppError = require("../utils/AppError");
const {
  existeBloqueioNoIntervalo,
  obterMinutosSaoPaulo,
} = require("./bloqueioAgendaService");

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

  const hora = Number(
    partes.find((parte) => parte.type === "hour")?.value,
  );

  const minuto = Number(
    partes.find((parte) => parte.type === "minute")?.value,
  );

  if (!Number.isInteger(hora) || !Number.isInteger(minuto)) {
    return null;
  }

  return hora * 60 + minuto;
}

/**
 * Formata qualquer Date/string de data-hora como "HH:mm" no horário de
 * São Paulo usando Intl.DateTimeFormat.
 */
function formatarHorarioSaoPaulo(dataOuTexto) {
  const minutos = obterMinutosHorarioSaoPaulo(dataOuTexto);

  return minutos === null ? null : minutosParaHorario(minutos);
}

function criarDataInicioDoDiaSaoPaulo(data) {
  if (
    typeof data !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return null;
  }

  const [ano, mes, dia] = data
    .split("-")
    .map(Number);

  const dataObj = new Date(
    Date.UTC(ano, mes - 1, dia, 3, 0, 0, 0),
  );

  if (isNaN(dataObj.getTime())) {
    return null;
  }

  return dataObj;
}

function obterBarbeariaId(usuario) {
  if (!usuario || !usuario.barbearia_id) {
    throw new AppError(
      "Usuário não está vinculado a uma barbearia.",
      403,
    );
  }

  return usuario.barbearia_id;
}

async function validarHorarioFuncionamento(
  data,
  horarioInicio,
  horarioFim,
  barbeariaId,
) {
  const configuracao = await prisma.configuracao.findFirst({
    where: {
      barbearia_id: barbeariaId,
    },
  });

  if (!configuracao) {
    return;
  }

  const temDiasConfigurados = Boolean(
    configuracao.dias_funcionamento?.trim(),
  );

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
      throw new AppError(
        `A barbearia não funciona aos ${diaSemana}.`,
        400,
      );
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

// OBTER CLIENTE VINCULADO AO USUÁRIO

async function obterClienteDoUsuario(usuarioId, barbeariaId) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: usuarioId,
    },

    select: {
      id: true,
      email: true,
    },
  });

  if (!usuario || !usuario.email) {
    return null;
  }

  return prisma.cliente.findFirst({
    where: {
      email: {
        equals: usuario.email,
        mode: "insensitive",
      },

      ativo: true,

      vinculos_barbearias: {
        some: {
          barbearia_id: barbeariaId,
          ativo: true,

          barbearia: {
            ativo: true,
          },
        },
      },
    },

    select: {
      id: true,
      email: true,
    },
  });
}

// VALIDAR ACESSO AO AGENDAMENTO

async function validarAcessoAgendamento(id, usuario) {
  const barbeariaId = obterBarbeariaId(usuario);

  const agendamento = await prisma.agendamentos.findFirst({
    where: {
      id,
      barbearia_id: barbeariaId,
    },

    select: {
      id: true,
      cliente_id: true,
      barbeiro_id: true,
      barbearia_id: true,
    },
  });

  if (!agendamento) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  if (usuario.cargo !== "CLIENTE") {
    return agendamento;
  }

  const cliente = await obterClienteDoUsuario(
    usuario.sub,
    barbeariaId,
  );

  if (!cliente || agendamento.cliente_id !== cliente.id) {
    throw new AppError("Agendamento não encontrado.", 404);
  }

  return agendamento;
}

// LISTAR HORÁRIOS DISPONÍVEIS

async function listarHorariosDisponiveis({
  barbeiro_id,
  servico_id,
  data,
  usuario,
}) {
  const barbeariaId = obterBarbeariaId(usuario);

  if (!barbeiro_id || !servico_id || !data) {
    throw new AppError(
      "Barbeiro, serviço e data são obrigatórios.",
      400,
    );
  }

  const dataInicio = criarDataInicioDoDiaSaoPaulo(data);

  if (!dataInicio) {
    throw new AppError("Data inválida.", 400);
  }

  const dataFim = new Date(dataInicio);

  dataFim.setUTCDate(dataFim.getUTCDate() + 1);

  const servico = await prisma.servicos.findFirst({
    where: {
      id: servico_id,
      barbearia_id: barbeariaId,
    },
  });

  if (!servico) {
    throw new AppError("Serviço não encontrado.", 404);
  }

  if (!servico.ativo) {
    throw new AppError("Este serviço está inativo.", 400);
  }

  const barbeiro = await prisma.barbeiros.findFirst({
    where: {
      id: barbeiro_id,
      barbearia_id: barbeariaId,
    },
  });

  if (!barbeiro) {
    throw new AppError("Barbeiro não encontrado.", 404);
  }

  if (!barbeiro.ativo) {
    throw new AppError("Este barbeiro está inativo.", 400);
  }

  const configuracao = await prisma.configuracao.findFirst({
    where: {
      barbearia_id: barbeariaId,
    },
  });

  if (!configuracao) {
    throw new AppError(
      "Configuração da barbearia não encontrada.",
      400,
    );
  }

  const inicioFuncionamento = horarioParaMinutos(
    configuracao.horario_abertura,
  );

  const fimFuncionamento = horarioParaMinutos(
    configuracao.horario_fechamento,
  );

  if (
    inicioFuncionamento === null ||
    fimFuncionamento === null
  ) {
    throw new AppError(
      "Horário de funcionamento não configurado.",
      400,
    );
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
      barbearia_id: barbeariaId,

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
    throw new AppError(
      "Duração do serviço inválida.",
      400,
    );
  }

  const horariosDisponiveis = [];

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

      if (
        inicioAgendamento === null ||
        fimAgendamento === null
      ) {
        return false;
      }

      return (
        inicio < fimAgendamento &&
        fim > inicioAgendamento
      );
    });

    if (conflito) {
      continue;
    }

    const existeBloqueio =
      await existeBloqueioNoIntervalo({
        barbeiro_id,
        data,
        inicioMinutos: inicio,
        fimMinutos: fim,
        barbeariaId,
      });

    if (existeBloqueio) {
      continue;
    }

    horariosDisponiveis.push(
      minutosParaHorario(inicio),
    );
  }

  return horariosDisponiveis;
}

// LISTAR AGENDAMENTOS

async function listarAgendamentos(usuario) {
  const barbeariaId = obterBarbeariaId(usuario);

  const where = {
    barbearia_id: barbeariaId,
  };

  if (usuario.cargo === "CLIENTE") {
    const cliente = await obterClienteDoUsuario(
      usuario.sub,
      barbeariaId,
    );

    if (!cliente) {
      return [];
    }

    where.cliente_id = cliente.id;
  }

  return prisma.agendamentos.findMany({
    where,

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

async function buscarAgendamentoPorId(id, usuario) {
  await validarAcessoAgendamento(id, usuario);

  const barbeariaId = obterBarbeariaId(usuario);

  return prisma.agendamentos.findFirst({
    where: {
      id,
      barbearia_id: barbeariaId,
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
  observacoes,
  usuario,
}) {
  if (!usuario || !usuario.sub) {
    throw new AppError("Não autenticado.", 401);
  }

  const barbeariaId = obterBarbeariaId(usuario);

  if (usuario.cargo === "CLIENTE") {
    const clienteUsuario =
      await obterClienteDoUsuario(
        usuario.sub,
        barbeariaId,
      );

    if (!clienteUsuario) {
      throw new AppError(
        "Cliente não encontrado.",
        404,
      );
    }

    cliente_id = clienteUsuario.id;
  }

  if (
    !cliente_id ||
    !barbeiro_id ||
    !servico_id ||
    !data ||
    !horario_inicio ||
    !horario_fim
  ) {
    throw new AppError(
      "Dados obrigatórios não informados.",
      400,
    );
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      id: cliente_id,
      ativo: true,

      vinculos_barbearias: {
        some: {
          barbearia_id: barbeariaId,
          ativo: true,

          barbearia: {
            ativo: true,
          },
        },
      },
    },
  });

  if (!cliente) {
    throw new AppError(
      "Cliente não encontrado.",
      404,
    );
  }

  const inicio = new Date(horario_inicio);

  const fim = new Date(horario_fim);

  if (
    isNaN(inicio.getTime()) ||
    isNaN(fim.getTime())
  ) {
    throw new AppError(
      "Data ou horário inválido.",
      400,
    );
  }

  if (fim <= inicio) {
    throw new AppError(
      "O horário de término deve ser posterior ao horário de início.",
      400,
    );
  }

  await validarHorarioFuncionamento(
    data,
    formatarHorarioSaoPaulo(inicio),
    formatarHorarioSaoPaulo(fim),
    barbeariaId,
  );

  const inicioMinutos =
    obterMinutosHorarioSaoPaulo(inicio);

  const fimMinutos =
    obterMinutosHorarioSaoPaulo(fim);

  if (
    inicioMinutos === null ||
    fimMinutos === null
  ) {
    throw new AppError(
      "Não foi possível determinar o horário do agendamento.",
      400,
    );
  }

  const barbeiro =
    await prisma.barbeiros.findFirst({
      where: {
        id: barbeiro_id,
        barbearia_id: barbeariaId,
      },
    });

  if (!barbeiro) {
    throw new AppError(
      "Barbeiro não encontrado.",
      404,
    );
  }

  if (!barbeiro.ativo) {
    throw new AppError(
      "Este barbeiro está inativo.",
      400,
    );
  }

  const servico =
    await prisma.servicos.findFirst({
      where: {
        id: servico_id,
        barbearia_id: barbeariaId,
      },
    });

  if (!servico) {
    throw new AppError(
      "Serviço não encontrado.",
      404,
    );
  }

  if (!servico.ativo) {
    throw new AppError(
      "Este serviço está inativo.",
      400,
    );
  }

  const existeBloqueio =
    await existeBloqueioNoIntervalo({
      barbeiro_id,
      data,
      inicioMinutos,
      fimMinutos,
      barbeariaId,
    });

  if (existeBloqueio) {
    throw new AppError(
      "O horário escolhido está bloqueado na agenda.",
      409,
    );
  }

  const conflito =
    await prisma.agendamentos.findFirst({
      where: {
        barbeiro_id,
        barbearia_id: barbeariaId,

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

  const usarPlano =
    Boolean(assinatura_plano_id);

  if (!usarPlano) {
    return prisma.agendamentos.create({
      data: {
        id: crypto.randomUUID(),

        cliente_id,
        barbeiro_id,
        servico_id,
        barbearia_id: barbeariaId,

        data: new Date(data),

        horario_inicio: inicio,
        horario_fim: fim,

        // O status inicial é definido pelo servidor.
        status: "AGENDADO",

        observacoes:
          observacoes || null,

        // O valor é obtido do serviço no banco.
        valor: servico.preco,

        // Pagamento é tratado separadamente pelo fluxo financeiro.
        forma_pagamento: null,
      },

      include: {
        clientes: true,
        barbeiros: true,
        servicos: true,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const agora = new Date();

    const assinatura =
      await tx.assinaturaPlano.findFirst({
        where: {
          id: assinatura_plano_id,
          barbearia_id: barbeariaId,
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
      throw new AppError(
        "Assinatura de plano não encontrada.",
        404,
      );
    }

    if (assinatura.cliente_id !== cliente_id) {
      throw new AppError(
        "A assinatura de plano não pertence a este cliente.",
        403,
      );
    }

    if (assinatura.plano.barbearia_id !== barbeariaId) {
      throw new AppError(
        "O plano não pertence a esta barbearia.",
        403,
      );
    }

    if (
      !assinatura.plano.servico ||
      assinatura.plano.servico.barbearia_id !==
        barbeariaId
    ) {
      throw new AppError(
        "O serviço do plano não pertence a esta barbearia.",
        403,
      );
    }

    if (assinatura.status !== "ATIVO") {
      throw new AppError(
        "A assinatura de plano não está ativa.",
        409,
      );
    }

    if (assinatura.data_fim < agora) {
      throw new AppError(
        "A assinatura de plano está vencida.",
        409,
      );
    }

    if (
      assinatura.plano.servico_id !==
      servico_id
    ) {
      throw new AppError(
        "O serviço escolhido não faz parte deste plano.",
        409,
      );
    }

    const consumo =
      await tx.assinaturaPlano.updateMany({
        where: {
          id: assinatura.id,
          barbearia_id: barbeariaId,

          status: "ATIVO",

          data_fim: {
            gte: agora,
          },

          quantidade_utilizada: {
            lt: assinatura.quantidade_total,
          },
        },

        data: {
          quantidade_utilizada: {
            increment: 1,
          },
        },
      });

    if (consumo.count !== 1) {
      throw new AppError(
        "Não há mais utilizações disponíveis neste plano.",
        409,
      );
    }

    const agendamento =
      await tx.agendamentos.create({
        data: {
          id: crypto.randomUUID(),

          cliente_id,
          barbeiro_id,
          servico_id,

          assinatura_plano_id:
            assinatura.id,

          barbearia_id: barbeariaId,

          data: new Date(data),

          horario_inicio: inicio,
          horario_fim: fim,

          // O status inicial é definido pelo servidor.
          status: "AGENDADO",

          observacoes:
            observacoes || null,

          // O serviço foi pago na contratação do plano.
          valor: 0,

          // Pagamento é tratado separadamente.
          forma_pagamento: null,
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

    return agendamento;
  });
}

// ATUALIZAR AGENDAMENTO

async function atualizarAgendamento(
  id,
  dados,
  usuario,
) {
  await validarAcessoAgendamento(
    id,
    usuario,
  );

  const barbeariaId =
    obterBarbeariaId(usuario);

  const dadosAtualizados = {};

  const camposPermitidos = [
    "cliente_id",
    "barbeiro_id",
    "servico_id",
    "assinatura_plano_id",
    "data",
    "horario_inicio",
    "horario_fim",
    "status",
    "observacoes",
    "valor",
    "forma_pagamento",
  ];

  for (const campo of camposPermitidos) {
    if (dados[campo] !== undefined) {
      dadosAtualizados[campo] =
        dados[campo];
    }
  }

  if (
    usuario.cargo === "CLIENTE"
  ) {
    delete dadosAtualizados.cliente_id;
    delete dadosAtualizados.status;
    delete dadosAtualizados.valor;
    delete dadosAtualizados.forma_pagamento;
  }

  if (
    dadosAtualizados.cliente_id !==
    undefined
  ) {
    const cliente =
      await prisma.cliente.findFirst({
        where: {
          id: dadosAtualizados.cliente_id,
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

    if (!cliente) {
      throw new AppError(
        "Cliente não encontrado.",
        404,
      );
    }
  }

  if (
    dadosAtualizados.barbeiro_id !==
    undefined
  ) {
    const barbeiro =
      await prisma.barbeiros.findFirst({
        where: {
          id: dadosAtualizados.barbeiro_id,
          barbearia_id: barbeariaId,
        },
      });

    if (!barbeiro) {
      throw new AppError(
        "Barbeiro não encontrado.",
        404,
      );
    }

    if (!barbeiro.ativo) {
      throw new AppError(
        "Este barbeiro está inativo.",
        400,
      );
    }
  }

  if (
    dadosAtualizados.servico_id !==
    undefined
  ) {
    const servico =
      await prisma.servicos.findFirst({
        where: {
          id: dadosAtualizados.servico_id,
          barbearia_id: barbeariaId,
        },
      });

    if (!servico) {
      throw new AppError(
        "Serviço não encontrado.",
        404,
      );
    }

    if (!servico.ativo) {
      throw new AppError(
        "Este serviço está inativo.",
        400,
      );
    }
  }

  if (
    dadosAtualizados.assinatura_plano_id !==
      undefined &&
    dadosAtualizados.assinatura_plano_id !==
      null
  ) {
    const assinatura =
      await prisma.assinaturaPlano.findFirst({
        where: {
          id:
            dadosAtualizados.assinatura_plano_id,
          barbearia_id: barbeariaId,
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
      throw new AppError(
        "Assinatura de plano não encontrada.",
        404,
      );
    }

    const clienteId =
      dadosAtualizados.cliente_id;

    if (
      clienteId !== undefined &&
      assinatura.cliente_id !== clienteId
    ) {
      throw new AppError(
        "A assinatura de plano não pertence a este cliente.",
        403,
      );
    }

    if (
      assinatura.plano.barbearia_id !==
        barbeariaId ||
      !assinatura.plano.servico ||
      assinatura.plano.servico.barbearia_id !==
        barbeariaId
    ) {
      throw new AppError(
        "O plano ou o serviço do plano não pertence a esta barbearia.",
        403,
      );
    }
  }

  if (dadosAtualizados.data) {
    dadosAtualizados.data =
      new Date(
        dadosAtualizados.data,
      );
  }

  if (
    dadosAtualizados.horario_inicio
  ) {
    dadosAtualizados.horario_inicio =
      new Date(
        dadosAtualizados.horario_inicio,
      );
  }

  if (
    dadosAtualizados.horario_fim
  ) {
    dadosAtualizados.horario_fim =
      new Date(
        dadosAtualizados.horario_fim,
      );
  }

  if (
    dadosAtualizados.data ||
    dadosAtualizados.horario_inicio ||
    dadosAtualizados.horario_fim ||
    dadosAtualizados.barbeiro_id
  ) {
    const agendamentoAtual =
      await prisma.agendamentos.findFirst({
        where: {
          id,
          barbearia_id: barbeariaId,
        },
      });

    if (!agendamentoAtual) {
      throw new AppError(
        "Agendamento não encontrado.",
        404,
      );
    }

    const barbeiroId =
      dadosAtualizados.barbeiro_id ||
      agendamentoAtual.barbeiro_id;

    const inicio =
      dadosAtualizados.horario_inicio ||
      agendamentoAtual.horario_inicio;

    const fim =
      dadosAtualizados.horario_fim ||
      agendamentoAtual.horario_fim;

    const dataAgendamento =
      dadosAtualizados.data ||
      agendamentoAtual.data
        .toISOString()
        .slice(0, 10);

    if (fim <= inicio) {
      throw new AppError(
        "O horário de término deve ser posterior ao horário de início.",
        400,
      );
    }

    await validarHorarioFuncionamento(
      dataAgendamento,
      formatarHorarioSaoPaulo(
        inicio,
      ),
      formatarHorarioSaoPaulo(fim),
      barbeariaId,
    );

    const inicioMinutos =
      obterMinutosHorarioSaoPaulo(
        inicio,
      );

    const fimMinutos =
      obterMinutosHorarioSaoPaulo(
        fim,
      );

    if (
      inicioMinutos === null ||
      fimMinutos === null
    ) {
      throw new AppError(
        "Não foi possível determinar o horário do agendamento.",
        400,
      );
    }

    const existeBloqueio =
      await existeBloqueioNoIntervalo({
        barbeiro_id: barbeiroId,
        data: dataAgendamento,
        inicioMinutos,
        fimMinutos,
        barbeariaId,
      });

    if (existeBloqueio) {
      throw new AppError(
        "O novo horário está bloqueado na agenda.",
        409,
      );
    }

    const conflito =
      await prisma.agendamentos.findFirst({
        where: {
          id: {
            not: id,
          },

          barbeiro_id: barbeiroId,
          barbearia_id: barbeariaId,

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

// REAGENDAR AGENDAMENTO

async function reagendarAgendamento(
  id,
  {
    data,
    horario_inicio,
    horario_fim,
    barbeiro_id,
  },
  usuario,
) {
  await validarAcessoAgendamento(
    id,
    usuario,
  );

  const barbeariaId =
    obterBarbeariaId(usuario);

  if (
    !data ||
    !horario_inicio ||
    !horario_fim
  ) {
    throw new AppError(
      "Data, horário de início e horário de fim são obrigatórios.",
      400,
    );
  }

  const agendamento =
    await prisma.agendamentos.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
    });

  if (!agendamento) {
    throw new AppError(
      "Agendamento não encontrado.",
      404,
    );
  }

  if (agendamento.status === "CANCELADO") {
    throw new AppError(
      "Não é possível reagendar um agendamento cancelado.",
      409,
    );
  }

  if (agendamento.status === "CONCLUIDO") {
    throw new AppError(
      "Não é possível reagendar um agendamento já concluído.",
      409,
    );
  }

  if (agendamento.status === "FALTOU") {
    throw new AppError(
      "Não é possível reagendar um agendamento marcado como falta.",
      409,
    );
  }

  const novoBarbeiroId =
    barbeiro_id ||
    agendamento.barbeiro_id;

  const novoInicio =
    new Date(horario_inicio);

  const novoFim =
    new Date(horario_fim);

  if (
    isNaN(novoInicio.getTime()) ||
    isNaN(novoFim.getTime())
  ) {
    throw new AppError(
      "Data ou horário do reagendamento inválido.",
      400,
    );
  }

  if (novoFim <= novoInicio) {
    throw new AppError(
      "O horário de término deve ser posterior ao horário de início.",
      400,
    );
  }

  const barbeiro =
    await prisma.barbeiros.findFirst({
      where: {
        id: novoBarbeiroId,
        barbearia_id: barbeariaId,
      },
    });

  if (!barbeiro) {
    throw new AppError(
      "Barbeiro não encontrado.",
      404,
    );
  }

  if (!barbeiro.ativo) {
    throw new AppError(
      "Este barbeiro está inativo.",
      400,
    );
  }

  await validarHorarioFuncionamento(
    data,
    formatarHorarioSaoPaulo(
      novoInicio,
    ),
    formatarHorarioSaoPaulo(novoFim),
    barbeariaId,
  );

  const inicioMinutos =
    obterMinutosHorarioSaoPaulo(
      novoInicio,
    );

  const fimMinutos =
    obterMinutosHorarioSaoPaulo(
      novoFim,
    );

  if (
    inicioMinutos === null ||
    fimMinutos === null
  ) {
    throw new AppError(
      "Não foi possível determinar o horário do reagendamento.",
      400,
    );
  }

  const existeBloqueio =
    await existeBloqueioNoIntervalo({
      barbeiro_id: novoBarbeiroId,
      data,
      inicioMinutos,
      fimMinutos,
      barbeariaId,
    });

  if (existeBloqueio) {
    throw new AppError(
      "O novo horário está bloqueado na agenda.",
      409,
    );
  }

  const conflito =
    await prisma.agendamentos.findFirst({
      where: {
        id: {
          not: id,
        },

        barbeiro_id: novoBarbeiroId,
        barbearia_id: barbeariaId,

        status: {
          not: "CANCELADO",
        },

        horario_inicio: {
          lt: novoFim,
        },

        horario_fim: {
          gt: novoInicio,
        },
      },
    });

  if (conflito) {
    throw new AppError(
      "O barbeiro já possui outro agendamento nesse horário.",
      409,
    );
  }

  return prisma.agendamentos.update({
    where: {
      id,
    },

    data: {
      data: new Date(data),
      barbeiro_id: novoBarbeiroId,
      horario_inicio: novoInicio,
      horario_fim: novoFim,
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

// CANCELAR AGENDAMENTO

async function cancelarAgendamento(
  id,
  usuario,
) {
  await validarAcessoAgendamento(
    id,
    usuario,
  );

  const barbeariaId =
    obterBarbeariaId(usuario);

  const agendamento =
    await prisma.agendamentos.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
    });

  if (!agendamento) {
    throw new AppError(
      "Agendamento não encontrado.",
      404,
    );
  }

  if (agendamento.status === "CANCELADO") {
    throw new AppError(
      "Este agendamento já está cancelado.",
      409,
    );
  }

  if (agendamento.status === "CONCLUIDO") {
    throw new AppError(
      "Não é possível cancelar um agendamento já concluído.",
      409,
    );
  }

  if (agendamento.status === "FALTOU") {
    throw new AppError(
      "Não é possível cancelar um agendamento marcado como falta.",
      409,
    );
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

async function concluirAgendamento(
  id,
  usuario,
) {
  await validarAcessoAgendamento(
    id,
    usuario,
  );

  const barbeariaId =
    obterBarbeariaId(usuario);

  const agendamento =
    await prisma.agendamentos.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
    });

  if (!agendamento) {
    throw new AppError(
      "Agendamento não encontrado.",
      404,
    );
  }

  if (agendamento.status === "CANCELADO") {
    throw new AppError(
      "Não é possível concluir um agendamento cancelado.",
      409,
    );
  }

  if (agendamento.status === "CONCLUIDO") {
    throw new AppError(
      "Este agendamento já está marcado como concluído.",
      409,
    );
  }

  return prisma.agendamentos.update({
    where: {
      id,
    },

    data: {
      status: "CONCLUIDO",
    },

    include: {
      clientes: true,
      barbeiros: true,
      servicos: true,
    },
  });
}

// MARCAR FALTA DO CLIENTE

async function marcarFalta(
  id,
  usuario,
) {
  await validarAcessoAgendamento(
    id,
    usuario,
  );

  const barbeariaId =
    obterBarbeariaId(usuario);

  const agendamento =
    await prisma.agendamentos.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
    });

  if (!agendamento) {
    throw new AppError(
      "Agendamento não encontrado.",
      404,
    );
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

  if (agendamento.status === "FALTOU") {
    throw new AppError(
      "Este agendamento já está marcado como falta.",
      409,
    );
  }

  return prisma.agendamentos.update({
    where: {
      id,
    },

    data: {
      status: "FALTOU",
    },

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
  reagendarAgendamento,
  cancelarAgendamento,
  concluirAgendamento,
  marcarFalta,
};