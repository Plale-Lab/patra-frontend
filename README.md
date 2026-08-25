# Patra Frontend

Vue 3 + Vite web interface for the [Patra Knowledge Base](https://github.com/Plale-Lab/patra-knowledge-base) — the frontend component of the Patra AI Cards framework. Browse model cards and datasheets, submit and edit records, and explore edge-deployment experiments.

**Tags:** CI4AI, PADI

For guidance on what How-To Guides and Explanation content covers, see [Diátaxis](https://diataxis.fr/).

### License

BSD 3-Clause. See `LICENSE`.

## References

- [Patra Knowledge Base](https://github.com/Plale-Lab/patra-knowledge-base)
- Repository layout: `app/` — Vue 3 application (Vite, Pinia, Vue Router, Tabler Icons)
- [Embedded login protocol](docs/login_redesign.md)
- [Production runtime example](docs/pod-config.patra-prod.json)

## Acknowledgements

This work has been funded by grants from the National Science Foundation, and in part through Plale Lab at The University of Oregon.

*National Science Foundation (NSF) funded AI institute for Intelligent Cyberinfrastructure with Computational Learning in the Environment (ICICLE) (OAC 2112606)*

## Issue reporting

Report issues via [GitHub Issues](https://github.com/Plale-Lab/patra-frontend/issues).

---

# How-To Guides

### Hosted deployments (Tapis Pods)

The frontend is deployed as a [Tapis Pod](https://tapis.readthedocs.io/en/latest/technical/pods.html)
in the ICICLE tenant. If you only want to use Patra, go here — no local setup required:

| Deployment | URL | Backend |
| ---------- | --- | ------- |
| Patra UI (stable) | `https://patra.pods.icicleai.tapis.io` | `https://patrabackend.pods.icicleai.tapis.io` |
| Patra UI (dev) | `https://patra-dev.pods.icicleai.tapis.io` | `https://patrabackend-dev.pods.icicleai.tapis.io` |

Both pods run the same `plalelab/patra-frontend` image; they differ only in runtime
configuration. Supporting services:

- MCP server — `https://patramcp.pods.icicleai.tapis.io`
- Tapis tenant (login) — `https://icicleai.tapis.io`

See [docs/DEPLOYMENT_TOPOLOGY.md](./docs/DEPLOYMENT_TOPOLOGY.md) for the per-pod environment,
and [docs/pod-config.patra-prod.json](./docs/pod-config.patra-prod.json) /
[docs/pod-config.patra-dev.json](./docs/pod-config.patra-dev.json) for complete pod payloads.
The image serves nginx on **port 80** — the pod's `networking.default.port` must match, or the
ingress returns `502 Bad Gateway`.

### Prerequisites

- Node.js 20+ (Vite 7)
- The Patra backend running on port `8000`

### Install

```bash
npm --prefix app install
```

### Run

```bash
cd app
npm run dev
```

The app opens at `http://localhost:5173`.

### Configuration

Create `app/.env` (see `app/.env.example`):

```env
VITE_LIVE_API_BASE_URL=http://localhost:8000
VITE_MCP_BASE_URL=http://localhost:8050
VITE_EMBEDDED_AUTH_ENABLED=false
VITE_PORTAL_AUTH_ORIGINS=
VITE_PORTAL_AUTH_TIMEOUT_MS=3000
```

To run the local UI against a hosted backend instead of a local one:

```env
VITE_LIVE_API_BASE_URL=https://patrabackend.pods.icicleai.tapis.io
VITE_MCP_BASE_URL=https://patramcp.pods.icicleai.tapis.io
```

Note that the stable and dev backends share one database — writes from a local dev server
pointed at either pod are writes against production data.

Feature areas (Ask Patra, Agent Toolkit, MCP Explorer, Domain Experiments) are gated by `VITE_SUPPORTS_*` flags — see `app/.env.example`.

### Configuring embedded login for deployment

Configure deployed containers at runtime:

```env
EMBEDDED_AUTH_ENABLED=true
PORTAL_AUTH_ORIGINS=https://portal.example.org
PORTAL_AUTH_TIMEOUT_MS=3000
```

A production runtime example for `https://icicleai.tapis.io` is provided in
[`docs/pod-config.patra-prod.json`](docs/pod-config.patra-prod.json).

---

# Explanation

Patra Frontend is the web interface for the Patra AI Cards framework, giving users a way to browse, search, submit, and edit model cards and datasheets without calling the [Patra Knowledge Base](https://github.com/Plale-Lab/patra-knowledge-base) API directly.

- **Browse & filter** model cards and datasheets with search, category, framework, and visibility filters
- **Detail views** with model metadata, deployment history, accuracy rings, and DataCite-style datasheet rendering
- **Inline editing** (logged-in users) — edit all model card fields, AI model metadata, and datasheet properties directly from the detail page
- **Tapis OAuth2 login** via sidebar — two access tiers: anyone can browse public records; signed-in Tapis users also see private records and the Contribute section (Submit / Edit / Ask Patra)
- **Embedded ICICLE/Tapis login** through a strict, memory-only parent-portal handshake
- **Submit** new model cards and datasheets to Patra
- **Ask Patra** — conversational assistant that answers from the catalog and cites the records it references
- **Experiments** — browse edge-deployed experiments (Animal Ecology, Digital Agriculture) with per-image scoring data and power metrics
- **MCP Explorer** — connect to the Model Context Protocol server, browse tools, and execute them

### Embedded login integration

When enabled inside an iframe, Patra requests a short-lived Tapis token from
the parent portal using protocol-v1 `postMessage`. The response is accepted
only from `window.parent`, from an exact configured origin, and with the
matching single-use request ID. The portal token remains memory-only and takes
precedence over a persisted standalone session.

The parent portal must verify the exact Patra origin and iframe window, then
reply with `event.source.postMessage(response, event.origin)`. Never use `"*"`,
place tokens in URLs, persist handoff tokens, or log raw tokens.

Top-level Patra deployments retain standalone login. In embedded mode, a
failed or invalid parent handshake produces a controlled parent-session error
instead of exposing a second Patra login prompt or reusing a stale standalone
identity. API requests prefer `Authorization: Bearer <token>` and do not send
browser-derived username or role headers as authoritative identity. See
[docs/login_redesign.md](docs/login_redesign.md) for the complete protocol,
portal handler, backend requirements, and verification checklist.
