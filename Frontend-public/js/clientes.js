/**
 * js/clientes.js — CRUD de clientes. Clicar no nome leva para
 * cliente.html?id=... (perfil/histórico individual).
 */

let paginaAtualLista = 1;
let modoEdicao = false;

async function carregarClientes() {
  const tbody = document.getElementById("tabelaClientes");
  tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Carregando...</td></tr>`;

  const busca = document.getElementById("buscaInput").value.trim();
  const ativo = document.getElementById("filtroAtivo").value;

  const params = new URLSearchParams({ pagina: paginaAtualLista, limite: 10 });
  if (busca) params.set("busca", busca);
  if (ativo) params.set("ativo", ativo);

  try {
    const resposta = await api.get(`/clientes?${params.toString()}`);
    renderizarTabela(resposta.data);
    renderizarPaginacao(resposta.paginacao);
  } catch (erro) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Não foi possível carregar os clientes.</td></tr>`;
    mostrarToast(erro.message, "danger");
  }
}

function renderizarTabela(clientes) {
  const tbody = document.getElementById("tabelaClientes");

  if (!clientes.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = clientes
    .map(
      (c) => `
      <tr>
        <td><a href="cliente.html?id=${c.id}">${escaparHtml(c.nome)}</a></td>
        <td>${escaparHtml(c.telefone || "—")}</td>
        <td>${escaparHtml(c.email || "—")}</td>
        <td><span class="badge ${c.ativo ? "badge-success" : "badge-danger"}">${c.ativo ? "Ativo" : "Inativo"}</span></td>
        <td class="flex gap-8">
          <button type="button" class="btn btn-outline" data-editar="${c.id}">Editar</button>
          ${
            c.ativo
              ? `<button type="button" class="btn btn-danger" data-desativar="${c.id}">Desativar</button>`
              : `<button type="button" class="btn btn-primary" data-ativar="${c.id}">Ativar</button>`
          }
        </td>
      </tr>`,
    )
    .join("");

  tbody
    .querySelectorAll("[data-editar]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        abrirModalEdicao(btn.dataset.editar, clientes),
      ),
    );

  tbody
    .querySelectorAll("[data-desativar]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        desativarCliente(btn.dataset.desativar),
      ),
    );

  tbody
    .querySelectorAll("[data-ativar]")
    .forEach((btn) =>
      btn.addEventListener("click", () => ativarCliente(btn.dataset.ativar)),
    );
}

function renderizarPaginacao(paginacao) {
  const container = document.getElementById("paginacao");
  if (!paginacao || paginacao.total_paginas <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button type="button" class="btn btn-ghost" ${paginacao.pagina <= 1 ? "disabled" : ""} id="btnPagAnterior">← Anterior</button>
    <span>Página ${paginacao.pagina} de ${paginacao.total_paginas} (${paginacao.total} clientes)</span>
    <button type="button" class="btn btn-ghost" ${paginacao.pagina >= paginacao.total_paginas ? "disabled" : ""} id="btnPagProxima">Próxima →</button>
  `;

  document.getElementById("btnPagAnterior")?.addEventListener("click", () => {
    paginaAtualLista = Math.max(1, paginaAtualLista - 1);
    carregarClientes();
  });

  document.getElementById("btnPagProxima")?.addEventListener("click", () => {
    paginaAtualLista += 1;
    carregarClientes();
  });
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function abrirModalCriacao() {
  modoEdicao = false;
  document.getElementById("modalTitulo").textContent = "Novo cliente";
  document.getElementById("formCliente").reset();
  document.getElementById("clienteId").value = "";
  document.getElementById("modalErro").style.display = "none";
  document.getElementById("modalOverlay").style.display = "flex";
}

function abrirModalEdicao(id, clientes) {
  const cliente = clientes.find((c) => c.id === id);
  if (!cliente) return;

  modoEdicao = true;
  document.getElementById("modalTitulo").textContent = `Editar ${cliente.nome}`;
  document.getElementById("clienteId").value = cliente.id;
  document.getElementById("nome").value = cliente.nome;
  document.getElementById("telefone").value = cliente.telefone || "";
  document.getElementById("whatsapp").value = cliente.whatsapp || "";
  document.getElementById("email").value = cliente.email || "";
  document.getElementById("dataNascimento").value = cliente.data_nascimento
    ? cliente.data_nascimento.slice(0, 10)
    : "";
  document.getElementById("cpf").value = cliente.cpf || "";
  document.getElementById("observacoes").value = cliente.observacoes || "";
  document.getElementById("modalErro").style.display = "none";
  document.getElementById("modalOverlay").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
}

function mostrarErroModal(mensagem) {
  const el = document.getElementById("modalErro");
  el.textContent = mensagem;
  el.style.display = "block";
}

async function salvarCliente(event) {
  event.preventDefault();

  const dados = {
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim() || undefined,
    email: document.getElementById("email").value.trim() || undefined,
    data_nascimento:
      document.getElementById("dataNascimento").value || undefined,
    cpf: document.getElementById("cpf").value.trim() || undefined,
    observacoes:
      document.getElementById("observacoes").value.trim() || undefined,
  };

  try {
    if (modoEdicao) {
      const id = document.getElementById("clienteId").value;
      await api.patch(`/clientes/${id}`, dados);
      mostrarToast("Cliente atualizado com sucesso.", "success");
    } else {
      await api.post("/clientes", dados);
      mostrarToast("Cliente cadastrado com sucesso.", "success");
    }

    fecharModal();
    carregarClientes();
  } catch (erro) {
    mostrarErroModal(erro.message);
  }
}

async function desativarCliente(id) {
  if (!confirm("Desativar este cliente?")) return;

  try {
    await api.delete(`/clientes/${id}`);
    mostrarToast("Cliente desativado.", "success");
    carregarClientes();
  } catch (erro) {
    mostrarToast(erro.message, "danger");
  }
}

async function ativarCliente(id) {
  if (!confirm("Ativar este cliente?")) return;

  try {
    await api.patch(`/clientes/${id}/ativar`);
    mostrarToast("Cliente ativado.", "success");
    carregarClientes();
  } catch (erro) {
    mostrarToast(erro.message, "danger");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();

  document.getElementById("btnNovoCliente").addEventListener("click", () => {
    window.location.href = "cadastrarcli.html";
  });

  document
    .getElementById("btnCancelarModal")
    .addEventListener("click", fecharModal);
  document
    .getElementById("formCliente")
    .addEventListener("submit", salvarCliente);

  document.getElementById("filtroAtivo").addEventListener("change", () => {
    paginaAtualLista = 1;
    carregarClientes();
  });

  document.getElementById("buscaInput").addEventListener(
    "input",
    debounce(() => {
      paginaAtualLista = 1;
      carregarClientes();
    }),
  );
});
