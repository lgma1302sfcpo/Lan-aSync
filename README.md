# LancaSync

Aplicativo mobile em React Native para registrar compras e vendas com fotos, usando WatermelonDB como banco local e sincronizacao offline com backend Node.js/Express + MySQL.

## Requisitos

- Node.js 18+
- npm
- Docker Desktop
- Android Studio/SDK configurado
- Emulador Android ou celular Android com depuracao USB

## Rodar o backend

Na raiz do projeto, execute:

```powershell
npm run backend:install
Copy-Item backend\.env.example backend\.env -Force
docker compose up -d mysql
npm run backend:db:init
npm run backend:dev
```

Se estiver usando Git Bash, Linux ou macOS, troque apenas o comando de copia do `.env`:

```bash
cp backend/.env.example backend/.env
```

A API ficara em:

```text
http://localhost:3333
```

Teste rapido no navegador:

```text
http://localhost:3333/health
```

## Rodar o app Android

Abra outro terminal na raiz do projeto:

```bash
npm run mobile:install
adb reverse tcp:3333 tcp:3333
adb reverse tcp:8081 tcp:8081
npm run mobile:start
```

Abra um terceiro terminal na raiz do projeto:

```bash
npm run mobile:android
```

O `adb reverse` permite que o app acesse a API local usando `http://localhost:3333/api`.

Se estiver usando Android Emulator sem `adb reverse`, altere `mobile/src/config.ts` para:

```ts
export const API_URL = 'http://10.0.2.2:3333/api';
```

## Usuarios de teste

| Empresa | Login | Senha |
| --- | --- | --- |
| Empresa Alfa | `joao@empresa1.com` | `123456` |
| Empresa Beta | `maria@empresa2.com` | `123456` |

Cada usuario pertence a uma empresa diferente. Depois do login, o app lista e sincroniza apenas os registros da empresa do usuario autenticado.

## Testar offline/online

1. Rode o backend e o app.
2. Faca login com um dos usuarios de teste.
3. Desligue a internet do emulador ou celular.
4. Cadastre um lancamento informando tipo, data/hora, descricao com pelo menos 10 caracteres e foto(s).
5. O registro fica salvo localmente no WatermelonDB e aparece como `Pendente`.
6. Ligue a internet novamente.
7. Toque em `Sincronizar`.
8. O registro e as fotos sao enviados para o backend e o status passa para `Sincronizado`.

## O que foi implementado

- Login validado no backend com dados do MySQL.
- Sessao local para pular a tela de login ao reabrir o app.
- Tabelas `empresa`, `usuario`, `registro` e `foto_registro`.
- Dois usuarios iniciais, cada um vinculado a uma empresa.
- Schema e models WatermelonDB para empresa, usuario, registro e fotos.
- `pullChanges` e `pushChanges` para sincronizacao.
- Cadastro offline de registros com tipo, data/hora, descricao e multiplas fotos.
- Lista local com tipo, data/hora, descricao e status de sincronizacao.

## Scripts principais

```bash
npm run backend:install
npm run backend:db:init
npm run backend:dev
npm run mobile:install
npm run mobile:start
npm run mobile:android
```
