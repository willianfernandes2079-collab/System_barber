const RELATORIOS = {
  faturamento: {
    titulo: "Faturamento",
    endpoint: "/relatorios/faturamento",
  },
  clientes: {
    titulo: "Clientes",
    endpoint: "/relatorios/clientes",
  },
  servicos: {
    titulo: "Serviços mais vendidos",
    endpoint: "/relatorios/servicos",
  },
  barbeiros: {
    titulo: "Faturamento por barbeiro",
    endpoint: "/relatorios/barbeiros",
  },
  comissoes: {
    titulo: "Comissões",
    endpoint: "/relatorios/comissoes",
  },
  pagamentos: {
    titulo: "Formas de pagamento",
    endpoint: "/relatorios/formas-pagamento",
  },
  cancelamentos: {
    titulo: "Cancelamentos e faltas",
    endpoint: "/relatorios/cancelamentos",
  },
  inativos: {
    titulo: "Clientes para retorno",
    endpoint: "/relatorios/clientes-retorno",
  },
};

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarValor(valor) {
  if (typeof formatarMoeda === "function") {
    return formatarMoeda(Number(valor) || 0);
  }

  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataRelatorio(data) {
  if (!data) return "—";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return dataObj.toLocaleDateString("pt-BR");
}

function obterPeriodo() {
  const select = document.getElementById("periodoSelect");

  if (!select) {
    return { periodo: "30dias" };
  }

  if (select.value !== "personalizado") {
    return {
      periodo: select.value,
    };
  }

  const dataInicio = document.getElementById("dataInicioRelatorio")?.value;
  const dataFim = document.getElementById("dataFimRelatorio")?.value;

  if (!dataInicio || !dataFim) {
    throw new Error("Informe a data inicial e a data final.");
  }

  return {
    data_inicio: dataInicio,
    data_fim: dataFim,
  };
}

function criarAreaResultado() {
  let area = document.getElementById("relatorioResultado");

  if (area) {
    return area;
  }

  area = document.createElement("section");
  area.id = "relatorioResultado";
  area.className = "card";
  area.style.display = "none";
  area.style.marginTop = "24px";

  area.innerHTML = `
    <div class="page-header">
      <h3 id="relatorioTitulo"></h3>

      <button
        type="button"
        id="btnFecharRelatorio"
        class="btn btn-outline"
      >
        Fechar
      </button>
    </div>

    <div id="relatorioConteudo"></div>
  `;

  const main = document.querySelector(".app-main");

  if (main) {
    main.appendChild(area);
  }

  document
    .getElementById("btnFecharRelatorio")
    ?.addEventListener("click", fecharRelatorio);

  return area;
}

function mostrarResultado(titulo, conteudo) {
  const area = criarAreaResultado();
  const tituloElemento = document.getElementById("relatorioTitulo");
  const conteudoElemento = document.getElementById("relatorioConteudo");

  if (!area || !tituloElemento || !conteudoElemento) {
    throw new Error("Área de resultado dos relatórios não encontrada.");
  }

  tituloElemento.textContent = titulo;
  conteudoElemento.innerHTML = conteudo;
  area.style.display = "block";

  area.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function fecharRelatorio() {
  const area = document.getElementById("relatorioResultado");

  if (area) {
    area.style.display = "none";
  }
}

function renderizarFaturamento(data) {
  const porDia = Array.isArray(data?.por_dia) ? data.por_dia : [];

  return `
    <div class="stat-grid">
      <div class="card stat-card">
        <span class="stat-label">Faturamento total</span>
        <strong class="stat-value">
          ${formatarValor(data?.faturamento_total)}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Atendimentos</span>
        <strong class="stat-value">
          ${data?.total_atendimentos ?? 0}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Ticket médio</span>
        <strong class="stat-value">
          ${formatarValor(data?.ticket_medio)}
        </strong>
      </div>
    </div>

    <h4 class="section-title">Faturamento por dia</h4>

    ${
      porDia.length
        ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${porDia
                  .map(
                    (item) => `
                      <tr>
                        <td>${formatarDataRelatorio(item.data)}</td>
                        <td>${formatarValor(item.valor)}</td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
        : `
          <div class="empty-state">
            Nenhum faturamento encontrado neste período.
          </div>
        `
    }
  `;
}

function renderizarClientes(data) {
  return `
    <div class="stat-grid">
      <div class="card stat-card">
        <span class="stat-label">Clientes ativos</span>
        <strong class="stat-value">
          ${data?.total_ativos ?? 0}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Clientes inativos</span>
        <strong class="stat-value">
          ${data?.total_inativos ?? 0}
        </strong>
      </div>
    </div>
  `;
}

function renderizarServicos(data) {
  const itens = Array.isArray(data) ? data : [];

  if (!itens.length) {
    return `
      <div class="empty-state">
        Nenhum serviço encontrado neste período.
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Quantidade</th>
            <th>Receita</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
                <tr>
                  <td>${escaparHtml(item.servico?.nome || "—")}</td>
                  <td>${item.quantidade ?? 0}</td>
                  <td>${formatarValor(item.receita)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarBarbeiros(data) {
  const itens = Array.isArray(data) ? data : [];

  if (!itens.length) {
    return `
      <div class="empty-state">
        Nenhum barbeiro encontrado neste período.
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Barbeiro</th>
            <th>Atendimentos</th>
            <th>Faturamento</th>
            <th>Comissão</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
                <tr>
                  <td>${escaparHtml(item.barbeiro?.nome || "—")}</td>
                  <td>${item.quantidade_atendimentos ?? 0}</td>
                  <td>${formatarValor(item.faturamento)}</td>
                  <td>${formatarValor(item.comissao)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarCancelamentos(data) {
  return `
    <div class="stat-grid">
      <div class="card stat-card">
        <span class="stat-label">Agendamentos</span>
        <strong class="stat-value">
          ${data?.total_agendamentos ?? 0}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Cancelados</span>
        <strong class="stat-value">
          ${data?.cancelados ?? 0}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Faltas</span>
        <strong class="stat-value">
          ${data?.faltas ?? 0}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Taxa de cancelamento</span>
        <strong class="stat-value">
          ${data?.taxa_cancelamento ?? 0}%
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Taxa de falta</span>
        <strong class="stat-value">
          ${data?.taxa_falta ?? 0}%
        </strong>
      </div>
    </div>
  `;
}

function renderizarRetorno(data) {
  const itens = Array.isArray(data) ? data : [];

  if (!itens.length) {
    return `
      <div class="empty-state">
        Nenhum cliente está pendente de retorno.
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Último atendimento</th>
            <th>Dias</th>
            <th>Serviço</th>
            <th>Barbeiro</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
                <tr>
                  <td>${escaparHtml(item.cliente?.nome || "—")}</td>
                  <td>${escaparHtml(item.cliente?.telefone || "—")}</td>
                  <td>${formatarDataRelatorio(item.ultimo_atendimento)}</td>
                  <td>${item.dias_desde_ultimo_atendimento ?? 0}</td>
                  <td>${escaparHtml(item.servico || "—")}</td>
                  <td>${escaparHtml(item.barbeiro || "—")}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarComissoes(data) {
  const itens = Array.isArray(data) ? data : [];

  if (!itens.length) {
    return `
      <div class="empty-state">
        Nenhuma comissão encontrada neste período.
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Barbeiro</th>
            <th>Valor do serviço</th>
            <th>Percentual</th>
            <th>Comissão</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
                <tr>
                  <td>${escaparHtml(item.barbeiro?.nome || "—")}</td>
                  <td>${formatarValor(item.valor_servico)}</td>
                  <td>${item.percentual ?? 0}%</td>
                  <td>${formatarValor(item.valor_comissao)}</td>
                  <td>${escaparHtml(item.status || "—")}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarFormasPagamento(data) {
  const formas = Array.isArray(data?.por_forma_pagamento)
    ? data.por_forma_pagamento
    : [];

  const labels = {
    DINHEIRO: "Dinheiro",
    PIX: "Pix",
    DEBITO: "Cartão de débito",
    CREDITO: "Cartão de crédito",
    OUTROS: "Outros",
  };

  if (!formas.length) {
    return `
      <div class="empty-state">
        Nenhum pagamento encontrado neste período.
      </div>
    `;
  }

  return `
    <div class="stat-grid">
      <div class="card stat-card">
        <span class="stat-label">Faturamento</span>
        <strong class="stat-value">
          ${formatarValor(data?.faturamento)}
        </strong>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Ticket médio</span>
        <strong class="stat-value">
          ${formatarValor(data?.ticket_medio)}
        </strong>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Forma de pagamento</th>
            <th>Valor</th>
            <th>Percentual</th>
          </tr>
        </thead>
        <tbody>
          ${formas
            .map(
              (item) => `
                <tr>
                  <td>
                    ${escaparHtml(
                      labels[item.forma_pagamento] ||
                        item.forma_pagamento ||
                        "—",
                    )}
                  </td>
                  <td>${formatarValor(item.valor)}</td>
                  <td>${item.percentual ?? 0}%</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarRelatorio(tipo, data) {
  switch (tipo) {
    case "faturamento":
      return renderizarFaturamento(data);

    case "clientes":
      return renderizarClientes(data);

    case "servicos":
      return renderizarServicos(data);

    case "barbeiros":
      return renderizarBarbeiros(data);

    case "cancelamentos":
      return renderizarCancelamentos(data);

    case "inativos":
      return renderizarRetorno(data);

    case "comissoes":
      return renderizarComissoes(data);

    case "pagamentos":
      return renderizarFormasPagamento(data);

    default:
      return `
        <div class="empty-state">
          Nenhum dado encontrado.
        </div>
      `;
  }
}

async function abrirRelatorio(tipo) {
  const relatorio = RELATORIOS[tipo];

  if (!relatorio) {
    mostrarToast("Relatório não encontrado.", "danger");
    return;
  }

  try {
    const periodo = obterPeriodo();
    const parametros = new URLSearchParams(periodo);

    const resposta = await api.get(
      `${relatorio.endpoint}?${parametros.toString()}`,
    );

    const dados = resposta?.data;

    mostrarResultado(
      relatorio.titulo,
      renderizarRelatorio(tipo, dados),
    );
  } catch (erro) {
    console.error(`Erro ao carregar relatório "${tipo}":`, erro);

    mostrarToast(
      erro?.message || "Não foi possível carregar o relatório.",
      "danger",
    );

    mostrarToast(
  erro?.message || "Não foi possível carregar o relatório.",
  "danger",
);
  }
}

function configurarPeriodoPersonalizado() {
  const select = document.getElementById("periodoSelect");

  if (!select) return;

  select.addEventListener("change", () => {
    let area = document.getElementById("periodoPersonalizado");

    if (select.value !== "personalizado") {
      area?.remove();
      return;
    }

    if (area) return;

    area = document.createElement("div");
    area.id = "periodoPersonalizado";
    area.className = "toolbar";

    area.innerHTML = `
      <label>
        Data inicial
        <input type="date" id="dataInicioRelatorio">
      </label>

      <label>
        Data final
        <input type="date" id="dataFimRelatorio">
      </label>
    `;

    select.parentElement?.appendChild(area);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-relatorio]").forEach((card) => {
    card.addEventListener("click", () => {
      abrirRelatorio(card.dataset.relatorio);
    });
  });

  configurarPeriodoPersonalizado();

  const banner = document.querySelector(".banner-em-construcao");

  if (banner) {
    banner.textContent =
      "Selecione um relatório para consultar os dados do sistema.";
  }
});