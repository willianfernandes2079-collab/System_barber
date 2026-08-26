let paginaAtualLista = 1;
let modoEdicao = false;

function debounce(funcao, atraso = 300) {
  let temporizador;

  return (...args) => {
    clearTimeout(temporizador);

    temporizador = setTimeout(
      () => funcao(...args),
      atraso,
    );
  };
}


async function carregarBarbeiros() {
  const tbody = document.getElementById("tabelaBarbeiros");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Carregando...</td></tr>`;

  const busca =
    document.getElementById("buscaInput")?.value.trim() || "";

  const ativo =
    document.getElementById("filtroAtivo")?.value || "";

  const params = new URLSearchParams({
    pagina: paginaAtualLista,
    limite: 10,
  });

  if (busca) params.set("busca", busca);
  if (ativo) params.set("ativo", ativo);

  try {
    const resposta = await api.get(`/barbeiros?${params}`);
renderizarTabela(
      Array.isArray(resposta?.data)
        ? resposta.data
        : [],
    );

    renderizarPaginacao(
      resposta?.paginacao,
    );
  } catch (erro) {
    console.error(erro);

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          NÃ£o foi possÃ­vel carregar os barbeiros.
        </td>
      </tr>
    `;

    mostrarToast?.(
      erro?.message ||
        "Erro ao carregar barbeiros.",
      "danger",
    );
  }
}

