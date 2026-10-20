# ECoM — Contexto do Projeto

> Este arquivo fornece contexto completo do monorepo **ECoM (EcoMonitor)** para outra IA ou desenvolvedor.
> Leia atentamente antes de fazer qualquer alteração no código.

## 1. O que é o projeto

O **ECoM** é um sistema de **monitoramento de consumo de água e energia** baseado em uma maquete física com sensores (ESP32). O fluxo completo é:

1. O **hardware** (ESP32 + MicroPython) lê sensores de corrente (ACS712) e fluxo de água (YF-S201) e envia leituras para a API.
2. O **backend** (Node.js/Express) armazena usuários, sessões (tokens), ambientes, consumo, alertas, tarifas e sensores em **PostgreSQL (Neon — serverless)** e expõe uma API REST.
3. Os apps **web** (Next.js) e **mobile** (React Native/Expo) consomem a API para exibir dashboards e gerenciar ambientes.

É um projeto educacional/simulação (sem Docker, sem CI/CD, sem testes) — mas o backend agora tem **banco de dados real e persistente**.

## 2. Estrutura do monorepo

```
ECoM/
├── README.md              # documentação principal (pt-BR)
├── ECoM-Back/             # API REST — Node.js + Express 5 (ES Modules)
├── ECoM-Mobile/           # App mobile — React Native 0.86 + Expo 57 + Expo Router (TypeScript)
├── ECoM-Web/              # App web — Next.js 16 + React 19 + TypeScript + Tailwind 4
├── ECoM-Hardware/         # Firmware atual — ESP32 + MicroPython (main.py)
└── ECoM-Arduino/          # Versão LEGADA — Arduino Uno C++ + bridge em Node.js
```

## 3. Stack de tecnologia

| Camada | Tecnologia |
|---|---|
| Backend | Node.js, **Express 5.2**, ES Modules, `pg`, `dotenv`, `cors`. **PostgreSQL (Neon/Neon)** — schema criado automaticamente. |
| Mobile | React Native 0.86, **Expo 57**, React 19.2, **Expo Router ~57** (file-based, TS strict), **AsyncStorage** (sessão persistida), `react-native-chart-kit`, `react-native-svg`. |
| Web | **Next.js 16.3** (App Router), React 19.2, TypeScript 5 (strict), Tailwind CSS 4, Recharts 3.10, ESLint 9. |
| Hardware | ESP32 + MicroPython (socket HTTP puro, sem bibliotecas). 5× ACS712 (corrente), 3× YF-S201 (fluxo), 1 relay, 1 bomba d'água, 1 botão. |
| Hardware Arduino | ESP32 (5x ACS712, 3x YF-S201, relé) + `bridge.js` (serialport → API). |

## 4. Arquitetura e fluxo de dados

```
ESP32 (ECoM-Hardware) ──POST /sensores (Bearer token, a cada 30s)──► ┐
Arduino legado (bridge.js) ──POST /consumo─────────────────────────► ECoM-Back (Express, porta 3333)
                                                                    └──► ECoM-Web (Next.js)
                                                                    └──► ECoM-Mobile (Expo)
                                                                        (ambos usam http://localhost:3333)
```

- **Hardware → Backend**: envia `{ambienteId, tipo, valor}` para `POST /sensores`. O backend grava a leitura, **cria automaticamente um registro de consumo**, calcula custo com base nas tarifas e **gera alerta "critico"** quando energia > 5.
- **Web/Mobile → Backend**: login via `POST /auth/login|register`, token no header `Authorization: Bearer <token>`.
- Web persiste auth no `localStorage`; mobile persiste token/usuário em **AsyncStorage** (`ecom_token`/`ecom_usuario`) — sessão sobrevive ao fechar o app.

## 5. Backend (ECoM-Back)

- **Entrada**: `src/index.js` → `src/app.js` → rotas em `src/routes/`. Banco em `src/lib/db.js` (`pg` Pool + `createSchema` que cria as tabelas no arranque) e tarifas em `src/lib/tarifas.js` (gravadas na tabela `tarifas` por usuário).
- **Auth** (`src/middleware/auth.js`): senha com hash **SHA-256**, token de 32 bytes aleatórios persistidos na tabela `sessoes`, comparação com `timingSafeEqual`; middleware `autenticar` é async/await. Ids são `SERIAL` (inteiro) e serializados como `String` (`reduzirX`) — mesmo formato de antes.
- **Rotas** (todas async/PostgreSQL, com transações em `consumo`/`sensores`):
  - `GET /health` — healthcheck
  - `POST /auth/register`, `POST /auth/login`, `GET /me`
  - CRUD `/ambientes` (GET lista com totais, GET um, POST, PATCH, DELETE)
  - `GET/POST /consumo` (filtros `tipo` ∈ {agua, energia} e `ambienteId`)
  - `GET/POST /alertas` (níveis: info, alerta, critico) + `PATCH /alertas/:id` para marcar lido
  - `GET /dashboard` — agrega totais, custos em R$, consumo do mês, histórico 30 dias, por ambiente, contagem de alertas, tarifas
  - `PUT/DELETE /tarifas` (unidades: R$/m³ para água, R$/kWh para energia; defaults 5.82 e 0.65)
  - `POST /sensores` (grava + cria consumo com `fonte: 'sensor'`, auto-alerta em energia > 5) e `GET /sensores/ultimas/:ambienteId`
