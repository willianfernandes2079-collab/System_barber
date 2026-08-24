const token = localStorage.getItem("accessToken");

if (!token) {
  window.location.href = "/login";
}

const form = document.getElementById("agendamentoForm");

const cliente = document.getElementById("cliente");

const clienteBusca = document.getElementById("clienteBusca");

const clienteSelect = document.getElementById("clienteSelect");

const clientesResultados = document.getElementById("clientesResultados");

const barbeiroSelect = document.getElementById("barbeiroSelect");

const servicoSelect = document.getElementById("servicoSelect");

const semanaSelect = document.getElementById("semanaSelect");

const diaSelect = document.getElementById("diaSelect");

const horarioInput = document.getElementById("horarioInput");

const valorInput = document.getElementById("valorInput");

const statusSelect = document.getElementById("statusSelect");

const observacaoInput = document.getElementById("observacaoInput");

const mensagem = document.getElementById("mensagem");

let clientes = [];

function mostrarMensagem(texto, tipo = "success") {
  mensagem.textContent = texto;
  mensagem.dataset.tipo = tipo;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obterInicioDaSemana(data, semanas = 0) {
  const resultado = new Date(data);

  const dia = resultado.getDay();

  const diferenca = dia === 0 ? -6 : 1 - dia;

  resultado.setDate(resultado.getDate() + diferenca + semanas * 7);

  resultado.setHours(0, 0, 0, 0);

  return resultado;
}

function formatarDataInput(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function atualizarDiasDaSemana() {
  const semana = semanaSelect.value === "proxima" ? 1 : 0;

  const inicioSemana = obterInicioDaSemana(new Date(), semana);

  const hoje = new Date();

  diaSelect.innerHTML = "";

  const nomesDias = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  for (let i = 0; i < 6; i++) {
    const data = new Date(inicioSemana);

    data.setDate(data.getDate() + i);

    const option = document.createElement("option");

    option.value = formatarDataInput(data);

    option.textContent = `${nomesDias[i]} - ${String(data.getDate()).padStart(
      2,
      "0",
    )}/${String(data.getMonth() + 1).padStart(2, "0")}`;

    if (semana === 0 && data.toDateString() === hoje.toDateString()) {
      option.selected = true;
    }

    diaSelect.appendChild(option);
  }

  if (!diaSelect.value) {
    diaSelect.selectedIndex = 0;
  }
}

async function carregarClientes() {
  try {
    const resposta = await fetch("/api/clientes?ativo=true&limite=100", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.success) {
      throw new Error(resultado.message || "Erro ao carregar clientes.");
    }

    clientes = Array.isArray(resultado.data) ? resultado.data : [];
  } catch (erro) {
    console.error("Erro ao carregar clientes:", erro);

    mostrarMensagem("Erro ao carregar clientes.", "danger");
  }
}

function mostrarClientes(lista) {
  clientesResultados.innerHTML = "";

  if (!lista.length) {
    clientesResultados.innerHTML = `
      <div class="cliente-resultado">
        Nenhum cliente encontrado.
      </div>
    `;

    clientesResultados.style.display = "block";

    return;
  }

  lista.forEach((clienteAtual) => {
    const resultado = document.createElement("div");

    resultado.className = "cliente-resultado";

    resultado.innerHTML = `
      <span class="cliente-resultado-nome">
        ${escaparHtml(clienteAtual.nome)}
      </span>

      <span class="cliente-resultado-telefone">
        ${escaparHtml(clienteAtual.telefone || "Telefone não informado")}
      </span>
    `;

    resultado.addEventListener("click", () => {
      clienteBusca.value = clienteAtual.nome;

      clienteSelect.value = clienteAtual.id;

      clientesResultados.innerHTML = "";

      clientesResultados.style.display = "none";
    });

    clientesResultados.appendChild(resultado);
  });

  clientesResultados.style.display = "block";
}

function buscarClientes() {
  const termo = clienteBusca.value.trim().toLowerCase();

  clienteSelect.value = "";

  if (!termo) {
    mostrarClientes(clientes);
    return;
  }

  const encontrados = clientes.filter((clienteAtual) =>
    String(clienteAtual.nome || "")
      .toLowerCase()
      .includes(termo),
  );

  mostrarClientes(encontrados);
}

clienteBusca.addEventListener("input", buscarClientes);

clienteBusca.addEventListener("focus", buscarClientes);

document.addEventListener("click", (evento) => {
  if (!cliente.contains(evento.target)) {
    clientesResultados.innerHTML = "";

    clientesResultados.style.display = "none";
  }
});

async function carregarBarbeiros() {
  try {
    const resposta = await fetch("/api/barbeiros?ativo=true", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.success) {
      throw new Error(resultado.message || "Erro ao carregar barbeiros.");
    }

    barbeiroSelect.innerHTML = '<option value="">Selecione o barbeiro</option>';

    resultado.data.forEach((barbeiro) => {
      const option = document.createElement("option");

      option.value = barbeiro.id;
      option.textContent = barbeiro.nome;

      barbeiroSelect.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar barbeiros:", erro);

    mostrarMensagem("Erro ao carregar barbeiros.", "danger");
  }
}

async function carregarServicos() {
  try {
    const resposta = await fetch("/api/servicos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.success) {
      throw new Error(resultado.message || "Erro ao carregar serviços.");
    }

    servicoSelect.innerHTML = '<option value="">Selecione o serviço</option>';

    resultado.data.forEach((servico) => {
      const option = document.createElement("option");

      option.value = servico.id;

      option.textContent = `${servico.nome} - R$ ${Number(
        servico.preco,
      ).toFixed(2)}`;

      option.dataset.preco = servico.preco;

      option.dataset.duracao = servico.duracao;

      servicoSelect.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar serviços:", erro);

    mostrarMensagem("Erro ao carregar serviços.", "danger");
  }
}

async function carregarHorariosDisponiveis() {
  horarioInput.innerHTML = '<option value="">Carregando horários...</option>';

  horarioInput.disabled = true;

  const barbeiro_id = barbeiroSelect.value;

  const servico_id = servicoSelect.value;

  const data = diaSelect.value;

  if (!barbeiro_id || !servico_id || !data) {
    horarioInput.innerHTML =
      '<option value="">Selecione primeiro barbeiro, serviço e dia</option>';

    return;
  }

  try {
    const parametros = new URLSearchParams({
      barbeiro_id,
      servico_id,
      data,
    });

    const resposta = await fetch(
      `/api/agendamentos/disponiveis?${parametros.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.success) {
      throw new Error(
        resultado.message || "Erro ao carregar horários disponíveis.",
      );
    }

    horarioInput.innerHTML = '<option value="">Selecione o horário</option>';

    if (!Array.isArray(resultado.data) || !resultado.data.length) {
      horarioInput.innerHTML =
        '<option value="">Nenhum horário disponível</option>';

      return;
    }

    resultado.data.forEach((horario) => {
      const option = document.createElement("option");

      option.value = horario;
      option.textContent = horario;

      horarioInput.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar horários disponíveis:", erro);

    horarioInput.innerHTML =
      '<option value="">Erro ao carregar horários</option>';

    mostrarMensagem(
      erro.message || "Erro ao carregar horários disponíveis.",
      "danger",
    );
  } finally {
    horarioInput.disabled = false;
  }
}

barbeiroSelect.addEventListener("change", carregarHorariosDisponiveis);

servicoSelect.addEventListener("change", carregarHorariosDisponiveis);

diaSelect.addEventListener("change", carregarHorariosDisponiveis);

servicoSelect.addEventListener("change", () => {
  const option = servicoSelect.options[servicoSelect.selectedIndex];

  if (!option?.value) {
    valorInput.value = "";

    delete servicoSelect.dataset.duracao;

    return;
  }

  const preco = Number(option.dataset.preco);

  const duracao = Number(option.dataset.duracao);

  if (Number.isFinite(preco)) {
    valorInput.value = preco.toFixed(2);
  }

  if (Number.isFinite(duracao)) {
    servicoSelect.dataset.duracao = duracao;
  }
});

function calcularHorarioFim(horarioInicio, duracaoMinutos) {
  const [horas, minutos] = horarioInicio.split(":").map(Number);

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    !Number.isFinite(duracaoMinutos)
  ) {
    return null;
  }

  const totalMinutos = horas * 60 + minutos + duracaoMinutos;

  if (totalMinutos >= 24 * 60) {
    return null;
  }

  const horasFim = Math.floor(totalMinutos / 60);

  const minutosFim = totalMinutos % 60;

  return (
    String(horasFim).padStart(2, "0") +
    ":" +
    String(minutosFim).padStart(2, "0")
  );
}

function combinarDataHorario(data, horario) {
  return `${data}T${horario}:00`;
}

semanaSelect.addEventListener("change", () => {
  atualizarDiasDaSemana();
  carregarHorariosDisponiveis();
});

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  mostrarMensagem("", "success");

  const cliente_id = clienteSelect.value;

  const barbeiro_id = barbeiroSelect.value;

  const servico_id = servicoSelect.value;

  const data = diaSelect.value;

  const horario_inicio = horarioInput.value;

  const valor = valorInput.value;

  const status = statusSelect.value;

  const observacoes = observacaoInput.value.trim();

  if (
    !cliente_id ||
    !barbeiro_id ||
    !servico_id ||
    !data ||
    !horario_inicio ||
    valor === ""
  ) {
    mostrarMensagem(
      "Preencha todos os campos obrigatórios e selecione um cliente da lista.",
      "danger",
    );

    return;
  }

  const duracao = Number(servicoSelect.dataset.duracao);

  if (!Number.isFinite(duracao) || duracao <= 0) {
    mostrarMensagem(
      "Não foi possível identificar a duração do serviço.",
      "danger",
    );

    return;
  }

  const horarioFimTexto = calcularHorarioFim(horario_inicio, duracao);

  if (!horarioFimTexto) {
    mostrarMensagem(
      "O horário final do serviço ultrapassa o limite do dia.",
      "danger",
    );

    return;
  }

  try {
    const resposta = await fetch("/api/agendamentos", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        cliente_id,
        barbeiro_id,
        servico_id,
        data,
        horario_inicio: combinarDataHorario(data, horario_inicio),
        horario_fim: combinarDataHorario(data, horarioFimTexto),
        status,
        observacoes: observacoes || null,
        valor: Number(valor),
        forma_pagamento: null,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.success) {
      throw new Error(resultado.message || "Erro ao criar agendamento.");
    }

    mostrarMensagem("Agendamento criado com sucesso!", "success");

    form.reset();

    clienteSelect.value = "";
    clienteBusca.value = "";

    clientesResultados.innerHTML = "";

    clientesResultados.style.display = "none";

    valorInput.value = "";

    horarioInput.innerHTML =
      '<option value="">Selecione primeiro barbeiro, serviço e dia</option>';

    horarioInput.disabled = true;

    delete servicoSelect.dataset.duracao;

    atualizarDiasDaSemana();
  } catch (erro) {
    console.error("Erro ao criar agendamento:", erro);

    mostrarMensagem(
      erro.message || "Não foi possível criar o agendamento.",
      "danger",
    );
  }
});

async function carregarDados() {
  atualizarDiasDaSemana();

  await carregarClientes();
  await carregarBarbeiros();
  await carregarServicos();
  await carregarHorariosDisponiveis();
}

carregarDados();
