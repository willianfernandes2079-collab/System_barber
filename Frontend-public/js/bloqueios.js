const formBloqueio =
  document.getElementById("formBloqueio");

const bloqueioData =
  document.getElementById("bloqueioData");

const bloqueioBarbeiro =
  document.getElementById("bloqueioBarbeiro");

const bloqueioHorarioInicio =
  document.getElementById("bloqueioHorarioInicio");

const bloqueioHorarioFim =
  document.getElementById("bloqueioHorarioFim");

const bloqueioMotivo =
  document.getElementById("bloqueioMotivo");

const bloqueioObservacoes =
  document.getElementById("bloqueioObservacoes");

const mensagemBloqueios =
  document.getElementById("mensagemBloqueios");

const btnLimparBloqueio =
  document.getElementById("btnLimparBloqueio");

const btnCriarBloqueio =
  document.getElementById("btnCriarBloqueio");

const filtroData =
  document.getElementById("filtroData");

const filtroBarbeiro =
  document.getElementById("filtroBarbeiro");

const filtroAtivo =
  document.getElementById("filtroAtivo");

const listaBloqueios =
  document.getElementById("listaBloqueios");

let barbeiros = [];
let bloqueioEmEdicao = null;
let cargoUsuario = "";

function mostrarMensagem(texto, tipo = "success") {
  mensagemBloqueios.textContent = texto;
  mensagemBloqueios.dataset.tipo = tipo;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarDataInput(data) {
  const dataObj =
    data instanceof Date
      ? data
      : new Date(data);

  if (isNaN(dataObj.getTime())) {
    return "";
  }

  const ano =
    dataObj.getFullYear();

  const mes = String(
    dataObj.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    dataObj.getDate(),
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function configurarLimitesData() {
  if (!bloqueioData) {
    return;
  }

  const hoje = new Date();

  const anoAtual =
    hoje.getFullYear();

  const dataMinima =
    `${anoAtual}-01-01`;

  const dataMaxima =
    `${anoAtual + 5}-12-31`;

  bloqueioData.min =
    dataMinima;

  bloqueioData.max =
    dataMaxima;

  filtroData.min =
    dataMinima;

  filtroData.max =
    dataMaxima;

  if (!bloqueioData.value) {
    bloqueioData.value =
      formatarDataInput(hoje);
  }
}

function validarDataBloqueio(data) {
  if (!data) {
    return "Informe a data do bloqueio.";
  }

  if (
    data < bloqueioData.min ||
    data > bloqueioData.max
  ) {
    return `A data deve estar entre ${bloqueioData.min} e ${bloqueioData.max}.`;
  }

  return null;
}

function formatarDataExibicao(data) {
  if (!data) {
    return "—";
  }

  const dataObj =
    new Date(data);

  if (isNaN(dataObj.getTime())) {
    return "—";
  }

  return dataObj.toLocaleDateString(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
    },
  );
}

function formatarHorarioExibicao(data) {
  if (!data) {
    return null;
  }

  const dataObj =
    new Date(data);

  if (isNaN(dataObj.getTime())) {
    return null;
  }

  return dataObj.toLocaleTimeString(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
  );
}

function obterNomeBarbeiro(bloqueio) {
  if (!bloqueio?.barbeiro_id) {
    return "Todos os barbeiros";
  }

  if (bloqueio.barbeiro?.nome) {
    return bloqueio.barbeiro.nome;
  }

  const barbeiro =
    barbeiros.find(
      (item) =>
        item.id ===
        bloqueio.barbeiro_id,
    );

  return (
    barbeiro?.nome ||
    barbeiro?.usuario?.nome ||
    "Barbeiro"
  );
}

function formatarHorarioBloqueio(
  bloqueio,
) {
  const inicio =
    formatarHorarioExibicao(
      bloqueio.horario_inicio,
    );

  const fim =
    formatarHorarioExibicao(
      bloqueio.horario_fim,
    );

  if (!inicio || !fim) {
    return "Dia inteiro";
  }

  return `${inicio} - ${fim}`;
}

function preencherSelectBarbeiros() {
  const selects = [
    bloqueioBarbeiro,
    filtroBarbeiro,
  ];

  selects.forEach((select) => {
    if (!select) {
      return;
    }

    const valorAtual =
      select.value;

    select.innerHTML =
      '<option value="">Todos os barbeiros</option>';

    barbeiros.forEach(
      (barbeiro) => {
        const option =
          document.createElement(
            "option",
          );

        option.value =
          barbeiro.id;

        option.textContent =
          barbeiro.nome ||
          barbeiro.usuario?.nome ||
          "Barbeiro";

        select.appendChild(
          option,
        );
      },
    );

    if (
      valorAtual &&
      barbeiros.some(
        (barbeiro) =>
          barbeiro.id === valorAtual,
      )
    ) {
      select.value =
        valorAtual;
    }
  });
}

async function carregarUsuario() {
  try {
    const resposta =
      await api.get("/auth/me");

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          "Não foi possível identificar o usuário.",
      );
    }

    cargoUsuario =
      resposta.data?.cargo || "";

    const podeGerenciar =
      cargoUsuario === "ADMIN" ||
      cargoUsuario === "GERENTE";

    if (!podeGerenciar) {
      bloquearInterfaceGerenciamento();
    }

    return podeGerenciar;
  } catch (erro) {
    console.error(
      "Erro ao carregar usuário:",
      erro,
    );

    window.location.href =
      "/login";

    return false;
  }
}

