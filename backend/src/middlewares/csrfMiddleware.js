const SAFE_METHODS = [
  "GET",
  "HEAD",
  "OPTIONS",
];

function obterOrigemPermitida() {
  return (
    process.env.CORS_ORIGIN ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function protegerCSRF(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin) {
    return next();
  }

  const origemPermitida =
    obterOrigemPermitida();

  if (origin.replace(/\/$/, "") !== origemPermitida) {
    return res.status(403).json({
      success: false,
      message: "Origem da requisição não permitida.",
      errors: null,
    });
  }

  return next();
}

module.exports = protegerCSRF;

