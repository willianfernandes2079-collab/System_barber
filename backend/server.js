require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const env = require("./src/config/env");
const apiRoutes = require("./src/routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./src/middlewares/errorMiddleware");
const seedUsers = require("./src/database/seedUsers");

const app = express();

// Necessário para que req.ip funcione corretamente atrás de proxy/load balancer
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(
  express.static(path.join(__dirname, "..", "frontend-public"))
);


// ROTAS HTML


app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend-public", "html", "login.html")
  );
});

app.get("/login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend-public", "html", "login.html")
  );
});

app.get("/index", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend-public", "html", "index.html")
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
        `Servidor rodando na porta ${env.PORT} (${env.NODE_ENV})`
      );
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

start();

module.exports = app;

