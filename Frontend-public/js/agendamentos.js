if (!localStorage.getItem("accessToken")) {
  window.location.href = "/login";
}

const form = document.getElementById("agendamentoForm");

const cliente = document.getElementById("cliente");

const clienteBusca = document.getElementById("clienteBusca");

const clienteSelect = document.getElementById("clienteSelect");

const clientesResultados = document.getElementById("clientesResultados");

const planoTipo = document.getElementById("planoTipo");

const tipoPlano = document.getElementById("tipoPlano");

const planoSelect = document.getElementById("planoSelect");

const planoInfo = document.getElementById("planoInfo");

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
let assinaturasPlano = [];

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
    const resultado = await api.get("/clientes?ativo=true&limite=100");

    if (!resultado?.success) {
      throw new Error(resultado?.message || "Erro ao carregar clientes.");
    }

    clientes = Array.isArray(resultado.data) ? resultado.data : [];
  } catch (erro) {
    console.error("Erro ao carregar clientes:", erro);

    mostrarMensagem("Erro ao carregar clientes.", "danger");
  }
}

async function carregarPlanosCliente(clienteId) {
  assinaturasPlano = [];

  tipoPlano.disabled = true;

  planoSelect.disabled = true;

  planoSelect.innerHTML = '<option value="">Nenhum plano disponível</option>';

  planoInfo.textContent = "";

  if (!clienteId) {
    return;
  }

  try {
    const resultado = await api.get(
      `/assinaturas-planos/cliente/${clienteId}/ativas`,
    );

    if (!resultado?.success) {
      throw new Error(
        resultado?.message || "Erro ao carregar planos do cliente.",
      );
    }

    assinaturasPlano = Array.isArray(resultado.data) ? resultado.data : [];

    if (!assinaturasPlano.length) {
      return;
    }

    planoSelect.innerHTML = '<option value="">Selecione o plano</option>';

    assinaturasPlano.forEach((assinatura) => {
      const restantes =
        Number(assinatura.quantidade_total) -
        Number(assinatura.quantidade_utilizada);

      const option = document.createElement("option");

      option.value = assinatura.id;

      option.textContent = `${assinatura.plano.nome} - ${restantes} corte(s) restante(s)`;

      option.dataset.servicoId = assinatura.plano.servico_id;

      option.dataset.restantes = restantes;

      option.dataset.dataFim = assinatura.data_fim;

      planoSelect.appendChild(option);
    });

    tipoPlano.disabled = false;
  } catch (erro) {
    console.error("Erro ao carregar planos do cliente:", erro);

    mostrarMensagem("Erro ao carregar os planos do cliente.", "danger");
  }
}

function atualizarEstadoPlano() {
  const usandoPlano = tipoPlano.checked;

  planoSelect.disabled = !usandoPlano || !assinaturasPlano.length;

  if (!usandoPlano) {
    planoSelect.value = "";
    planoInfo.textContent = "";

    return;
  }

  atualizarInformacaoPlano();
}

function atualizarInformacaoPlano() {
  const assinaturaId = planoSelect.value;

  if (!assinaturaId) {
    planoInfo.textContent = "Selecione um plano.";

    return;
  }

  const assinatura = assinaturasPlano.find((item) => item.id === assinaturaId);

  if (!assinatura) {
    planoInfo.textContent = "";

    return;
  }

  const restantes =
    Number(assinatura.quantidade_total) -
    Number(assinatura.quantidade_utilizada);

  const dataFim = new Date(assinatura.data_fim);

  const dataFormatada = dataFim.toLocaleDateString("pt-BR");

  planoInfo.textContent = `${restantes} corte(s) restante(s) • Válido até ${dataFormatada}`;
}

