# LancaSync

Aplicativo em React Native para registrar compras e vendas com fotos.

Os dados ficam salvos no celular pelo WatermelonDB e depois sao sincronizados com uma API em Node.js usando MySQL.

## Requisitos

- Node.js 18+
- npm
- Docker Desktop
- Android Studio com SDK configurado
- Emulador Android ou celular com depuracao USB ativa

## Rodar o backend

Na pasta principal do projeto, rode:

```powershell
npm run backend:install
Copy-Item backend\.env.example backend\.env -Force
docker compose up -d mysql
npm run backend:db:init
npm run backend:dev
```

Se estiver no Git Bash, Linux ou macOS, use este comando no lugar do `Copy-Item`:

```bash
cp backend/.env.example backend/.env
```

A API vai rodar em:

```text
http://localhost:3333
```

## Rodar o app Android

Abra outro terminal na pasta principal:

```bash
npm run mobile:install
adb reverse tcp:3333 tcp:3333
adb reverse tcp:8081 tcp:8081
npm run mobile:start
```

Depois, em mais um terminal:

```bash
npm run mobile:android
```

O `adb reverse` faz o app conseguir acessar a API local em `http://localhost:3333/api`.

Se preferir rodar no emulador sem `adb reverse`, altere `mobile/src/config.ts` para:

```ts
export const API_URL = 'http://10.0.2.2:3333/api';
```

## Usuarios de teste

| Empresa | Login | Senha |
| --- | --- | --- |
| Empresa Alfa | `joao@empresa1.com` | `123456` |
| Empresa Beta | `maria@empresa2.com` | `123456` |

Cada usuario esta ligado a uma empresa diferente. Ao entrar no app, ele ve e cadastra apenas os registros da propria empresa.

## Testar offline/online

1. Rode o backend e abra o app.
2. Entre com um dos usuarios de teste.
3. Desligue a internet do emulador ou do celular.
4. Cadastre um lancamento com tipo, data/hora, descricao e foto(s).
5. O registro aparece na lista como `Pendente`.
6. Ligue a internet novamente.
7. Toque em `Sincronizar`.
8. Depois da sincronizacao, o status muda para `Sincronizado`.

## O que foi implementado

- Login validado pelo backend.
- Sessao salva localmente para nao precisar logar toda vez.
- Tabelas `empresa`, `usuario`, `registro` e `foto_registro` no MySQL.
- Dois usuarios iniciais, um para cada empresa.
- Models e schema do WatermelonDB no app.
- Sincronizacao com `pullChanges` e `pushChanges`.
- Cadastro offline com tipo, data/hora, descricao e multiplas fotos.
- Lista de registros com status `Pendente` ou `Sincronizado`.

## Scripts principais

```bash
npm run backend:install
npm run backend:db:init
npm run backend:dev
npm run mobile:install
npm run mobile:start
npm run mobile:android
```
