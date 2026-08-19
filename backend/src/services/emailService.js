const env = require("../config/env");

/*Camada de serviço de e-mail. Enquanto EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD
  não estiverem configurados no .env, o sistema roda em modo MOCK: em vez
  de enviar de verdade, apenas registra no console o que seria enviado.
  Isso evita travar o desenvolvimento por falta de credenciais reais e
  evita también inventar uma integração que não existe.
  Quando as credenciais reais forem configuradas, troque o corpo de
  `enviarEmail` para usar nodemailer (ou outro provedor) — a assinatura da
  função continua igual, então nada mais no projeto precisa mudar.*/

const modoMock = !env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD;

async function enviarEmail({ to, subject, body }) {
  if (modoMock) {
    
    // eslint-disable-next-line no-console

    console.log(
      `[EMAIL MOCK] Para: ${to} | Assunto: ${subject}\n${body}\n`
    );
    return { enviado: true, modo: "MOCK" };
  }

  // TODO (fase de integrações reais): implementar envio via nodemailer/SMTP
  // usando EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD.

  throw new Error("Envio real de e-mail ainda não implementado.");
}

module.exports = { enviarEmail, modoMock };