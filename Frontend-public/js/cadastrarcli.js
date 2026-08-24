const form =
  document.getElementById(
    "formCadastrarCliente",
  );

const btnVoltar =
  document.getElementById(
    "btnVoltar",
  );

const formErro =
  document.getElementById(
    "formErro",
  );

const btnCadastrar =
  document.getElementById(
    "btnCadastrar",
  );

const dataNascimentoInput =
  document.getElementById(
    "dataNascimento",
  );

const cpfInput =
  document.getElementById(
    "cpf",
  );

function obterDataHoje() {
  const hoje = new Date();

  const ano =
    hoje.getFullYear();

  const mes = String(
    hoje.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate(),
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

dataNascimentoInput.max =
  obterDataHoje();

cpfInput.addEventListener(
  "input",
  () => {
    cpfInput.value =
      cpfInput.value
        .replace(/\D/g, "")
        .slice(0, 11);
  },
);

function mostrarErro(
  mensagem,
) {
  formErro.textContent =
    mensagem;

  formErro.style.display =
    "block";
}

function validarDataNascimento(
  valor,
) {
  if (!valor) {
    return "A data de nascimento é obrigatória.";
  }

  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor,
    )
  ) {
    return "Informe uma data de nascimento válida.";
  }

  const [ano, mes, dia] =
    valor.split("-").map(Number);

  if (
    ano < 1900 ||
    ano > new Date().getFullYear()
  ) {
    return "Informe um ano de nascimento válido.";
  }

  const data =
    new Date(
      ano,
      mes - 1,
      dia,
    );

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return "Informe uma data de nascimento válida.";
  }

  const hoje =
    new Date();

  hoje.setHours(
    23,
    59,
    59,
    999,
  );

  if (data > hoje) {
    return "A data de nascimento não pode ser futura.";
  }

  return null;
}

function validarCpf(cpf) {
  if (!cpf) {
    return "O CPF é obrigatório.";
  }

  if (!/^\d{11}$/.test(cpf)) {
    return "O CPF deve conter exatamente 11 números.";
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return "Informe um CPF válido.";
  }

  let soma = 0;

  for (
    let i = 0;
    i < 9;
    i++
  ) {
    soma +=
      Number(cpf[i]) *
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
    Number(cpf[9])
  ) {
    return "Informe um CPF válido.";
  }

  soma = 0;

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    soma +=
      Number(cpf[i]) *
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
    Number(cpf[10])
  ) {
    return "Informe um CPF válido.";
  }

  return null;
}

btnVoltar.addEventListener(
  "click",
  () => {
    window.location.href =
      "cliente.html";
  },
);

form.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    formErro.style.display =
      "none";

    const nome =
      document
        .getElementById("nome")
        .value.trim();

    const telefone =
      document
        .getElementById("telefone")
        .value.trim();

    const whatsapp =
      document
        .getElementById("whatsapp")
        .value.trim();

    const email =
      document
        .getElementById("email")
        .value.trim();

    const dataNascimento =
      dataNascimentoInput.value;

    const cpf =
      cpfInput.value.trim();

    const observacoes =
      document
        .getElementById(
          "observacoes",
        )
        .value.trim();

    const erroData =
      validarDataNascimento(
        dataNascimento,
      );

    if (erroData) {
      mostrarErro(erroData);
      return;
    }

    const erroCpf =
      validarCpf(cpf);

    if (erroCpf) {
      mostrarErro(erroCpf);
      return;
    }

    btnCadastrar.disabled =
      true;

    btnCadastrar.textContent =
      "Cadastrando...";

    const dados = {
      nome,
      telefone,
      whatsapp:
        whatsapp || undefined,
      email:
        email || undefined,
      data_nascimento:
        dataNascimento,
      cpf,
      observacoes:
        observacoes ||
        undefined,
    };

    try {
      await api.post(
        "/clientes",
        dados,
      );

      mostrarToast(
        "Cliente cadastrado com sucesso.",
        "success",
      );

      form.reset();

      dataNascimentoInput.max =
        obterDataHoje();

      setTimeout(
        () => {
          window.location.href =
            "cliente.html";
        },
        800,
      );
    } catch (erro) {
      console.error(
        "Erro ao cadastrar cliente:",
        erro,
      );

      formErro.textContent =
        erro?.data?.message ||
        erro?.message ||
        "Não foi possível cadastrar o cliente.";

      formErro.style.display =
        "block";

      btnCadastrar.disabled =
        false;

      btnCadastrar.textContent =
        "Cadastrar cliente";
    }
  },
);