let usuarioPerfil = null;

const formPerfil =
  document.getElementById(
    "formPerfil",
  );

const campoNome =
  document.getElementById(
    "nome",
  );

const campoEmail =
  document.getElementById(
    "email",
  );

const campoTelefone =
  document.getElementById(
    "telefone",
  );

const campoCargo =
  document.getElementById(
    "cargo",
  );

const campoBarbearia =
  document.getElementById(
    "barbearia",
  );

const botaoSalvar =
  document.getElementById(
    "btnSalvarPerfil",
  );

const mensagemPerfil =
  document.getElementById(
    "mensagemPerfil",
  );

function mostrarMensagem(
  mensagem,
  tipo = "",
) {
  portalMostrarMensagem(
    mensagemPerfil,
    mensagem,
    tipo,
  );
}

function preencherPerfil(
  usuario,
) {
  usuarioPerfil =
    usuario || null;

  if (!usuario) {
    return;
  }

  if (campoNome) {
    campoNome.value =
      usuario.nome || "";
  }

  if (campoEmail) {
    campoEmail.value =
      usuario.email || "";
  }

  if (campoTelefone) {
    campoTelefone.value =
      usuario.telefone || "";
  }

  if (campoCargo) {
    campoCargo.value =
      usuario.cargo || "";
  }

  if (campoBarbearia) {
    campoBarbearia.value =
      usuario.barbearia_id
        ? "Barbearia selecionada"
        : "Nenhuma selecionada";
  }
}

async function carregarPerfil() {
  mostrarMensagem(
    "Carregando seus dados...",
  );

  try {
    const resposta =
      await fetch(
        "/api/auth/me",
        {
          method: "GET",
          credentials:
            "include",
        },
      );

    let dados = null;

    try {
      dados =
        await resposta.json();
    } catch {
      dados = null;
    }

    if (
      !resposta.ok ||
      !dados?.success ||
      !dados?.data
    ) {
      throw new Error(
        dados?.message ||
          "Não foi possível carregar seu perfil.",
      );
    }

    if (
      dados.data.cargo !==
      "CLIENTE"
    ) {
      throw new Error(
        "Esta página é exclusiva para clientes.",
      );
    }

    preencherPerfil(
      dados.data,
    );

    localStorage.setItem(
      "usuario",
      JSON.stringify(
        dados.data,
      ),
    );

    mostrarMensagem(
      "",
    );
  } catch (erro) {
    console.error(
      "Erro ao carregar perfil:",
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível carregar seu perfil.",
      "error",
    );
  }
}

function obterDadosFormulario() {
  return {
    nome:
      campoNome?.value?.trim() ||
      "",
    telefone:
      campoTelefone?.value?.trim() ||
      "",
  };
}

async function salvarPerfil(
  evento,
) {
  evento.preventDefault();

  const dados =
    obterDadosFormulario();

  if (!dados.nome) {
    mostrarMensagem(
      "Informe seu nome.",
      "error",
    );

    campoNome?.focus();

    return;
  }

  if (
    dados.nome.length >
    120
  ) {
    mostrarMensagem(
      "O nome deve ter no máximo 120 caracteres.",
      "error",
    );

    campoNome?.focus();

    return;
  }

  if (
    dados.telefone.length >
    30
  ) {
    mostrarMensagem(
      "O telefone deve ter no máximo 30 caracteres.",
      "error",
    );

    campoTelefone?.focus();

    return;
  }

  if (botaoSalvar) {
    botaoSalvar.disabled =
      true;

    botaoSalvar.textContent =
      "Salvando...";
  }

  mostrarMensagem(
    "",
  );

  try {
    const resposta =
      await fetch(
        "/api/auth/me",
        {
          method: "PATCH",
          credentials:
            "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            dados,
          ),
        },
      );

    let resultado = null;

    try {
      resultado =
        await resposta.json();
    } catch {
      resultado = null;
    }

    if (
      !resposta.ok ||
      !resultado?.success ||
      !resultado?.data
    ) {
      throw new Error(
        resultado?.message ||
          "Não foi possível atualizar seu perfil.",
      );
    }

    usuarioPerfil =
      resultado.data;

    preencherPerfil(
      resultado.data,
    );

    localStorage.setItem(
      "usuario",
      JSON.stringify(
        resultado.data,
      ),
    );

    mostrarMensagem(
      "Perfil atualizado com sucesso.",
      "success",
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar perfil:",
      erro,
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível atualizar seu perfil.",
      "error",
    );
  } finally {
    if (botaoSalvar) {
      botaoSalvar.disabled =
        false;

      botaoSalvar.textContent =
        "Salvar alterações";
    }
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    formPerfil?.addEventListener(
      "submit",
      salvarPerfil,
    );

    carregarPerfil();
  },
);

