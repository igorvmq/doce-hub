# Doce Hub Frontend

Frontend simples em Next.js + Tailwind para testar comunicação com a API Doce Hub.

## Como usar

1. Copie `.env.example` para `.env.local`:

```bash
copy .env.example .env.local
```

2. Instale dependências:

```bash
npm install
```

3. Execute o frontend:

```bash
npm run dev
```

4. Abra o navegador em `http://localhost:3000`

O app faz uma chamada simples para a API usando `NEXT_PUBLIC_API_BASE_URL`.
