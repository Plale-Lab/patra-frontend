# Patra Frontend

Vue 3 + Vite frontend for the **Patra Knowledge Base** — part of the [ICICLE](https://icicle.ai) AI Institute ecosystem (NSF Award #2112606, Indiana University).

Patra catalogs AI model cards and datasheets to support transparent, accountable AI/ML deployment at the edge. This app provides the admin panel for browsing, submitting, and reviewing those assets, managing support tickets, and exploring the public catalog.

## Stack

- Vue 3 (Composition API), Vite 7, Pinia, Vue Router
- Tapis OAuth2 for authentication
- Tabler Icons for UI iconography

## Getting Started

```bash
cp .env.example .env   # adjust if needed
npm install
npm run dev:live       # targets the real REST API on :8000
```

## Modes

| Command | Description |
|---|---|
| `npm run dev:live` | Normal mode — targets the real Patra KG REST API |
| `npm run dev:mock` | Test mode — targets the local mock server on :5003 |

The runtime API mode can also be switched from the app header.

## Environment

Copy `.env.example` and adjust if needed:

```bash
VITE_DEFAULT_API_MODE=live          # "live" or "mock"
VITE_LIVE_API_BASE_URL=http://localhost:8000
VITE_MOCK_API_BASE_URL=http://localhost:5003
```

## Architecture

```
patra-frontend (this app, :5173)
  └─► patra-kg REST API (:8000)  — FastAPI + PostgreSQL
  └─► Tapis                      — OAuth2 authentication
```

The backend API lives in the sibling `patra-kg` repository. See the root `CLAUDE.md` for the full system diagram.