function renderizarTabela(barbeiros) {
  const tbody =
    document.getElementById(
      "tabelaBarbeiros",
    );

  if (!tbody) return;

  if (!barbeiros.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhum barbeiro encontrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    barbeiros
      .map(
        (b) => `
          <tr>
            <td>${escaparHtml(b.nome)}</td>
            <td>${escaparHtml(b.telefone || "â€”")}</td>
            <td>${escaparHtml(b.especialidade || "â€”")}</td>
            <td>${b.percentual_comissao ?? "â€”"}%</td>

            <td>
              <span
                class="badge ${
                  b.ativo
                    ? "badge-success"
                    : "badge-danger"
                }"
              >
                ${
                  b.ativo
                    ? "Ativo"
                    : "Inativo"
                }
              </span>
            </td>

            <td class="flex gap-8">
              <button
                type="button"
                class="btn btn-outline"
                data-editar="${b.id}"
              >
                Editar
              </button>

              ${
                b.ativo
                  ? `
                    <button
                      type="button"
                      class="btn btn-danger"
                      data-desativar="${b.id}"
                    >
                      Desativar
                    </button>
                  `
                  : `
                    <button
                      type="button"
                      class="btn btn-primary"
                      data-ativar="${b.id}"
                    >
                      Ativar
                    </button>
                  `
              }
            </td>
          </tr>
        `,
      )
      .join("");

  tbody
    .querySelectorAll("[data-editar]")
    .forEach((btn) =>
      btn.addEventListener(
        "click",
        () =>
          abrirModalEdicao(
            btn.dataset.editar,
            barbeiros,
          ),
      ),
    );

  tbody
    .querySelectorAll("[data-desativar]")
    .forEach((btn) =>
      btn.addEventListener(
        "click",
        () =>
          desativarBarbeiro(
            btn.dataset.desativar,
          ),
      ),
    );

  tbody
    .querySelectorAll("[data-ativar]")
    .forEach((btn) =>
      btn.addEventListener(
        "click",
        () =>
          ativarBarbeiro(
            btn.dataset.ativar,
          ),
      ),
    );
}

function renderizarPaginacao(
  paginacao,
) {
  const container =
    document.getElementById(
      "paginacao",
    );

  if (
    !container ||
    !paginacao ||
    paginacao.total_paginas <= 1
  ) {
    if (container)
      container.innerHTML = "";

    return;
  }

  container.innerHTML = `
    <button
      type="button"
      class="btn btn-ghost"
      id="btnPagAnterior"
      ${
        paginacao.pagina <= 1
          ? "disabled"
          : ""
      }
    >
      â† Anterior
    </button>

    <span>
      PÃ¡gina ${paginacao.pagina} de ${paginacao.total_paginas}
      (${paginacao.total} barbeiros)
    </span>

    <button
      type="button"
      class="btn btn-ghost"
      id="btnPagProxima"
      ${
        paginacao.pagina >=
        paginacao.total_paginas
          ? "disabled"
          : ""
      }
    >
      PrÃ³xima â†’
    </button>
  `;

  document
    .getElementById("btnPagAnterior")
    ?.addEventListener(
      "click",
      () => {
        paginaAtualLista =
          Math.max(
            1,
            paginaAtualLista - 1,
          );

        carregarBarbeiros();
      },
    );

  document
    .getElementById("btnPagProxima")
    ?.addEventListener(
      "click",
      () => {
        paginaAtualLista =
          Math.min(
            paginacao.total_paginas,
            paginaAtualLista + 1,
          );

        carregarBarbeiros();
      },
    );
}

function escaparHtml(texto) {
  const div =
    document.createElement(
      "div",
    );

  div.textContent =
    texto ?? "";

  return div.innerHTML;
}

function obterDataHoje() {
  const hoje =
    new Date();

  const ano =
    hoje.getFullYear();

  const mes =
    String(
      hoje.getMonth() + 1,
    ).padStart(2, "0");

  const dia =
    String(
      hoje.getDate(),
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function abrirModalCriacao() {
  modoEdicao = false;

  document.getElementById(
    "modalTitulo",
  ).textContent =
    "Novo barbeiro";

  document.getElementById(
    "formBarbeiro",
  ).reset();

  document.getElementById(
    "barbeiroId",
  ).value = "";

  document.getElementById(
    "percentualComissao",
  ).value = "40";

  document.getElementById(
    "campoEmail",
  ).style.display = "";

  document.getElementById(
    "campoSenha",
  ).style.display = "";

  document.getElementById(
    "campoAtivo",
  ).style.display = "none";

  document.getElementById(
    "email",
  ).required = true;

  document.getElementById(
    "senha",
  ).required = true;

  document.getElementById(
    "cpf",
  ).required = true;

  document.getElementById(
    "dataNascimento",
  ).required = true;

  document.getElementById(
    "pixTipo",
  ).required = true;

  document.getElementById(
    "pixChave",
  ).required = true;

  document.getElementById(
    "dataNascimento",
  ).max =
    obterDataHoje();

  document.getElementById(
    "modalErro",
  ).style.display = "none";

  document.getElementById(
    "modalOverlay",
  ).style.display = "flex";
}

function abrirModalEdicao(
  id,
  barbeiros,
) {
  const barbeiro =
    barbeiros.find(
      (b) =>
        String(b.id) ===
        String(id),
    );

  if (!barbeiro) return;

  modoEdicao = true;

  document.getElementById(
    "modalTitulo",
  ).textContent =
    `Editar ${barbeiro.nome}`;

  document.getElementById(
    "barbeiroId",
  ).value =
    barbeiro.id;

  document.getElementById(
    "nome",
  ).value =
    barbeiro.nome || "";

  document.getElementById(
    "cpf",
  ).value =
    barbeiro.cpf || "";

  document.getElementById(
    "dataNascimento",
  ).value =
    barbeiro.data_nascimento
      ? barbeiro.data_nascimento.slice(
          0,
          10,
        )
      : "";

  document.getElementById(
    "telefone",
  ).value =
    barbeiro.telefone || "";

  document.getElementById(
    "whatsapp",
  ).value =
    barbeiro.whatsapp || "";

  document.getElementById(
    "especialidade",
  ).value =
    barbeiro.especialidade || "";

  document.getElementById(
    "percentualComissao",
  ).value =
    barbeiro.percentual_comissao ??
    40;

  document.getElementById(
    "pixTipo",
  ).value =
    barbeiro.pix_tipo || "";

  document.getElementById(
    "pixChave",
  ).value =
    barbeiro.pix_chave || "";

  document.getElementById(
    "ativo",
  ).checked =
    Boolean(
      barbeiro.ativo,
    );

  document.getElementById(
    "campoEmail",
  ).style.display = "none";

  document.getElementById(
    "campoSenha",
  ).style.display = "none";

  document.getElementById(
    "campoAtivo",
  ).style.display = "";

  document.getElementById(
    "email",
  ).required = false;

  document.getElementById(
    "senha",
  ).required = false;

  document.getElementById(
    "cpf",
  ).required =
    !barbeiro.cpf;

  document.getElementById(
    "dataNascimento",
  ).required =
    !barbeiro.data_nascimento;

  document.getElementById(
    "pixTipo",
  ).required =
    !barbeiro.pix_tipo;

  document.getElementById(
    "pixChave",
  ).required =
    !barbeiro.pix_chave;

  document.getElementById(
    "dataNascimento",
  ).max =
    obterDataHoje();

  document.getElementById(
    "modalErro",
  ).style.display = "none";

  document.getElementById(
    "modalOverlay",
  ).style.display = "flex";
}

function fecharModal() {
  document.getElementById(
    "modalOverlay",
  ).style.display = "none";
}

function mostrarErroModal(
  mensagem,
) {
  const el =
    document.getElementById(
      "modalErro",
    );

  el.textContent =
    mensagem ||
    "Ocorreu um erro.";

  el.style.display =
    "block";
}

function validarCpf(cpf) {
  const valor =
    cpf.replace(/\D/g, "");

  if (
    !/^\d{11}$/.test(
      valor,
    )
  ) {
    return "O CPF deve conter exatamente 11 nÃºmeros.";
  }

  if (
    /^(\d)\1{10}$/.test(
      valor,
    )
  ) {
    return "Informe um CPF vÃ¡lido.";
  }

  let soma = 0;

  for (
    let i = 0;
    i < 9;
    i++
  ) {
    soma +=
      Number(valor[i]) *
      (10 - i);
  }

  let resto =
    soma % 11;

  const digito1 =
    resto < 2
      ? 0
      : 11 - resto;

  if (
    digito1 !==
    Number(valor[9])
  ) {
    return "Informe um CPF vÃ¡lido.";
  }

  soma = 0;

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    soma +=
      Number(valor[i]) *
      (11 - i);
  }

  resto =
    soma % 11;

  const digito2 =
    resto < 2
      ? 0
      : 11 - resto;

  if (
    digito2 !==
    Number(valor[10])
  ) {
    return "Informe um CPF vÃ¡lido.";
  }

  return null;
}

function validarDataNascimento(
  data,
) {
  if (!data) {
    return "A data de nascimento Ã© obrigatÃ³ria.";
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      data,
    )
  ) {
    return "Informe uma data de nascimento vÃ¡lida.";
  }

  const [
    ano,
    mes,
    dia,
  ] =
    data
      .split("-")
      .map(Number);

  if (
    ano < 1900 ||
    ano >
      new Date().getFullYear()
  ) {
    return "Informe um ano de nascimento vÃ¡lido.";
  }

  const dataObj =
    new Date(
      ano,
      mes - 1,
      dia,
    );

  if (
    dataObj.getFullYear() !==
      ano ||
    dataObj.getMonth() !==
      mes - 1 ||
    dataObj.getDate() !==
      dia
  ) {
    return "Informe uma data de nascimento vÃ¡lida.";
  }

  if (
    dataObj > new Date()
  ) {
    return "A data de nascimento nÃ£o pode ser futura.";
  }

  return null;
}

function validarPix(
  tipo,
  chave,
) {
  if (
    !tipo ||
    !chave.trim()
  ) {
    return "Informe o tipo e a chave PIX.";
  }

  const valor =
    chave.trim();

  if (
    tipo === "CPF"
  ) {
    if (
      !/^\d{11}$/.test(
        valor.replace(
          /\D/g,
          "",
        ),
      )
    ) {
      return "A chave PIX CPF deve conter 11 nÃºmeros.";
    }
  }

  if (
    tipo === "TELEFONE"
  ) {
    const telefone =
      valor.replace(
        /\D/g,
        "",
      );

    if (
      telefone.length <
        10 ||
      telefone.length >
        13
    ) {
      return "A chave PIX telefone Ã© invÃ¡lida.";
    }
  }

  if (
    tipo === "EMAIL"
  ) {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        valor,
      )
    ) {
      return "A chave PIX de e-mail Ã© invÃ¡lida.";
    }
  }

  if (
    tipo === "ALEATORIA"
  ) {
    if (
      valor.length <
        8 ||
      valor.length >
        100
    ) {
      return "A chave PIX aleatÃ³ria Ã© invÃ¡lida.";
    }
  }

  return null;
}

