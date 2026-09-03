const CHAVE_NOTIFICACOES =
  "cliente_notificacoes_agendamento";

const CHAVE_CONFIRMACOES =
  "cliente_mostrar_confirmacoes";

function carregarPreferencias() {
  const notificacoes =
    document.getElementById(
      "notificacoesAgendamento",
    );

  const confirmacoes =
    document.getElementById(
      "mostrarConfirmacoes",
    );

  if (notificacoes) {
    notificacoes.checked =
      localStorage.getItem(
        CHAVE_NOTIFICACOES,
      ) !== "false";
  }

  if (confirmacoes) {
    confirmacoes.checked =
      localStorage.getItem(
        CHAVE_CONFIRMACOES,
      ) !== "false";
  }
}

function salvarPreferencias() {
  const notificacoes =
    document.getElementById(
      "notificacoesAgendamento",
    );

  const confirmacoes =
    document.getElementById(
      "mostrarConfirmacoes",
    );

  if (notificacoes) {
    localStorage.setItem(
      CHAVE_NOTIFICACOES,
      String(
        notificacoes.checked,
      ),
    );
  }

  if (confirmacoes) {
    localStorage.setItem(
      CHAVE_CONFIRMACOES,
      String(
        confirmacoes.checked,
      ),
    );

    portalMostrarMensagem(
      document.getElementById(
        "mensagemConfiguracao",
      ),
      "Preferências salvas neste navegador.",
      "success",
    );
  }
}

async function encerrarTodasSessoes() {
  const mensagem =
    document.getElementById(
      "mensagemConfiguracao",
    );

  if (
    !confirm(
      "Deseja realmente encerrar todas as sessões da sua conta?",
    )
  ) {
    return;
  }

  try {
    await api.post(
      "/auth/logout-all",
    );

    localStorage.removeItem(
      "usuario",
    );

    window.location.href =
      "/login";
  } catch (erro) {
    portalMostrarMensagem(
      mensagem,
      erro?.message ||
        "Não foi possível encerrar as sessões.",
      "error",
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    carregarPreferencias();

    document
      .getElementById(
        "notificacoesAgendamento",
      )
      ?.addEventListener(
        "change",
        salvarPreferencias,
      );

    document
      .getElementById(
        "mostrarConfirmacoes",
      )
      ?.addEventListener(
        "change",
        salvarPreferencias,
      );

    document
      .getElementById(
        "btnEncerrarSessoes",
      )
      ?.addEventListener(
        "click",
        encerrarTodasSessoes,
      );
  },
);