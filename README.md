# RepoMind

RepoMind is an AI-powered GitHub repository assistant that uses Retrieval-Augmented Generation (RAG) to help developers understand unfamiliar codebases.

Paste a GitHub repository URL and RepoMind:

1. clones the repository
2. filters and parses relevant files
3. splits source into searchable chunks
4. generates embeddings with Gemini
5. stores embeddings in ChromaDB
6. retrieves relevant code for each question
7. generates a grounded answer with Gemini
8. returns file and line-level citations
9. persists chat sessions in MongoDB

The goal is not just to generate an answer, but to make the answer traceable back to the repository.

---

## Features

### RAG Chat

Ask questions about:

- code behavior
- architecture
- functions
- APIs
- onboarding
- implementation details

Answers are generated from retrieved repository context and include source citations.

### Chat Modes

RepoMind provides focused modes for:

- Explain
- Architecture
- Function
- API
- Onboarding

### Repository Indexing

Repositories are cloned and indexed automatically.

The indexing pipeline filters irrelevant files and limits very large files before chunking and embedding.

### Source Citations

RAG responses include:

- file path
- start line
- end line
- source snippet
- retrieval score

### Documentation

RepoMind can generate repository documentation such as:

- README
- API documentation
- onboarding documentation
- folder structure information

### Architecture View

The application exposes repository architecture/dependency information through a dedicated UI.

### Persistent Chat Sessions

Chat sessions are stored in MongoDB and associated with the repository they belong to.

---

## Architecture

```text
                        ┌─────────────────────┐
                        │      Next.js UI      │
                        │  React + TypeScript  │
                        └──────────┬──────────┘
                                   │ HTTP
                                   ▼
                        ┌─────────────────────┐
                        │   Express Backend   │
                        │    TypeScript API   │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
       │   MongoDB   │      │  ChromaDB   │     │   Gemini    │
       │ metadata +  │      │ embeddings +│     │ embeddings +│
       │ chat        │      │ retrieval   │     │ generation  │
       └─────────────┘      └─────────────┘     └─────────────┘
                                   ▲
                                   │
                           repository chunks
                                   ▲
                                   │
                        ┌─────────────────────┐
                        │  GitHub repository  │
                        │ clone + parse/filter│
                        └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (metadata + chat), ChromaDB (embeddings + retrieval) |
| AI | Google Gemini API (embeddings + generation) |
| Auth | bcrypt password hashing + JWT session cookie |
| Validation | Zod |
| Testing | Node's built-in test runner (`node:test`), run via `tsx` |

---

## Authentication

RepoMind sits behind a **single demo login**, not a multi-tenant account system. That's a deliberate scope decision: the goal is to stop a public deployment from being usable anonymously (which would let a stranger burn your Gemini quota and clone repositories on your infrastructure) without building a full multi-tenant data model this project doesn't otherwise need.

- Credentials live in environment variables: `AUTH_EMAIL` (plaintext - it isn't a secret) and `AUTH_PASSWORD_HASH` (a bcrypt hash; the plaintext password is never stored anywhere, including in this repo).
- Generate the hash with `cd backend && npm run hash-password -- "your-chosen-password"` and paste the output into `AUTH_PASSWORD_HASH`.
- Successful login issues a JWT (signed with `JWT_SECRET`) in an **httpOnly, SameSite=Lax cookie** (`Secure` as well when `NODE_ENV=production`). httpOnly means frontend JavaScript can never read the token directly, which is why a cookie is used instead of `localStorage`.
- Every repository/chat/docs route requires a valid session. `POST /api/auth/login` and `GET /api/health` are the only public routes.
- Login is rate-limited (10 attempts / 15 minutes per IP) since there is exactly one valid password in this system.
- The frontend's route redirect to `/login` when unauthenticated is UX only - the actual security boundary is the backend's `requireAuth` middleware, enforced regardless of what the frontend does.

## Security Hardening

- **Rate limiting**: login (10/15min) and every endpoint that triggers real cost - repository indexing, reindex, chat, docs generation (30/hour) - via in-memory `express-rate-limit`. No Redis: this is a single-instance deployment with no horizontal scaling in scope.
- **Security headers**: `helmet` (X-Content-Type-Options, X-Frame-Options, HSTS in production, etc.), with `crossOriginResourcePolicy` disabled since the frontend and backend are intentionally on different origins.
- **CORS**: origin locked to `FRONTEND_URL`, `credentials: true` (required for the session cookie to work cross-origin).
- **Input validation**: Zod on every request body; ObjectId format validated on every `:id`/`:sessionId` route param before it reaches Mongoose, so a malformed id returns a clean 400 instead of an uncaught `CastError`.
- **Session isolation**: chat session lookups are scoped to the repository they were created under, not just by session id.
- **Provider error classification**: Chroma/Gemini/GitHub failures are classified into clean, correctly-coded errors; raw SDK/driver error text is logged server-side only, never sent to the client.
- **No secrets in logs**: audited - nothing logs request bodies, passwords, tokens, or the raw values behind a failed environment validation (only field names).

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (local development)
- A [Gemini API key](https://aistudio.google.com/apikey)

## Local Setup

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` and set:
- `GEMINI_API_KEY` - your Gemini API key
- `AUTH_EMAIL` - the login email you'll use
- `AUTH_PASSWORD_HASH` - run `cd backend && npm run hash-password -- "your-password"` and paste the output
- `JWT_SECRET` - a long random string, e.g. `openssl rand -base64 48`