async function salvarBarbeiro(
  event,
) {
  event.preventDefault();

  const nome =
    document
      .getElementById(
        "nome",
      )
      .value.trim();

  const cpfInput =
    document.getElementById(
      "cpf",
    );

  const cpf =
    cpfInput.value
      .replace(
        /\D/g,
        "",
      );

  const dataNascimento =
    document.getElementById(
      "dataNascimento",
    ).value;

  const telefone =
    document
      .getElementById(
        "telefone",
      )
      .value.trim();

  const whatsapp =
    document
      .getElementById(
        "whatsapp",
      )
      .value.trim();

  const especialidade =
    document
      .getElementById(
        "especialidade",
      )
      .value.trim();

  const pixTipo =
    document.getElementById(
      "pixTipo",
    ).value;

  const pixChave =
    document.getElementById(
      "pixChave",
    ).value.trim();

  const percentual_comissao =
    Number(
      document.getElementById(
        "percentualComissao",
      ).value,
    );

  if (!nome) {
    mostrarErroModal(
      "Informe o nome do barbeiro.",
    );

    return;
  }

  const erroCpf =
    validarCpf(cpf);

  if (
    erroCpf &&
    !modoEdicao
  ) {
    mostrarErroModal(
      erroCpf,
    );

    return;
  }

  if (
    cpf &&
    modoEdicao
  ) {
    const erroCpfEdicao =
      validarCpf(cpf);

    if (erroCpfEdicao) {
      mostrarErroModal(
        erroCpfEdicao,
      );

      return;
    }
  }

  const erroData =
    validarDataNascimento(
      dataNascimento,
    );

  if (
    erroData &&
    (!modoEdicao ||
      dataNascimento)
  ) {
    mostrarErroModal(
      erroData,
    );

    return;
  }

  const erroPix =
    validarPix(
      pixTipo,
      pixChave,
    );

  if (
    erroPix &&
    (!modoEdicao ||
      pixTipo ||
      pixChave)
  ) {
    mostrarErroModal(
      erroPix,
    );

    return;
  }

  if (
    !Number.isFinite(
      percentual_comissao,
    ) ||
    percentual_comissao < 0 ||
    percentual_comissao > 100
  ) {
    mostrarErroModal(
      "Informe uma comissÃ£o vÃ¡lida entre 0 e 100%.",
    );

    return;
  }

  try {
    if (modoEdicao) {
      const id =
        document.getElementById(
          "barbeiroId",
        ).value;

      const ativo =
        document.getElementById(
          "ativo",
        ).checked;

      await api.put(
        `/barbeiros/${id}`,
        {
          nome,
          cpf:
            cpf ||
            undefined,
          data_nascimento:
            dataNascimento ||
            undefined,
          telefone,
          whatsapp,
          especialidade,
          pix_tipo:
            pixTipo ||
            undefined,
          pix_chave:
            pixChave ||
            undefined,
          percentual_comissao,
          ativo,
        },
      );

      mostrarToast?.(
        "Barbeiro atualizado com sucesso.",
        "success",
      );
    } else {
      const email =
        document
          .getElementById(
            "email",
          )
          .value.trim();

      const senha =
        document.getElementById(
          "senha",
        ).value;

      const usuarioResp =
        await api.post(
          "/auth/register",
          {
            nome,
            email,
            senha,
            telefone,
            cargo: "BARBEIRO",
          },
        );

      if (
        !usuarioResp?.data?.id
      ) {
        throw new Error(
          "O servidor nÃ£o retornou o ID do usuÃ¡rio criado.",
        );
      }

      await api.post(
        "/barbeiros",
        {
          usuario_id:
            usuarioResp.data.id,
          nome,
          cpf,
          data_nascimento:
            dataNascimento,
          telefone,
          whatsapp,
          especialidade,
          pix_tipo: pixTipo,
          pix_chave: pixChave,
          percentual_comissao,
        },
      );

      mostrarToast?.(
        "Barbeiro cadastrado com sucesso.",
        "success",
      );
    }

    fecharModal();

    await carregarBarbeiros();
  } catch (erro) {
    console.error(erro);

    mostrarErroModal(
      erro?.data?.errors?.join(
        " ",
      ) ||
        erro?.message ||
        "Não foi possivel salvar o barbeiro.",
    );
  }
}

