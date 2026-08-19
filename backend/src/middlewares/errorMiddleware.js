const AppError = require("../utils/AppError");
const { fail } = require("../utils/apiResponse");

/* Handler global de erros.*/
function errorHandler(err, req, res, next) {
  
  // ERROS OPERACIONAIS

  if (err instanceof AppError) {
    return fail(res, {
      message: err.message,
      status: err.statusCode,
      errors: err.errors || null,
    });
  }

  // ERRO NÃO TRATADO

  console.error("[ERRO NÃO TRATADO]", err);

  return fail(res, {
    message: "Erro interno do servidor.",
    status: 500,
    errors: null,
  });
}

/* Rota não encontrada.*/
function notFoundHandler(req, res) {
  return fail(res, {
    message: "Rota não encontrada.",
    status: 404,
    errors: null,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
