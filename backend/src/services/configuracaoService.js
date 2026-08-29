const prisma = require("../config/prismaClient");
const AppError = require("../utils/AppError");

function validarBarbeariaId(barbeariaId) {
  if (!barbeariaId) {
    throw new AppError(
      "Usuário não está vinculado a uma barbearia.",
      403,
    );
  }

  return barbeariaId;
}

async function buscar(barbeariaId) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  let configuracao =
    await prisma.configuracao.findFirst({
      where: {
        barbearia_id: barbeariaId,
      },
    });

  if (!configuracao) {
    configuracao =
      await prisma.configuracao.create({
        data: {
          nome_barbearia:
            "Sistema Barbearia",
          barbearia_id: barbeariaId,
        },
      });
  }

  return configuracao;
}

async function atualizar(
  dados,
  barbeariaId,
) {
  barbeariaId =
    validarBarbeariaId(barbeariaId);

  const configuracaoAtual =
    await buscar(barbeariaId);

  const camposPermitidos = [
    "nome_barbearia",
    "telefone",
    "endereco",
    "horario_abertura",
    "horario_fechamento",
    "dias_funcionamento",
    "comissao_padrao",
  ];

  const dadosAtualizados = {};

  for (const campo of camposPermitidos) {
    if (dados[campo] !== undefined) {
      dadosAtualizados[campo] =
        dados[campo];
    }
  }

  return prisma.configuracao.update({
    where: {
      id: configuracaoAtual.id,
    },

    data: dadosAtualizados,
  });
}

module.exports = {
  buscar,
  atualizar,
};