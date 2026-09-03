let meusAgendamentos = [];

let agendamentoSelecionado = null;

let barbeirosDisponiveis = [];

let modoModal = "detalhes";

async function requisicaoPortal(
  path,
  options = {},
) {
  const resposta = await fetch(
    `/api${path}`,
    {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options.headers || {}),
      },
    },
  );

  let dados = null;

  try {
    dados =
      await resposta.json();
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.message ||
        "Erro ao comunicar com o servidor.",
    );
  }

  return dados;
}

function renderizarAgendamentos() {
  const lista =
    document.getElementById(
      "listaAgendamentos",
    );

  if (!lista) return;

  const filtro =
    document.getElementById(
      "filtroStatus",
    )?.value || "TODOS";

  const filtrados =
    filtro === "TODOS"
      ? meusAgendamentos
      : meusAgendamentos.filter(
          (item) =>
            item.status === filtro,
        );

  if (!filtrados.length) {
    lista.innerHTML = `
      <div class="empty-state">
        <strong>Nenhum agendamento encontrado.</strong>

        <p>
          Não existem agendamentos para o filtro selecionado.
        </p>
      </div>
    `;

    return;
  }

  lista.innerHTML =
    filtrados
      .map(
        (item) => `
          <article class="data-item">
            <div class="data-item-header">
              <div>
                <h3 class="data-item-title">
                  ${portalEscaparHtml(
                    item.servicos?.nome ||
                      "Serviço",
                  )}
                </h3>

                <p class="data-item-subtitle">
                  ${portalEscaparHtml(
                    item.barbeiros?.nome ||
                      "Barbeiro não informado",
                  )}
                </p>
              </div>

              <span
                class="badge ${portalStatusClasse(
                  item.status,
                )}"
              >
                ${portalEscaparHtml(
                  portalStatusTexto(
                    item.status,
                  ),
                )}
              </span>
            </div>

            <div class="data-grid">
              <div>
                <span>Data</span>

                <strong>
                  ${portalFormatarData(
                    item.data,
                  )}
                </strong>
              </div>

              <div>
                <span>Horário</span>

                <strong>
                  ${portalFormatarHorario(
                    item.horario_inicio,
                  )}
                  -
                  ${portalFormatarHorario(
                    item.horario_fim,
                  )}
                </strong>
              </div>

              <div>
                <span>Valor</span>

                <strong>
                  ${portalFormatarMoeda(
                    item.valor,
                  )}
                </strong>
              </div>

              <div>
                <span>Pagamento</span>

                <strong>
                  ${
                    item.forma_pagamento
                      ? portalEscaparHtml(
                          item.forma_pagamento,
                        )
                      : "Não registrado"
                  }
                </strong>
              </div>
            </div>

            <div class="item-actions">
              <button
                type="button"
                class="btn btn-outline"
                data-detalhes="${portalEscaparHtml(
                  item.id,
                )}"
              >
                Ver detalhes
              </button>

              ${
                item.status ===
                "AGENDADO"
                  ? `
                    <button
                      type="button"
                      class="btn btn-outline"
                      data-reagendar="${portalEscaparHtml(
                        item.id,
                      )}"
                    >
                      Reagendar
                    </button>

                    <button
                      type="button"
                      class="btn btn-danger"
                      data-cancelar="${portalEscaparHtml(
                        item.id,
                      )}"
                    >
                      Cancelar
                    </button>
                  `
                  : ""
              }
            </div>
          </article>
        `,
      )
      .join("");

  lista
    .querySelectorAll(
      "[data-detalhes]",
    )
    .forEach(
      (botao) => {
        botao.addEventListener(
          "click",
          () =>
            abrirDetalhes(
              botao.dataset
                .detalhes,
            ),
        );
      },
    );

  lista
    .querySelectorAll(
      "[data-reagendar]",
    )
    .forEach(
      (botao) => {
        botao.addEventListener(
          "click",
          () =>
            abrirReagendamento(
              botao.dataset
                .reagendar,
            ),
        );
      },
    );

  lista
    .querySelectorAll(
      "[data-cancelar]",
    )
    .forEach(
      (botao) => {
        botao.addEventListener(
          "click",
          () =>
            cancelarAgendamento(
              botao.dataset
                .cancelar,
            ),
        );
      },
    );
}