```bash
# 3. Install dependencies and run
npm install
cd backend && npm run dev     # in one terminal
cd frontend && npm run dev    # in another
```

- Frontend: http://localhost:3000 (redirects to `/login` until you sign in)
- Backend API: http://localhost:4000

### Running tests

```bash
cd backend && npm test
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required? | Default |
|----------|-------------|:---:|---------|
| `PORT` | API server port | No | `4000` |
| `NODE_ENV` | `development` or `production` - controls the session cookie's `Secure` flag | No | `development` |
| `MONGODB_URI` | MongoDB connection string | **Yes** | - |
| `CHROMA_HOST` / `CHROMA_PORT` | ChromaDB host/port | No | `127.0.0.1` / `8000` |
| `GEMINI_API_KEY` | Google Gemini API key | **Yes** | - |
| `GEMINI_MODEL` | Chat model | No | see `.env.example` |
| `GEMINI_EMBEDDING_MODEL` | Embedding model | No | see `.env.example` |
| `REPOS_DIR` | Local clone directory | No | `./data/repos` |
| `FRONTEND_URL` | CORS origin - must exactly match your deployed frontend URL | No | `http://localhost:3000` |
| `AUTH_EMAIL` | Demo login email | **Yes** | - |
| `AUTH_PASSWORD_HASH` | bcrypt hash - generate with `npm run hash-password` | **Yes** | - |
| `JWT_SECRET` | Signs the session cookie (16+ characters) | **Yes** | - |

Backend startup **fails fast** - it refuses to start, with a clear log message, if any required variable above is missing. It will never silently run in a partially-configured or unprotected state.

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |

## Production Deployment

### Frontend on Vercel

1. Import `frontend/` as a Vercel project.
2. Set `NEXT_PUBLIC_API_URL` to your Render backend's public URL + `/api` (e.g. `https://repomind-api.onrender.com/api`).
3. Deploy.

### Backend on Render

1. Deploy `backend/` as a Render Web Service (`npm run build` as the build command, `npm start` as the start command).
2. Render sets `PORT` automatically, and the server already binds `0.0.0.0` explicitly.
3. Set all **required** backend env vars above, especially `FRONTEND_URL` (your exact Vercel URL - both the CORS origin and relevant to cookie behavior) and `NODE_ENV=production` (enables the session cookie's `Secure` flag, required for it to be honored over HTTPS).
4. Point `MONGODB_URI` at a MongoDB Atlas connection string (see below).
5. Point `CHROMA_HOST`/`CHROMA_PORT` at a **hosted, persistent** Chroma instance (see below) - Render's filesystem is ephemeral.
6. Point Render's health check at `GET /api/health`, which is intentionally public/unauthenticated.

### MongoDB Atlas

Create a free-tier Atlas cluster, add a database user, allow-list Render's outbound IPs (or `0.0.0.0/0` for simplicity in a demo, understanding the trade-off), and use the resulting connection string as `MONGODB_URI`.

### Chroma deployment requirement

ChromaDB needs a persistently running process with persistent disk storage - it cannot run as a stateless Render web service without a paid persistent-disk add-on, and this codebase has no managed Chroma-Cloud integration today. Practical options:
- A small always-on VM (Fly.io, a cheap DigitalOcean droplet, Render with a persistent disk) running `chromadb/chroma` via Docker, matching the `docker-compose.yml` service already in this repo.
- A managed vector-DB-as-a-service, which would require replacing `chroma.service.ts`'s client - not implemented here, since that's a genuine architecture change, not a deployment-configuration one.

### Gemini API

`GEMINI_API_KEY` is backend-only. It is never sent to or exposed in the frontend bundle - only `NEXT_PUBLIC_*`-prefixed variables are ever exposed by Next.js, and no Gemini key is prefixed that way anywhere in this codebase.

## Known Limitations

- **Single-user auth, not multi-tenant.** There is one login for the whole app - a deliberate scope decision, not an oversight.
- **Chroma has no managed hosting story in this codebase** - see "Chroma deployment requirement" above.
- **Rate limits are in-memory**, so they reset on every backend restart/redeploy and don't share state across multiple instances. Fine for a single-instance demo; would need a shared store for real horizontal scaling.

