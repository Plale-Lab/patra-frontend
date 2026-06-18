# Frontend Features

This directory groups patra-dev UI by product feature instead of keeping all feature pages under `src/views`.

Current feature modules:
- `ask-patra`: conversational assistant UI and API client
- `agent-toolkit`: schema search and synthesis tools
- `edit-records`: unified model-card + datasheet editing UI
- `experiment-domains`: edge-deployment experiment dashboards (Animal Ecology, Digital Agriculture)
- `mcp-explorer`: Model Context Protocol server browser and tool runner

Shared app-level concerns remain in:
- `src/router`
- `src/stores`
- `src/config`
- `src/lib/api.js`
