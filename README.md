# 💈 MW System — Sistema de Gestão para Barbearia

Sistema de gestão desenvolvido para auxiliar no gerenciamento completo de uma barbearia, centralizando informações de clientes, agendamentos, serviços, financeiro, relatórios e configurações.

> 🚧 **Status do projeto:** Em desenvolvimento

---

## 📋 Sobre o projeto

O **MW System** é um sistema web desenvolvido com o objetivo de facilitar a administração de uma barbearia.

A proposta é permitir que os responsáveis pelo estabelecimento possam gerenciar, de forma organizada e segura:

- 👤 Clientes
- 📅 Agendamentos
- ✂️ Serviços
- 💰 Financeiro
- 📊 Relatórios
- ⚙️ Configurações
- 🏪 Informações da barbearia
- 🔐 Usuários e autenticação

O sistema está sendo desenvolvido utilizando uma arquitetura separada entre **Frontend** e **Backend**, permitindo que as duas partes sejam desenvolvidas e evoluídas de forma independente.

---

# 🏗️ Estrutura do projeto

Atualmente o projeto está organizado da seguinte maneira:

```text
System_barber/
│
├── .eucode/
│   ├── .gitignore
│   ├── eucode.json
│   └── eucodeIgnore
│
├── .vscode/
│   └── settings.json
│
├── Frontend-public/
│   ├── css/
│   │   ├── dashboard.css
│   │   ├── global.css
│   │   ├── index.css
│   │   └── style.login.css
│   │
│   └── html/
│       ├── Imagem/
│       │   └── Logo-MWsystem.jpeg
│       │
│       ├── agendamentos.html
│       ├── barbearia.html
│       ├── cliente.html
│       ├── configuracao.html
│       ├── financeiros.html
│       ├── index.html
│       ├── login.html
│       ├── relatorios.html
│       └── servicos.html
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20260818181854_init/
│   │   │       └── migration.sql
│   │   │
│   │   ├── migration_lock.toml
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── prismaClient.js
│   │   │
│   │   ├── controllers/
│   │   │   └── authcontroller.js
│   │   │
│   │   ├── database/
│   │   │   └── seedUsers.js
│   │   │
│   │   ├── generated/
│   │   │   └── prisma/
│   │   │
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   ├── permissionMiddleware.js
│   │   │   └── rateLimitMiddleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── sessionStore.js
│   │   │   └── userStore.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── emailService.js
│   │   │
│   │   └── utils/
│   │       ├── apiResponse.js
│   │       ├── appError.js
│   │       ├── asyncHandler.js
│   │       ├── auditLogger.js
│   │       ├── hash.js
│   │       ├── jwt.js
│   │       └── validators.js
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── INSTRUCOES.md
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma.config.ts
│   └── server.js
│
├── .gitignore
└── README.md