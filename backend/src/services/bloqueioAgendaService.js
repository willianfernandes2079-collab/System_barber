const prisma = require("../config/prismaClient");
const AppError = require("../utils/AppError");

const OFFSET_SAO_PAULO = "-03:00";

function validarBarbeariaId(barbeariaId) {
  if (!barbeariaId) {
    throw new AppError(
      "Usuário não está vinculado a uma barbearia.",
      403,
    );
  }

  return barbeariaId;
}

function normalizarData(data) {
  const dataObj = new Date(`${data}T00:00:00${OFFSET_SAO_PAULO}`);

  if (isNaN(dataObj.getTime())) {
    throw new AppError("Data inválida.", 400);
  }

  return dataObj;
}

function normalizarHorario(data, horario) {
  if (!horario) return null;

  const dataObj = new Date(`${data}T${horario}:00${OFFSET_SAO_PAULO}`);

  if (isNaN(dataObj.getTime())) {
    throw new AppError("Horário inválido.", 400);
  }

  return dataObj;
}

function obterMinutosSaoPaulo(dataObj) {
  if (!dataObj) return null;

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

function validarIntervalo(horarioInicio, horarioFim) {
  if (!horarioInicio && !horarioFim) {
    return;
  }

  if (!horarioInicio || !horarioFim) {
    throw new AppError(
      "Informe o horário de início e o horário de fim.",
      400,
    );
  }

  if (horarioInicio >= horarioFim) {
    throw new AppError(
      "O horário de início deve ser anterior ao horário de fim.",
      400,
    );
  }
}

async function criarBloqueio({
  barbeiro_id,
  data,
  horario_inicio,
  horario_fim,
  motivo,
  observacoes,
  barbeariaId,
}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  if (!data) {
    throw new AppError("A data do bloqueio é obrigatória.", 400);
  }

  if (!motivo || !motivo.trim()) {
    throw new AppError("O motivo do bloqueio é obrigatório.", 400);
  }

  const dataObj = normalizarData(data);
  const horarioInicioObj = normalizarHorario(data, horario_inicio);
  const horarioFimObj = normalizarHorario(data, horario_fim);

  validarIntervalo(horarioInicioObj, horarioFimObj);

  if (barbeiro_id) {
    const barbeiro = await prisma.barbeiros.findFirst({
      where: {
        id: barbeiro_id,
        barbearia_id: barbeariaId,
      },
    });

    if (!barbeiro) {
      throw new AppError("Barbeiro não encontrado.", 404);
    }
  }

  return prisma.bloqueioAgenda.create({
    data: {
      barbeiro_id: barbeiro_id || null,
      data: dataObj,
      horario_inicio: horarioInicioObj,
      horario_fim: horarioFimObj,
      motivo: motivo.trim(),
      observacoes: observacoes?.trim() || null,
      ativo: true,
      barbearia_id: barbeariaId,
    },
    include: {
      barbeiro: true,
    },
  });
}

async function listarBloqueios({
  data,
  barbeiro_id,
  ativo,
  barbeariaId,
} = {}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const where = {
    barbearia_id: barbeariaId,
  };

  if (data) {
    const dataObj = normalizarData(data);

    where.data = dataObj;
  }

  if (barbeiro_id) {
    where.OR = [
      {
        barbeiro_id,
      },
      {
        barbeiro_id: null,
      },
    ];
  }

  if (ativo !== undefined) {
    where.ativo =
      ativo === true || ativo === "true";
  }

  return prisma.bloqueioAgenda.findMany({
    where,
    orderBy: [
      {
        data: "asc",
      },
      {
        horario_inicio: "asc",
      },
    ],
    include: {
      barbeiro: true,
    },
  });
}

async function buscarBloqueioPorId(
  id,
  barbeariaId,
) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const bloqueio =
    await prisma.bloqueioAgenda.findFirst({
      where: {
        id,
        barbearia_id: barbeariaId,
      },
      include: {
        barbeiro: true,
      },
    });

  if (!bloqueio) {
    throw new AppError("Bloqueio não encontrado.", 404);
  }

  return bloqueio;
}

