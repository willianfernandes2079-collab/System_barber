# MW System — Sistema de Gestão para Barbearia

# System Barber

Sistema de gerenciamento para barbearia.

O projeto está sendo desenvolvido para facilitar o gerenciamento de clientes, barbeiros, serviços e agendamentos.

Atualmente estou trabalhando principalmente no backend e na estrutura da API.

## Tecnologias

* Node.js
* Express
* JavaScript
* PostgreSQL
* Prisma ORM
* Git e GitHub

## Estrutura

```text
System_barber/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── controllers/
│       ├── database/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
│
├── frontend/
│
└── README.md
```

## Backend

O backend foi desenvolvido com Node.js e Express.

A ideia é manter cada parte do sistema separada para facilitar a manutenção.

De forma geral:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Prisma
  ↓
PostgreSQL
```

As `routes` definem as rotas da API, os `controllers` recebem as requisições e os `services` concentram as regras do sistema.

## Funcionalidades atuais

### Clientes

* Cadastro de clientes
* Listagem de clientes
* Busca por ID
* Atualização
* Desativação

### Barbeiros

* Cadastro de barbeiros
* Listagem
* Busca por ID
* Atualização
* Desativação

### Serviços

* Cadastro de serviços
* Listagem
* Busca por ID
* Atualização
* Desativação

Os serviços possuem informações como nome, descrição, duração, preço e percentual de comissão.

### Agendamentos

* Criar agendamento
* Listar agendamentos
* Buscar agendamento por ID
* Atualizar agendamento
* Cancelar agendamento

Também existe uma verificação para evitar que um barbeiro tenha dois agendamentos no mesmo horário.

## Banco de dados

O projeto utiliza PostgreSQL.

O Prisma é utilizado para fazer a comunicação entre o backend e o banco.

As migrations ficam dentro de:

```text
backend/prisma/migrations/
```

Para gerar o Prisma Client:

```bash
npx prisma generate
```

Para aplicar as migrations:

```bash
npx prisma migrate deploy
```

Durante o desenvolvimento, quando houver alterações no schema:

```bash
npx prisma migrate dev
```

## Configuração

Primeiro, clone o projeto:

```bash
git clone https://github.com/willianfernandes2079-collab/System_barber.git
```

Entre na pasta:

```bash
cd System_barber
```

Depois entre no backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` dentro da pasta `backend`.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/barbearia?schema=public"
```

Não envie o `.env` para o GitHub.

## Executando

Para iniciar o backend em desenvolvimento:

```bash
npm run dev
```

Por padrão, a API fica disponível em:

```text
http://localhost:3000
```

## Rotas principais

```text
/api/clientes
/api/barbeiros
/api/servicos
/api/agendamentos
```

Exemplo:

```text
GET    /api/servicos
GET    /api/servicos/:id
POST   /api/servicos
PATCH  /api/servicos/:id
DELETE  /api/servicos/:id
```

Agendamentos:

```text
GET    /api/agendamentos
GET    /api/agendamentos/:id
POST   /api/agendamentos
PATCH  /api/agendamentos/:id
```

## Segurança

Alguns arquivos não são enviados para o GitHub, como:

```text
.env
node_modules/
*.log
*.dump
```

O backup do banco também é mantido separado do código.

## Desenvolvimento

O projeto ainda está em desenvolvimento.

Algumas das próximas etapas são:

* terminar a integração com o frontend;
* melhorar as validações;
* testar todas as rotas;
* criar testes automatizados;
* melhorar a documentação da API;
* preparar o projeto para deploy.

## GitHub

Repositório:

[https://github.com/willianfernandes2079-collab/System_barber](https://github.com/willianfernandes2079-collab/System_barber)


---

## 👥 Desenvolvimento

Projeto desenvolvido como sistema de gestão para barbearia, utilizando tecnologias modernas de desenvolvimento web e arquitetura baseada em API REST.
