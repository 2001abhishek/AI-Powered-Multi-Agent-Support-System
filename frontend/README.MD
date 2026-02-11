# Swades AI — Multi-Agent Support System

AI-powered customer support with a Router Agent that delegates to specialized sub-agents (Support, Order, Billing), each with database-backed tools.

## Architecture

```
User → Frontend (Next.js) → Backend (Hono.js, Port 8000)
                                 ├── Auth (JWT + bcrypt)
                                 ├── Rate Limiting (IP-based, sliding window)
                                 └── Multi-Agent System (Vercel AI SDK)
                                      ├── Router Agent → classifies intent
                                      ├── Support Agent → queryConversationHistory
                                      ├── Order Agent → fetchOrder, trackOrder, cancelOrder, createOrder
                                      └── Billing Agent → getInvoice, checkRefund
                                           ↕
                                      PostgreSQL (Drizzle ORM)
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, shadcn/ui |
| Backend | Hono.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| AI | Vercel AI SDK, Groq (LLaMA 3.3 70B) |
| Auth | JWT, bcrypt |

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Backend

```bash
cd backend
npm install
```

Create `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/swades_ai
GROQ_API_KEY=your_groq_api_key
```

```bash
npm run db:push    # Push schema to DB
npm run db:seed    # Seed demo data
npm run dev        # Start on port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Start on port 3000
```

### Demo Credentials
```
Email: demo@swades.ai
Password: password123
```

## API Routes

```
/api/auth       POST /signup, /login, /logout
/api/chat       POST /messages, /messages/stream
                GET /conversations, /conversations/:id
                DELETE /conversations/:id
/api/agents     GET /, /:type/capabilities
/api/health     GET /
/docs           Swagger UI
```

## Key Features
- **Multi-Agent Routing** — AI classifies intent, keyword fallback
- **Agent Tools** — 7 tools querying real PostgreSQL data
- **Streaming (SSE)** — Real-time token-by-token AI responses
- **Rate Limiting** — 100/min API, 10/min auth, 20/min chat
- **Rich UI Cards** — Order & invoice cards rendered from tool results
- **Conversation Persistence** — Full history stored in DB
- **Prompt Optimization** — Strict capability/limitation boundaries per agent