- **Observações**:
  - `App.jsx` e `src/pages/` no ECoM-Back são **arquivos perdidos/perdidos** (código React Native), não são usados pelo backend.
  - CORS está aberto (`app.use(cors())`); `CORS_ORIGIN` do `.env.example` não é lido pelo código.

## 6. Web (ECoM-Web)

> **IMPORTANTE**: Next.js 16 tem mudanças que quebram código antigo — os arquivos `AGENTS.md`/`CLAUDE.md` alertam: "This is NOT the Next.js you know". A documentação relevante está em `node_modules/next/dist/docs/`.

- `src/app/layout.tsx` — layout raiz com `AuthProvider`.
- `src/app/page.tsx` — **Dashboard** (346 linhas, client component): modal de login/cadastro quando não autenticado; quando autenticado mostra 4 cards de métricas (energia, água, custo, alertas ativos), custo do mês, 2 gráficos de linha (kWh/dia e L/dia), pie de proporção, barra por ambiente e lista de alertas recentes (coloridos por criticidade). Usa **Recharts**.
- `src/app/ambientes/page.tsx` — CRUD completo de ambientes (232 linhas), modal de criar/editar (`nome` obrigatório, `localizacao`/`descricao` opcionais), exclusão com confirmação.
- `src/components/NavBar.tsx` — navegação Dashboard/Ambientes + logout.
- `src/lib/api.ts` — wrapper fetch tipado + interfaces TypeScript.
- `src/lib/auth-context.tsx` — contexto de auth com persistência em `localStorage` (`ecom_token`, `ecom_usuario`).
- URL da API: `NEXT_PUBLIC_API_URL` (default `http://localhost:3333`).

## 7. Mobile (ECoM-Mobile) — reescrito com Expo Router + TypeScript

> Refatoração completa (out/2026): o app antigo (JSX + React Navigation, dois temas visuais, 6/8 telas quebradas por chamadas `api()` errôneas) foi substituído por uma base TypeScript estrita com Expo Router.

- **Estrutura de rotas** (`app/`, file-based):
  - `app/_layout.tsx` — `AuthProvider` + auth-guard (redirect baseado em sessão) + splash nativo (`expo-splash-screen`).
  - `app/index.tsx` — redirect inicial para `(auth)/welcome`.
  - `app/(auth)/` — `welcome`, `login`, `cadastro` (cadastro agora **envia `telefone`**, antes era descartado).
  - `app/(app)/_layout.tsx` — bottom tabs: `index` (Início), `dashboard`, `controles`, `ambientes`, `alertas`.
  - `app/perfil.tsx` — tela de conta fora das tabs (acessada do Home).
- **Camada de serviços** (`src/services/`):
  - `api.ts` — fetch wrapper tipado com `ApiError`, injeta Bearer do token em memória; objeto `api` com métodos nomeados (`login`, `getDashboard`, `enviarSensor`, ...) — todos com `JSON.stringify` correto.
  - `session.ts` — token/usuário em módulo + **AsyncStorage** (`carregarSessao`/`salvarSessao`/`limparSessao`).
- **Contexto**: `src/context/auth.tsx` — `AuthProvider` com `entrar`/`registrar`/`sair`/`recarregarUsuario`; hidrata sessão no boot.
- **Tipos**: `src/types.ts` — interfaces espelhando o contrato real do backend (ids `string`, `Dashboard.totais/mes/alertas/historico/consumoPorAmbiente/alertasRecentes/tarifas`).
- **Tema único**: `src/styles/theme.ts` — paleta "eco-clara" (fundo `#F5F6F1`, floresta `#16352B`, verde `#3E8D62`, água `#3478C5`) + `espacamento`/`raio`. O tema neon-escuro antigo foi removido.
- **Componentes** (`src/components/`): `Botao`, `Campo` (input com label/erro), `Carregando`, `Vazio` (empty state).
- **Telas**:
  - **Início**: saudação, custo acumulado (hero), métricas energia/água, resumo de alertas, 3 alertas recentes, pull-to-refresh.
  - **Análises**: `/dashboard` com seletor de período **funcional** (7/14/30 dias — filtra o `historico` do servidor, antes era cosmético), LineCharts/Pie/Bar em cores do tema, legenda manual no bar chart.
  - **Alertas**: colorido por nível, `PATCH /alertas/:id` marca lido.
  - **Ambientes**: CRUD em Modal (teclado tratado), ícones por palavra-chave (Ionicons), totais por ambiente.
  - **Controles**: 9 dispositivos (6 energia / 3 água), **seletor de ambiente de destino** (antes sempre usava `ambientes[0]`), envio corrigido (antes o alerta de erro era mostrado após sucesso — bug invertido), custo/hora com tarifas reais do dashboard.
  - **Perfil**: `/auth/me` (rota correta — antes o helper apontava para `/me`), logout que limpa AsyncStorage.
