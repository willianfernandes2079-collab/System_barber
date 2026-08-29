const NAV_ITEMS = [
  { href: "index.html", label: "Dashboard", },
  { href: "agendamentos.html", label: "Agendamentos", },
  { href: "caixa.html", label: "Caixa", },
  { href: "cliente.html", label: "Clientes", },
  { href: "barbearia.html", label: "Barbearia", },
  { href: "servicos.html", label: "Serviços", },
  { href: "financeiros.html", label: "Financeiro", },
  { href: "relatorios.html", label: "Relatórios", },
  {
    href: "bloqueios.html",
    label: "Bloqueios",
    cargos: ["ADMIN", "GERENTE"],
  },
  { href: "configuracao.html", label: "Configurações",},
];

function paginaAtual() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function montarSidebar(cargoUsuario = null) {
  const atual = paginaAtual();

  const links = NAV_ITEMS.filter((item) => {
    if (!item.cargos) {
      return true;
    }

    return item.cargos.includes(cargoUsuario);
  })
    .map(
      (item) => `
      <a
        class="sidebar-link${item.href === atual ? " active" : ""}"
        href="${item.href}"
      >
        <span aria-hidden="true">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `,
    )
    .join("");

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

    const sidebarRoot = document.getElementById("app-sidebar");

    if (sidebarRoot) {
      sidebarRoot.innerHTML = montarSidebar(usuario.cargo);

      const btnLogout = document.getElementById("btnLogoutSidebar");

      if (btnLogout) {
        btnLogout.addEventListener("click", fazerLogout);
      }
    }
  } catch {
    // Se a sessão estiver inválida,
    // o api.js tenta renovar ou redireciona para o login.
  }
}

async function fazerLogout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Mesmo se a chamada falhar,
    // segue para o login.
  }

  localStorage.removeItem("usuario");

  window.location.href = "/login";
}

function inicializarLayout(tituloPagina) {
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
