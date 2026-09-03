
let clienteLogado = null;

let barbeariaSelecionadaId = null;

const nomeCliente =
  document.getElementById("nomeCliente");

const nomeConta =
  document.getElementById("nomeConta");

const emailConta =
  document.getElementById("emailConta");

const btnLogout =
  document.getElementById("btnLogout");

const btnLogin =
  document.getElementById("btnLogin");

const btnMeusAgendamentos =
  document.getElementById(
    "btnMeusAgendamentos",
  );

const btnMinhaConta =
  document.getElementById("btnMinhaConta");

const btnAgendarBarbearia =
  document.getElementById(
    "btnAgendarBarbearia",
  );

const linkMeusAgendamentos =
  document.getElementById(
    "linkMeusAgendamentos",
  );

const linkMeuPerfil =
  document.getElementById(
    "linkMeuPerfil",
  );

const linkConfiguracoes =
  document.getElementById(
    "linkConfiguracoes",
  );

const linkPagamentos =
  document.getElementById(
    "linkPagamentos",
  );

const proximoAgendamento =
  document.getElementById(
    "proximoAgendamento",
  );

const nomeBarbearia =
  document.getElementById(
    "nomeBarbearia",
  );

const infoBarbearia =
  document.getElementById(
    "infoBarbearia",
  );

const barbeariasGrid =
  document.getElementById(
    "barbeariasGrid",
  );

const statusBarbearia =
  document.getElementById(
    "statusBarbearia",
  );

function mostrarNomeCliente(usuario) {
  const nome =
    usuario?.nome || "Visitante";

  if (nomeCliente) {
    nomeCliente.textContent =
      nome;
  }

  if (nomeConta) {
    nomeConta.textContent =
      nome;
  }
}

async function carregarClienteLogado() {
  try {
    const resposta = await fetch(
      "/api/auth/me",
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!resposta.ok) {
      mostrarNomeCliente(null);

      if (emailConta) {
        emailConta.textContent =
          "Faça login para acessar sua conta.";
      }

      return;
    }

    const dados =
      await resposta.json();

    if (
      !dados?.success ||
      !dados.data
    ) {
      mostrarNomeCliente(null);

      return;
    }

    const usuario =
      dados.data;

    if (
      usuario.cargo !==
      "CLIENTE"
    ) {
      mostrarNomeCliente(null);

      return;
    }

    clienteLogado =
      usuario;

    barbeariaSelecionadaId =
      usuario.barbearia_id ||
      null;

    mostrarNomeCliente(
      usuario,
    );

    if (emailConta) {
      emailConta.textContent =
        usuario.email ||
        "E-mail não informado.";
    }

    if (btnLogin) {
      btnLogin.textContent =
        "Minha conta";
    }
  } catch (erro) {
    console.error(
      "Erro ao verificar usuário:",
      erro,
    );

    mostrarNomeCliente(null);
  }
}

async function carregarProximoAgendamento() {
  if (
    !proximoAgendamento ||
    !clienteLogado
  ) {
    return;
  }

  try {
    const resposta =
      await api.get(
        "/agendamentos",
      );

    if (
      !resposta?.success ||
      !Array.isArray(
        resposta.data,
      )
    ) {
      return;
    }

    const agora =
      Date.now();

    const futuros =
      resposta.data
        .filter((agendamento) => {
          if (
            [
              "CANCELADO",
              "CONCLUIDO",
              "FALTOU",
            ].includes(
              agendamento.status,
            )
          ) {
            return false;
          }

          if (
            !agendamento.horario_inicio
          ) {
            return false;
          }

          const timestamp =
            new Date(
              agendamento.horario_inicio,
            ).getTime();

          return (
            Number.isFinite(
              timestamp,
            ) &&
            timestamp >=
              agora
          );
        })
        .sort(
          (a, b) =>
            new Date(
              a.horario_inicio,
            ).getTime() -
            new Date(
              b.horario_inicio,
            ).getTime(),
        );

    const proximo =
      futuros[0];

    if (!proximo) {
      proximoAgendamento.textContent =
        "Nenhum agendamento futuro.";

      return;
    }

    const data =
      new Date(
        proximo.horario_inicio,
      );

    if (
      Number.isNaN(
        data.getTime(),
      )
    ) {
      return;
    }

    const dataFormatada =
      data.toLocaleDateString(
        "pt-BR",
      );

    const horarioFormatado =
      data.toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );

    const servico =
      proximo.servicos?.nome ||
      "Serviço";

    const barbeiro =
      proximo.barbeiros?.nome ||
      "Barbeiro";

    proximoAgendamento.textContent =
      `${dataFormatada} às ${horarioFormatado} • ${servico} • ${barbeiro}`;
  } catch (erro) {
    console.error(
      "Erro ao carregar próximo agendamento:",
      erro,
    );
  }
}