function obterAssinaturaPlanoSelecionada() {
  if (!tipoPlano.checked) {
    return null;
  }

  if (!planoSelect.value) {
    return null;
  }

  return (
    assinaturasPlano.find(
      (assinatura) => assinatura.id === planoSelect.value,
    ) || null
  );
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

    resultado.addEventListener("click", async () => {
      clienteBusca.value = clienteAtual.nome;

      clienteSelect.value = clienteAtual.id;

      clientesResultados.innerHTML = "";

      clientesResultados.style.display = "none";

      tipoPlano.checked = false;

      planoSelect.value = "";

      planoInfo.textContent = "";

      await carregarPlanosCliente(clienteAtual.id);

      atualizarEstadoPlano();

      await carregarHorariosDisponiveis();
    });

    clientesResultados.appendChild(resultado);
  });

  clientesResultados.style.display = "block";
}

function buscarClientes() {
  const termo = clienteBusca.value.trim().toLowerCase();

  clienteSelect.value = "";

  assinaturasPlano = [];

  tipoPlano.checked = false;
  tipoPlano.disabled = true;
  planoSelect.disabled = true;
  planoSelect.innerHTML = '<option value="">Nenhum plano disponível</option>';
  planoInfo.textContent = "";

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
    const resultado = await api.get("/barbeiros?ativo=true");

    if (!resultado?.success) {
      throw new Error(resultado?.message || "Erro ao carregar barbeiros.");
    }

    barbeiroSelect.innerHTML = '<option value="">Selecione o barbeiro</option>';

    const barbeiros = Array.isArray(resultado.data) ? resultado.data : [];

    barbeiros.forEach((barbeiro) => {
      const option = document.createElement("option");

      option.value = barbeiro.id;

      option.textContent =
        barbeiro.nome || barbeiro.usuario?.nome || "Barbeiro";

      barbeiroSelect.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar barbeiros:", erro);

    mostrarMensagem(
      erro.message || "Erro ao carregar barbeiros.",
      "danger",
    );
  }
}

async function carregarServicos() {
  try {
    const resultado = await api.get("/servicos");

    if (!resultado?.success) {
      throw new Error(resultado?.message || "Erro ao carregar serviços.");
    }

    servicoSelect.innerHTML = '<option value="">Selecione o serviço</option>';

    const servicos = Array.isArray(resultado.data) ? resultado.data : [];

    servicos.forEach((servico) => {
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

    const resultado = await api.get(
      `/agendamentos/disponiveis?${parametros.toString()}`,
    );

    if (!resultado?.success) {
      throw new Error(
        resultado?.message || "Erro ao carregar horários disponíveis.",
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

tipoPlano.addEventListener("change", atualizarEstadoPlano);

planoSelect.addEventListener("change", atualizarInformacaoPlano);

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

  const assinatura = obterAssinaturaPlanoSelecionada();

  if (assinatura && assinatura.plano.servico_id !== servicoSelect.value) {
    planoSelect.value = "";

    planoInfo.textContent =
      "O plano selecionado não cobre este serviço. Escolha o serviço do plano.";

    tipoPlano.checked = false;

    atualizarEstadoPlano();
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

  const assinatura = obterAssinaturaPlanoSelecionada();

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

  if (tipoPlano.checked && !assinatura) {
    mostrarMensagem("Selecione uma assinatura de plano válida.", "danger");

    return;
  }

  if (assinatura && assinatura.plano.servico_id !== servico_id) {
    mostrarMensagem("O serviço selecionado não faz parte do plano.", "danger");

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
    const resultado = await api.post("/agendamentos", {
      cliente_id,
      barbeiro_id,
      servico_id,

      assinatura_plano_id: assinatura ? assinatura.id : null,

      data,

      horario_inicio: combinarDataHorario(data, horario_inicio),

      horario_fim: combinarDataHorario(data, horarioFimTexto),

      status,

      observacoes: observacoes || null,

      valor: assinatura ? 0 : Number(valor),

      forma_pagamento: null,
    });

    if (!resultado?.success) {
      throw new Error(resultado?.message || "Erro ao criar agendamento.");
    }

    mostrarMensagem(
      assinatura
        ? "Agendamento criado utilizando o plano!"
        : "Agendamento criado com sucesso!",
      "success",
    );

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

    assinaturasPlano = [];

    tipoPlano.checked = false;

    tipoPlano.disabled = true;

    planoSelect.disabled = true;

    planoSelect.innerHTML =
      '<option value="">Nenhum plano disponível</option>';

    planoInfo.textContent = "";

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