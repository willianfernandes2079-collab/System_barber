let clienteLogado = null;
let servicos = [];
let barbeiros = [];

const formAgendamento = document.getElementById("formAgendamento");

const servicoSelect = document.getElementById("servico");
const barbeiroSelect = document.getElementById("barbeiro");
const dataInput = document.getElementById("data");
const horarioSelect = document.getElementById("horario");

const nomeInput = document.getElementById("nome");
const whatsappInput = document.getElementById("whatsapp");

const resumoAgendamento = document.getElementById("resumoAgendamento");
const resumoServico = document.getElementById("resumoServico");
const resumoBarbeiro = document.getElementById("resumoBarbeiro");
const resumoData = document.getElementById("resumoData");
const resumoHorario = document.getElementById("resumoHorario");
const resumoValor = document.getElementById("resumoValor");

const erroAgendamento = document.getElementById("erroAgendamento");
const btnConfirmarAgendamento = document.getElementById(
  "btnConfirmarAgendamento",
);

function mostrarErro(mensagem) {
  erroAgendamento.textContent = mensagem || "Ocorreu um erro.";
  erroAgendamento.className = "alert alert-danger";
  erroAgendamento.style.display = "block";
}

function mostrarSucesso(mensagem) {
  erroAgendamento.textContent = mensagem;
  erroAgendamento.className = "alert alert-success";
  erroAgendamento.style.display = "block";
}

function esconderMensagem() {
  erroAgendamento.textContent = "";
  erroAgendamento.style.display = "none";
}

