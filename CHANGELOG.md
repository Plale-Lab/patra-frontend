# Changelog

## [1.0.0] - 2026-08-12

First stable release.

### Added
- `.github/workflows/ci.yml` — this repo had no CI at all before. Runs `vitest` and `vite build`
  on pushes/PRs to `main` and `release/1.0.0`.
- `LICENSE` (BSD 3-Clause, IU Board of Trustees), matching the README's existing license claim.

### Changed
- Repointed the Patra Knowledge Base README link from the stale
  `Data-to-Insight-Center/patra-kg` org+name to `Plale-Lab/patra-knowledge-base`.
- `app/package.json` version 0.3.0 -> 1.0.0.

### Removed
- Working notes (`dev log.md`, `agent-submission-plan.md`) that shouldn't ship in a 1.0.0 tree.

### Security
- Verified the embedded-portal `postMessage` auth path (`docs/login_redesign.md`) ahead of this
  release: exact `event.source`/origin checks with no `"*"` targetOrigin, a single-use random
  nonce per handshake, and memory-only token storage (`setRuntimeAuth`) that never touches
  `localStorage`/`sessionStorage` — that persistence path is only reachable from the separate
  standalone Tapis login flow. No raw token is logged.
