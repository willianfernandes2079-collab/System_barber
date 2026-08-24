const barbeiroService = require("../services/barbeiroService");
const asyncHandler = require("../utils/asyncHandler");

function validarDataNascimento(data) {
  if (!data) {
    return "A data de nascimento é obrigatória.";
  }

  if (
    typeof data !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return "Informe uma data de nascimento válida.";
  }

  const [ano, mes, dia] =
    data.split("-").map(Number);

  if (
    ano < 1900 ||
    ano > new Date().getFullYear()
  ) {
    return "Informe um ano de nascimento válido.";
  }

  const dataObj = new Date(
    ano,
    mes - 1,
    dia,
  );

  if (
    dataObj.getFullYear() !== ano ||
    dataObj.getMonth() !== mes - 1 ||
    dataObj.getDate() !== dia
  ) {
    return "Informe uma data de nascimento válida.";
  }

  if (dataObj > new Date()) {
    return "A data de nascimento não pode ser futura.";
  }

  return null;
}

function validarCpf(cpf) {
  if (!cpf) {
    return "O CPF é obrigatório.";
  }

  const cpfNumerico =
    String(cpf).replace(/\D/g, "");

  if (cpfNumerico.length !== 11) {
    return "O CPF deve conter exatamente 11 números.";
  }

  if (/^(\d)\1{10}$/.test(cpfNumerico)) {
    return "Informe um CPF válido.";
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma +=
      Number(cpfNumerico[i]) *
      (10 - i);
  }

  let resto = soma % 11;

  const digito1 =
    resto < 2 ? 0 : 11 - resto;

  if (
    digito1 !==
    Number(cpfNumerico[9])
  ) {
    return "Informe um CPF válido.";
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma +=
      Number(cpfNumerico[i]) *
      (11 - i);
  }

  resto = soma % 11;

  const digito2 =
    resto < 2 ? 0 : 11 - resto;

  if (
    digito2 !==
    Number(cpfNumerico[10])
  ) {
    return "Informe um CPF válido.";
  }

  return null;
}

function validarPix(tipo, chave) {
  if (!tipo || !chave) {
    return "O tipo e a chave PIX são obrigatórios.";
  }

  const chaveNormalizada =
    chave.trim();

  if (tipo === "CPF") {
    if (!/^\d{11}$/.test(
      chaveNormalizada.replace(/\D/g, ""),
    )) {
      return "A chave PIX CPF deve conter 11 números.";
    }
  }

  if (tipo === "TELEFONE") {
    const telefone =
      chaveNormalizada.replace(/\D/g, "");

    if (
      telefone.length < 10 ||
      telefone.length > 13
    ) {
      return "A chave PIX telefone é inválida.";
    }
  }

  if (tipo === "EMAIL") {
    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        chaveNormalizada,
      );

    if (!emailValido) {
      return "A chave PIX de e-mail é inválida.";
    }
  }

  if (tipo === "ALEATORIA") {
    if (
      chaveNormalizada.length < 8 ||
      chaveNormalizada.length > 100
    ) {
      return "A chave PIX aleatória é inválida.";
    }
  }

  return null;
}

const listarBarbeiros = asyncHandler(
  async (req, res) => {
    const {
      pagina,
      limite,
      busca,
      ativo,
    } = req.query;

    const resultado =
      await barbeiroService.listarBarbeiros({
        pagina,
        limite,
        busca,
        ativo,
      });

    return res.status(200).json({
      success: true,
      data: resultado.barbeiros,
      paginacao:
        resultado.paginacao,
    });
  },
);

const buscarBarbeiroPorId =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const barbeiro =
      await barbeiroService.buscarBarbeiroPorId(
        id,
      );

    if (!barbeiro) {
      return res.status(404).json({
        success: false,
        message: "Barbeiro não encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      data: barbeiro,
    });
  });

