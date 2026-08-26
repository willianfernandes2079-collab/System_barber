/* js/clientes.js — CRUD de clientes e histórico individual. */

let paginaAtualLista = 1;
let modoEdicao = false;

async function carregarClientes() {
  const tbody =
    document.getElementById("tabelaClientes");

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-state">
        Carregando...
      </td>
    </tr>
  `;

  const busca =
    document
      .getElementById("buscaInput")
      .value
      .trim();

  const ativo =
    document
      .getElementById("filtroAtivo")
      .value;

  const params =
    new URLSearchParams({
      pagina: paginaAtualLista,
      limite: 10,
    });

  if (busca) {
    params.set("busca", busca);
  }

  if (ativo) {
    params.set("ativo", ativo);
  }

  try {
    const resposta =
      await api.get(
        `/clientes?${params.toString()}`,
      );

    renderizarTabela(
      Array.isArray(resposta?.data)
        ? resposta.data
        : [],
    );

    renderizarPaginacao(
      resposta?.paginacao,
    );
  } catch (erro) {
    console.error(
      "Erro ao carregar clientes:",
      erro,
    );

    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty-state"
        >
          Não foi possível carregar os clientes.
        </td>
      </tr>
    `;

    mostrarToast?.(
      erro?.message ||
        "Erro ao carregar clientes.",
      "danger",
    );
  }
}

function renderizarTabela(clientes) {
  const tbody =
    document.getElementById(
      "tabelaClientes",
    );

  if (!clientes.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty-state"
        >
          Nenhum cliente encontrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    clientes
      .map(
        (c) => `
          <tr>

            <td>
              <a
                href="cliente.html?id=${encodeURIComponent(
                  c.id,
                )}"
              >
                ${escaparHtml(c.nome)}
              </a>
            </td>

            <td>
              ${escaparHtml(
                c.telefone || "—",
              )}
            </td>

            <td>
              ${escaparHtml(
                c.email || "—",
              )}
            </td>

            <td>
              <span
                class="badge ${
                  c.ativo
                    ? "badge-success"
                    : "badge-danger"
                }"
              >
                ${
                  c.ativo
                    ? "Ativo"
                    : "Inativo"
                }
              </span>
            </td>

            <td class="flex gap-8">

              <button
                type="button"
                class="btn btn-outline"
                data-historico="${c.id}"
              >
                Histórico
              </button>

              <button
                type="button"
                class="btn btn-outline"
                data-editar="${c.id}"
              >
                Editar
              </button>

              ${
                c.ativo
                  ? `
                    <button
                      type="button"
                      class="btn btn-danger"
                      data-desativar="${c.id}"
                    >
                      Desativar
                    </button>
                  `
                  : `
                    <button
                      type="button"
                      class="btn btn-primary"
                      data-ativar="${c.id}"
                    >
                      Ativar
                    </button>
                  `
              }

            </td>

          </tr>
        `,
      )
      .join("");

  tbody
    .querySelectorAll(
      "[data-historico]",
    )
    .forEach((btn) => {
      btn.addEventListener(
        "click",
        () =>
          abrirHistoricoCliente(
            btn.dataset.historico,
          ),
      );
    });

  tbody
    .querySelectorAll(
      "[data-editar]",
    )
    .forEach((btn) => {
      btn.addEventListener(
        "click",
        () =>
          abrirModalEdicao(
            btn.dataset.editar,
            clientes,
          ),
      );
    });

  tbody
    .querySelectorAll(
      "[data-desativar]",
    )
    .forEach((btn) => {
      btn.addEventListener(
        "click",
        () =>
          desativarCliente(
            btn.dataset.desativar,
          ),
      );
    });

  tbody
    .querySelectorAll(
      "[data-ativar]",
    )
    .forEach((btn) => {
      btn.addEventListener(
        "click",
        () =>
          ativarCliente(
            btn.dataset.ativar,
          ),
      );
    });
}

function renderizarPaginacao(
  paginacao,
) {
  const container =
    document.getElementById(
      "paginacao",
    );

  if (
    !container ||
    !paginacao ||
    paginacao.total_paginas <= 1
  ) {
    if (container) {
      container.innerHTML = "";
    }

    return;
  }

  container.innerHTML = `
    <button
      type="button"
      class="btn btn-ghost"
      id="btnPagAnterior"
      ${
        paginacao.pagina <= 1
          ? "disabled"
          : ""
      }
    >
      ← Anterior
    </button>

    <span>
      Página ${paginacao.pagina}
      de ${paginacao.total_paginas}
      (${paginacao.total} clientes)
    </span>

    <button
      type="button"
      class="btn btn-ghost"
      id="btnPagProxima"
      ${
        paginacao.pagina >=
        paginacao.total_paginas
          ? "disabled"
          : ""
      }
    >
      Próxima →
    </button>
  `;

  document
    .getElementById(
      "btnPagAnterior",
    )
    ?.addEventListener(
      "click",
      () => {
        paginaAtualLista =
          Math.max(
            1,
            paginaAtualLista - 1,
          );

        carregarClientes();
      },
    );

  document
    .getElementById(
      "btnPagProxima",
    )
    ?.addEventListener(
      "click",
      () => {
        paginaAtualLista += 1;

        carregarClientes();
      },
    );
}

function escaparHtml(texto) {
  const div =
    document.createElement(
      "div",
    );

  div.textContent =
    texto ?? "";

  return div.innerHTML;
}

function formatarMoeda(valor) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero)
  ) {
    return "R$ 0,00";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function formatarData(data) {
  if (!data) {
    return "—";
  }

  const objeto =
    new Date(data);

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return "—";
  }

  return objeto.toLocaleDateString(
    "pt-BR",
  );
}

