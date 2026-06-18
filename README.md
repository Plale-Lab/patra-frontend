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
- **Embedded ICICLE/Tapis login** via a strict parent-portal handshake; see [docs/login_redesign.md](docs/login_redesign.md)
- **Submit** new model cards and datasheets to Patra
- **Tickets** — submit support requests, view status, admin management panel
- **Experiments** — browse edge-deployed experiments (Animal Ecology, Digital Agriculture) with per-image scoring data and power metrics
- **MCP Explorer** — connect to the Model Context Protocol server, browse tools, and execute them

## Configuration

Create `app/.env` (see `app/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MCP_BASE_URL=http://localhost:8050
VITE_EMBEDDED_AUTH_ENABLED=false
VITE_PORTAL_AUTH_ORIGINS=
VITE_PORTAL_AUTH_TIMEOUT_MS=3000
```

Embedded authentication requires both the documented parent-portal handler and
a Patra backend configured for server-side Tapis JWT validation. Browser-parsed
identity is never an authorization boundary.

## Embedded ICICLE/Tapis Login

### What changed

- Patra can request a short-lived Tapis access token from its parent portal
  through a strict protocol-v1 `postMessage` handshake.
- Portal tokens remain memory-only and are refreshed shortly before expiry.
- Authentication initialization finishes before account-dependent UI renders,
  preventing a valid portal user from briefly appearing as `Guest`.
- Standalone Patra login, persistence, reload, and logout remain available when
  Patra is opened directly or the portal handshake fails.
- API calls use the active authentication source and prefer
  `Authorization: Bearer <token>`. Browser-derived username and role headers
  are not sent as authoritative identity.

### Authentication logic

1. Embedded authentication runs only when it is enabled, Patra is inside an
   iframe, and exact parent origins are configured.
2. Patra sends a single-use request nonce to each configured exact origin.
3. A response is accepted only from `window.parent`, from an allowlisted
   origin, and with the matching unused nonce.
4. Patra checks token structure and lifetime for frontend usability, derives
   the displayed username, and keeps the token only in memory.
5. The backend performs the actual security validation: signature, time
   claims, configured issuer/audience, and server-derived identity.
6. Invalid or unavailable embedded authentication safely falls back to a valid
   standalone session or Guest mode.

### Runtime setup

For a deployed container, configure:

```env
EMBEDDED_AUTH_ENABLED=true
PORTAL_AUTH_ORIGINS=https://portal.example.org
PORTAL_AUTH_TIMEOUT_MS=3000
```

For local Vite development, use the equivalent `VITE_` variables shown above.
Origins must be exact origins without paths or wildcards.

### Parent portal integration

The portal must verify both the exact Patra origin and the expected iframe
window before returning its current short-lived token:

```js
event.source.postMessage({
  type: "patra:portal-auth:response",
  version: 1,
  requestId: event.data.requestId,
  accessToken,
  tokenType: "Bearer",
}, event.origin)
```

Never use `"*"` as the target origin, put tokens in URLs, persist a handoff
token in browser storage, or log raw tokens. Full protocol details, a complete
portal handler, backend configuration, and verification steps are in
[docs/login_redesign.md](docs/login_redesign.md).

## License

BSD 3-Clause. See `LICENSE.txt`.

## Acknowledgements

Funded by the National Science Foundation (award #2112606, ICICLE) and the Data to Insight Center (D2I) at Indiana University.