const criarBarbeiro =
  asyncHandler(async (req, res) => {
    const {
      usuario_id,
      nome,
      cpf,
      data_nascimento,
      telefone,
      whatsapp,
      especialidade,
      pix_tipo,
      pix_chave,
      percentual_comissao,
    } = req.body;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message:
          "O usuário do barbeiro é obrigatório.",
      });
    }

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "O nome do barbeiro é obrigatório.",
      });
    }

    const erroCpf =
      validarCpf(cpf);

    if (erroCpf) {
      return res.status(400).json({
        success: false,
        message: erroCpf,
      });
    }

    const erroData =
      validarDataNascimento(
        data_nascimento,
      );

    if (erroData) {
      return res.status(400).json({
        success: false,
        message: erroData,
      });
    }

    const erroPix =
      validarPix(
        pix_tipo,
        pix_chave,
      );

    if (erroPix) {
      return res.status(400).json({
        success: false,
        message: erroPix,
      });
    }

    const cpfNormalizado =
      String(cpf)
        .replace(/\D/g, "");

    const barbeiroComCpf =
      await barbeiroService.buscarPorCpf(
        cpfNormalizado,
      );

    if (barbeiroComCpf) {
      return res.status(409).json({
        success: false,
        message:
          "Já existe um barbeiro cadastrado com este CPF.",
      });
    }

    const comissao =
      Number(
        percentual_comissao,
      );

    if (
      !Number.isFinite(comissao) ||
      comissao < 0 ||
      comissao > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Informe uma comissão válida entre 0 e 100%.",
      });
    }

    const barbeiro =
      await barbeiroService.criarBarbeiro({
        usuario_id,
        nome,
        cpf: cpfNormalizado,
        data_nascimento,
        telefone,
        whatsapp,
        especialidade,
        pix_tipo,
        pix_chave,
        percentual_comissao:
          comissao,
      });

    return res.status(201).json({
      success: true,
      message:
        "Barbeiro criado com sucesso.",
      data: barbeiro,
    });
  });

const atualizarBarbeiro =
  asyncHandler(async (req, res) => {
    const { id } =
      req.params;

    const barbeiroExistente =
      await barbeiroService.buscarBarbeiroPorId(
        id,
      );

    if (!barbeiroExistente) {
      return res.status(404).json({
        success: false,
        message:
          "Barbeiro não encontrado.",
      });
    }

    const dados = {
      ...req.body,
    };

    if (dados.cpf !== undefined) {
      const erroCpf =
        validarCpf(dados.cpf);

      if (erroCpf) {
        return res.status(400).json({
          success: false,
          message: erroCpf,
        });
      }

      dados.cpf =
        String(dados.cpf)
          .replace(/\D/g, "");

      const barbeiroComCpf =
        await barbeiroService.buscarPorCpf(
          dados.cpf,
        );

      if (
        barbeiroComCpf &&
        barbeiroComCpf.id !== id
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Já existe outro barbeiro cadastrado com este CPF.",
        });
      }
    }

    if (
      dados.data_nascimento !== undefined
    ) {
      const erroData =
        validarDataNascimento(
          dados.data_nascimento,
        );

      if (erroData) {
        return res.status(400).json({
          success: false,
          message: erroData,
        });
      }
    }

    if (
      dados.pix_tipo !== undefined ||
      dados.pix_chave !== undefined
    ) {
      const erroPix =
        validarPix(
          dados.pix_tipo ||
            barbeiroExistente.pix_tipo,
          dados.pix_chave ||
            barbeiroExistente.pix_chave,
        );

      if (erroPix) {
        return res.status(400).json({
          success: false,
          message: erroPix,
        });
      }
    }

    if (
      dados.percentual_comissao !==
      undefined
    ) {
      const comissao =
        Number(
          dados.percentual_comissao,
        );

      if (
        !Number.isFinite(comissao) ||
        comissao < 0 ||
        comissao > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Informe uma comissão válida entre 0 e 100%.",
        });
      }

      dados.percentual_comissao =
        comissao;
    }

    const barbeiro =
      await barbeiroService.atualizarBarbeiro(
        id,
        dados,
      );

    return res.status(200).json({
      success: true,
      message:
        "Barbeiro atualizado com sucesso.",
      data: barbeiro,
    });
  });

const desativarBarbeiro =
  asyncHandler(async (req, res) => {
    const { id } =
      req.params;

    const barbeiroExistente =
      await barbeiroService.buscarBarbeiroPorId(
        id,
      );

    if (!barbeiroExistente) {
      return res.status(404).json({
        success: false,
        message:
          "Barbeiro não encontrado.",
      });
    }

    await barbeiroService.desativarBarbeiro(
      id,
    );

    return res.status(200).json({
      success: true,
      message:
        "Barbeiro desativado com sucesso.",
    });
  });

const ativarBarbeiro =
  asyncHandler(async (req, res) => {
    const { id } =
      req.params;

    const barbeiroExistente =
      await barbeiroService.buscarBarbeiroPorId(
        id,
      );

    if (!barbeiroExistente) {
      return res.status(404).json({
        success: false,
        message:
          "Barbeiro não encontrado.",
      });
    }

    await barbeiroService.ativarBarbeiro(
      id,
    );

    return res.status(200).json({
      success: true,
      message:
        "Barbeiro ativado com sucesso.",
    });
  });

module.exports = {
  listarBarbeiros,
  buscarBarbeiroPorId,
  criarBarbeiro,
  atualizarBarbeiro,
  desativarBarbeiro,
  ativarBarbeiro,
};