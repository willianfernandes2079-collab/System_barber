function success(res, { message = "Operação realizada com sucesso.", data = null, status = 200 } = {}) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, { message = "Ocorreu um erro.", status = 500, errors = null } = {}) {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
}

module.exports = {
  success,
  fail,
};