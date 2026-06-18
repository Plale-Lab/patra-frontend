# Patra Frontend

Vue 3 + Vite web interface for the [Patra Knowledge Base](https://github.com/Data-to-Insight-Center/patra-kg). Browse model cards and datasheets, submit and edit records, and explore edge-deployment experiments.

## Repository Layout

- `app/` — Vue 3 application (Vite, Pinia, Vue Router, Tabler Icons)

## Prerequisites

- Node.js 20+ (Vite 7)
- The Patra backend running on port `8000`

## Install

```bash
npm --prefix app install
```

## Run

```bash
cd app
npm run dev
```

The app opens at `http://localhost:5173`.

## Features

- **Browse & filter** model cards and datasheets with search, category, framework, and visibility filters
- **Detail views** with model metadata, deployment history, accuracy rings, and DataCite-style datasheet rendering
- **Inline editing** (logged-in users) — edit all model card fields, AI model metadata, and datasheet properties directly from the detail page
- **Tapis OAuth2 login** via sidebar — two access tiers: anyone can browse public records; signed-in Tapis users also see private records and the Contribute section (Submit / Edit / Ask Patra)
- **Submit** new model cards and datasheets to Patra
- **Ask Patra** — conversational assistant that answers from the catalog and cites the records it references
- **Experiments** — browse edge-deployed experiments (Animal Ecology, Digital Agriculture) with per-image scoring data and power metrics
- **MCP Explorer** — connect to the Model Context Protocol server, browse tools, and execute them

## Configuration

Create `app/.env` (see `app/.env.example`):

```env
VITE_LIVE_API_BASE_URL=http://localhost:8000
VITE_MCP_BASE_URL=http://localhost:8050
```

Feature areas (Ask Patra, Agent Toolkit, MCP Explorer, Domain Experiments) are gated by `VITE_SUPPORTS_*` flags — see `app/.env.example`.

## License

BSD 3-Clause. See `LICENSE.txt`.

## Acknowledgements

Funded by the National Science Foundation (award #2112606, ICICLE) and the Data to Insight Center (D2I) at Indiana University.
