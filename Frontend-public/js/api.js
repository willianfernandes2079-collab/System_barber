/**
 * js/api.js — comunicação com a API.
 */

const API_BASE = "/api";

function paginaAtual() {
  return window.location.pathname.split("/").pop() || "";
}

function paginaPortalCliente() {
  const pagina = paginaAtual();

  return (
    pagina === "cliente-agendamento.html" ||
    window.location.pathname === "/cliente-agendamento"
  );
}

async function tentarRenovarToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    return response.ok && data?.success;
  } catch {
    return false;
  }
}

async function apiRequest(
  path,
  { method = "GET", body, auth = true, retry = true } = {},
) {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Resposta sem corpo.
  }

  if (response.status === 401 && auth && retry) {
    const renovado = await tentarRenovarToken();

    if (renovado) {
      return apiRequest(path, {
        method,
        body,
        auth,
        retry: false,
      });
    }

    localStorage.removeItem("usuario");

    window.location.href = "/login";

    return null;
  }

  if (!response.ok) {
    const erro = new Error(
      data?.message || "Erro ao comunicar com o servidor.",
    );

    erro.status = response.status;

    erro.data = data;

    throw erro;
  }

  return data;
}

const api = {
  get: (path) =>
    apiRequest(path, {
      method: "GET",
    }),

  post: (path, body) =>
    apiRequest(path, {
      method: "POST",
      body,
    }),

  put: (path, body) =>
    apiRequest(path, {
      method: "PUT",
      body,
    }),

  patch: (path, body) =>
    apiRequest(path, {
      method: "PATCH",
      body,
    }),

  delete: (path) =>
    apiRequest(path, {
      method: "DELETE",
    }),
};

async function protegerAcessoInterno() {
  if (paginaPortalCliente()) {
    return;
  }

  const caminhoAtual = window.location.pathname;

  if (!caminhoAtual.includes("/html/")) {
    return;
  }

  try {
    const resposta = await apiRequest("/auth/me", {
      method: "GET",
      auth: true,
      retry: true,
    });

    const usuario = resposta?.data;

    if (!usuario) {
      return;
    }

    localStorage.setItem("usuario", JSON.stringify(usuario));

    if (usuario.cargo === "CLIENTE") {
      window.location.href = "/cliente-agendamento";
    }
  } catch (erro) {
    console.error("Erro ao verificar acesso:", erro);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  protegerAcessoInterno();
});