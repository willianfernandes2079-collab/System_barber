let modoEdicao = false;

async function carregarServicos() {
  const tbody = document.getElementById("tabelaServicos");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Carregando...</td></tr>`;

  try {
    const resposta = await api.get("/servicos");
    renderizarTabela(Array.isArray(resposta?.data) ? resposta.data : []);
  } catch (erro) {
    console.error("Erro ao carregar serviços:", erro);
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Não foi possível carregar os serviços.</td></tr>`;
    mostrarToast?.(erro?.message || "Erro ao carregar serviços.", "danger");
  }
}

function renderizarTabela(servicos) {
  const tbody = document.getElementById("tabelaServicos");
  if (!tbody) return;

  if (!servicos.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum serviço cadastrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = servicos.map((s) => `
    <tr>
      <td>${escaparHtml(s.nome)}</td>
      <td>${s.duracao} min</td>
      <td>${formatarMoeda(s.preco)}</td>
      <td>${
        s.percentual_comissao !== null && s.percentual_comissao !== undefined
          ? `${s.percentual_comissao}%`
          : "Padrão da barbearia"
      }</td>
      <td><span class="badge badge-success">Ativo</span></td>
      <td class="flex gap-8">
        <button type="button" class="btn btn-outline" data-editar="${s.id}">Editar</button>
        <button type="button" class="btn btn-danger" data-desativar="${s.id}">Desativar</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-editar]").forEach((btn) => {
    btn.addEventListener("click", () =>
      abrirModalEdicao(btn.dataset.editar, servicos)
    );
  });

  tbody.querySelectorAll("[data-desativar]").forEach((btn) => {
    btn.addEventListener("click", () =>
      desativarServico(btn.dataset.desativar)
    );
  });
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function abrirModalCriacao() {
  modoEdicao = false;

  document.getElementById("modalTitulo").textContent = "Novo serviço";
  document.getElementById("formServico").reset();
  document.getElementById("servicoId").value = "";
  document.getElementById("duracao").value = "30";
  document.getElementById("campoAtivo").style.display = "none";
  document.getElementById("modalErro").style.display = "none";
  document.getElementById("modalOverlay").style.display = "flex";
}

function abrirModalEdicao(id, servicos) {
  const servico = servicos.find((s) => String(s.id) === String(id));
  if (!servico) return;

  modoEdicao = true;

  document.getElementById("modalTitulo").textContent = `Editar ${servico.nome}`;
  document.getElementById("servicoId").value = servico.id;
  document.getElementById("nome").value = servico.nome || "";
  document.getElementById("descricao").value = servico.descricao || "";
  document.getElementById("duracao").value = servico.duracao ?? 30;
  document.getElementById("preco").value = servico.preco ?? "";
  document.getElementById("percentualComissao").value =
    servico.percentual_comissao ?? "";
  document.getElementById("ativo").checked = Boolean(servico.ativo);
  document.getElementById("campoAtivo").style.display = "";
  document.getElementById("modalErro").style.display = "none";
  document.getElementById("modalOverlay").style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modalOverlay");
  if (modal) modal.style.display = "none";
}

function mostrarErroModal(mensagem) {
  const el = document.getElementById("modalErro");
  if (!el) return;

  el.textContent = mensagem || "Ocorreu um erro.";
  el.style.display = "block";
}

async function salvarServico(event) {
  event.preventDefault();

  const percentual = document.getElementById("percentualComissao").value;

  const dados = {
    nome: document.getElementById("nome").value.trim(),
    descricao: document.getElementById("descricao").value.trim() || undefined,
    duracao: Number(document.getElementById("duracao").value),
    preco: Number(document.getElementById("preco").value),
    percentual_comissao:
      percentual === "" ? undefined : Number(percentual),
  };

  if (!dados.nome) {
    mostrarErroModal("Informe o nome do serviço.");
    return;
  }

  if (!Number.isFinite(dados.duracao) || dados.duracao <= 0) {
    mostrarErroModal("Informe uma duração válida.");
    return;
  }

  if (!Number.isFinite(dados.preco) || dados.preco < 0) {
    mostrarErroModal("Informe um preço válido.");
    return;
  }

  try {
    if (modoEdicao) {
      const id = document.getElementById("servicoId").value;
      dados.ativo = document.getElementById("ativo").checked;

      await api.patch(`/servicos/${id}`, dados);
      mostrarToast?.("Serviço atualizado com sucesso.", "success");
    } else {
      await api.post("/servicos", dados);
      mostrarToast?.("Serviço criado com sucesso.", "success");
    }

    fecharModal();
    await carregarServicos();
  } catch (erro) {
    console.error("Erro ao salvar serviço:", erro);
    mostrarErroModal(
      erro?.data?.message ||
      erro?.message ||
      "Não foi possível salvar o serviço."
    );
  }
}

async function desativarServico(id) {
  if (
    !confirm(
      "Desativar este serviço? Ele deixará de aparecer nos agendamentos."
    )
  ) return;

  try {
    await api.delete(`/servicos/${id}`);
    mostrarToast?.("Serviço desativado.", "success");
    await carregarServicos();
  } catch (erro) {
    console.error("Erro ao desativar serviço:", erro);
    mostrarToast?.(
      erro?.message || "Não foi possível desativar o serviço.",
      "danger"
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarServicos();

  document
    .getElementById("btnNovoServico")
    ?.addEventListener("click", abrirModalCriacao);

  document
    .getElementById("btnCancelarModal")
    ?.addEventListener("click", fecharModal);

  document
    .getElementById("formServico")
    ?.addEventListener("submit", salvarServico);
});