function atualizarBarbeariaSelecionada(
  barbearia,
) {
  if (!barbearia) {
    barbeariaSelecionadaId =
      null;

    if (nomeBarbearia) {
      nomeBarbearia.textContent =
        "Nenhuma selecionada";
    }

    if (infoBarbearia) {
      infoBarbearia.textContent =
        "Selecione uma das barbearias vinculadas à sua conta.";
    }

    if (statusBarbearia) {
      statusBarbearia.textContent =
        "Nenhuma selecionada";
    }

    if (btnAgendarBarbearia) {
      btnAgendarBarbearia.disabled =
        true;
    }

    return;
  }

  barbeariaSelecionadaId =
    barbearia.id;

  if (nomeBarbearia) {
    nomeBarbearia.textContent =
      barbearia.nome;
  }

  if (infoBarbearia) {
    infoBarbearia.textContent =
      "Barbearia atualmente selecionada para esta sessão.";
  }

  if (statusBarbearia) {
    statusBarbearia.textContent =
      "Selecionada";
  }

  if (btnAgendarBarbearia) {
    btnAgendarBarbearia.disabled =
      false;
  }
}

function renderizarBarbearias(
  barbearias,
) {
  if (!barbeariasGrid) {
    return;
  }

  barbeariasGrid.innerHTML =
    "";

  if (
    !Array.isArray(
      barbearias,
    ) ||
    !barbearias.length
  ) {
    const card =
      document.createElement(
        "article",
      );

    card.className =
      "shop-card";

    card.innerHTML = `
      <div class="shop-thumb">
        <span
          class="shop-logo"
          aria-hidden="true"
        >
          💈
        </span>
      </div>

      <div class="shop-info">
        <h4>
          Nenhuma barbearia disponível
        </h4>

        <p>
          Não encontramos vínculos ativos de barbearia para sua conta.
        </p>
      </div>
    `;

    barbeariasGrid.appendChild(
      card,
    );

    atualizarBarbeariaSelecionada(
      null,
    );

    return;
  }

  const barbeariaAtual =
    barbearias.find(
      (barbearia) =>
        barbearia.id ===
          barbeariaSelecionadaId &&
        barbearia.ativo ===
          true,
    );

  atualizarBarbeariaSelecionada(
    barbeariaAtual ||
      null,
  );

  barbearias.forEach(
    (barbearia) => {
      const card =
        document.createElement(
          "article",
        );

      card.className =
        "shop-card";

      const selecionada =
        barbearia.id ===
        barbeariaSelecionadaId;

      card.innerHTML = `
        <div class="shop-thumb">
          <span
            class="shop-logo"
            aria-hidden="true"
          >
            💈
          </span>
        </div>

        <div class="shop-info">
          <h4>
            ${escapeHtml(
              barbearia.nome ||
                "Barbearia",
            )}
          </h4>

          <p>
            ${
              selecionada
                ? "Barbearia atualmente selecionada."
                : "Barbearia vinculada à sua conta."
            }
          </p>

          <button
            type="button"
            class="btn-gold shop-button btnSelecionarBarbearia"
            data-barbearia-id="${escapeHtml(
              barbearia.id,
            )}"
            ${
              selecionada
                ? "disabled"
                : ""
            }
          >
            ${
              selecionada
                ? "Selecionada"
                : "Selecionar"
            }
          </button>
        </div>
      `;

      barbeariasGrid.appendChild(
        card,
      );
    },
  );

  document
    .querySelectorAll(
      ".btnSelecionarBarbearia",
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        async () => {
          const barbeariaId =
            botao.dataset
              .barbeariaId;

          await selecionarBarbearia(
            barbeariaId,
          );
        },
      );
    });
}

function escapeHtml(valor) {
  const div =
    document.createElement(
      "div",
    );

  div.textContent =
    String(valor ?? "");

  return div.innerHTML;
}