async function desativarBarbeiro(
  id,
) {
  if (
    !confirm(
      "Desativar este barbeiro? Ele deixará de aparecer na agenda para novos horarios.",
    )
  ) {
    return;
  }

  try {
    await api.delete(
      `/barbeiros/${id}`,
    );

    mostrarToast?.(
      "Barbeiro desativado.",
      "success",
    );

    await carregarBarbeiros();
  } catch (erro) {
    console.error(erro);

    mostrarToast?.(
      erro?.message ||
        "Não foi possivel desativar o barbeiro.",
      "danger",
    );
  }
}

async function ativarBarbeiro(
  id,
) {
  if (
    !confirm(
      "Ativar este barbeiro?",
    )
  ) {
    return;
  }

  try {
    await api.patch(
      `/barbeiros/${id}/ativar`,
    );

    mostrarToast?.(
      "Barbeiro ativado.",
      "success",
    );

    await carregarBarbeiros();
  } catch (erro) {
    console.error(erro);

    mostrarToast?.(
      erro?.message ||
        "Não foi possivel ativar o barbeiro.",
      "danger",
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document
      .getElementById(
        "btnNovoBarbeiro",
      )
      ?.addEventListener(
        "click",
        abrirModalCriacao,
      );

    document
      .getElementById(
        "btnCancelarModal",
      )
      ?.addEventListener(
        "click",
        fecharModal,
      );

    document
      .getElementById(
        "formBarbeiro",
      )
      ?.addEventListener(
        "submit",
        salvarBarbeiro,
      );

    document
      .getElementById(
        "cpf",
      )
      ?.addEventListener(
        "input",
        (event) => {
          event.target.value =
            event.target.value
              .replace(
                /\D/g,
                "",
              )
              .slice(
                0,
                11,
              );
        },
      );

    document
      .getElementById(
        "dataNascimento",
      )
      ?.setAttribute(
        "max",
        obterDataHoje(),
      );

    document
      .getElementById(
        "pixTipo",
      )
      ?.addEventListener(
        "change",
        () => {
          const tipo =
            document.getElementById(
              "pixTipo",
            ).value;

          const campo =
            document.getElementById(
              "pixChave",
            );

          if (
            tipo === "CPF"
          ) {
            campo.placeholder =
              "Digite o CPF da chave PIX";
          } else if (
            tipo === "TELEFONE"
          ) {
            campo.placeholder =
              "Digite o telefone da chave PIX";
          } else if (
            tipo === "EMAIL"
          ) {
            campo.placeholder =
              "Digite o e-mail da chave PIX";
          } else if (
            tipo === "ALEATORIA"
          ) {
            campo.placeholder =
              "Digite a chave aleatoria";
          } else {
            campo.placeholder =
              "Digite a chave PIX";
          }
        },
      );

    document
      .getElementById(
        "buscaInput",
      )
      ?.addEventListener(
        "input",
        debounce(
          () => {
            paginaAtualLista = 1;
            carregarBarbeiros();
          },
        ),
      );

    document
      .getElementById(
        "filtroAtivo",
      )
      ?.addEventListener(
        "change",
        () => {
          paginaAtualLista = 1;
          carregarBarbeiros();
        },
      );

    carregarBarbeiros();
  },
);