function atualizarResumo() {
  const total =
    document.getElementById(
      "totalAgendamentos",
    );

  const proximo =
    document.getElementById(
      "proximoAgendamento",
    );

  const concluidos =
    document.getElementById(
      "totalConcluidos",
    );

  if (total) {
    total.textContent =
      meusAgendamentos.length;
  }

  const agora =
    new Date();

  const futuros =
    meusAgendamentos
      .filter(
        (item) =>
          item.status ===
          "AGENDADO",
      )
      .map(
        (item) => ({
          ...item,
          instante:
            new Date(
              item.horario_inicio,
            ),
        }),
      )
      .filter(
        (item) =>
          !Number.isNaN(
            item.instante.getTime(),
          ) &&
          item.instante >=
            agora,
      )
      .sort(
        (a, b) =>
          a.instante -
          b.instante,
      );

  if (proximo) {
    if (!futuros.length) {
      proximo.textContent =
        "Nenhum";
    } else {
      proximo.textContent =
        `${portalFormatarData(
          futuros[0]
            .horario_inicio,
        )} ${portalFormatarHorario(
          futuros[0]
            .horario_inicio,
        )}`;
    }
  }

  if (concluidos) {
    concluidos.textContent =
      meusAgendamentos.filter(
        (item) =>
          item.status ===
          "CONCLUIDO",
      ).length;
  }
}

function obterAgendamentoPorId(
  id,
) {
  return meusAgendamentos.find(
    (agendamento) =>
      agendamento.id === id,
  );
}

function abrirModal() {
  const modal =
    document.getElementById(
      "modalDetalhes",
    );

  if (!modal) return;

  modal.classList.add(
    "active",
  );

  modal.setAttribute(
    "aria-hidden",
    "false",
  );
}

function abrirDetalhes(id) {
  const item =
    obterAgendamentoPorId(id);

  if (!item) return;

  agendamentoSelecionado =
    item;

  modoModal =
    "detalhes";

  const titulo =
    document.getElementById(
      "modalTitulo",
    );

  const conteudo =
    document.getElementById(
      "modalConteudo",
    );

  const reagendamento =
    document.getElementById(
      "modalReagendamento",
    );

  const acoes =
    document.getElementById(
      "modalAcoes",
    );

  if (titulo) {
    titulo.textContent =
      item.servicos?.nome ||
      "Agendamento";
  }

  if (reagendamento) {
    reagendamento.style.display =
      "none";
  }

  if (conteudo) {
    conteudo.style.display =
      "block";

    conteudo.innerHTML = `
      <div class="data-grid">
        <div>
          <span>Status</span>

          <strong>
            ${portalEscaparHtml(
              portalStatusTexto(
                item.status,
              ),
            )}
          </strong>
        </div>

        <div>
          <span>Data</span>

          <strong>
            ${portalFormatarData(
              item.data,
            )}
          </strong>
        </div>

        <div>
          <span>Início</span>

          <strong>
            ${portalFormatarHorario(
              item.horario_inicio,
            )}
          </strong>
        </div>

        <div>
          <span>Fim</span>

          <strong>
            ${portalFormatarHorario(
              item.horario_fim,
            )}
          </strong>
        </div>

        <div>
          <span>Barbeiro</span>

          <strong>
            ${portalEscaparHtml(
              item.barbeiros?.nome ||
                "Não informado",
            )}
          </strong>
        </div>

        <div>
          <span>Serviço</span>

          <strong>
            ${portalEscaparHtml(
              item.servicos?.nome ||
                "Não informado",
            )}
          </strong>
        </div>

        <div>
          <span>Valor</span>

          <strong>
            ${portalFormatarMoeda(
              item.valor,
            )}
          </strong>
        </div>

        <div>
          <span>Pagamento</span>

          <strong>
            ${
              item.forma_pagamento
                ? portalEscaparHtml(
                    item.forma_pagamento,
                  )
                : "Ainda não registrado"
            }
          </strong>
        </div>

        ${
          item.observacoes
            ? `
              <div
                style="grid-column: 1 / -1;"
              >
                <span>Observações</span>

                <strong>
                  ${portalEscaparHtml(
                    item.observacoes,
                  )}
                </strong>
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  const btnReagendar =
    document.getElementById(
      "btnReagendarAgendamento",
    );

  const btnCancelar =
    document.getElementById(
      "btnCancelarAgendamento",
    );

  if (btnReagendar) {
    btnReagendar.style.display =
      item.status ===
      "AGENDADO"
        ? "inline-flex"
        : "none";
  }

  if (btnCancelar) {
    btnCancelar.style.display =
      item.status ===
      "AGENDADO"
        ? "inline-flex"
        : "none";
  }

  if (acoes) {
    acoes.style.display =
      "flex";
  }

  abrirModal();
}

function fecharDetalhes() {
  const modal =
    document.getElementById(
      "modalDetalhes",
    );

  if (modal) {
    modal.classList.remove(
      "active",
    );

    modal.setAttribute(
      "aria-hidden",
      "true",
    );
  }

  agendamentoSelecionado =
    null;

  modoModal =
    "detalhes";
}

function definirDataMinima() {
  const input =
    document.getElementById(
      "reagendamentoData",
    );

  if (!input) return;

  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    agora.getDate(),
  ).padStart(2, "0");

  input.min =
    `${ano}-${mes}-${dia}`;
}

