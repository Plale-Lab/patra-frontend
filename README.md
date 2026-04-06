# Patra Frontend

Vue 3 + Vite web interface for the [Patra Knowledge Base](https://github.com/Data-to-Insight-Center/patra-kg). Browse model cards and datasheets, submit new records, manage tickets, and explore edge-deployment experiments.

## Repository Layout

- `app/` — Vue 3 application (Vite, Pinia, Vue Router, Tabler Icons)
- `mock-server/` — Express mock API for frontend development without the real backend

## Prerequisites

- Node.js 18+
- The Patra backend running on port `8000` (or the mock server on `5003`)

## Install

```bash
npm --prefix app install
npm --prefix mock-server install
```

## Run

### Against the real backend (default, port 8000)

```bash
cd app
npx vite
```

### Against the mock server (offline development)

```bash
# Terminal 1 — start mock API on :5003
npm --prefix mock-server run dev

# Terminal 2 — start frontend pointed at mock
cd app
VITE_API_BASE_URL=http://localhost:5003 npx vite
```

The app opens at `http://localhost:5173`.

## Features

- **Browse & filter** model cards and datasheets with search, category, framework, and visibility filters
- **Detail views** with model metadata, deployment history, accuracy rings, and DataCite-style datasheet rendering
- **Inline editing** (logged-in users) — edit all model card fields, AI model metadata, and datasheet properties directly from the detail page
- **Tapis OAuth2 login** via sidebar; private/gated records visible when authenticated
- **Submit** new model cards and datasheets to Patra
- **Tickets** — submit support requests, view status, admin management panel
- **Experiments** — browse edge-deployed experiments (Animal Ecology, Digital Agriculture) with per-image scoring data and power metrics
- **MCP Explorer** — connect to the Model Context Protocol server, browse tools, and execute them

## Configuration

Create `app/.env` (see `app/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MCP_BASE_URL=http://localhost:8050
```

## License

BSD 3-Clause. See `LICENSE.txt`.

## Acknowledgements

Funded by the National Science Foundation (award #2112606, ICICLE) and the Data to Insight Center (D2I) at Indiana University.
