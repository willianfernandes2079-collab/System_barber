const configuracaoService = require("../services/configuracaoService");

async function buscar(req, res) {
  const configuracao = await configuracaoService.buscar();

  return res.status(200).json({
    success: true,
    data: configuracao,
  });
}

async function atualizar(req, res) {
  const configuracao = await configuracaoService.atualizar(req.body);

  return res.status(200).json({
    success: true,
    message: "Configurações atualizadas com sucesso.",
    data: configuracao,
  });
}

module.exports = {
  buscar,
  atualizar,
};