function bloquearInterfaceGerenciamento() {
  formBloqueio?.querySelectorAll(
    "input, select, textarea, button",
  ).forEach((elemento) => {
    elemento.disabled = true;
  });

  if (btnCriarBloqueio) {
    btnCriarBloqueio.style.display =
      "none";
  }

  if (btnLimparBloqueio) {
    btnLimparBloqueio.style.display =
      "none";
  }
}

async function carregarBarbeiros() {
  try {
    const resposta =
      await api.get(
        "/barbeiros?ativo=true",
      );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          "Erro ao carregar barbeiros.",
      );
    }

    barbeiros =
      Array.isArray(
        resposta.data,
      )
        ? resposta.data
        : [];

    preencherSelectBarbeiros();
  } catch (erro) {
    console.error(
      "Erro ao carregar barbeiros:",
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível carregar os barbeiros.",
      "danger",
    );
  }
}

function montarQueryBloqueios() {
  const parametros =
    new URLSearchParams();

  if (filtroData?.value) {
    parametros.set(
      "data",
      filtroData.value,
    );
  }

  if (filtroBarbeiro?.value) {
    parametros.set(
      "barbeiro_id",
      filtroBarbeiro.value,
    );
  }

  if (
    filtroAtivo &&
    filtroAtivo.value !== ""
  ) {
    parametros.set(
      "ativo",
      filtroAtivo.value,
    );
  }

  const query =
    parametros.toString();

  return query
    ? `?${query}`
    : "";
}

async function carregarBloqueios() {
  if (!listaBloqueios) {
    return;
  }

  listaBloqueios.innerHTML =
    '<div class="bloqueio-carregando">Carregando bloqueios...</div>';

  try {
    const resposta =
      await api.get(
        `/bloqueios${montarQueryBloqueios()}`,
      );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          "Erro ao carregar bloqueios.",
      );
    }

    const lista =
      Array.isArray(
        resposta.data,
      )
        ? resposta.data
        : [];

    renderizarBloqueios(
      lista,
    );
  } catch (erro) {
    console.error(
      "Erro ao carregar bloqueios:",
      erro,
    );

    listaBloqueios.innerHTML = `
      <div class="bloqueio-vazio">
        Não foi possível carregar os bloqueios.
      </div>
    `;

    mostrarMensagem(
      erro?.message ||
        "Erro ao carregar bloqueios.",
      "danger",
    );
  }
}