function formatarMoeda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) {
    return "—";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function combinarDataHorario(data, horario) {
  const dataLocal = new Date(`${data}T${horario}:00`);

  if (Number.isNaN(dataLocal.getTime())) {
    return null;
  }

  return dataLocal.toISOString();
}

function calcularHorarioFim(horarioInicio, duracao) {
  if (!horarioInicio) {
    return null;
  }

  const minutosDuracao = Number(duracao);

  if (!Number.isFinite(minutosDuracao) || minutosDuracao <= 0) {
    return null;
  }

  const [hora, minuto] = horarioInicio.split(":").map(Number);

  if (
    !Number.isInteger(hora) ||
    !Number.isInteger(minuto) ||
    hora < 0 ||
    hora > 23 ||
    minuto < 0 ||
    minuto > 59
  ) {
    return null;
  }

  const total = hora * 60 + minuto + minutosDuracao;

  if (total >= 24 * 60) {
    return null;
  }

  const horaFim = Math.floor(total / 60);

  const minutoFim = total % 60;

  return `${String(horaFim).padStart(2, "0")}:${String(minutoFim).padStart(
    2,
    "0",
  )}`;
}

function obterServicoSelecionado() {
  return servicos.find((servico) => servico.id === servicoSelect.value);
}

function obterBarbeiroSelecionado() {
  return barbeiros.find((barbeiro) => barbeiro.id === barbeiroSelect.value);
}

function atualizarResumo() {
  const servico = obterServicoSelecionado();

  const barbeiro = obterBarbeiroSelecionado();

  const horario = horarioSelect.value;

  const data = dataInput.value;

  resumoServico.textContent = servico?.nome || "—";

  resumoBarbeiro.textContent = barbeiro?.nome || "—";

  resumoData.textContent = formatarData(data);

  resumoHorario.textContent = horario || "—";

  resumoValor.textContent = servico ? formatarMoeda(servico.preco) : "R$ 0,00";

  const completo =
    Boolean(servico) && Boolean(barbeiro) && Boolean(data) && Boolean(horario);

  resumoAgendamento.hidden = !completo;

  btnConfirmarAgendamento.disabled = !completo;
}

function limparHorarios(mensagem = "Selecione o horário") {
  horarioSelect.innerHTML = "";

  const option = document.createElement("option");

  option.value = "";
  option.textContent = mensagem;

  horarioSelect.appendChild(option);

  horarioSelect.disabled = true;

  atualizarResumo();
}

function atualizarEstadoCampos() {
  const possuiServico = Boolean(servicoSelect.value);

  const possuiBarbeiro = Boolean(barbeiroSelect.value);

  dataInput.disabled = !(possuiServico && possuiBarbeiro);

  if (!dataInput.value) {
    limparHorarios("Selecione a data");
  }

  atualizarResumo();
}

async function carregarClienteLogado() {
  try {
    const respostaUsuario = await api.get("/auth/me");

    const usuario = respostaUsuario?.data;

    if (!usuario) {
      throw new Error("Não foi possível identificar o usuário autenticado.");
    }

    if (usuario.cargo !== "CLIENTE") {
      window.location.href = "/index";

      return;
    }

    const resposta = await api.get("/clientes/me");

    if (!resposta?.success || !resposta.data) {
      throw new Error(
        resposta?.message || "Não foi possível identificar o cliente.",
      );
    }

    clienteLogado = resposta.data;

    nomeInput.value = clienteLogado.nome || "";

    whatsappInput.value =
      clienteLogado.whatsapp || clienteLogado.telefone || "";

    if (clienteLogado.ativo === false) {
      throw new Error("Seu cadastro de cliente está inativo.");
    }
  } catch (erro) {
    console.error("Erro ao carregar cliente logado:", erro);

    mostrarErro(
      erro.message || "Não foi possível carregar os dados do cliente.",
    );

    btnConfirmarAgendamento.disabled = true;
  }
}

async function carregarServicos() {
  servicoSelect.disabled = true;

  servicoSelect.innerHTML = '<option value="">Carregando serviços...</option>';

  try {
    const resposta = await api.get("/servicos");

    if (!resposta?.success) {
      throw new Error(
        resposta?.message || "Não foi possível carregar os serviços.",
      );
    }

    servicos = Array.isArray(resposta.data) ? resposta.data : [];

    servicoSelect.innerHTML = '<option value="">Selecione o serviço</option>';

    servicos.forEach((servico) => {
      if (servico.ativo === false) {
        return;
      }

      const option = document.createElement("option");

      option.value = servico.id;

      option.textContent = `${servico.nome} - ${formatarMoeda(servico.preco)}`;

      servicoSelect.appendChild(option);
    });

    if (!servicos.length) {
      servicoSelect.innerHTML =
        '<option value="">Nenhum serviço disponível</option>';
    }
  } catch (erro) {
    console.error("Erro ao carregar serviços:", erro);

    servicoSelect.innerHTML =
      '<option value="">Erro ao carregar serviços</option>';

    mostrarErro(erro.message || "Não foi possível carregar os serviços.");
  } finally {
    servicoSelect.disabled = false;

    atualizarEstadoCampos();
  }
}

async function carregarBarbeiros() {
  barbeiroSelect.disabled = true;

  barbeiroSelect.innerHTML =
    '<option value="">Carregando barbeiros...</option>';

  try {
    const resposta = await api.get("/barbeiros?ativo=true");

    if (!resposta?.success) {
      throw new Error(
        resposta?.message || "Não foi possível carregar os barbeiros.",
      );
    }

    barbeiros = Array.isArray(resposta.data) ? resposta.data : [];

    barbeiroSelect.innerHTML = '<option value="">Selecione o barbeiro</option>';

    barbeiros.forEach((barbeiro) => {
      if (barbeiro.ativo === false) {
        return;
      }

      const option = document.createElement("option");

      option.value = barbeiro.id;

      option.textContent =
        barbeiro.nome || barbeiro.usuario?.nome || "Barbeiro";

      barbeiroSelect.appendChild(option);
    });

    if (!barbeiros.length) {
      barbeiroSelect.innerHTML =
        '<option value="">Nenhum barbeiro disponível</option>';
    }
  } catch (erro) {
    console.error("Erro ao carregar barbeiros:", erro);

    barbeiroSelect.innerHTML =
      '<option value="">Erro ao carregar barbeiros</option>';

    mostrarErro(erro.message || "Não foi possível carregar os barbeiros.");
  } finally {
    barbeiroSelect.disabled = false;

    atualizarEstadoCampos();
  }
}

async function carregarHorariosDisponiveis() {
  esconderMensagem();

  horarioSelect.innerHTML = '<option value="">Carregando horários...</option>';

  horarioSelect.disabled = true;

  atualizarResumo();

  const barbeiro_id = barbeiroSelect.value;

  const servico_id = servicoSelect.value;

  const data = dataInput.value;

  if (!barbeiro_id || !servico_id || !data) {
    limparHorarios("Selecione serviço, barbeiro e data");

    return;
  }

  try {
    const parametros = new URLSearchParams({
      barbeiro_id,
      servico_id,
      data,
    });

    const resposta = await api.get(
      `/agendamentos/disponiveis?${parametros.toString()}`,
    );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message || "Não foi possível carregar os horários.",
      );
    }

    const horarios = Array.isArray(resposta.data) ? resposta.data : [];

    horarioSelect.innerHTML = '<option value="">Selecione o horário</option>';

    if (!horarios.length) {
      horarioSelect.innerHTML =
        '<option value="">Nenhum horário disponível</option>';

      atualizarResumo();

      return;
    }

    horarios.forEach((horario) => {
      const option = document.createElement("option");

      option.value = horario;

      option.textContent = horario;

      horarioSelect.appendChild(option);
    });

    horarioSelect.disabled = false;
  } catch (erro) {
    console.error("Erro ao carregar horários:", erro);

    horarioSelect.innerHTML =
      '<option value="">Erro ao carregar horários</option>';

    mostrarErro(erro.message || "Não foi possível carregar os horários.");
  }

  atualizarResumo();
}

