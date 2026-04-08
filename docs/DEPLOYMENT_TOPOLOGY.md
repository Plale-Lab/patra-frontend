# PATRA Frontend Deployment Topology

## Canonical frontend repository

Use `patra-frontend` as the only long-term frontend codebase. Deploy two pods from the same image:

- `patra`: stable public UI
- `patra-dev`: internal/development UI

The difference between the two pods is runtime configuration only.

## Recommended pod mapping

- `patra` -> `patrabackend`
- `patra-dev` -> `patrabackend-dev`

## Stable frontend env

```json
{
  "API_BASE_URL": "https://patrabackend.pods.icicleai.tapis.io",
  "SUPPORTS_AGENT_TOOLS": "false",
  "SUPPORTS_EDIT_RECORDS": "true",
  "SUPPORTS_ASK_PATRA": "false",
  "SUPPORTS_AUTOMATED_INGESTION": "false",
  "SUPPORTS_TICKETS": "true",
  "SUPPORTS_MCP_EXPLORER": "false",
  "SUPPORTS_DOMAIN_EXPERIMENTS": "false"
}
```

## Dev frontend env

```json
{
  "API_BASE_URL": "https://patrabackend-dev.pods.icicleai.tapis.io",
  "SUPPORTS_AGENT_TOOLS": "true",
  "SUPPORTS_EDIT_RECORDS": "true",
  "SUPPORTS_ASK_PATRA": "true",
  "SUPPORTS_AUTOMATED_INGESTION": "true",
  "SUPPORTS_TICKETS": "true",
  "SUPPORTS_MCP_EXPLORER": "true",
  "SUPPORTS_DOMAIN_EXPERIMENTS": "true",
  "MCP_BASE_URL": "http://<mcp-host>:8050"
}
```

## Feature flag defaults

The frontend now defaults these dev-only features to `false` unless explicitly enabled:

- `SUPPORTS_MCP_EXPLORER`
- `SUPPORTS_DOMAIN_EXPERIMENTS`
- `SUPPORTS_ASK_PATRA`
- `SUPPORTS_AUTOMATED_INGESTION`

This keeps one image safe for both stable and dev deployments.