function renderizarBloqueios(
  lista,
) {
  if (!lista.length) {
    listaBloqueios.innerHTML = `
      <div class="bloqueio-vazio">
        Nenhum bloqueio encontrado.
      </div>
    `;

    return;
  }

  const podeGerenciar =
    cargoUsuario === "ADMIN" ||
    cargoUsuario === "GERENTE";

  listaBloqueios.innerHTML =
    lista
      .map((bloqueio) => {
        const ativo =
          bloqueio.ativo === true;

        const statusClasse =
          ativo
            ? "badge-success"
            : "badge-danger";

        const statusTexto =
          ativo
            ? "Ativo"
            : "Inativo";

        const observacoes =
          bloqueio.observacoes
            ? `
              <div class="bloqueio-item-observacoes">
                <strong>Observações:</strong>
                ${escaparHtml(
                  bloqueio.observacoes,
                )}
              </div>
            `
            : "";

        const acoes =
          podeGerenciar
            ? `
              <div class="bloqueio-item-acoes">
                <button
                  type="button"
                  class="btn btn-outline"
                  data-editar-bloqueio="${escaparHtml(
                    bloqueio.id,
                  )}"
                >
                  Editar
                </button>

                ${
                  ativo
                    ? `
                      <button
                        type="button"
                        class="btn btn-danger"
                        data-desativar-bloqueio="${escaparHtml(
                          bloqueio.id,
                        )}"
                      >
                        Desativar
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="btn btn-primary"
                        data-ativar-bloqueio="${escaparHtml(
                          bloqueio.id,
                        )}"
                      >
                        Ativar
                      </button>
                    `
                }

                <button
                  type="button"
                  class="btn btn-danger"
                  data-excluir-bloqueio="${escaparHtml(
                    bloqueio.id,
                  )}"
                >
                  Excluir
                </button>
              </div>
            `
            : "";

        return `
          <article
            class="bloqueio-item"
            data-bloqueio-id="${escaparHtml(
              bloqueio.id,
            )}"
          >
            <div class="bloqueio-item-cabecalho">
              <div>
                <div class="bloqueio-item-titulo">
                   ${escaparHtml(
                    bloqueio.motivo ||
                      "Bloqueio",
                  )}
                </div>

                <div class="bloqueio-item-subtitulo">
                  ${formatarDataExibicao(
                    bloqueio.data,
                  )}
                  ·
                  ${escaparHtml(
                    obterNomeBarbeiro(
                      bloqueio,
                    ),
                  )}
                </div>
              </div>

              <span
                class="badge ${statusClasse} bloqueio-status"
              >
                ${statusTexto}
              </span>
            </div>

            <div class="bloqueio-item-detalhes">
              <div class="bloqueio-detalhe">
                <span>Data</span>
                <strong>
                  ${formatarDataExibicao(
                    bloqueio.data,
                  )}
                </strong>
              </div>

              <div class="bloqueio-detalhe">
                <span>Barbeiro</span>
                <strong>
                  ${escaparHtml(
                    obterNomeBarbeiro(
                      bloqueio,
                    ),
                  )}
                </strong>
              </div>

              <div class="bloqueio-detalhe">
                <span>Horário</span>
                <strong>
                  ${formatarHorarioBloqueio(
                    bloqueio,
                  )}
                </strong>
              </div>
            </div>

            ${observacoes}

            ${acoes}
          </article>
        `;
      })
      .join("");

  if (!podeGerenciar) {
    return;
  }

  listaBloqueios
    .querySelectorAll(
      "[data-editar-bloqueio]",
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () =>
          editarBloqueio(
            botao.dataset
              .editarBloqueio,
          ),
      );
    });

  listaBloqueios
    .querySelectorAll(
      "[data-desativar-bloqueio]",
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () =>
          alterarStatusBloqueio(
            botao.dataset
              .desativarBloqueio,
            false,
          ),
      );
    });

  listaBloqueios
    .querySelectorAll(
      "[data-ativar-bloqueio]",
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () =>
          alterarStatusBloqueio(
            botao.dataset
              .ativarBloqueio,
            true,
          ),
      );
    });

  listaBloqueios
    .querySelectorAll(
      "[data-excluir-bloqueio]",
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () =>
          excluirBloqueio(
            botao.dataset
              .excluirBloqueio,
          ),
      );
    });
}

