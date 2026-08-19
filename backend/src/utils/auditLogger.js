function registrar(evento, dados = {}) {
  console.log(
    `[AUDIT] ${new Date().toISOString()} | ${evento}`,
    dados
  );
}

module.exports = {
  registrar,
};