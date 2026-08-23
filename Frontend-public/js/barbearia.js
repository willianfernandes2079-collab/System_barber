let paginaAtualLista = 1;
let modoEdicao = false;

async function carregarBarbeiros() {
  const tbody = document.getElementById("tabelaBarbeiros");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Carregando...</td></tr>`;

  const busca = document.getElementById("buscaInput")?.value.trim() || "";
  const ativo = document.getElementById("filtroAtivo")?.value || "";

  const params = new URLSearchParams({
    pagina: paginaAtualLista,
    limite: 10
  });

  if (busca) params.set("busca", busca);
  if (ativo) params.set("ativo", ativo);

  try {
    const resposta = await api.get(`/barbeiros?${params}`);
    renderizarTabela(Array.isArray(resposta?.data) ? resposta.data : []);
    renderizarPaginacao(resposta?.paginacao);
  } catch (erro) {
    console.error(erro);
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Não foi possível carregar os barbeiros.</td></tr>`;
    mostrarToast?.(erro?.message || "Erro ao carregar barbeiros.", "danger");
  }
}

function renderizarTabela(barbeiros) {
  const tbody = document.getElementById("tabelaBarbeiros");
  if (!tbody) return;

  if (!barbeiros.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum barbeiro encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = barbeiros.map(b => `
    <tr>
      <td>${escaparHtml(b.nome)}</td>
      <td>${escaparHtml(b.telefone || "—")}</td>
      <td>${escaparHtml(b.especialidade || "—")}</td>
      <td>${b.percentual_comissao ?? "—"}%</td>
      <td><span class="badge ${b.ativo ? "badge-success" : "badge-danger"}">${b.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="flex gap-8">
        <button type="button" class="btn btn-outline" data-editar="${b.id}">Editar</button>
        ${b.ativo ? `<button type="button" class="btn btn-danger" data-desativar="${b.id}">Desativar</button>` : ""}
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-editar]").forEach(btn =>
    btn.addEventListener("click", () => abrirModalEdicao(btn.dataset.editar, barbeiros))
  );

  tbody.querySelectorAll("[data-desativar]").forEach(btn =>
    btn.addEventListener("click", () => desativarBarbeiro(btn.dataset.desativar))
  );
}

function renderizarPaginacao(paginacao) {
  const container = document.getElementById("paginacao");
  if (!container || !paginacao || paginacao.total_paginas <= 1) {
    if (container) container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button type="button" class="btn btn-ghost" id="btnPagAnterior" ${paginacao.pagina <= 1 ? "disabled" : ""}>← Anterior</button>
    <span>Página ${paginacao.pagina} de ${paginacao.total_paginas} (${paginacao.total} barbeiros)</span>
    <button type="button" class="btn btn-ghost" id="btnPagProxima" ${paginacao.pagina >= paginacao.total_paginas ? "disabled" : ""}>Próxima →</button>
  `;

  document.getElementById("btnPagAnterior")?.addEventListener("click", () => {
    paginaAtualLista = Math.max(1, paginaAtualLista - 1);
    carregarBarbeiros();
  });

  document.getElementById("btnPagProxima")?.addEventListener("click", () => {
    paginaAtualLista = Math.min(paginacao.total_paginas, paginaAtualLista + 1);
    carregarBarbeiros();
  });
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function abrirModalCriacao() {
  modoEdicao = false;

  document.getElementById("modalTitulo").textContent = "Novo barbeiro";
  document.getElementById("formBarbeiro").reset();
  document.getElementById("barbeiroId").value = "";
  document.getElementById("percentualComissao").value = "40";
  document.getElementById("campoEmail").style.display = "";
  document.getElementById("campoSenha").style.display = "";
  document.getElementById("campoAtivo").style.display = "none";
  document.getElementById("email").required = true;
  document.getElementById("senha").required = true;
  document.getElementById("modalErro").style.display = "none";
  document.getElementById("modalOverlay").style.display = "flex";
}

function abrirModalEdicao(id, barbeiros) {
  const barbeiro = barbeiros.find(b => String(b.id) === String(id));
  if (!barbeiro) return;

  modoEdicao = true;

  document.getElementById("modalTitulo").textContent = `Editar ${barbeiro.nome}`;
  document.getElementById("barbeiroId").value = barbeiro.id;
  document.getElementById("nome").value = barbeiro.nome || "";
  document.getElementById("telefone").value = barbeiro.telefone || "";
  document.getElementById("especialidade").value = barbeiro.especialidade || "";
  document.getElementById("percentualComissao").value = barbeiro.percentual_comissao ?? 40;
  document.getElementById("ativo").checked = Boolean(barbeiro.ativo);
  document.getElementById("campoEmail").style.display = "none";
  document.getElementById("campoSenha").style.display = "none";
  document.getElementById("campoAtivo").style.display = "";
  document.getElementById("email").required = false;
  document.getElementById("senha").required = false;
  document.getElementById("modalErro").style.display = "none";
  document.getElementById("modalOverlay").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
}

function mostrarErroModal(mensagem) {
  const el = document.getElementById("modalErro");
  el.textContent = mensagem || "Ocorreu um erro.";
  el.style.display = "block";
}

async function salvarBarbeiro(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const especialidade = document.getElementById("especialidade").value.trim();
  const percentual_comissao = Number(document.getElementById("percentualComissao").value);

  if (!nome) {
    mostrarErroModal("Informe o nome do barbeiro.");
    return;
  }

  try {
    if (modoEdicao) {
      const id = document.getElementById("barbeiroId").value;
      const ativo = document.getElementById("ativo").checked;

      await api.put(`/barbeiros/${id}`, {
        nome,
        telefone,
        especialidade,
        percentual_comissao,
        ativo
      });

      mostrarToast?.("Barbeiro atualizado com sucesso.", "success");
    } else {
      const email = document.getElementById("email").value.trim();
      const senha = document.getElementById("senha").value;

      const usuarioResp = await api.post("/auth/register", {
        nome,
        email,
        senha,
        telefone,
        cargo: "BARBEIRO"
      });

      if (!usuarioResp?.data?.id) {
        throw new Error("O servidor não retornou o ID do usuário criado.");
      }

      await api.post("/barbeiros", {
        usuario_id: usuarioResp.data.id,
        nome,
        telefone,
        especialidade,
        percentual_comissao
      });

      mostrarToast?.("Barbeiro cadastrado com sucesso.", "success");
    }

    fecharModal();
    await carregarBarbeiros();
  } catch (erro) {
    console.error(erro);
    mostrarErroModal(erro?.data?.errors?.join(" ") || erro?.message || "Não foi possível salvar o barbeiro.");
  }
}

async function desativarBarbeiro(id) {
  if (!confirm("Desativar este barbeiro? Ele deixará de aparecer na agenda para novos horários.")) return;

  try {
    await api.delete(`/barbeiros/${id}`);
    mostrarToast?.("Barbeiro desativado.", "success");
    await carregarBarbeiros();
  } catch (erro) {
    console.error(erro);
    mostrarToast?.(erro?.message || "Não foi possível desativar o barbeiro.", "danger");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnNovoBarbeiro")?.addEventListener("click", abrirModalCriacao);
  document.getElementById("btnCancelarModal")?.addEventListener("click", fecharModal);
  document.getElementById("formBarbeiro")?.addEventListener("submit", salvarBarbeiro);

  document.getElementById("filtroAtivo")?.addEventListener("change", () => {
    paginaAtualLista = 1;
    carregarBarbeiros();
  });

  document.getElementById("buscaInput")?.addEventListener(
    "input",
    debounce(() => {
      paginaAtualLista = 1;
      carregarBarbeiros();
    })
  );

  carregarBarbeiros();
});