function portalEscaparHtml(valor) {
  const div =
    document.createElement(
      "div",
    );

  div.textContent =
    String(valor ?? "");

  return div.innerHTML;
}

function portalMostrarMensagem(
  elemento,
  mensagem,
  tipo = "",
) {
  if (!elemento) {
    return;
  }

  elemento.textContent =
    mensagem || "";

  elemento.className =
    `message${
      tipo
        ? ` ${tipo}`
        : ""
    }`;
}

function portalFormatarData(
  valor,
) {
  if (!valor) {
    return "Não informado";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "Não informado";
  }

  return data.toLocaleDateString(
    "pt-BR",
  );
}

function portalFormatarHorario(
  valor,
) {
  if (!valor) {
    return "Não informado";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "Não informado";
  }

  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function portalFormatarMoeda(
  valor,
) {
  const numero =
    Number(valor) || 0;

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function portalStatusClasse(
  status,
) {
  switch (status) {
    case "AGENDADO":
      return "badge-warning";

    case "CONCLUIDO":
      return "badge-success";

    case "CANCELADO":
      return "badge-danger";

    case "FALTOU":
      return "badge-muted";

    default:
      return "badge-muted";
  }
}

function portalStatusTexto(
  status,
) {
  switch (status) {
    case "AGENDADO":
      return "Agendado";

    case "CONCLUIDO":
      return "Concluído";

    case "CANCELADO":
      return "Cancelado";

    case "FALTOU":
      return "Faltou";

    default:
      return (
        status ||
        "Desconhecido"
      );
  }
}

async function portalLogout() {
  try {
    await api.post(
      "/auth/logout",
    );
  } catch {
    // O logout local continua mesmo se a API falhar.
  }

  localStorage.removeItem(
    "usuario",
  );

  window.location.href =
    "/login";
}

async function portalCarregarUsuario() {
  const resposta =
    await api.get(
      "/auth/me",
    );

  const usuario =
    resposta?.data;

  if (!usuario) {
    throw new Error(
      "Usuário não autenticado.",
    );
  }

  localStorage.setItem(
    "usuario",
    JSON.stringify(
      usuario,
    ),
  );

  return usuario;
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document
      .getElementById(
        "btnLogout",
      )
      ?.addEventListener(
        "click",
        portalLogout,
      );
  },
);