function formatarHorario(data) {
  if (!data) {
    return "—";
  }

  const objeto =
    new Date(data);

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return "—";
  }

  return objeto.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatarFormaPagamento(
  forma,
) {
  if (!forma) {
    return "Não pago";
  }

  const formas = {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    DEBITO: "Cartão de débito",
    CREDITO: "Cartão de crédito",
    OUTROS: "Outros",
    PLANO: "Plano",
  };

  return formas[forma] || forma;
}

function classeStatusHistorico(
  status,
) {
  if (
    status === "CONCLUIDO"
  ) {
    return "badge-success";
  }

  if (
    status === "CANCELADO"
  ) {
    return "badge-danger";
  }

  if (
    status === "PENDENTE"
  ) {
    return "badge-warning";
  }

  return "badge-info";
}

function textoStatusHistorico(
  status,
) {
  const statusMap = {
    AGENDADO: "Agendado",
    PENDENTE: "Pendente",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
    FALTOU: "Faltou",
  };

  return (
    statusMap[status] ||
    status ||
    "—"
  );
}

function fecharHistorico() {
  const overlay =
    document.getElementById(
      "modalHistoricoOverlay",
    );

  if (overlay) {
    overlay.style.display =
      "none";
  }
}

function limparHistorico() {
  document.getElementById(
    "historicoTitulo",
  ).textContent =
    "Histórico do cliente";

  document.getElementById(
    "historicoSubtitulo",
  ).textContent =
    "Carregando...";

  document.getElementById(
    "historicoVisitas",
  ).textContent =
    "0";

  document.getElementById(
    "historicoTotalGasto",
  ).textContent =
    "R$ 0,00";

  document.getElementById(
    "historicoTicketMedio",
  ).textContent =
    "R$ 0,00";

  document.getElementById(
    "historicoUltimoAtendimento",
  ).textContent =
    "—";

  document.getElementById(
    "historicoServicoMaisUtilizado",
  ).textContent =
    "Nenhum atendimento concluído.";

  document.getElementById(
    "historicoBarbeiroMaisUtilizado",
  ).textContent =
    "Nenhum atendimento concluído.";

  document.getElementById(
    "tabelaHistorico",
  ).innerHTML = `
    <tr>
      <td
        colspan="7"
        class="empty-state"
      >
        Carregando...
      </td>
    </tr>
  `;

  const erro =
    document.getElementById(
      "historicoErro",
    );

  erro.textContent = "";
  erro.style.display =
    "none";
}