function extrairDataAgendamento(
  item,
) {
  if (!item?.data) {
    return "";
  }

  const data =
    new Date(item.data);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "";
  }

  const ano =
    data.getFullYear();

  const mes = String(
    data.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    data.getDate(),
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

async function abrirReagendamento(
  id,
) {
  const item =
    obterAgendamentoPorId(id);

  if (!item) return;

  if (
    item.status !==
    "AGENDADO"
  ) {
    return;
  }

  agendamentoSelecionado =
    item;

  modoModal =
    "reagendamento";

  const titulo =
    document.getElementById(
      "modalTitulo",
    );

  const conteudo =
    document.getElementById(
      "modalConteudo",
    );

  const reagendamento =
    document.getElementById(
      "modalReagendamento",
    );

  const acoes =
    document.getElementById(
      "modalAcoes",
    );

  if (titulo) {
    titulo.textContent =
      "Reagendar atendimento";
  }

  if (conteudo) {
    conteudo.style.display =
      "none";
  }

  if (reagendamento) {
    reagendamento.style.display =
      "block";
  }

  if (acoes) {
    acoes.style.display =
      "none";
  }

  const servicoInput =
    document.getElementById(
      "reagendamentoServico",
    );

  if (servicoInput) {
    servicoInput.value =
      item.servicos?.nome ||
      "Serviço";
  }

  const dataInput =
    document.getElementById(
      "reagendamentoData",
    );

  if (dataInput) {
    dataInput.value =
      extrairDataAgendamento(
        item,
      );
  }

  definirDataMinima();

  const barbeiroSelect =
    document.getElementById(
      "reagendamentoBarbeiro",
    );

  const barbeiroAtual =
    item.barbeiro_id ||
    item.barbeiros?.id ||
    "";

  if (barbeiroSelect) {
    barbeiroSelect.innerHTML = `
      <option value="">
        Carregando barbeiros...
      </option>
    `;

    barbeiroSelect.disabled =
      true;
  }

  const horarioSelect =
    document.getElementById(
      "reagendamentoHorario",
    );

  if (horarioSelect) {
    horarioSelect.innerHTML = `
      <option value="">
        Selecione a data e o barbeiro.
      </option>
    `;

    horarioSelect.disabled =
      true;
  }

  mostrarMensagemReagendamento(
    "",
  );

  abrirModal();

  try {
    await carregarBarbeirosParaReagendamento();

    if (barbeiroSelect) {
      barbeiroSelect.innerHTML = `
        <option value="">
          Selecione o barbeiro
        </option>
      `;

      barbeirosDisponiveis.forEach(
        (barbeiro) => {
          const option =
            document.createElement(
              "option",
            );

          option.value =
            barbeiro.id;

          option.textContent =
            barbeiro.nome;

          if (
            barbeiro.id ===
            barbeiroAtual
          ) {
            option.selected =
              true;
          }

          barbeiroSelect.appendChild(
            option,
          );
        },
      );

      barbeiroSelect.disabled =
        false;
    }

    await carregarHorariosReagendamento();
  } catch (erro) {
    mostrarMensagemReagendamento(
      erro?.message ||
        "Não foi possível carregar os dados para reagendamento.",
      "error",
    );
  }
}

async function carregarBarbeirosParaReagendamento() {
  const resposta =
    await requisicaoPortal(
      "/barbeiros",
      {
        method: "GET",
      },
    );

  barbeirosDisponiveis =
    Array.isArray(
      resposta?.data,
    )
      ? resposta.data.filter(
          (barbeiro) =>
            barbeiro?.ativo !==
            false,
        )
      : [];

  if (
    !barbeirosDisponiveis.length
  ) {
    throw new Error(
      "Nenhum barbeiro disponível.",
    );
  }

  return barbeirosDisponiveis;
}

async function carregarHorariosReagendamento() {
  if (
    modoModal !==
      "reagendamento" ||
    !agendamentoSelecionado
  ) {
    return;
  }

  const dataInput =
    document.getElementById(
      "reagendamentoData",
    );

  const barbeiroSelect =
    document.getElementById(
      "reagendamentoBarbeiro",
    );

  const horarioSelect =
    document.getElementById(
      "reagendamentoHorario",
    );

  if (
    !dataInput ||
    !barbeiroSelect ||
    !horarioSelect
  ) {
    return;
  }

  const data =
    dataInput.value;

  const barbeiroId =
    barbeiroSelect.value;

  if (
    !data ||
    !barbeiroId
  ) {
    horarioSelect.innerHTML = `
      <option value="">
        Selecione a data e o barbeiro.
      </option>
    `;

    horarioSelect.disabled =
      true;

    return;
  }

  const servicoId =
    agendamentoSelecionado
      .servico_id ||
    agendamentoSelecionado
      .servicos?.id;

  if (!servicoId) {
    mostrarMensagemReagendamento(
      "Não foi possível identificar o serviço.",
      "error",
    );

    return;
  }

  horarioSelect.innerHTML = `
    <option value="">
      Carregando horários...
    </option>
  `;

  horarioSelect.disabled =
    true;

  mostrarMensagemReagendamento(
    "",
  );

  try {
    const parametros =
      new URLSearchParams({
        barbeiro_id:
          barbeiroId,

        servico_id:
          servicoId,

        data,
      });

    const resposta =
      await requisicaoPortal(
        `/agendamentos/disponiveis?${parametros.toString()}`,
        {
          method: "GET",
        },
      );

    const horarios =
      Array.isArray(
        resposta?.data,
      )
        ? resposta.data
        : [];

    if (!horarios.length) {
      horarioSelect.innerHTML = `
        <option value="">
          Nenhum horário disponível
        </option>
      `;

      return;
    }

    horarioSelect.innerHTML = `
      <option value="">
        Selecione um horário
      </option>
    `;

    horarios.forEach(
      (horario) => {
        const option =
          document.createElement(
            "option",
          );

        option.value =
          horario;

        option.textContent =
          horario;

        horarioSelect.appendChild(
          option,
        );
      },
    );

    horarioSelect.disabled =
      false;
  } catch (erro) {
    console.error(
      "Erro ao carregar horários:",
      erro,
    );

    horarioSelect.innerHTML = `
      <option value="">
        Não foi possível carregar os horários
      </option>
    `;

    mostrarMensagemReagendamento(
      erro?.message ||
        "Não foi possível carregar os horários.",
      "error",
    );
  }
}

function mostrarMensagemReagendamento(
  mensagem,
  tipo = "",
) {
  const elemento =
    document.getElementById(
      "mensagemReagendamento",
    );

  if (!elemento) return;

  elemento.textContent =
    mensagem || "";

  elemento.style.display =
    mensagem
      ? "block"
      : "none";

  elemento.className =
    `message${
      tipo
        ? ` ${tipo}`
        : ""
    }`;
}

function criarDataHoraISO(
  data,
  horario,
) {
  if (
    !data ||
    !/^\d{2}:\d{2}$/.test(
      horario,
    )
  ) {
    return null;
  }

  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  const [
    hora,
    minuto,
  ] = horario
    .split(":")
    .map(Number);

  const dataLocal =
    new Date(
      ano,
      mes - 1,
      dia,
      hora,
      minuto,
      0,
      0,
    );

  if (
    Number.isNaN(
      dataLocal.getTime(),
    )
  ) {
    return null;
  }

  return dataLocal.toISOString();
}

async function confirmarReagendamento(
  event,
) {
  event.preventDefault();

  if (
    !agendamentoSelecionado
  ) {
    return;
  }

  const data =
    document.getElementById(
      "reagendamentoData",
    )?.value;

  const barbeiroId =
    document.getElementById(
      "reagendamentoBarbeiro",
    )?.value;

  const horario =
    document.getElementById(
      "reagendamentoHorario",
    )?.value;

  if (
    !data ||
    !barbeiroId ||
    !horario
  ) {
    mostrarMensagemReagendamento(
      "Informe a nova data, o barbeiro e o horário.",
      "error",
    );

    return;
  }

  const inicio =
    criarDataHoraISO(
      data,
      horario,
    );

  if (!inicio) {
    mostrarMensagemReagendamento(
      "Data ou horário inválido.",
      "error",
    );

    return;
  }

  const duracao =
    Number(
      agendamentoSelecionado
        .servicos?.duracao,
    );

  if (
    !Number.isFinite(
      duracao,
    ) ||
    duracao <= 0
  ) {
    mostrarMensagemReagendamento(
      "Não foi possível determinar a duração do serviço.",
      "error",
    );

    return;
  }

  const fim =
    new Date(
      new Date(
        inicio,
      ).getTime() +
        duracao * 60000,
    ).toISOString();

  const botao =
    document.getElementById(
      "btnConfirmarReagendamento",
    );

  if (botao) {
    botao.disabled =
      true;

    botao.textContent =
      "Reagendando...";
  }

  mostrarMensagemReagendamento(
    "",
  );

  try {
    await requisicaoPortal(
      `/agendamentos/${encodeURIComponent(
        agendamentoSelecionado.id,
      )}/reagendar`,
      {
        method: "PATCH",
        body: JSON.stringify({
          data,
          horario_inicio:
            inicio,
          horario_fim:
            fim,
          barbeiro_id:
            barbeiroId,
        }),
      },
    );

    await carregarAgendamentos();

    fecharDetalhes();

    portalMostrarMensagem(
      document.getElementById(
        "mensagemAgendamentos",
      ),
      "Agendamento reagendado com sucesso.",
      "success",
    );
  } catch (erro) {
    mostrarMensagemReagendamento(
      erro?.message ||
        "Não foi possível reagendar o agendamento.",
      "error",
    );
  } finally {
    if (botao) {
      botao.disabled =
        false;

      botao.textContent =
        "Confirmar reagendamento";
    }
  }
}

async function cancelarAgendamento(
  id,
) {
  const item =
    obterAgendamentoPorId(id);

  if (!item) return;

  if (
    item.status !==
    "AGENDADO"
  ) {
    return;
  }

  if (
    !confirm(
      "Deseja realmente cancelar este agendamento?",
    )
  ) {
    return;
  }

  try {
    await requisicaoPortal(
      `/agendamentos/${encodeURIComponent(
        id,
      )}`,
      {
        method: "DELETE",
      },
    );

    fecharDetalhes();

    await carregarAgendamentos();

    portalMostrarMensagem(
      document.getElementById(
        "mensagemAgendamentos",
      ),
      "Agendamento cancelado com sucesso.",
      "success",
    );
  } catch (erro) {
    portalMostrarMensagem(
      document.getElementById(
        "mensagemAgendamentos",
      ),
      erro?.message ||
        "Não foi possível cancelar o agendamento.",
      "error",
    );
  }
}

async function carregarAgendamentos() {
  const mensagem =
    document.getElementById(
      "mensagemAgendamentos",
    );

  if (mensagem) {
    mensagem.textContent =
      "Carregando seus agendamentos...";
    mensagem.className =
      "message";
  }

  try {
    const resposta =
      await requisicaoPortal(
        "/agendamentos",
        {
          method: "GET",
        },
      );

    meusAgendamentos =
      Array.isArray(
        resposta?.data,
      )
        ? resposta.data
        : [];

    atualizarResumo();

    renderizarAgendamentos();

    if (mensagem) {
      portalMostrarMensagem(
        mensagem,
        meusAgendamentos.length
          ? ""
          : "Você ainda não possui agendamentos.",
      );
    }
  } catch (erro) {
    console.error(
      "Erro ao carregar agendamentos:",
      erro,
    );

    meusAgendamentos =
      [];

    atualizarResumo();

    renderizarAgendamentos();

    portalMostrarMensagem(
      mensagem,
      erro?.message ||
        "Não foi possível carregar seus agendamentos.",
      "error",
    );
  }
}

function voltarParaDetalhes() {
  if (
    !agendamentoSelecionado
  ) {
    fecharDetalhes();
    return;
  }

  abrirDetalhes(
    agendamentoSelecionado.id,
  );
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document
      .getElementById(
        "filtroStatus",
      )
      ?.addEventListener(
        "change",
        renderizarAgendamentos,
      );

    document
      .getElementById(
        "btnFecharModal",
      )
      ?.addEventListener(
        "click",
        fecharDetalhes,
      );

    document
      .getElementById(
        "btnFecharDetalhes",
      )
      ?.addEventListener(
        "click",
        fecharDetalhes,
      );

    document
      .getElementById(
        "btnReagendarAgendamento",
      )
      ?.addEventListener(
        "click",
        () => {
          if (
            agendamentoSelecionado
          ) {
            abrirReagendamento(
              agendamentoSelecionado.id,
            );
          }
        },
      );

    document
      .getElementById(
        "btnCancelarAgendamento",
      )
      ?.addEventListener(
        "click",
        () => {
          if (
            agendamentoSelecionado
          ) {
            cancelarAgendamento(
              agendamentoSelecionado.id,
            );
          }
        },
      );

    document
      .getElementById(
        "btnVoltarDetalhes",
      )
      ?.addEventListener(
        "click",
        voltarParaDetalhes,
      );

    document
      .getElementById(
        "formReagendamento",
      )
      ?.addEventListener(
        "submit",
        confirmarReagendamento,
      );

    document
      .getElementById(
        "reagendamentoData",
      )
      ?.addEventListener(
        "change",
        carregarHorariosReagendamento,
      );

    document
      .getElementById(
        "reagendamentoBarbeiro",
      )
      ?.addEventListener(
        "change",
        carregarHorariosReagendamento,
      );

    const modal =
      document.getElementById(
        "modalDetalhes",
      );

    modal?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          modal
        ) {
          fecharDetalhes();
        }
      },
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          fecharDetalhes();
        }
      },
    );

    carregarAgendamentos();
  },
);

