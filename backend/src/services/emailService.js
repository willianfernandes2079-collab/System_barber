const env = require("../config/env");

const modoMock =
  !env.EMAIL_HOST ||
  !env.EMAIL_USER ||
  !env.EMAIL_PASSWORD;

async function enviarEmail({
  to,
  subject,
  body,
}) {
  if (modoMock) {
    // Não registrar o corpo do e-mail, pois ele pode conter
    // tokens de recuperação ou outras informações sensíveis.
    console.log(
      `[EMAIL MOCK] E-mail simulado para ${to}. Assunto: ${subject}`,
    );

    return true;
  }

  throw new Error(
    "Envio real de e-mail ainda não implementado.",
  );
}

module.exports = {
  enviarEmail,
  modoMock,
}