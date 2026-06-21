# RepoMind — GitHub Repository Assistant

AI-powered RAG assistant for understanding GitHub repositories. Clone, parse, embed, and chat with any codebase using Gemini and ChromaDB.

## Architecture

```
github-rag/
├── backend/          # Express API (Node.js + TypeScript)
│   └── src/
│       ├── config/       # Environment & database config
│       ├── controllers/  # Route handlers
│       ├── middleware/   # Error handling & validation
│       ├── models/       # MongoDB schemas
│       ├── routes/       # API routes
│       ├── services/     # Business logic
│       │   ├── github.service.ts      # Clone repositories
│       │   ├── parser.service.ts      # Parse & chunk source files
│       │   ├── embedding.service.ts   # Gemini embeddings & generation
│       │   ├── chroma.service.ts      # Vector storage & search
│       │   ├── rag.service.ts         # RAG chat pipeline
│       │   ├── docs.service.ts        # Documentation generation
│       │   ├── architecture.service.ts # Dependency analysis
│       │   └── indexing.service.ts    # Orchestration pipeline
│       └── utils/
├── frontend/         # Next.js 15 (React + TypeScript + TailwindCSS)
│   └── src/
│       ├── app/          # App Router pages
│       ├── components/   # UI components
│       ├── lib/          # API client & utilities
│       └── types/        # TypeScript types
└── docker-compose.yml    # MongoDB + ChromaDB
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (metadata), ChromaDB (vectors) |
| AI | Google Gemini API (embeddings + chat) |
| Validation | Zod |

## Features

- **Repository Indexing** — Paste a GitHub URL to clone, parse, chunk, and embed
- **RAG Chat** — Ask about code, architecture, functions, APIs with source citations
- **Documentation Generator** — README, API docs, onboarding guide, folder structure
- **Architecture View** — File tree, language distribution, dependency graph
- **Modern SaaS UI** — Dashboard, dark mode, responsive design

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- [Gemini API key](https://aistudio.google.com/apikey)

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and set GEMINI_API_KEY

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repositories` | Index a GitHub repository |
| GET | `/api/repositories` | List all repositories |
| GET | `/api/repositories/:id` | Get repository details |
| GET | `/api/repositories/:id/status` | Get indexing status |
| POST | `/api/repositories/:id/reindex` | Reindex repository |
| DELETE | `/api/repositories/:id` | Delete repository |
| POST | `/api/repositories/:id/chat` | RAG chat |
| POST | `/api/repositories/:id/docs` | Generate documentation |
| GET | `/api/repositories/:id/architecture` | Get architecture data |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/github-rag` |
| `CHROMA_HOST` | ChromaDB host | `localhost` |
| `CHROMA_PORT` | ChromaDB port | `8000` |
| `GEMINI_API_KEY` | Google Gemini API key | **required** |
| `GEMINI_MODEL` | Chat model | `gemini-2.0-flash` |
| `GEMINI_EMBEDDING_MODEL` | Embedding model | `text-embedding-004` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |

## Production Deployment

```bash
# Build
npm run build

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm start
```

For production, set `NODE_ENV=production` and use proper MongoDB/ChromaDB hosting.

## License

MIT
