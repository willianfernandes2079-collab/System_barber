# 💈 Sistema de Gestão para Barbearia

## 📋 Descrição

Sistema de gestão completo para barbearias, com controle de agendamentos, clientes, financeiro e relatórios.

## 🚀 Como Usar

### 1. Instalação de Dependências

```bash
cd backend
npm install
```

### 2. Iniciar o Servidor

**Modo de Desenvolvimento** (com auto-reload):

```bash
npm run dev
```

**Modo Normal**:

```bash
npm start
```

O servidor rodará na porta **3000** por padrão (ou conforme definido em `.env`)

## 🌐 Acessar a Aplicação

Após iniciar o servidor, acesse no seu navegador:

- **Página de Login**: [http://localhost:3000](http://localhost:3000)
- **Página Inicial**: [http://localhost:3000/index](http://localhost:3000/index)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 📁 Estrutura do Projeto

```
backend/
├── public/
│   ├── index.html        # Página inicial
│   ├── login.html        # Página de login
│   └── style.css         # Estilos globais
├── src/
│   ├── config/           # Configurações
│   ├── controllers/       # Controladores
│   ├── middlewares/       # Middleware
│   ├── models/           # Modelos de dados
│   ├── routes/           # Rotas
│   ├── services/         # Serviços
│   └── utils/            # Utilitários
├── server.js             # Arquivo principal
├── package.json          # Dependências
└── .env                  # Variáveis de ambiente
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `backend`:

```
PORT=3000
NODE_ENV=development
```

## 🛠️ Tecnologias

- **Express.js** - Framework web
- **CORS** - Controle de acesso
- **Dotenv** - Gerenciamento de variáveis de ambiente
- **Nodemon** - Auto-reload em desenvolvimento

## 📝 Endpoints Disponíveis

### Login

- **POST** `/api/login` - Fazer login com usuário e senha
  ```json
  {
    "usuario": "seu_usuario",
    "senha": "sua_senha"
  }
  ```

### Health Check

- **GET** `/api/health` - Verificar se a API está funcionando

## 🔐 Próximos Passos

- [ ] Implementar autenticação real (JWT)
- [ ] Conectar banco de dados
- [ ] Criar controladores para agendamentos
- [ ] Criar controladores para clientes
- [ ] Implementar sistema de pagamentos
- [ ] Criar dashboard com relatórios

## 📞 Suporte

Para dúvidas ou problemas, verifique se o servidor está rodando corretamente.

---

**Desenvolvido com ❤️ para sua barbearia**
