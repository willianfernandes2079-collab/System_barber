function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(password) {
  if (typeof password !== "string") return false;

  // Mínimo de 8 caracteres, contendo pelo menos uma letra e um número
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  );
}

function isValidCargo(cargo) {
  const cargosValidos = ["ADMIN", "GERENTE", "BARBEIRO", "RECEPCIONISTA"];

  return cargosValidos.includes(cargo);
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isNonEmptyString,
  isValidCargo,
};
