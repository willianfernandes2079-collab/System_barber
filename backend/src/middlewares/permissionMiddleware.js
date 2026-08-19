const { fail } = require("../utils/apiResponse");

/**
 * Controle de permissões por cargo (item 7 da especificação).
 * Uso: router.delete('/usuarios/:id', autenticar, autorizar('ADMIN'), ...)
 *
 * Deve ser usado sempre DEPOIS do middleware `autenticar`, pois depende de
 * `req.user` já estar preenchido.
 */
function autorizar(...cargosPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, { message: "Não autenticado.", status: 401 });
    }
    if (!cargosPermitidos.includes(req.user.cargo)) {
      return fail(res, {
        message: "Você não tem permissão para realizar esta ação.",
        status: 403,
      });
    }
    return next();
  };
}

module.exports = autorizar;