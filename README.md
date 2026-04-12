# Swades AI Support System

A production-ready, full-stack **AI-powered customer support system** with multi-agent architecture, real-time streaming, user dashboard, and a modern UI — built for the Swades AI assessment.

![Hono](https://img.shields.io/badge/Hono-FF6D00?logo=hono&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-000000?logo=vercel&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

---

## 🚀 Features

### Multi-Agent System
- **Router Agent** — Classifies incoming queries via LLM intent analysis + keyword fallback (dual-strategy) and delegates to the correct specialist
- **Order Agent** — Tracks orders, delivery status, shipping info, tracking numbers via database tools
- **Billing Agent** — Invoice lookup, payment history, refund status via database tools
- **Support Agent** — FAQ answers, help articles, general support via knowledge base search
- **Tool-Based Data Access** — All agents use structured tools to query real data (zero hallucinations)
- **Conversation Context** — Full conversation history maintained across messages for accurate, personalized responses

### Streaming & Real-Time UX
- **Real-time Streaming** — AI responses streamed to client via Hono SSE
- **AI Reasoning Display** — Live streaming phases: Analyzing → Thinking → Searching → Responding
- **Typing Indicator** — Real-time "agent is typing" feedback
- **Quick Replies** — Interactive pill buttons for selecting options (e.g., specific orders, confirmation)

### User Dashboard
- **Profile Management** — View/edit personal info, change password with current password verification
- **Order History** — Full order table with status badges, delivery tracking, tracking numbers
- **Invoice History** — Invoice table with refund status badges, payment methods, download links
- **Chat History** — Browse and revisit past conversations

### Homepage & Navigation
- **Floating Navbar** — Rounded, semi-transparent navbar with backdrop-blur and scroll-spy section highlighting
- **Warm Earthy Design** — swades.ai-inspired aesthetic with brown/terracotta gradient hero section
- **Dynamic FAQ** — Fetches real support articles from the database via API
- **Responsive Design** — Mobile hamburger menu, adaptive layouts for all screen sizes
- **Auth-Aware Navigation** — Shows Dashboard/Open Chat when logged in, Sign In/Get Started when logged out

### Agent Interactions
- **Human-in-the-Loop (HITL)** — Agents ask for confirmation before bulk data retrieval or sensitive actions
- **Escalation Handoff** — Seamless transition to human support with specialized UI banners
- **Smart Disambiguation** — Numbered lists when multiple records match a query
- **Empty Chat Prevention** — Prevents empty conversations from cluttering history

### Bonus Features (Assessment)
- **Hono RPC + Monorepo** — End-to-end type safety via `hc<AppType>`
- **Turborepo** — Monorepo management with caching and parallel execution
- **useworkflow.dev** — Durable execution for ticket escalation workflows via Nitro
- **Rate Limiting** — Per-IP rate limiting with `X-RateLimit-Remaining` and `Retry-After` headers
- **Unit/Integration Tests** — Vitest tests for agent routes, billing tools, context compactor, health, workflow
- **Context Compaction** — Summarizes older messages when conversations exceed token limits
- **AI Reasoning Display** — Streaming phase indicators (Thinking, Searching, etc.)
- **Dark/Light Mode** — Full theme toggle support
- **Deployed Live Demo** — Cloud deployment on Vercel + Neon

### Error Handling
- **Structured LLM Error Classification** — Rate limit, API key, model unavailable, context overflow, timeout, CORS
- **User-Friendly Error Messages** — Specific messages for each error type
- **Retry Button** — For transient errors (rate limit, network, model unavailable)
- **Error Banners** — Visual error display with destructive styling

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS + Shadcn UI |
| **Backend** | Hono.dev + Nitro + Node.js + TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | Vercel AI SDK (multi-provider: Gemini 2.5 / OpenAI / Anthropic / Ollama) |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Auth** | JWT (access + refresh tokens) + bcrypt |
| **Type Safety** | Hono RPC (`hc<AppType>`) |
| **Workflow** | useworkflow.dev + Nitro |
| **Testing** | Vitest |
| **Animation** | Framer Motion |

---

## 📁 Project Structure

```
swades-ai-support-system/
├── apps/
│   ├── api/                        # Hono backend (port 3000)
│   │   ├── src/
│   │   │   ├── agents/             # Multi-agent system
│   │   │   │   ├── base/           # BaseAgent abstract class
│   │   │   │   ├── router.agent.ts # Intent classifier + delegator
│   │   │   │   ├── support.agent.ts
│   │   │   │   ├── order.agent.ts
│   │   │   │   └── billing.agent.ts
│   │   │   ├── controllers/        # HTTP controllers (chat, auth, agents)
│   │   │   ├── routes/             # Hono route definitions
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── chat.routes.ts
│   │   │   │   ├── agents.routes.ts
│   │   │   │   ├── orders.routes.ts
│   │   │   │   ├── billing.routes.ts
│   │   │   │   ├── profile.routes.ts   # User profile CRUD + password change
│   │   │   │   ├── articles.routes.ts  # Public support articles API
│   │   │   │   ├── workflow.routes.ts
│   │   │   │   └── health.routes.ts
│   │   │   ├── services/
│   │   │   │   ├── auth/           # Auth service (JWT, bcrypt, token rotation)
│   │   │   │   └── conversation/
│   │   │   │       ├── chat.service.ts       # Message routing + streaming
│   │   │   │       └── context-compactor.ts  # Token limit management
│   │   │   ├── tools/              # Agent tools (order, billing, support, conversation)
│   │   │   ├── middleware/         # Auth, CORS, rate limiting, error handling, logger
│   │   │   ├── config/            # AI provider config, environment validation
│   │   │   ├── db/                # Drizzle schema + relations
│   │   │   └── lib/               # DB client, JWT utilities
│   │   ├── drizzle/               # Migrations + seed script
│   │   ├── __tests__/             # Unit & integration tests
│   │   ├── nitro.config.ts        # Nitro config (workflow module, routes)
│   │   └── package.json
│   │
│   └── web/                        # Vite + React frontend (port 5173)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── HomePage.tsx         # Landing page with scroll-spy nav
│       │   │   ├── AuthPage.tsx         # Login / Register
│       │   │   ├── ChatPage.tsx         # AI chat interface
│       │   │   └── dashboard/
│       │   │       ├── DashboardLayout.tsx
│       │   │       ├── ProfilePage.tsx   # Profile edit + password change
│       │   │       ├── OrdersPage.tsx    # Order history with tracking
│       │   │       ├── InvoicesPage.tsx  # Invoice history with refund status
│       │   │       └── ChatHistoryPage.tsx
│       │   ├── components/
│       │   │   ├── chat/           # Chat UI, message bubbles, sidebar, typing indicator
│       │   │   ├── layout/         # App header (with homepage link), theme toggle
│       │   │   ├── auth/           # Login/Register forms
│       │   │   └── ui/             # Shadcn UI components
│       │   ├── hooks/              # useChat, useConversations, useToast
│       │   └── lib/                # API client, auth store (Zustand), types
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD pipeline
├── docker-compose.yml              # Local PostgreSQL
├── vercel.json                     # Vercel monorepo deployment config
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml
└── README.md
```

---

## 🛠️ Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **pnpm** — `npm install -g pnpm`
- **Docker** (for local PostgreSQL) or a cloud PostgreSQL instance
- **AI Provider API Key** — One of:
  - Google Gemini API key (default, free tier available)
  - OpenAI API key
  - Anthropic API key
  - Ollama running locally (free, no API key needed)

---

## 📦 Setup & Installation

### 1. Clone & Install

```bash
git clone <repository-url>
cd swades-ai-support-system
pnpm install
```

### 2. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

#### API Environment (`apps/api/.env`)

```env
# AI Provider: gemini | openai | anthropic | ollama
AI_PROVIDER=gemini

# AI API Keys (only the active provider's key is required)
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Ollama (local) config — only needed when AI_PROVIDER=ollama
AI_API_KEY=ollama_local_key_placeholder
AI_BASE_URL=http://localhost:11434

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/support_system

# JWT Secrets (use strong random strings in production)
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRY="30m"
JWT_REFRESH_EXPIRY="7d"

# Server
PORT=3000
NODE_ENV="development"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
```

#### Web Environment (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Start PostgreSQL via Docker
docker compose up -d

# Push schema to database
cd apps/api
npx drizzle-kit push

# Seed demo data
node --import tsx/esm drizzle/seed.ts
```

### 4. Run Development Servers

```bash
# From root — starts both API and Web concurrently
cd ../.. #to return to the Project root folder (only if not in root folder)
pnpm dev
```

> [!TIP]
> If `pnpm dev` fails with `failed to openpty`, start services individually:
> ```bash
> pnpm dev:api   # Terminal 1 — Backend on port 3000
> pnpm dev:web   # Terminal 2 — Frontend on port 5173
> ```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:3000](http://localhost:3000) |
| Health Check | [http://localhost:3000/api/health](http://localhost:3000/api/health) |

**Demo Credentials:** `sayam@swades.ai` / `Swades@123!`

---

## 🤖 AI Provider Configuration

Switch providers by setting `AI_PROVIDER` in `apps/api/.env`:

| Provider | Router Model | Agent Model | Requires |
|----------|-------------|-------------|----------|
| `gemini` | gemini-2.5-flash-lite | gemini-2.5-flash | `GOOGLE_GENERATIVE_AI_API_KEY` |
| `openai` | gpt-4o-mini | gpt-4o | `OPENAI_API_KEY` |
| `anthropic` | claude-3-5-sonnet | claude-3-5-sonnet | `ANTHROPIC_API_KEY` |
| `ollama` | gemma3 | gemma3 | Ollama running locally |

For Ollama (free, local):
```bash
ollama serve

ollama pull gemma3 # or,
ollama pull gemma3:12b

ollama pull qwen3:4b
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run API tests only
cd apps/api && pnpm test
```

Test coverage includes:
- Agent routes & capabilities
- Billing tools
- Context compactor
- Health endpoint
- Workflow escalation

---

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **Auth** |
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login (returns JWT + sets refresh cookie) |
| POST | `/api/auth/refresh` | 🔑 | Refresh access token |
| POST | `/api/auth/logout` | 🔑 | Logout (clears refresh token) |
| **Chat** |
| POST | `/api/chat/messages` | 🔑 | Send message (streaming SSE response) |
| GET | `/api/chat/conversations` | 🔑 | List user's conversations |
| GET | `/api/chat/conversations/:id` | 🔑 | Get conversation + messages |
| DELETE | `/api/chat/conversations/:id` | 🔑 | Delete conversation |
| **Profile** |
| GET | `/api/profile` | 🔑 | Get current user profile |
| PUT | `/api/profile` | 🔑 | Update name & phone number |
| PUT | `/api/profile/password` | 🔑 | Change password (requires current) |
| **Data** |
| GET | `/api/orders` | 🔑 | Get user's orders |
| GET | `/api/orders/:orderNumber` | 🔑 | Get specific order |
| GET | `/api/billing` | 🔑 | Get user's invoices |
| GET | `/api/billing/:invoiceNumber` | 🔑 | Get specific invoice |
| **Public** |
| GET | `/api/agents` | ❌ | List available agents |
| GET | `/api/agents/:type/capabilities` | ❌ | Get agent capabilities |
| POST | `/api/agents/classify` | ❌ | Classify query intent |
| GET | `/api/articles` | ❌ | Get support articles (for FAQ) |
| POST | `/api/workflow/escalate` | ❌ | Trigger ticket escalation |
| GET | `/api/health` | ❌ | Health check |

---

## ☁️ Cloud Deployment Guide

### Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Vercel     │────▶│   Vercel     │────▶│  Neon         │
│   (Frontend) │     │   (Backend)  │     │  (PostgreSQL) │
│   React/Vite │     │ Hono + Nitro │     │  Serverless   │
└─────────────┘     └──────────────┘     └───────────────┘
```

#### System Flow

![System Flow](apps/web/public/system-flow.png)


### GitHub Actions CI/CD

Create `.github/workflows/ci.yml` for automated testing and deployment:

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel organization/team ID |
| `VERCEL_API_PROJECT_ID` | Vercel project ID for the backend |
| `VERCEL_WEB_PROJECT_ID` | Vercel project ID for the frontend |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key (for tests) |



## 🔒 Security

#### Authentication Flow

![Authentication Flow](apps/web/public/authentication-flow.png)

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT access tokens (30 min) + httpOnly refresh token cookies |
| **Password Storage** | bcrypt with salt rounds = 12 |
| **Token Rotation** | Refresh token rotation on each use |
| **Rate Limiting** | Per-IP with `Retry-After` and `X-RateLimit-Remaining` headers |
| **CORS** | Explicit origin whitelist via `CORS_ORIGIN` env var |
| **Input Validation** | Zod schemas on all endpoints |
| **Error Safety** | Middleware strips stack traces in production |
| **Password Changes** | Requires current password verification |

---

## 🏗️ Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Multi-Agent over single prompt** | Separation of concerns, testability, extensibility |
| **Tool-only DB access** | Prevents LLM hallucinations, auditable data flow |
| **Drizzle over Prisma** | Lighter, better TypeScript inference, SQL-like API |
| **Hono over Express** | Edge-ready, fastest startup, built-in RPC for type safety |
| **Vercel AI SDK** | Native streaming, multi-provider, structured tool calling |
| **Context Compaction** | Handles free-tier token limits via conversation summarization |
| **Nitro** | Universal deployment (Node, Vercel, Cloudflare), bundles useworkflow.dev |
| **Zustand** | Lightweight state management for auth, persisted to localStorage |

---

## 🛟 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` on port 5432 | Start Docker: `docker compose up -d` |
| `database "support_system" does not exist` | A local PostgreSQL may be shadowing Docker on port 5432. Run `brew services stop postgresql` (or `postgresql@16`) then retry |
| `relation "messages" does not exist` | Run `npx drizzle-kit push` to create tables |
| `API key missing` error | Check `AI_PROVIDER` matches the key set in `.env` |
| Rate limit errors | Wait 60s or increase `RATE_LIMIT_MAX_REQUESTS` |
| `EPERM` when running `pnpm db:seed` | Use `node --import tsx/esm drizzle/seed.ts` instead |
| `failed to openpty` with `pnpm dev` | Use `pnpm dev:api` + `pnpm dev:web` separately |
| CORS errors in browser | Set `CORS_ORIGIN` in backend `.env` to match frontend URL |

---

## 📝 License


---
