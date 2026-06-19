# Patra Frontend

Vue 3 + Vite frontend for the **Patra Knowledge Base** — part of the [ICICLE](https://icicle.ai) AI Institute ecosystem (NSF Award #2112606, Indiana University).

Patra catalogs AI model cards and datasheets to support transparent, accountable AI/ML deployment at the edge. This app is the web interface for the catalog: anyone can browse the public records, and signed-in Tapis users can contribute by submitting and editing model cards and datasheets.

## Stack

- Vue 3 (Composition API), Vite 7, Pinia, Vue Router
- Tapis OAuth2 for authentication
- Tabler Icons for UI iconography

## Getting Started

```bash
cp .env.example .env   # adjust if needed
npm install
npm run dev            # targets the real REST API on :8000
```

## Environment

Copy `.env.example` and adjust if needed:

```bash
VITE_LIVE_API_BASE_URL=http://localhost:8000
```

## Architecture

```
patra-frontend (this app, :5173)
  └─► patra-kg REST API (:8000)  — FastAPI + PostgreSQL
  └─► Tapis                      — OAuth2 authentication
```

The backend API lives in the sibling `patra-kg` repository. See the root `CLAUDE.md` for the full system diagram.