async function criarOuAtualizarBloqueio(
  evento,
) {
  evento.preventDefault();

  const erroData =
    validarDataBloqueio(
      bloqueioData.value,
    );

  if (erroData) {
    mostrarMensagem(
      erroData,
      "danger",
    );

    return;
  }

  const horarioInicio =
    bloqueioHorarioInicio.value;

  const horarioFim =
    bloqueioHorarioFim.value;

  if (
    (horarioInicio &&
      !horarioFim) ||
    (!horarioInicio &&
      horarioFim)
  ) {
    mostrarMensagem(
      "Informe o horário inicial e o horário final.",
      "danger",
    );

    return;
  }

  if (
    horarioInicio &&
    horarioFim &&
    horarioInicio >= horarioFim
  ) {
    mostrarMensagem(
      "O horário inicial deve ser anterior ao horário final.",
      "danger",
    );

    return;
  }

  const motivo =
    bloqueioMotivo.value.trim();

  if (!motivo) {
    mostrarMensagem(
      "Informe o motivo do bloqueio.",
      "danger",
    );

    return;
  }

  const dados = {
    barbeiro_id:
      bloqueioBarbeiro.value ||
      null,

    data:
      bloqueioData.value,

    horario_inicio:
      horarioInicio || null,

    horario_fim:
      horarioFim || null,

    motivo,

    observacoes:
      bloqueioObservacoes.value.trim() ||
      null,
  };

  const estaEditando =
    Boolean(bloqueioEmEdicao);

  btnCriarBloqueio.disabled =
    true;

  btnLimparBloqueio.disabled =
    true;

  mostrarMensagem(
    estaEditando
      ? "Atualizando bloqueio..."
      : "Criando bloqueio...",
    "success",
  );

  try {
    const resposta =
      estaEditando
        ? await api.patch(
            `/bloqueios/${bloqueioEmEdicao}`,
            dados,
          )
        : await api.post(
            "/bloqueios",
            dados,
          );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          `Erro ao ${
            estaEditando
              ? "atualizar"
              : "criar"
          } bloqueio.`,
      );
    }

    formBloqueio.reset();

    cancelarEdicao();

    mostrarMensagem(
      estaEditando
        ? "Bloqueio atualizado com sucesso."
        : "Bloqueio criado com sucesso.",
      "success",
    );

    configurarLimitesData();

    await carregarBloqueios();
  } catch (erro) {
    console.error(
      "Erro ao salvar bloqueio:",
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível salvar o bloqueio.",
      "danger",
    );
  } finally {
    btnCriarBloqueio.disabled =
      false;

    btnLimparBloqueio.disabled =
      false;
  }
}

async function editarBloqueio(
  id,
) {
  try {
    mostrarMensagem(
      "Carregando bloqueio...",
      "success",
    );

    const resposta =
      await api.get(
        `/bloqueios/${id}`,
      );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          "Erro ao carregar bloqueio.",
      );
    }

    const bloqueio =
      resposta.data;

    bloqueioEmEdicao =
      bloqueio.id;

    bloqueioData.value =
      formatarDataInput(
        bloqueio.data,
      );

    bloqueioBarbeiro.value =
      bloqueio.barbeiro_id ||
      "";

    bloqueioHorarioInicio.value =
      formatarHorarioParaInput(
        bloqueio.horario_inicio,
      );

    bloqueioHorarioFim.value =
      formatarHorarioParaInput(
        bloqueio.horario_fim,
      );

    bloqueioMotivo.value =
      bloqueio.motivo || "";

    bloqueioObservacoes.value =
      bloqueio.observacoes || "";

    document.querySelector(
      ".bloqueios-card h3",
    ).textContent =
      "Editar bloqueio";

    btnCriarBloqueio.textContent =
      "Salvar alterações";

    btnLimparBloqueio.textContent =
      "Cancelar edição";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    mostrarMensagem(
      "Modo de edição ativado.",
      "success",
    );
  } catch (erro) {
    console.error(
      "Erro ao editar bloqueio:",
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível carregar o bloqueio.",
      "danger",
    );
  }
}

