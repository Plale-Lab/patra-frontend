# Frontend Features

This directory groups patra-dev UI by product feature instead of keeping all feature pages under `src/views`.

Current feature modules:
- `ask-patra`: conversational assistant UI and API client
- `agent-toolkit`: schema search and synthesis tools
- `automated-ingestion`: isolated CSV ingestion pool UI
- `edit-records`: unified model-card + datasheet editing UI

Shared app-level concerns remain in:
- `src/router`
- `src/stores`
- `src/config`
- `src/lib/api.js`
