# Doce Hub - Guia de execução local

Este guia descreve como baixar e executar o projeto Doce Hub utilizando o banco de teste hospedado no MonsterASP, sem a necessidade de configurar um banco MySQL local.

## 1. Pré-requisitos

Tenha instalados:

- Git
- .NET SDK 9
- Node.js 20+

## 2. Clonar o projeto

```powershell
git clone igorvmq/doce-hub
cd doce-hub
```

## 3. Backend: usar o banco de teste do MonsterASP

O projeto já está preparado para se conectar ao banco de teste remoto configurado no arquivo de configuração do backend. Não é necessário criar um banco local.

Entre na pasta do backend:

```powershell
cd .\doce-hub-api
```

Se quiser confirmar a configuração, veja o arquivo [doce-hub-api/appsettings.json](doce-hub-api/appsettings.json). Ele já aponta para a conexão do banco de teste.

## 4. Rodar o backend

```powershell
dotnet restore
dotnet run
```

O backend ficará disponível em:

- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

## 5. Frontend: configurar o endpoint da API

Em outra janela do terminal, entre na pasta do frontend:

```powershell
cd .\doce-hub-frontend
```

Crie um arquivo `.env.local` com o endpoint da API local:

```powershell
@'
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
'@ | Set-Content .env.local
```

Instale as dependências:

```powershell
npm install
```

## 6. Rodar o frontend

```powershell
npm run dev
```

O frontend ficará disponível em:

- http://localhost:3000
- http://localhost:3000/cardapio
- http://localhost:3000/admin

## 7. Verificar se tudo está funcionando

- Acesse http://localhost:3000
- Acesse http://localhost:5000/health
- O Swagger deve estar disponível em http://localhost:5000/swagger

## 8. Dicas de troubleshooting

- Se o backend falhar por estar com uma instância antiga em execução, encerre o processo anterior antes de rodar novamente.
- Se o frontend não encontrar a API, confira se o valor de `NEXT_PUBLIC_API_BASE_URL` está correto no `.env.local`.
- Se a porta 3000 estiver ocupada, o Next.js pode usar outra porta; confira a saída do terminal.
