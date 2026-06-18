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
  "SUPPORTS_DOMAIN_EXPERIMENTS": "false",
  "EMBEDDED_AUTH_ENABLED": "false",
  "PORTAL_AUTH_ORIGINS": "",
  "PORTAL_AUTH_TIMEOUT_MS": "3000"
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
  "EMBEDDED_AUTH_ENABLED": "false",
  "PORTAL_AUTH_ORIGINS": "",
  "PORTAL_AUTH_TIMEOUT_MS": "3000",
  "MCP_BASE_URL": "http://<mcp-host>:8050"
}
```

## Example `patra-dev` pod config

A complete `patra-dev` pod example now lives here:

- [docs/pod-config.patra-dev.json](./pod-config.patra-dev.json)

This replaces the old `patra-dev` repo-local `pod_config.json` so the deployment example stays with the canonical frontend repository.

## Feature flag defaults

The frontend now defaults these dev-only features to `false` unless explicitly enabled:

- `SUPPORTS_MCP_EXPLORER`
- `SUPPORTS_DOMAIN_EXPERIMENTS`
- `SUPPORTS_ASK_PATRA`
- `SUPPORTS_AUTOMATED_INGESTION`

This keeps one image safe for both stable and dev deployments.

Enable `EMBEDDED_AUTH_ENABLED` only for a deployment opened by an ICICLE/Tapis
parent portal, and configure `PORTAL_AUTH_ORIGINS` with that portal's exact
origin. See [login_redesign.md](./login_redesign.md) for the integration
contract and verification checklist.
