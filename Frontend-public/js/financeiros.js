/* js/financeiros.js — dashboard financeiro conectado à API. */

const LABEL_FORMA_PAGAMENTO = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  DEBITO: "Cartão de débito",
  CREDITO: "Cartão de crédito",
  OUTROS: "Outros",
};

function escaparHtml(valor) {
  const div = document.createElement("div");
  div.textContent = String(valor ?? "");
  return div.innerHTML;
}

async function carregarFinanceiro() {
  try {
    const [hojeResp, mesResp, pagamentosResp, comissoesResp] =
      await Promise.all([
        api.get("/financeiro/resumo?periodo=hoje"),
        api.get("/financeiro/resumo?periodo=mes_atual"),
        api.get("/financeiro/pagamentos?limite=10"),
        api.get("/financeiro/comissoes"),
      ]);

    renderizarStats(hojeResp?.data, mesResp?.data);

    renderizarFormasPagamento(mesResp?.data?.por_forma_pagamento);

    renderizarPagamentos(pagamentosResp?.data || []);

    renderizarComissoes(comissoesResp?.data || []);
  } catch (erro) {
    console.error("Erro ao carregar financeiro:", erro);

    mostrarToast(
      erro?.message || "Não foi possível carregar o financeiro.",
      "danger",
    );
  }
}

function renderizarStats(hoje, mes) {
  const faturamentoHoje = document.getElementById("statFaturamentoHoje");

  const faturamentoMes = document.getElementById("statFaturamentoMes");

  const ticketMedio = document.getElementById("statTicketMedio");

  const comissoes = document.getElementById("statComissoes");

  if (faturamentoHoje) {
    faturamentoHoje.textContent = formatarMoeda(hoje?.faturamento || 0);
  }

  if (faturamentoMes) {
    faturamentoMes.textContent = formatarMoeda(mes?.faturamento || 0);
  }

  if (ticketMedio) {
    ticketMedio.textContent = formatarMoeda(mes?.ticket_medio || 0);
  }

  if (comissoes) {
    comissoes.textContent = formatarMoeda(mes?.comissoes_total || 0);
  }
}

