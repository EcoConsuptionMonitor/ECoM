# ECoM

Sistema de controle de consumo de água e energia. Monorepo com três aplicações:

| Pasta        | Stack                                             | Descrição                          |
|--------------|---------------------------------------------------|------------------------------------|
| `ECoM-Back`  | Node.js, Express, dotenv, cors                    | API REST                          |
| `ECoM-Mobile`| React Native, Expo 54, React Navigation, charts   | Aplicativo mobile                  |
| `ECoM-Web`   | Next.js 16, React 19, Tailwind CSS 4 + TypeScript | Aplicação web                      |

## Como rodar

### Backend
```bash
cd ECoM-Back
npm install
npm run dev      # ou npm start
```
A API sobe em `http://localhost:3333` (defina `PORT` no `.env` para mudar).

### Mobile
```bash
cd ECoM-Mobile
npm install
npm start        # ou: npm run android / ios / web
```

### Web
```bash
cd ECoM-Web
npm install
npm run dev
```

## Scripts úteis

- **Backend:** `npm start` (produção), `npm run dev` (watch)
- **Mobile:** `npx expo-doctor` (valida o projeto), `npx expo export` (gera bundle de produção)
- **Web:** `npm run lint`, `npm run build`, `npm start`

## Endpoints da API

Todas as rotas, exceto `/health` e `/auth/*` (exceto `/me`), exigem `Authorization: Bearer <token>`.

| Método | Rota               | Descrição                                  |
|--------|--------------------|--------------------------------------------|
| GET    | `/health`          | Health check                               |
| POST   | `/auth/register`   | Cria usuário e retorna token               |
| POST   | `/auth/login`      | Autentica e retorna token                  |
| GET    | `/auth/me`         | Dados do usuário autenticado (bearer)      |
| GET    | `/consumo`         | Lista consumo do usuário (`?tipo=`/`?ambienteId=`) |
| POST   | `/consumo`         | Registra consumo (`ambienteId`, `tipo`, `valor`) |
| GET    | `/ambientes`       | Lista ambientes do usuário                 |
| POST   | `/ambientes`       | Cria ambiente (`nome`)                     |
| GET    | `/alertas`         | Lista alertas do usuário                   |
| POST   | `/alertas`         | Cria alerta (`mensagem`, opcional `nivel`/`tipo`) |
| PATCH  | `/alertas/:id`     | Marca alerta como lido (`lido: true`)      |

A API usa **dados em memória** (sem banco de dados) — os dados são perdidos ao reiniciar o servidor.

## Estado atual

- **Backend:** API funcional com autenticação (token em memória), consumo, ambientes e alertas, e tratamento de erro/404 em JSON.
- **Mobile:** navegação (Splash → Welcome → Login/Cadastro → abas); Login e Cadastro autenticam na API; Home e Alerts consomem dados reais do backend.
- **Web:** painel (dashboard) com login/registro, totais de consumo, alertas e tabela de consumo — consome a mesma API.

> Nota: use um único gerenciador de pacotes (`npm`) — não commitar `yarn.lock` e `package-lock.json` juntos.