async function abrirHistoricoCliente(
  id,
) {
  limparHistorico();

  const overlay =
    document.getElementById(
      "modalHistoricoOverlay",
    );

  overlay.style.display =
    "flex";

  try {
    const resposta =
      await api.get(
        `/clientes/${id}/historico`,
      );

    if (
      !resposta?.success ||
      !resposta.data
    ) {
      throw new Error(
        resposta?.message ||
          "Não foi possível carregar o histórico.",
      );
    }

    renderizarHistorico(
      resposta.data,
    );
  } catch (erro) {
    console.error(
      "Erro ao carregar histórico:",
      erro,
    );

    const erroElemento =
      document.getElementById(
        "historicoErro",
      );

    erroElemento.textContent =
      erro?.message ||
      "Não foi possível carregar o histórico.";

    erroElemento.style.display =
      "block";

    document.getElementById(
      "tabelaHistorico",
    ).innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-state"
        >
          Não foi possível carregar o histórico.
        </td>
      </tr>
    `;
  }
}

function renderizarHistorico(
  dados,
) {
  const cliente =
    dados.cliente;

  const estatisticas =
    dados.estatisticas ||
    {};

  const historico =
    Array.isArray(
      dados.historico,
    )
      ? dados.historico
      : [];

  document.getElementById(
    "historicoTitulo",
  ).textContent =
    `Histórico — ${cliente.nome}`;

  document.getElementById(
    "historicoSubtitulo",
  ).textContent =
    cliente.telefone ||
    "Cliente";

  document.getElementById(
    "historicoVisitas",
  ).textContent =
    estatisticas.quantidade_visitas ??
    0;

  document.getElementById(
    "historicoTotalGasto",
  ).textContent =
    formatarMoeda(
      estatisticas.total_gasto,
    );

  document.getElementById(
    "historicoTicketMedio",
  ).textContent =
    formatarMoeda(
      estatisticas.ticket_medio,
    );

  document.getElementById(
    "historicoUltimoAtendimento",
  ).textContent =
    estatisticas.ultimo_atendimento
      ? formatarData(
          estatisticas.ultimo_atendimento,
        )
      : "—";

  if (
    estatisticas.servico_mais_utilizado
  ) {
    document.getElementById(
      "historicoServicoMaisUtilizado",
    ).textContent =
      `${estatisticas.servico_mais_utilizado.nome} — ${estatisticas.servico_mais_utilizado.quantidade} atendimento(s)`;
  }

  if (
    estatisticas.barbeiro_mais_utilizado
  ) {
    document.getElementById(
      "historicoBarbeiroMaisUtilizado",
    ).textContent =
      `${estatisticas.barbeiro_mais_utilizado.nome} — ${estatisticas.barbeiro_mais_utilizado.quantidade} atendimento(s)`;
  }

  renderizarTabelaHistorico(
    historico,
  );
}

function renderizarTabelaHistorico(
  historico,
) {
  const tbody =
    document.getElementById(
      "tabelaHistorico",
    );

  if (!historico.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-state"
        >
          Nenhum atendimento encontrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    historico
      .map(
        (item) => {
          const servico =
            item.servico?.nome ||
            "—";

          const barbeiro =
            item.barbeiro?.nome ||
            "—";

          const statusClasse =
            classeStatusHistorico(
              item.status,
            );

          const statusTexto =
            textoStatusHistorico(
              item.status,
            );

          const valor =
            item.valor_pago !== null &&
            item.valor_pago !== undefined
              ? item.valor_pago
              : item.valor;

          const pagamento =
            formatarFormaPagamento(
              item.forma_pagamento,
            );

          return `
            <tr>

              <td>
                ${formatarData(
                  item.data,
                )}
              </td>

              <td>
                ${formatarHorario(
                  item.horario_inicio,
                )}
                -
                ${formatarHorario(
                  item.horario_fim,
                )}
              </td>

              <td>
                ${escaparHtml(
                  servico,
                )}
              </td>

              <td>
                ${escaparHtml(
                  barbeiro,
                )}
              </td>

              <td>
                <span
                  class="badge ${statusClasse}"
                >
                  ${statusTexto}
                </span>
              </td>

              <td>
                ${formatarMoeda(
                  valor,
                )}
              </td>

              <td>
                ${escaparHtml(
                  pagamento,
                )}
              </td>

            </tr>
          `;
        },
      )
      .join("");
}

function abrirModalCriacao() {
  modoEdicao = false;

  document.getElementById(
    "modalTitulo",
  ).textContent =
    "Novo cliente";

  document.getElementById(
    "formCliente",
  ).reset();

  document.getElementById(
    "clienteId",
  ).value = "";

  document.getElementById(
    "modalErro",
  ).style.display =
    "none";

  document.getElementById(
    "modalOverlay",
  ).style.display =
    "flex";
}

function abrirModalEdicao(
  id,
  clientes,
) {
  const cliente =
    clientes.find(
      (c) => c.id === id,
    );

  if (!cliente) {
    return;
  }

  modoEdicao = true;

  document.getElementById(
    "modalTitulo",
  ).textContent =
    `Editar ${cliente.nome}`;

  document.getElementById(
    "clienteId",
  ).value =
    cliente.id;

  document.getElementById(
    "nome",
  ).value =
    cliente.nome;

  document.getElementById(
    "telefone",
  ).value =
    cliente.telefone || "";

  document.getElementById(
    "whatsapp",
  ).value =
    cliente.whatsapp || "";

  document.getElementById(
    "email",
  ).value =
    cliente.email || "";

  document.getElementById(
    "dataNascimento",
  ).value =
    cliente.data_nascimento
      ? cliente.data_nascimento.slice(
          0,
          10,
        )
      : "";

  document.getElementById(
    "cpf",
  ).value =
    cliente.cpf || "";

  document.getElementById(
    "observacoes",
  ).value =
    cliente.observacoes || "";

  document.getElementById(
    "modalErro",
  ).style.display =
    "none";

  document.getElementById(
    "modalOverlay",
  ).style.display =
    "flex";
}

function fecharModal() {
  document.getElementById(
    "modalOverlay",
  ).style.display =
    "none";
}

function mostrarErroModal(
  mensagem,
) {
  const el =
    document.getElementById(
      "modalErro",
    );

  el.textContent =
    mensagem;

  el.style.display =
    "block";
}

async function salvarCliente(
  event,
) {
  event.preventDefault();

  const dados = {
    nome:
      document
        .getElementById(
          "nome",
        )
        .value
        .trim(),

    telefone:
      document
        .getElementById(
          "telefone",
        )
        .value
        .trim(),

    whatsapp:
      document
        .getElementById(
          "whatsapp",
        )
        .value
        .trim() ||
      undefined,

    email:
      document
        .getElementById(
          "email",
        )
        .value
        .trim() ||
      undefined,

    data_nascimento:
      document
        .getElementById(
          "dataNascimento",
        )
        .value ||
      undefined,

    cpf:
      document
        .getElementById(
          "cpf",
        )
        .value
        .trim() ||
      undefined,

    observacoes:
      document
        .getElementById(
          "observacoes",
        )
        .value
        .trim() ||
      undefined,
  };

  try {
    if (modoEdicao) {
      const id =
        document.getElementById(
          "clienteId",
        ).value;

      await api.patch(
        `/clientes/${id}`,
        dados,
      );

      mostrarToast(
        "Cliente atualizado com sucesso.",
        "success",
      );
    } else {
      await api.post(
        "/clientes",
        dados,
      );

      mostrarToast(
        "Cliente cadastrado com sucesso.",
        "success",
      );
    }

    fecharModal();

    carregarClientes();
  } catch (erro) {
    mostrarErroModal(
      erro.message,
    );
  }
}

async function desativarCliente(
  id,
) {
  if (
    !confirm(
      "Desativar este cliente?",
    )
  ) {
    return;
  }

  try {
    await api.delete(
      `/clientes/${id}`,
    );

    mostrarToast(
      "Cliente desativado.",
      "success",
    );

    carregarClientes();
  } catch (erro) {
    mostrarToast(
      erro.message,
      "danger",
    );
  }
}

async function ativarCliente(
  id,
) {
  if (
    !confirm(
      "Ativar este cliente?",
    )
  ) {
    return;
  }

  try {
    await api.patch(
      `/clientes/${id}/ativar`,
    );

    mostrarToast(
      "Cliente ativado.",
      "success",
    );

    carregarClientes();
  } catch (erro) {
    mostrarToast(
      erro.message,
      "danger",
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    carregarClientes();

    document
      .getElementById(
        "btnNovoCliente",
      )
      ?.addEventListener(
        "click",
        () => {
          window.location.href =
            "cadastrarcli.html";
        },
      );

    document
      .getElementById(
        "btnCancelarModal",
      )
      ?.addEventListener(
        "click",
        fecharModal,
      );

    document
      .getElementById(
        "formCliente",
      )
      ?.addEventListener(
        "submit",
        salvarCliente,
      );

    document
      .getElementById(
        "btnFecharHistorico",
      )
      ?.addEventListener(
        "click",
        fecharHistorico,
      );

    document
      .getElementById(
        "modalHistoricoOverlay",
      )
      ?.addEventListener(
        "click",
        (event) => {
          if (
            event.target.id ===
            "modalHistoricoOverlay"
          ) {
            fecharHistorico();
          }
        },
      );

    document
      .getElementById(
        "filtroAtivo",
      )
      ?.addEventListener(
        "change",
        () => {
          paginaAtualLista = 1;
          carregarClientes();
        },
      );

    document
      .getElementById(
        "buscaInput",
      )
      ?.addEventListener(
        "input",
        debounce(
          () => {
            paginaAtualLista = 1;
            carregarClientes();
          },
        ),
      );
  },
);