function formatarHorarioParaInput(
  horario,
) {
  if (!horario) {
    return "";
  }

  const dataObj =
    new Date(horario);

  if (isNaN(dataObj.getTime())) {
    return "";
  }

  return dataObj.toLocaleTimeString(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
  );
}

function cancelarEdicao() {
  bloqueioEmEdicao = null;

  const titulo =
    document.querySelector(
      ".bloqueios-card h3",
    );

  if (titulo) {
    titulo.textContent =
      "Novo bloqueio";
  }

  btnCriarBloqueio.textContent =
    "Criar bloqueio";

  btnLimparBloqueio.textContent =
    "Limpar";

  configurarLimitesData();

  preencherSelectBarbeiros();
}

async function alterarStatusBloqueio(
  id,
  ativo,
) {
  const acao =
    ativo
      ? "ativar"
      : "desativar";

  const confirmado =
    window.confirm(
      `Deseja ${acao} este bloqueio?`,
    );

  if (!confirmado) {
    return;
  }

  try {
    mostrarMensagem(
      `${ativo ? "Ativando" : "Desativando"} bloqueio...`,
      "success",
    );

    const resposta =
      await api.patch(
        `/bloqueios/${id}/${acao}`,
        {},
      );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          `Erro ao ${acao} bloqueio.`,
      );
    }

    mostrarMensagem(
      `Bloqueio ${
        ativo
          ? "ativado"
          : "desativado"
      } com sucesso.`,
      "success",
    );

    await carregarBloqueios();
  } catch (erro) {
    console.error(
      `Erro ao ${acao} bloqueio:`,
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        `Não foi possível ${acao} o bloqueio.`,
      "danger",
    );
  }
}

async function excluirBloqueio(
  id,
) {
  const confirmado =
    window.confirm(
      "Deseja realmente excluir este bloqueio? Essa ação não pode ser desfeita.",
    );

  if (!confirmado) {
    return;
  }

  try {
    mostrarMensagem(
      "Excluindo bloqueio...",
      "success",
    );

    const resposta =
      await api.delete(
        `/bloqueios/${id}`,
      );

    if (!resposta?.success) {
      throw new Error(
        resposta?.message ||
          "Erro ao excluir bloqueio.",
      );
    }

    if (
      bloqueioEmEdicao === id
    ) {
      cancelarEdicao();
      formBloqueio.reset();
      configurarLimitesData();
    }

    mostrarMensagem(
      "Bloqueio excluído com sucesso.",
      "success",
    );

    await carregarBloqueios();
  } catch (erro) {
    console.error(
      "Erro ao excluir bloqueio:",
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível excluir o bloqueio.",
      "danger",
    );
  }
}

function limparFormularioBloqueio() {
  if (bloqueioEmEdicao) {
    formBloqueio.reset();

    cancelarEdicao();

    mostrarMensagem(
      "Edição cancelada.",
      "success",
    );

    return;
  }

  formBloqueio.reset();

  configurarLimitesData();

  preencherSelectBarbeiros();

  mostrarMensagem(
    "",
    "success",
  );
}

if (formBloqueio) {
  formBloqueio.addEventListener(
    "submit",
    criarOuAtualizarBloqueio,
  );
}

if (btnLimparBloqueio) {
  btnLimparBloqueio.addEventListener(
    "click",
    () => {
      setTimeout(
        limparFormularioBloqueio,
        0,
      );
    },
  );
}

if (filtroData) {
  filtroData.addEventListener(
    "change",
    carregarBloqueios,
  );
}

if (filtroBarbeiro) {
  filtroBarbeiro.addEventListener(
    "change",
    carregarBloqueios,
  );
}

if (filtroAtivo) {
  filtroAtivo.addEventListener(
    "change",
    carregarBloqueios,
  );
}

async function inicializarBloqueios() {
  configurarLimitesData();

  const podeGerenciar =
    await carregarUsuario();

  await carregarBarbeiros();

  if (!podeGerenciar) {
    return;
  }

  await carregarBloqueios();
}

inicializarBloqueios();

