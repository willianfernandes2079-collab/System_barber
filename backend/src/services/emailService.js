const env = require("../config/env");

const modoMock = !env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD;

async function enviarEmail({ to, subject, body }) {
  if (modoMock) {
    console.log(
      `[EMAIL MOCK] Para: ${to}\n` + `Assunto: ${subject}\n` + `${body}\n`,
    );

    return true;
  }

  throw new Error("Envio real de e-mail ainda não implementado.");
}

module.exports = {
  enviarEmail,
  modoMock,
};
