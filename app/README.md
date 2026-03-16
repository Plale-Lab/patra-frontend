# Patra Frontend App

Vue 3 + Vite frontend for the Patra Knowledge Base.

## Modes

- `npm run dev:live`: normal mode, targets the real REST API
- `npm run dev:mock`: test mode, targets the local mock server

The runtime mode can also be changed from the app header.

## Environment

Copy `.env.example` and adjust if needed:

```bash
VITE_DEFAULT_API_MODE=live
VITE_LIVE_API_BASE_URL=http://localhost:8000
VITE_MOCK_API_BASE_URL=http://localhost:5003
```
