# ECoM

Sistema de controle de consumo de água e energia. Monorepo com três aplicações:

| Pasta        | Stack                                             | Descrição                          |
|--------------|---------------------------------------------------|------------------------------------|
| `ECoM-Back`  | Node.js, Express 5, pg, dotenv, cors              | API REST + PostgreSQL/Neon        |
| `ECoM-Mobile`| React Native, Expo 54, React Navigation, charts   | Aplicativo mobile                  |
| `ECoM-Web`   | Next.js 16, React 19, Tailwind CSS 4 + TypeScript | Aplicação web                      |
| `ECoM-Hardware` | ESP32 + MicroPython (ACS712 + YF-S201 + relé)  | Firmware de leitura dos sensores da maquete |
| `ECoM-Arduino`| ESP32 + Arduino C++                               | Firmware Serial + bridge para a maquete |

## Como rodar

### Backend
```bash
cd ECoM-Back
npm install
cp .env.example .env   # preencha DATABASE_URL com seu Postgres/Neon
npm run dev            # ou npm start
```
A API sobe em `http://localhost:3333` (defina `PORT` no `.env` para mudar). Na primeira execução o schema (tabelas) é criado automaticamente no banco. O backend usa **PostgreSQL** (testado com **Neon** serverless) — sem `pg`, rode `npm install pg`.

> Para Neon: crie um projeto em https://neon.tech → copie a connection string em **Pooled connection** e coloque em `DATABASE_URL` (ex.: `postgres://...ep-...-pooler...neon.tech/neondb?sslmode=require`). SSL vem via `DATABASE_SSL`. Dados são **persistentes** — diferentemente da versão antiga em memória.

### Mobile
```bash
cd ECoM-Mobile
npm install
npm start        # ou: npm run android / ios / web
```

Para testar no celular físico, copie `ECoM-Mobile/.env.example` para `ECoM-Mobile/.env` e informe o IP da rede local da máquina que executa a API. `localhost` no celular aponta para o próprio aparelho.

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
| PATCH  | `/ambientes/:id`   | Atualiza ambiente                          |
| DELETE | `/ambientes/:id`   | Remove ambiente                            |
| GET    | `/alertas`         | Lista alertas do usuário                   |
| POST   | `/alertas`         | Cria alerta (`mensagem`, opcional `nivel`/`tipo`) |
| PATCH  | `/alertas/:id`     | Marca alerta como lido (`lido: true`)      |

A API persiste dados em **PostgreSQL** (Neon) — `DATABASE_URL` no `.env`. As tabelas (`usuarios`, `sessoes`, `ambientes`, `consumo`, `alertas`, `tarifas`, `sensores`) são criadas sozinhas na primeira subida. Dados **sobrevivem** a reinícios (diferente da versão antiga em memória).

## Endpoints adicionais

| Método | Rota                         | Descrição                                        |
|--------|------------------------------|--------------------------------------------------|
| GET    | `/dashboard`                 | Estatísticas gerais (totais, custos, histórico, alertas) |
| GET    | `/tarifas`                   | Lista tarifas do usuário                         |
| POST   | `/tarifas`                   | Cria/atualiza tarifa (`tipo`, `valorPorUnidade`) |
| DELETE | `/tarifas/:id`               | Remove tarifa                                    |
| GET    | `/sensores`                  | Lista leituras de sensores                       |
| POST   | `/sensores`                  | Registra leitura de sensor e acumula consumo (`valor` em L para água ou kWh para energia) |
| GET    | `/sensores/ultimas/:ambienteId` | Últimas 50 leituras de um ambiente             |

> `POST /sensores` também gera alerta automático de consumo alto de energia e calcula custos usando as tarifas configuradas.

## Estado atual

- **Backend:** API funcional com autenticação (token SHA-256 persistido no banco, sessões em `sessoes`), consumo, ambientes, alertas, dashboard de estatísticas, tarifas e endpoint de sensores — tudo com **PostgreSQL (Neon)** — e tratamento de erro/404 em JSON.
- **Mobile:** navegação (Splash → Welcome → Login/Cadastro → abas); Login e Cadastro autenticam na API; Home, Alerts, Dashboard (gráficos), Environments (CRUD) e Controls (simulação de dispositivos) consomem dados reais do backend.
- **Web:** painel (dashboard) com login/registro, gráficos de consumo (Recharts), custos, alertas e página de ambientes com CRUD.
- **Hardware (ESP32):** `ECoM-Hardware` contém o firmware MicroPython com Wi-Fi e `ECoM-Arduino` contém a alternativa em Arduino C++ que envia leituras pela Serial ao bridge. Ambos suportam 5x ACS712, 3x YF-S201 e 1 relé.

> Nota: use um único gerenciador de pacotes (`npm`) — não commitar `yarn.lock` e `package-lock.json` juntos.