async function carregarBarbeariaDoCliente() {
  if (!clienteLogado) {
    return;
  }

  try {
    const resposta =
      await api.get(
        "/clientes/me",
      );

    if (
      !resposta?.success ||
      !resposta.data
    ) {
      return;
    }

    const cliente =
      resposta.data;

    renderizarBarbearias(
      cliente.barbearias ||
        [],
    );
  } catch (erro) {
    console.error(
      "Erro ao carregar barbearias do cliente:",
      erro,
    );
  }
}

async function selecionarBarbearia(
  barbeariaId,
) {
  if (
    !barbeariaId ||
    !clienteLogado
  ) {
    return;
  }

  const botoes =
    document.querySelectorAll(
      ".btnSelecionarBarbearia",
    );

  botoes.forEach(
    (botao) => {
      botao.disabled =
        true;
    },
  );

  try {
    const resposta =
      await fetch(
        "/api/auth/barbearia",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            barbeariaId,
          }),
        },
      );

    const dados =
      await resposta.json();

    if (
      !resposta.ok ||
      !dados?.success
    ) {
      throw new Error(
        dados?.message ||
          "Não foi possível selecionar a barbearia.",
      );
    }

    barbeariaSelecionadaId =
      barbeariaId;

    if (clienteLogado) {
      clienteLogado.barbearia_id =
        barbeariaId;
    }

    await carregarBarbeariaDoCliente();

    await carregarProximoAgendamento();
  } catch (erro) {
    console.error(
      "Erro ao selecionar barbearia:",
      erro,
    );

    alert(
      erro.message ||
        "Não foi possível selecionar a barbearia.",
    );

    botoes.forEach(
      (botao) => {
        botao.disabled =
          botao.dataset
            .barbeariaId ===
          barbeariaSelecionadaId;
      },
    );
  }
}

function verificarLoginParaAcao() {
  if (!clienteLogado) {
    window.location.href =
      "/login";

    return false;
  }

  return true;
}

function irParaMeusAgendamentos() {
  if (
    !verificarLoginParaAcao()
  ) {
    return;
  }

  window.location.href =
    "/meus-agendamentos";
}

function irParaPerfil() {
  if (
    !verificarLoginParaAcao()
  ) {
    return;
  }

  window.location.href =
    "/meu-perfil";
}

function irParaConfiguracoes() {
  if (
    !verificarLoginParaAcao()
  ) {
    return;
  }

  window.location.href =
    "/configuracoes";
}

function irParaPagamentos() {
  if (
    !verificarLoginParaAcao()
  ) {
    return;
  }

  window.location.href =
    "/pagamentos";
}

function irParaAgendamento() {
  if (
    !verificarLoginParaAcao()
  ) {
    return;
  }

  if (
    !barbeariaSelecionadaId
  ) {
    alert(
      "Selecione uma barbearia antes de agendar um atendimento.",
    );

    return;
  }

  window.location.href =
    "/cliente-agendamento";
}

async function realizarLogout() {
  try {
    await api.post(
      "/auth/logout",
    );
  } catch (erro) {
    console.error(
      "Erro ao realizar logout:",
      erro,
    );
  } finally {
    localStorage.removeItem(
      "usuario",
    );

    window.location.href =
      "/login";
  }
}

function configurarEventos() {
  if (btnLogin) {
    btnLogin.addEventListener(
      "click",
      (evento) => {
        evento.preventDefault();

        if (clienteLogado) {
          irParaPerfil();
          return;
        }

        window.location.href =
          "/login";
      },
    );
  }

  btnLogout?.addEventListener(
    "click",
    realizarLogout,
  );

  btnMeusAgendamentos?.addEventListener(
    "click",
    irParaMeusAgendamentos,
  );

  btnMinhaConta?.addEventListener(
    "click",
    irParaPerfil,
  );

  btnAgendarBarbearia?.addEventListener(
    "click",
    irParaAgendamento,
  );

  linkMeusAgendamentos?.addEventListener(
    "click",
    (evento) => {
      evento.preventDefault();

      irParaMeusAgendamentos();
    },
  );

  linkMeuPerfil?.addEventListener(
    "click",
    (evento) => {
      evento.preventDefault();

      irParaPerfil();
    },
  );

  linkConfiguracoes?.addEventListener(
    "click",
    (evento) => {
      evento.preventDefault();

      irParaConfiguracoes();
    },
  );

  linkPagamentos?.addEventListener(
    "click",
    (evento) => {
      evento.preventDefault();

      irParaPagamentos();
    },
  );
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    configurarEventos();

    await carregarClienteLogado();

    await carregarBarbeariaDoCliente();

    await carregarProximoAgendamento();
  },
);