function definirDataMinima() {
  const hoje = new Date();

  const ano = hoje.getFullYear();

  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  const dia = String(hoje.getDate()).padStart(2, "0");

  const hojeFormatado = `${ano}-${mes}-${dia}`;

  dataInput.min = hojeFormatado;
}

function prepararHorarioInicial() {
  limparHorarios("Selecione o horário");
}

async function confirmarAgendamento(evento) {
  evento.preventDefault();

  esconderMensagem();

  if (!clienteLogado?.id) {
    mostrarErro("Não foi possível identificar seu cadastro de cliente.");

    return;
  }

  const servico = obterServicoSelecionado();

  const barbeiro = obterBarbeiroSelecionado();

  const data = dataInput.value;

  const horarioInicio = horarioSelect.value;

  if (!servico || !barbeiro || !data || !horarioInicio) {
    mostrarErro("Selecione serviço, barbeiro, data e horário.");

    return;
  }

  const horarioFim = calcularHorarioFim(horarioInicio, servico.duracao);

  if (!horarioFim) {
    mostrarErro("Não foi possível calcular o horário final do serviço.");

    return;
  }

  const inicio = combinarDataHorario(data, horarioInicio);

  const fim = combinarDataHorario(data, horarioFim);

  if (!inicio || !fim) {
    mostrarErro("Data ou horário inválido.");

    return;
  }

  btnConfirmarAgendamento.disabled = true;

  btnConfirmarAgendamento.textContent = "Confirmando...";

  try {
    const resposta = await api.post("/agendamentos", {
      cliente_id: clienteLogado.id,

      barbeiro_id: barbeiro.id,

      servico_id: servico.id,

      assinatura_plano_id: null,

      data,

      horario_inicio: inicio,

      horario_fim: fim,

      status: "AGENDADO",

      observacoes: null,

      valor: Number(servico.preco),

      forma_pagamento: null,
    });

    if (!resposta?.success) {
      throw new Error(
        resposta?.message || "Não foi possível criar o agendamento.",
      );
    }

    mostrarSucesso("Agendamento realizado com sucesso.");

    formAgendamento.reset();

    barbeiroSelect.value = "";

    dataInput.value = "";

    barbeiroSelect.disabled = false;

    dataInput.disabled = true;

    prepararHorarioInicial();

    resumoAgendamento.hidden = true;

    atualizarResumo();
  } catch (erro) {
    console.error("Erro ao criar agendamento:", erro);

    mostrarErro(erro.message || "Não foi possível realizar o agendamento.");
  } finally {
    btnConfirmarAgendamento.disabled = true;

    btnConfirmarAgendamento.textContent = "Confirmar agendamento";
  }
}

servicoSelect.addEventListener("change", () => {
  esconderMensagem();

  horarioSelect.value = "";

  atualizarEstadoCampos();

  if (servicoSelect.value && barbeiroSelect.value && dataInput.value) {
    carregarHorariosDisponiveis();
  }
});

barbeiroSelect.addEventListener("change", () => {
  esconderMensagem();

  horarioSelect.value = "";

  atualizarEstadoCampos();

  if (servicoSelect.value && barbeiroSelect.value && dataInput.value) {
    carregarHorariosDisponiveis();
  }
});

dataInput.addEventListener("change", () => {
  esconderMensagem();

  carregarHorariosDisponiveis();
});

horarioSelect.addEventListener("change", () => {
  esconderMensagem();

  atualizarResumo();
});

formAgendamento.addEventListener("submit", confirmarAgendamento);

document.addEventListener("DOMContentLoaded", async () => {
  definirDataMinima();

  prepararHorarioInicial();

  await carregarClienteLogado();

  await Promise.all([carregarServicos(), carregarBarbeiros()]);

  atualizarEstadoCampos();
});
