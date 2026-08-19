# Backend da Barbearia

Este é o backend inicial para o sistema profissional de gestão de barbearia.

## Estrutura inicial

- `src/controllers`  
- `src/routes`
- `src/services`
- `src/models`
- `src/middlewares`
- `src/config`
- `src/utils`

## Instalação

```bash
cd backend
npm install
cp .env.example .env
```

## Iniciar o servidor

Modo de desenvolvimento:

```bash
npm run dev
```

Modo de produção:

```bash
npm start
```

A API estará disponível na porta configurada em `.env` ou na porta padrão `3000`.

## Health check

```bash
GET /api/health
```

Resposta esperada:

```json
{
  "success": true,
  "message": "API da Barbearia funcionando!",
  "status": "online"
}
```



