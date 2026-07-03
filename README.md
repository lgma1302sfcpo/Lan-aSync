# Teste candidato - React Native offline

Aplicativo mobile em React Native com WatermelonDB local, sincronizacao offline e API REST Node/Express persistindo em MySQL.

## Estrutura

- `mobile`: app React Native com login, sessao local, WatermelonDB, cadastro de registros, fotos e sincronizacao.
- `backend`: API REST com autenticacao JWT, seed, isolamento por empresa, pull/push de sync e upload opcional de fotos.
- `docker-compose.yml`: MySQL local para desenvolvimento.

## Requisitos

- Node.js 18+
- npm
- Docker Desktop, ou MySQL 8 instalado localmente
- Ambiente React Native configurado para Android/iOS

## Backend

1. Suba o MySQL:

```bash
docker compose up -d mysql
```

2. Configure as variaveis:

```bash
cd backend
cp .env.example .env
```

Se estiver usando o `docker-compose.yml`, use `DB_USER=root` e `DB_PASSWORD=root`.

3. Instale dependencias, crie tabelas e seed:

```bash
npm install
npm run db:init
npm run dev
```

A API fica em `http://localhost:3333`.

Tambem e possivel executar os scripts a partir da pasta raiz:

```bash
npm run backend:install
npm run backend:db:init
npm run backend:dev
```

Usuarios iniciais:

- `joao@empresa1.com` / `123456`
- `maria@empresa2.com` / `123456`

Cada usuario pertence a uma empresa diferente. A API sempre filtra pull, push, upload e listagens pelo `empresa_id` do token.

## Mobile

1. Instale dependencias:

```bash
cd mobile
npm install
```

2. Confira a URL da API em `src/config.ts`.

Para Android com `adb reverse` ou iOS Simulator, use:

```ts
export const API_URL = 'http://localhost:3333/api';
```

Antes de abrir o app no Android, encaminhe a porta da API:

```bash
adb reverse tcp:3333 tcp:3333
adb reverse tcp:8081 tcp:8081
```

Sem `adb reverse`, em Android Emulator voce pode usar `http://10.0.2.2:3333/api`; em dispositivo fisico, use o IP da maquina na rede.

3. Rode o app:

```bash
npm run start
npm run android
```

Ou, a partir da pasta raiz:

```bash
npm run mobile:install
npm run mobile:start
npm run mobile:android
```

Este diretorio contem o codigo fonte do app. Se o projeto ainda nao tiver pastas nativas `android/ios`, gere-as com a React Native CLI usando a mesma versao do `package.json` ou copie este `App.tsx` e `src` para um projeto React Native CLI novo.

## Teste offline/online

1. Faca login com um dos usuarios de seed.
2. Desligue a internet do emulador/dispositivo.
3. Cadastre um registro com tipo, data/hora, descricao com pelo menos 10 caracteres e uma ou mais fotos.
4. O registro aparece na lista como `Pendente`, pois esta apenas no WatermelonDB.
5. Reative a internet.
6. Toque em `Sincronizar`, ou aguarde a sincronizacao automatica pelo NetInfo.
7. O backend recebe os registros pelo endpoint `POST /api/sync`; as fotos sao enviadas para `POST /api/registros/:registroId/fotos/:fotoId/file` quando ha arquivo local disponivel.

## Endpoints principais

- `POST /api/auth/login`: valida usuario/senha contra MySQL e retorna JWT.
- `GET /api/auth/me`: retorna usuario logado.
- `GET /api/sync?lastPulledAt=0`: pullChanges para WatermelonDB.
- `POST /api/sync`: pushChanges do WatermelonDB.
- `POST /api/registros/:registroId/fotos/:fotoId/file`: upload multipart opcional da foto.

## Observacoes de implementacao

- `registro.id` e `foto_registro.id` usam UUID para permitir criacao offline antes de existir servidor.
- O banco remoto usa as tabelas obrigatorias `empresa`, `usuario`, `registro` e a auxiliar `foto_registro`.
- O app usa as collections WatermelonDB `empresas`, `usuarios`, `registros` e `fotos_registro`.
- Campos de sync usam `created_at`, `updated_at` e `deleted_at`; exclusoes sao tratadas como soft delete no backend.
