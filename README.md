# LançaSync

Aplicativo em React Native para registrar compras e vendas com fotos.

Os dados ficam salvos no celular pelo WatermelonDB e depois são sincronizados com uma API em Node.js usando MySQL.

## Requisitos

- Node.js 18+
- npm
- Docker Desktop
- Android Studio com SDK configurado
- Emulador Android ou celular com depuração USB ativa

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

Quando aparecer `API rodando em http://localhost:3333` no terminal, o backend está ativo.

Se abrir `http://localhost:3333/` no navegador e aparecer `404`, está tudo certo. A API não tem uma página inicial; as rotas usadas pelo app ficam em `/api`.

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

O app também tenta acessar automaticamente a API pelo endereço do Metro e por `http://10.0.2.2:3333/api`, usado pelo emulador Android.

Se aparecer `Network request failed`, confira se o backend está rodando e rode novamente:

```bash
adb reverse tcp:3333 tcp:3333
```

Se estiver usando celular físico sem USB, o celular e o computador precisam estar na mesma rede Wi-Fi.

Se ainda precisar ajustar manualmente, o arquivo de configuração é:

```text
mobile/src/config.ts
```

## Usuários de teste

| Empresa | Login | Senha |
| --- | --- | --- |
| Empresa Alfa | `joao@empresa1.com` | `123456` |
| Empresa Beta | `maria@empresa2.com` | `123456` |

Cada usuário está ligado a uma empresa diferente. Ao entrar no app, ele vê e cadastra apenas os registros da própria empresa.

## Testar offline/online

1. Rode o backend e abra o app.
2. Entre com um dos usuários de teste.
3. Desligue a internet do emulador ou do celular.
4. Cadastre um lançamento com tipo, data/hora, descrição e foto(s).
5. O registro aparece na lista como `Pendente`.
6. Ligue a internet novamente.
7. Toque em `Sincronizar`.
8. Depois da sincronização, o status muda para `Sincronizado`.

## O que foi implementado

- Login validado pelo backend.
- Sessão salva localmente para não precisar logar toda vez.
- Tabelas `empresa`, `usuario`, `registro` e `foto_registro` no MySQL.
- Dois usuários iniciais, um para cada empresa.
- Modelos e schema do WatermelonDB no app.
- Sincronização com `pullChanges` e `pushChanges`.
- Cadastro offline com tipo, data/hora, descrição e múltiplas fotos.
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
