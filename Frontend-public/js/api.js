/**
 * js/api.js — comunicação com a API.
 */

const API_BASE = "/api";

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function paginaAtual() {
  return window.location.pathname.split("/").pop() || "";
}

function paginaPortalCliente() {
  return paginaAtual() === "cliente-agendamento.html";
}

async function tentarRenovarToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);

      return true;
    }
  } catch {
    // Falha de conexão ou refresh expirado.
  }

  return false;
}

async function apiRequest(
  path,
  { method = "GET", body, auth = true, retry = true } = {},
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
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

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
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
  const token = getAccessToken();

  if (!token) {
    if (!paginaPortalCliente()) {
      return;
    }

    return;
  }

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
      window.location.href = "/html/cliente-agendamento.html";
    }
  } catch (erro) {
    console.error("Erro ao verificar acesso:", erro);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  protegerAcessoInterno();
});
