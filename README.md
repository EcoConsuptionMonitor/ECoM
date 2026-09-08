# ECoM

Sistema de controle de consumo de água e energia. Monorepo com três aplicações:

| Pasta        | Stack                                             | Descrição                          |
|--------------|---------------------------------------------------|------------------------------------|
| `ECoM-Back`  | Node.js, Express, dotenv, cors                    | API REST                          |
| `ECoM-Mobile`| React Native, Expo 54, React Navigation, charts   | Aplicativo mobile                  |
| `ECoM-Web`   | Next.js 16, React 19, Tailwind CSS 4 + TypeScript | Aplicação web                      |
| `ECoM-Hardware` | ESP32 + MicroPython (ACS712 + YF-S201 + relé)  | Firmware de leitura dos sensores da maquete |
| `ECoM-Arduino`| Arduino Uno (C++) (legado)                        | Versão anterior do firmware        |

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
| PATCH  | `/ambientes/:id`   | Atualiza ambiente                          |
| DELETE | `/ambientes/:id`   | Remove ambiente                            |
| GET    | `/alertas`         | Lista alertas do usuário                   |
| POST   | `/alertas`         | Cria alerta (`mensagem`, opcional `nivel`/`tipo`) |
| PATCH  | `/alertas/:id`     | Marca alerta como lido (`lido: true`)      |

A API usa **dados em memória** (sem banco de dados) — os dados são perdidos ao reiniciar o servidor.

## Endpoints adicionais

| Método | Rota                         | Descrição                                        |
|--------|------------------------------|--------------------------------------------------|
| GET    | `/dashboard`                 | Estatísticas gerais (totais, custos, histórico, alertas) |
| GET    | `/tarifas`                   | Lista tarifas do usuário                         |
| POST   | `/tarifas`                   | Cria/atualiza tarifa (`tipo`, `valorPorUnidade`) |
| DELETE | `/tarifas/:id`               | Remove tarifa                                    |
| GET    | `/sensores`                  | Lista leituras de sensores                       |
| POST   | `/sensores`                  | Registra leitura de sensor (Arduino) e acumula consumo |
| GET    | `/sensores/ultimas/:ambienteId` | Últimas 50 leituras de um ambiente             |

> `POST /sensores` também gera alerta automático de consumo alto de energia e calcula custos usando as tarifas configuradas.

## Estado atual

- **Backend:** API funcional com autenticação (token em memória), consumo, ambientes, alertas, dashboard de estatísticas, tarifas e endpoint de sensores, e tratamento de erro/404 em JSON.
- **Mobile:** navegação (Splash → Welcome → Login/Cadastro → abas); Login e Cadastro autenticam na API; Home, Alerts, Dashboard (gráficos), Environments (CRUD) e Controls (simulação de dispositivos) consomem dados reais do backend.
- **Web:** painel (dashboard) com login/registro, gráficos de consumo (Recharts), custos, alertas e página de ambientes com CRUD.
- **Hardware (ESP32):** firmware MicroPython para `ECoM-Hardware` — 5x ACS712 (corrente), 3x YF-S201 (fluxo de água), 1 relé (lâmpada) e bomba d'água. O ESP32 se conecta ao Wi-Fi e envia as leituras direto para a API (`POST /sensores`). Versão anterior (Arduino Uno + bridge) mantida em `ECoM-Arduino` como legado.

> Nota: use um único gerenciador de pacotes (`npm`) — não commitar `yarn.lock` e `package-lock.json` juntos.