async function atualizarBloqueio(
  id,
  {
    barbeiro_id,
    data,
    horario_inicio,
    horario_fim,
    motivo,
    observacoes,
    ativo,
  },
  barbeariaId,
) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const bloqueio = await buscarBloqueioPorId(
    id,
    barbeariaId,
  );

  const novaData =
    data !== undefined
      ? normalizarData(data)
      : bloqueio.data;

  const dataTexto =
    data !== undefined
      ? data
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
        }).format(bloqueio.data);

  const novoHorarioInicio =
    horario_inicio !== undefined
      ? normalizarHorario(dataTexto, horario_inicio)
      : bloqueio.horario_inicio;

  const novoHorarioFim =
    horario_fim !== undefined
      ? normalizarHorario(dataTexto, horario_fim)
      : bloqueio.horario_fim;

  validarIntervalo(
    novoHorarioInicio,
    novoHorarioFim,
  );

  if (
    barbeiro_id !== undefined &&
    barbeiro_id !== null
  ) {
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
  }

  const dados = {
    data: novaData,
    horario_inicio: novoHorarioInicio,
    horario_fim: novoHorarioFim,
  };

  if (barbeiro_id !== undefined) {
    dados.barbeiro_id =
      barbeiro_id || null;
  }

  if (motivo !== undefined) {
    if (!motivo || !motivo.trim()) {
      throw new AppError(
        "O motivo do bloqueio é obrigatório.",
        400,
      );
    }

    dados.motivo = motivo.trim();
  }

  if (observacoes !== undefined) {
    dados.observacoes =
      observacoes?.trim() || null;
  }

  if (ativo !== undefined) {
    dados.ativo =
      ativo === true || ativo === "true";
  }

  return prisma.bloqueioAgenda.update({
    where: {
      id,
    },
    data: dados,
    include: {
      barbeiro: true,
    },
  });
}

async function desativarBloqueio(
  id,
  barbeariaId,
) {
  await buscarBloqueioPorId(
    id,
    barbeariaId,
  );

  return prisma.bloqueioAgenda.update({
    where: {
      id,
    },
    data: {
      ativo: false,
    },
  });
}

async function ativarBloqueio(
  id,
  barbeariaId,
) {
  await buscarBloqueioPorId(
    id,
    barbeariaId,
  );

  return prisma.bloqueioAgenda.update({
    where: {
      id,
    },
    data: {
      ativo: true,
    },
  });
}

async function excluirBloqueio(
  id,
  barbeariaId,
) {
  await buscarBloqueioPorId(
    id,
    barbeariaId,
  );

  return prisma.bloqueioAgenda.delete({
    where: {
      id,
    },
  });
}

async function existeBloqueioNoIntervalo({
  barbeiro_id,
  data,
  inicioMinutos,
  fimMinutos,
  barbeariaId,
}) {
  barbeariaId = validarBarbeariaId(barbeariaId);

  const bloqueios =
    await listarBloqueios({
      data,
      barbeiro_id,
      ativo: true,
      barbeariaId,
    });

  return bloqueios.some((bloqueio) => {
    // Bloqueio sem horário = dia inteiro.
    if (
      !bloqueio.horario_inicio ||
      !bloqueio.horario_fim
    ) {
      return true;
    }

    const bloqueioInicio =
      obterMinutosSaoPaulo(
        bloqueio.horario_inicio,
      );

    const bloqueioFim =
      obterMinutosSaoPaulo(
        bloqueio.horario_fim,
      );

    if (
      bloqueioInicio === null ||
      bloqueioFim === null
    ) {
      return false;
    }

    return (
      inicioMinutos < bloqueioFim &&
      fimMinutos > bloqueioInicio
    );
  });
}

module.exports = {
  criarBloqueio,
  listarBloqueios,
  buscarBloqueioPorId,
  atualizarBloqueio,
  desativarBloqueio,
  ativarBloqueio,
  excluirBloqueio,
  existeBloqueioNoIntervalo,
  obterMinutosSaoPaulo,
};