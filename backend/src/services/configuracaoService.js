const prisma = require("../config/prismaClient");

async function buscar() {
  let configuracao = await prisma.configuracao.findFirst();

  if (!configuracao) {
    configuracao = await prisma.configuracao.create({
      data: {
        nome_barbearia: "Sistema Barbearia",
      },
    });
  }

  return configuracao;
}

async function atualizar(dados) {
  const configuracaoAtual = await buscar();

  return prisma.configuracao.update({
    where: {
      id: configuracaoAtual.id,
    },
    data: dados,
  });
}

module.exports = {
  buscar,
  atualizar,
};