function renderizarFormasPagamento(porForma) {
  const tbody = document.getElementById("tabelaFormasPagamento");

  if (!tbody) return;

  if (!porForma || !porForma.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          Nenhum pagamento registrado neste período.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = porForma
    .map(
      (item) => `
        <tr>
          <td>
            ${escaparHtml(
              LABEL_FORMA_PAGAMENTO[item.forma_pagamento] ||
                item.forma_pagamento,
            )}
          </td>

          <td>
            ${formatarMoeda(item.valor)}
          </td>

          <td>
            ${item.percentual}%
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderizarPagamentos(pagamentos) {
  const tbody = document.getElementById("tabelaPagamentos");

  if (!tbody) return;

  if (!pagamentos.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhum pagamento registrado ainda.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pagamentos
    .map(
      (pagamento) => `
        <tr>
          <td>
            ${formatarData(pagamento.data_pagamento)}
          </td>

          <td>
            ${escaparHtml(
              pagamento.cliente?.nome || "—",
            )}
          </td>

          <td>
            ${escaparHtml(
              pagamento.servico?.nome || "—",
            )}
          </td>

          <td>
            ${escaparHtml(
              LABEL_FORMA_PAGAMENTO[pagamento.forma_pagamento] ||
                pagamento.forma_pagamento,
            )}
          </td>

          <td>
            ${formatarMoeda(pagamento.valor)}
          </td>

          <td>
            <span class="badge badge-success">
              ${
                pagamento.status === "PAGO"
                  ? "Pago"
                  : escaparHtml(pagamento.status)
              }
            </span>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderizarComissoes(comissoes) {
  const tbody = document.getElementById("tabelaComissoes");

  if (!tbody) return;

  if (!comissoes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhuma comissão gerada ainda.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = comissoes
    .map(
      (comissao) => `
        <tr>
          <td>
            ${escaparHtml(
              comissao.barbeiro?.nome || "—",
            )}
          </td>

          <td>
            ${formatarMoeda(comissao.valor_servico)}
          </td>

          <td>
            ${comissao.percentual}%
          </td>

          <td>
            ${formatarMoeda(comissao.valor_comissao)}
          </td>

          <td>
            <span
              class="badge ${
                comissao.status === "PAGA"
                  ? "badge-success"
                  : "badge-warning"
              }"
            >
              ${
                comissao.status === "PAGA"
                  ? "Paga"
                  : escaparHtml(comissao.status)
              }
            </span>
          </td>

          <td>
            ${
              comissao.status === "PENDENTE"
                ? `
                  <button
                    type="button"
                    class="btn btn-outline"
                    data-pagar="${escaparHtml(comissao.id)}"
                  >
                    Marcar como paga
                  </button>
                `
                : ""
            }
          </td>
        </tr>
      `,
    )
    .join("");

  tbody.querySelectorAll("[data-pagar]").forEach((botao) => {
    botao.addEventListener("click", () => {
      marcarComissaoPaga(botao.dataset.pagar);
    });
  });
}

async function marcarComissaoPaga(id) {
  try {
    await api.patch(`/financeiro/comissoes/${id}/pagar`, {});

    mostrarToast("Comissão marcada como paga.", "success");

    await carregarFinanceiro();
  } catch (erro) {
    mostrarToast(
      erro?.message || "Não foi possível atualizar a comissão.",
      "danger",
    );
  }
}

async function carregarAgendamentosPagamento() {
  const select = document.getElementById("agendamentoId");

  const info = document.getElementById("infoAgendamento");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Carregando agendamentos...
    </option>
  `;

  if (info) {
    info.textContent = "";
  }

  try {
    const resposta = await api.get("/agendamentos");

    const agendamentos = Array.isArray(resposta?.data)
      ? resposta.data
      : [];

    const disponiveis = agendamentos.filter(
      (agendamento) =>
        agendamento.status !== "CANCELADO" &&
        agendamento.status !== "FINALIZADO",
    );

    if (!disponiveis.length) {
      select.innerHTML = `
        <option value="">
          Nenhum agendamento disponível
        </option>
      `;
      return;
    }

    select.innerHTML = `
      <option value="">
        Selecione um agendamento
      </option>
    `;

    disponiveis.forEach((agendamento) => {
      const inicio = new Date(agendamento.horario_inicio);

      const cliente =
        agendamento.clientes?.nome ||
        "Cliente não informado";

      const barbeiro =
        agendamento.barbeiros?.nome ||
        "Barbeiro não informado";

      const servico =
        agendamento.servicos?.nome ||
        "Serviço não informado";

      const valor =
        Number(agendamento.valor) || 0;

      const option =
        document.createElement("option");

      option.value =
        agendamento.id;

      option.dataset.valor =
        String(valor);

      option.textContent =
        `${cliente} — ${servico} — ${barbeiro} — ` +
        `${inicio.toLocaleDateString("pt-BR")} ` +
        `${inicio.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })} — ${formatarMoeda(valor)}`;

      select.appendChild(option);
    });
  } catch (erro) {
    console.error(
      "Erro ao carregar agendamentos:",
      erro,
    );

    select.innerHTML = `
      <option value="">
        Não foi possível carregar os agendamentos
      </option>
    `;

    mostrarToast(
      erro?.message ||
        "Não foi possível carregar os agendamentos.",
      "danger",
    );
  }
}

function atualizarValorAgendamento() {
  const select =
    document.getElementById(
      "agendamentoId",
    );

  const valorInput =
    document.getElementById(
      "valorPagamento",
    );

  const info =
    document.getElementById(
      "infoAgendamento",
    );

  if (!select || !valorInput) return;

  const option =
    select.options[
      select.selectedIndex
    ];

  if (!option?.value) {
    valorInput.value = "";

    if (info) {
      info.textContent = "";
    }

    return;
  }

  const valor =
    Number(option.dataset.valor);

  if (!Number.isFinite(valor)) return;

  valorInput.value =
    valor.toFixed(2);

  if (info) {
    info.textContent =
      "O valor foi preenchido automaticamente com o valor do agendamento.";
  }
}

function abrirModalPagamento() {
  const form =
    document.getElementById(
      "formPagamento",
    );

  const erro =
    document.getElementById(
      "modalErro",
    );

  const modal =
    document.getElementById(
      "modalOverlay",
    );

  const select =
    document.getElementById(
      "agendamentoId",
    );

  if (!form || !modal) return;

  form.reset();

  if (erro) {
    erro.style.display =
      "none";

    erro.textContent = "";
  }

  if (select) {
    select.innerHTML = `
      <option value="">
        Carregando agendamentos...
      </option>
    `;
  }

  carregarAgendamentosPagamento();

  modal.style.display =
    "flex";
}

function fecharModal() {
  const modal =
    document.getElementById(
      "modalOverlay",
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}

async function registrarPagamento(event) {
  event.preventDefault();

  const agendamentoId =
    document.getElementById(
      "agendamentoId",
    );

  const formaPagamento =
    document.getElementById(
      "formaPagamento",
    );

  const valorPagamento =
    document.getElementById(
      "valorPagamento",
    );

  const observacoes =
    document.getElementById(
      "observacoesPagamento",
    );

  const modalErro =
    document.getElementById(
      "modalErro",
    );

  const agendamento_id =
    agendamentoId?.value.trim();

  const forma_pagamento =
    formaPagamento?.value;

  const valorTexto =
    valorPagamento?.value;

  const observacoesTexto =
    observacoes?.value.trim();

  if (
    !agendamento_id ||
    !forma_pagamento
  ) {
    if (modalErro) {
      modalErro.textContent =
        "Informe o agendamento e a forma de pagamento.";

      modalErro.style.display =
        "block";
    }

    return;
  }

  try {
    await api.post(
      "/financeiro/pagamentos",
      {
        agendamento_id,
        forma_pagamento,
        valor:
          valorTexto === ""
            ? undefined
            : Number(valorTexto),
        observacoes:
          observacoesTexto ||
          undefined,
      },
    );

    mostrarToast(
      "Pagamento registrado com sucesso.",
      "success",
    );

    fecharModal();

    await carregarFinanceiro();
  } catch (erro) {
    if (modalErro) {
      modalErro.textContent =
        erro?.message ||
        "Não foi possível registrar o pagamento.";

      modalErro.style.display =
        "block";
    }
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    carregarFinanceiro();

    document
      .getElementById(
        "btnRegistrarPagamento",
      )
      ?.addEventListener(
        "click",
        abrirModalPagamento,
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
        "formPagamento",
      )
      ?.addEventListener(
        "submit",
        registrarPagamento,
      );

    document
      .getElementById(
        "agendamentoId",
      )
      ?.addEventListener(
        "change",
        atualizarValorAgendamento,
      );
  },
);