- **Config**: `app.json` com `scheme: "ecom"`, bundle ids, `experiments.typedRoutes`; `package.json` com `main: "expo-router/entry"`; `tsconfig.json` strict.
- Em dispositivo físico, usar o IP da LAN via `EXPO_PUBLIC_API_URL` (`.env`).

## 8. Hardware (ECoM-Hardware — firmware atual)

- `main.py` — firmware completo: leitura de sensores + Wi-Fi + POST HTTP via socket puro.
- `config.example.json` — Wi-Fi, URL da API, token, `ambienteId`, intervalos de leitura/envio, sensibilidade ACS712, divisor de tensão.
- ACS712: divisor de tensão (`divisor_tensao`), calibração de offset por canal, corrente RMS via amostragem; energia `P = I × V` (default 127 V) convertida para kWh.
- YF-S201: interrupções de hardware (450 pulsos/L), vazão em L/min.
- Relay (pin 26) controlado por botão (pin 4, debounce); bomba d'água (pin 25) via transistor, liga no boot.
- Envia a cada 30 s para `POST /sensores` com Bearer token; acumuladores zeram apenas em envio bem-sucedido (200/201).
- **Importante**: usar o IP da LAN da máquina, **não localhost**.

## 9. Hardware Arduino (ECoM-Arduino)

- `ecom_sensors.ino` — sketch para ESP32: 5 ACS712 (GPIO 32, 33, 34, 35 e 4), 3 YF-S201 (GPIO 25, 26 e 27) e relé (GPIO 18). Imprime JSON com corrente, fluxo, energiaKwh, aguaLitros e estado do relé a cada 30 s, a 9600 baud.
- `bridge.js` — Node + `serialport`: lê o serial, filtra linhas JSON e posta em `POST /consumo` (não `/sensores`) com `AMBIENTE_ID` e token (env/CLI).

## 10. Comandos

| Subprojeto | Comandos |
|---|---|
| Backend | `cd ECoM-Back && npm install && npm run dev` (node --watch). API em `http://localhost:3333`. |
| Web | `cd ECoM-Web && npm install && npm run dev`. Lint: `npm run lint`. Build: `npm run build`. |
| Mobile | `cd ECoM-Mobile && npm install && npm start` (ou `npm run android`/`ios`/`web`). Typecheck: `npx tsc --noEmit`. `npx expo-doctor` valida. |
| Hardware | Flash MicroPython via `esptool.py` + `mpremote connect COMx fs cp boot.py main.py config.json :`. Criar `config.json` a partir do exemplo. |
| Arduino ESP32 | Upload via Arduino IDE; `cd ECoM-Arduino && node bridge.js COM3 SEU_TOKEN`. |

**Não existem testes automatizados em nenhum subprojeto.**

## 11. Configuração e observações importantes

- Sem Docker, sem CI/CD, sem banco de dados (dados em memória — **perdem-se ao reiniciar o backend**). README recomenda NÃO misturar yarn.lock e package-lock.json — todos os 3 subprojetos usam npm/package-lock.json hoje.
- `.gitignore` raiz ignora `.env*` (exceto `.env.example`), `dist/`, `build/`, `.playwright-cli/`, nós do Arduino. O hardware ignora `config.json` (segredos locais).
- **Segurança mínima (projeto educacional):** SHA-256 (não bcrypt) para senhas, tokens sem expiração, CORS aberto.
- O hardware envia água em **litros** mas as tarifas são em **R$/m³**; o backend converte (fator 1/1000).
- Tarifas default duplicadas em dois lugares do backend (dashboard `5.82`/`0.65` e rota de sensores). O mobile Controls agora lê as tarifas reais do `/dashboard` (o valores antigos `0.00065`/W foram removidos na refatoração).

## 12. Convenções a seguir ao editar

- Backend: ES Modules (`import/export`), estilo já usado nas rotas existentes, sem comentários desnecessários.
- Web: client components (`'use client'`), TypeScript estrito, `@/*` → `./src/*`, Tailwind/Recharts conforme páginas existentes.
- Mobile: **TypeScript estrito**, Expo Router (telas em `app/`, imports relativos `../../src/...`), tema/espacamento de `src/styles/theme.ts`, componentes de `src/components/`, UI em pt-BR. Verificar com `npx tsc --noEmit`.
- Não adicionar testes sem antes perguntar (não há framework de teste configurado).
- Idioma do código/UI: português (pt-BR).
