require("dotenv").config();

function exigirVariavel(nome) {
  const valor = process.env[nome];

  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: ${nome}`,
    );
  }

  return valor.trim();
}

const nodeEnv =
  process.env.NODE_ENV ||
  "development";

const env = {
  PORT:
    Number(process.env.PORT) ||
    3000,

  NODE_ENV: nodeEnv,

  DEVELOPMENT_MODE:
    String(
      process.env.DEVELOPMENT_MODE,
    ).toLowerCase() === "true",

  DATABASE_URL:
    process.env.DATABASE_URL ||
    "",

  JWT_SECRET:
    process.env.JWT_SECRET ||
    "",

  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "",

  JWT_RESET_SECRET:
    process.env.JWT_RESET_SECRET ||
    "",

  JWT_ACCESS_EXPIRES_IN:
    process.env.JWT_ACCESS_EXPIRES_IN ||
    "15m",

  JWT_REFRESH_EXPIRES_IN:
    process.env.JWT_REFRESH_EXPIRES_IN ||
    "7d",

  JWT_REFRESH_EXPIRES_IN_REMEMBER:
    process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER ||
    "30d",

  JWT_RESET_EXPIRES_IN:
    process.env.JWT_RESET_EXPIRES_IN ||
    "15m",

  BCRYPT_SALT_ROUNDS:
    Number(
      process.env.BCRYPT_SALT_ROUNDS,
    ) || 10,

  WHATSAPP_API_URL:
    process.env.WHATSAPP_API_URL ||
    "",

  WHATSAPP_ACCESS_TOKEN:
    process.env.WHATSAPP_ACCESS_TOKEN ||
    "",

  WHATSAPP_PHONE_NUMBER_ID:
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    "",

  EMAIL_HOST:
    process.env.EMAIL_HOST ||
    "",

  EMAIL_PORT:
    Number(process.env.EMAIL_PORT) ||
    587,

  EMAIL_USER:
    process.env.EMAIL_USER ||
    "",

  EMAIL_PASSWORD:
    process.env.EMAIL_PASSWORD ||
    "",

  CORS_ORIGIN:
    process.env.CORS_ORIGIN ||
    "http://localhost:3000",
};

if (env.NODE_ENV === "production") {
  exigirVariavel("DATABASE_URL");
  exigirVariavel("JWT_SECRET");
  exigirVariavel("JWT_REFRESH_SECRET");
  exigirVariavel("JWT_RESET_SECRET");

  if (
    env.JWT_SECRET.length < 32 ||
    env.JWT_REFRESH_SECRET.length < 32 ||
    env.JWT_RESET_SECRET.length < 32
  ) {
    throw new Error(
      "Os segredos JWT de produção devem possuir pelo menos 32 caracteres.",
    );
  }

  if (
    !env.CORS_ORIGIN.startsWith("https://")
  ) {
    throw new Error(
      "CORS_ORIGIN em produção deve utilizar HTTPS.",
    );
  }
}

module.exports = env;