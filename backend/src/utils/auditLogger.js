function registrar(evento, dados = {}) {
  let registro;

  if (
    evento &&
    typeof evento === "object" &&
    !Array.isArray(evento)
  ) {
    registro = {
      ...evento,
    };
  } else {
    registro = {
      evento,
      ...dados,
    };
  }

  console.log(
    `[AUDIT] ${new Date().toISOString()}`,
    registro,
  );
}

module.exports = {
  registrar,
};

