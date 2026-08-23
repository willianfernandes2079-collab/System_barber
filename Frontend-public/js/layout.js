/**
 * js/layout.js — sidebar e topbar compartilhados por toda página interna.
 *
 * Uso no HTML:
 * <div id="app-sidebar"></div>
 * <header id="app-topbar"></header>
 *
 * Scripts:
 * <script src="../js/api.js"></script>
 * <script src="../js/layout.js"></script>
 *
 * Inicialização:
 * <script>
 *   inicializarLayout("Título da página");
 * </script>
 */

const NAV_ITEMS = [
  { href: "index.html", label: "Dashboard", icon: "🏠" },
  { href: "agendamentos.html", label: "Agendamentos", icon: "📅" },
  { href: "cliente.html", label: "Clientes", icon: "👥" },
  { href: "barbearia.html", label: "Barbearia", icon: "💈" },
  { href: "servicos.html", label: "Serviços", icon: "✂️" },
  { href: "financeiros.html", label: "Financeiro", icon: "💰" },
  { href: "relatorios.html", label: "Relatórios", icon: "📊" },
  { href: "configuracao.html", label: "Configurações", icon: "⚙️" },
];

function paginaAtual() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function montarSidebar() {
  const atual = paginaAtual();

  const links = NAV_ITEMS.map(
    (item) => `
      <a
        class="sidebar-link${item.href === atual ? " active" : ""}"
        href="${item.href}"
      >
        <span aria-hidden="true">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `,
  ).join("");

  return `
    <div class="app-sidebar-header">
      <span class="app-sidebar-logo">💈</span>
      <span class="app-sidebar-title">Sistema Barbearia</span>
    </div>

    <nav class="app-sidebar-nav">
      ${links}
    </nav>

    <button
      type="button"
      class="btn btn-ghost app-sidebar-logout"
      id="btnLogoutSidebar"
    >
      <span aria-hidden="true">🚪</span>
      Sair
    </button>
  `;
}

function montarTopbar(titulo) {
  return `
    <button
      type="button"
      class="app-menu-toggle"
      id="btnMenuToggle"
      aria-label="Abrir menu"
    >
      ☰
    </button>

    <h1 class="app-topbar-title">${titulo}</h1>

    <div class="app-topbar-user">
      <span
        class="app-topbar-user-name"
        id="topbarUserNome"
      >
        …
      </span>

      <span
        class="badge badge-info"
        id="topbarUserCargo"
      ></span>
    </div>
  `;
}

async function carregarUsuarioLogado() {
  try {
    const resposta = await api.get("/auth/me");
    const usuario = resposta.data;

    const nomeEl = document.getElementById("topbarUserNome");
    const cargoEl = document.getElementById("topbarUserCargo");

    if (nomeEl) {
      nomeEl.textContent = usuario.nome;
    }

    if (cargoEl) {
      cargoEl.textContent = usuario.cargo;
    }
  } catch {
    // Se o token estiver inválido,
    // o api.js já tenta renovar ou redireciona para o login.
  }
}

async function fazerLogout() {
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    await api.post("/auth/logout", { refreshToken });
  } catch {
    // Mesmo se a chamada falhar,
    // limpa os tokens localmente e sai.
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  window.location.href = "/login";
}

function inicializarLayout(tituloPagina) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    window.location.href = "/login";
    return;
  }

  const sidebarRoot = document.getElementById("app-sidebar");
  const topbarRoot = document.getElementById("app-topbar");

  if (sidebarRoot) {
    sidebarRoot.innerHTML = montarSidebar();
  }

  if (topbarRoot) {
    topbarRoot.innerHTML = montarTopbar(tituloPagina);
  }

  const btnLogout = document.getElementById("btnLogoutSidebar");

  if (btnLogout) {
    btnLogout.addEventListener("click", fazerLogout);
  }

  const btnMenu = document.getElementById("btnMenuToggle");

  if (btnMenu && sidebarRoot) {
    btnMenu.addEventListener("click", () => {
      sidebarRoot.classList.toggle("open");
    });
  }

  carregarUsuarioLogado();
}
