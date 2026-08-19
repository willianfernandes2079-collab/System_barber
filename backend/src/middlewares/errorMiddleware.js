const AppError = require("../utils/AppError");
const { fail } = require("../utils/apiResponse");

/**
 * Handler global de erros (item 37 da especificação). Deve ser o ÚLTIMO
 * middleware registrado no server.js.
 *
 * Erros esperados (AppError) retornam a mensagem definida pelo próprio
 * fluxo de negócio. Qualquer outro erro (bug, exceção não tratada) NUNCA
 * expõe detalhes internos para o cliente — só é logado no servidor.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return fail(res, { message: err.message, status: err.status, errors: err.errors });
  }

  // eslint-disable-next-line no-console
  console.error("[ERRO NÃO TRATADO]", err);

  return fail(res, {
    message: "Erro interno do servidor.",
    status: 500,
  });
}

function notFoundHandler(req, res) {
  return fail(res, { message: "Rota não encontrada.", status: 404 });
}

module.exports = { errorHandler, notFoundHandler };