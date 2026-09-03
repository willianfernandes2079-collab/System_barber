require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const { verifyAccessToken } = require("./src/utils/jwt");

const env = require("./src/config/env");
const apiRoutes = require("./src/routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./src/middlewares/errorMiddleware");
const protegerCSRF = require("./src/middlewares/csrfMiddleware");
const seedUsers = require("./src/database/seedUsers");
const {
  apiWriteLimiter,
} = require("./src/middlewares/rateLimitMiddleware");

const app = express();

// Necessário para que req.ip funcione corretamente atrás de proxy/load balancer
app.set(
  "trust proxy",
  env.NODE_ENV === "production"
    ? 1
    : false,
);

// Headers básicos de segurança
app.use((req, res, next) => {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );

  res.setHeader(
    "X-Frame-Options",
    "DENY",
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );

  next();
});

// CORS
const corsOrigin =
  process.env.CORS_ORIGIN ||
  `http://localhost:${env.PORT}`;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

app.use(
  express.json({
    limit: "100kb",
  }),
);

app.use(cookieParser());

// Proteção CSRF para requisições que alteram estado
app.use("/api", protegerCSRF);
app.use("/api", apiWriteLimiter);

function protegerPaginasHtml(req, res, next) {
  const caminho = req.path;

  const paginasPublicas = [
    "/html/login.html",
    "/html/esquecisenha.html",
    "/html/redefinir-senha.html",
  ];

  if (paginasPublicas.includes(caminho)) {
    return next();
  }

  if (!caminho.endsWith(".html")) {
    return next();
  }

  const token = req.cookies?.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyAccessToken(token);
    return next();
  } catch {
    return res.redirect("/login");
  }
}

// Proteger páginas HTML antes do express.static
app.use(protegerPaginasHtml);

// Servir arquivos estáticos do frontend
app.use(
  express.static(
    path.join(
      __dirname,
      "..",
      "frontend-public",
    ),
  ),
);

// ROTAS HTML

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html",
      "login.html",
    ),
  );
});

app.get("/login", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html",
      "login.html",
    ),
  );
});

// Portal exclusivo do cliente
app.get("/cliente-agendamento", (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyAccessToken(token);
  } catch {
    return res.redirect("/login");
  }

  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html_site",
      "html",
      "cliente-agendamento.html",
    ),
  );
});

// Meus agendamentos
app.get("/meus-agendamentos", (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyAccessToken(token);
  } catch {
    return res.redirect("/login");
  }

  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html_site",
      "html",
      "meusagendamentos.html",
    ),
  );
});

// Meu perfil
app.get("/meu-perfil", (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyAccessToken(token);
  } catch {
    return res.redirect("/login");
  }

  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html_site",
      "html",
      "meuperfil.html",
    ),
  );
});

// Configurações do cliente
app.get("/configuracoes", (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyAccessToken(token);
  } catch {
    return res.redirect("/login");
  }

  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html_site",
      "html",
      "configuracao.html",
    ),
  );
});

// Pagamentos do cliente
app.get("/pagamentos", (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyAccessToken(token);
  } catch {
    return res.redirect("/login");
  }

  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html_site",
      "html",
      "pagamentos.html",
    ),
  );
});

app.get("/index", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend-public",
      "html",
      "index.html",
    ),
  );
});

// API

// Todas as rotas da API ficam sob /api
app.use("/api", apiRoutes);

// 404 para qualquer rota da API não encontrada
app.use("/api", notFoundHandler);

// Tratamento global de erros
app.use(errorHandler);

// INICIAR SERVIDOR

async function start() {
  try {
    await seedUsers();

    app.listen(env.PORT, () => {
      console.log(
        `Servidor rodando na porta ${env.PORT} (${env.NODE_ENV})`,
      );
    });
  } catch (error) {
    console.error(
      "Erro ao iniciar servidor:",
      error,
    );

    process.exit(1);
  }
}

start();