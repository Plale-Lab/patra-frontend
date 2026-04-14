# Frontend Dev Log

## Version 0.7.2 - 2026-04-13

## Summary

This update records the latest dev frontend work shipped for the PATRA planning and Ask Patra surfaces.

The main deployment target is now:

- Frontend image: `plalelab/patra-frontend:WQ-4-13-2`
- Backend companion image: `plalelab/patra-backend:WQ-4-12-7`

## Frontend Changes

- Kept the new `/llm-test` vanilla LLM tab for isolating LiteLLM/JWT behavior from Ask Patra orchestration.
- Expanded dev feature flags and route availability for the full planning pipeline:
  - Intent Schema
  - Metadata Discovery
  - Dataset Assembly
  - Training Readiness
  - Baseline Training Stub
  - MVP Demo Report
- Updated `Intent Schema` so the downstream pipeline actions are no longer hidden or disabled by stale frontend-only subfeature gating once a schema result exists.
- Moved the five Intent Schema pipeline actions into a compact sticky right-side rail:
  - Generate Schema
  - Metadata Discovery
  - Assembly Plan
  - Preview Dataset
  - Training Stub
- Adjusted the rail to sit next to the main content card instead of the browser edge.
- Added explicit Baseline Training Stub messaging that the module does not run a real model fit and does not create reusable model artifacts.
- Added `Copy Report JSON` and `Download Report JSON` actions for the Baseline Training Stub report.
- Updated Ask Patra rendering behavior to reduce raw inline Markdown artifacts from assistant responses.

## Current Behavior Notes

- The Baseline Training Stub intentionally returns a readiness/eval stub, not a downloadable model artifact.
- If the readiness gate is blocked, the UI should show that no real training, train/validation/test split, or reusable model package was produced.
- A blocked report with zero selected datasets and zero preview rows is expected when the current schema has no safe direct or derivable source coverage.

## Validation

- `npm run build` passed.
- Docker image `plalelab/patra-frontend:WQ-4-13-2` was built and pushed.

## Version 0.7.1 - 2026-04-12

## Summary

This update records the current suspended state for the LLM/JWT investigation and the frontend changes shipped in Docker tag `WQ-4-12-2`.

The working assumption is now that the UI and backend routes are wired, but LiteLLM access still depends on a valid Tapis service token or a user JWT that has access to `litellm.pods.tacc.tapis.io`. The issue is paused until the Tapis Pods maintainer can provide or validate a service token.

## Frontend Changes

- Added a new `LLM Test` tab at `/llm-test`.
- Added a `Start Here` sidebar entry for `LLM Test` when Ask Patra support is enabled.
- Implemented a minimal vanilla chatbot surface for direct LLM connection testing.
- The LLM test page intentionally does not use:
  - Ask Patra tool routing
  - starter prompts
  - citations
  - tool cards
  - templates
  - workflow handoff behavior
- The page displays the raw provider, model, API base, success mode, or backend error so the LLM path can be debugged without Ask Patra orchestration noise.
- Normalized runtime base URLs with `.trim()` so accidental leading/trailing whitespace in pod env values does not break frontend endpoint configuration.

## Current Suspended State

- `Ask Patra` and `Intent Schema` can still produce deterministic fallback responses when LiteLLM returns `403 Forbidden`.
- A valid service token is not yet confirmed in the pod configuration.
- The next step is to retest `/llm-test` after a valid service token is installed on `patrabackenddev`.

## Docker Images

- Frontend image pushed: `plalelab/patra-frontend:WQ-4-12-2`
- Backend companion image expected for the same test run: `plalelab/patra-backend:WQ-4-12-2`

## Validation

- `npm run build` passed.

## Version 0.7.0 - 2026-04-10

## Summary

This milestone records two frontend status changes:

- the current MVP demo pipeline framework has reached a high-level end-to-end shape and is now paused pending LLM invocation stability fixes
- a new Ask Patra milestone has started, focused on making Ask Patra the unified entry point for user-facing tools through hybrid routing, tool cards, and structured handoffs

## Current MVP Demo Status

- The frontend already has the high-level demo surfaces needed for:
  - Intent Schema
  - Metadata Discovery
  - Dataset Assembly Plan
  - Composition Preview
  - Baseline Training Stub
  - MVP Demo Report
- The demo framework is largely in place, but the final run-through is not yet considered stable.
- The current blocking suspicion is LLM invocation / integration stability rather than missing page structure.
- This branch is temporarily paused so the new Ask Patra unification milestone can proceed without being blocked by the remaining demo-path LLM issue.

## Next Milestone

- Ask Patra will be expanded into a hybrid router for user-facing PATRA tools.
- First stage scope:
  - user tools only
  - deterministic-first routing
  - structured tool cards and deep-link handoffs
  - no admin-only surfaces in the first pass

## Action Points

- Resume the MVP demo branch after the Ask Patra milestone reaches a stable first slice.
- Repair LLM invocation / handoff stability separately instead of mixing that work into the Ask Patra routing implementation.

## Version 0.6.1 - 2026-04-07

## Summary

Version `0.6.1` brings the shared `patra-frontend` surface back into alignment with `patra-dev` as the current product baseline while preserving the newer `MCP Explorer` and domain experiment work from the latest frontend branch.

## Problem

- The shared frontend had drifted in two directions at once:
  - the upstream SQL-migration branch introduced `MCP Explorer` and experiment pages
  - `patra-dev` carried the newer product shell, access model, and visual system
- The sidebar structure for `MCP Explorer`, `Animal Ecology`, and `Digital Agriculture` did not match the latest intended organization.
- Runtime defaults still allowed deployment config to hide those features even though they were supposed to stay visible and show warnings when dependencies were missing.

## Implementation

- Rebased the shared frontend direction on the newer `patra-dev` shell and visual system.
- Preserved and aligned the experimental surfaces:
  - `MCP Explorer`
  - `Animal Ecology`
  - `Digital Agriculture`
- Moved `MCP Explorer` into `Explore`.
- Added a dedicated `Experiments` section for the two domain pages.
- Removed route-level `tapis` gating from those three pages so they can remain visible and show graceful warning states.
- Updated feature/runtime defaults and env injection so:
  - `SUPPORTS_MCP_EXPLORER` defaults to `true`
  - `SUPPORTS_DOMAIN_EXPERIMENTS` defaults to `true`
  - `MCP_BASE_URL` continues to be runtime-configurable

## Validation Performed

- `npm --prefix app run build` -> passed
- Verified local preview for:
  - `/`
  - `/mcp-explorer`
  - `/animal-ecology`
  - `/digital-agriculture`

## Action Points

- Promote this aligned frontend build to the deployed `patra` surface so the online sidebar matches the intended information architecture.
- Configure `MCP_BASE_URL` explicitly when the MCP service is not running on the default local endpoint.

## Version 0.6.0 - 2026-04-06

## Summary

Version `0.6.0` records the current shared-frontend direction around PATRA’s new assistant, ingestion, editing, and access-control model. This milestone emphasizes organization and product coherence: feature-oriented structure, clearer terminology, calmer visual-system work, and a stricter group-based access policy aligned with the active dev surface.

## Problem

- The frontend surface area now spans:
  - assistant workflows
  - automated ingestion / record scraping
  - direct record editing
  - moderation and admin operations
- Without a stronger shared structure, these capabilities become harder to maintain and harder to reason about across stable and dev surfaces.
- Access behavior had temporarily drifted during rapid iteration, especially around admin visibility and cached role state.
- Product language and UI style needed a more deliberate, system-level direction.

## Philosophy

- Keep the shared frontend aligned with the evolving PATRA product model, even when some features still ship in `patra-dev` first.
- Organize by feature, not just by route or historical page ownership.
- Let access control be explicit and tiered:
  - public browse
  - Tapis-authenticated contribution
  - admin moderation
- Prefer visual harmonization through shared tokens and shell refinements rather than disruptive redesigns.

## Implementation

- Captured the current feature-oriented frontend direction around:
  - `Ask Patra`
  - automated ingestion / record scraping
  - record editing
  - agent-toolkit style workflows
- Documented and aligned terminology toward records / resources rather than older asset-only phrasing.
- Brought the shared frontend log in line with the current PATRA direction for:
  - assistant-first surfaces
  - ingestion review staging
  - direct record save flows
- Reflected the current access-control contract:
  - public visitor -> explore only
  - Tapis user -> explore + contribute
  - admin -> explore + contribute + admin
- Recorded the current admin-identity rule:
  - must be a Tapis-authenticated user
  - username must be in the admin allowlist

## Validation Performed

- Reviewed the current shared frontend structure against the active `patra-dev` implementation and documented the intended parity direction.
- Confirmed that the shared frontend log now reflects the current PATRA product model rather than only the older explore/submit baseline.

## Action Points

- Promote approved `patra-dev` UI changes into the shared frontend in deliberate batches.
- Keep shared terminology and access-model documentation synchronized across frontend repos.
- Continue using feature-folder docs so new assistant and ingestion work remains navigable.

## Version 0.3.1

## Summary

Version `0.3.1` fixes the live PostgreSQL-backed detail-page regression and aligns the frontend's default live API target with the active backend port. It also includes an end-to-end validation pass for asset submission, support tickets, and admin review workflows against the local live stack.

## Problem

- Model card detail links no longer resolved in live mode because the frontend still expected legacy list payload keys such as `id`, while the active backend now returns `mc_id`.
- Datasheet detail links had the same contract drift and were still built from `ds.id` even though the active backend returns `identifier`.
- Detail views still assumed older nested response shapes, so even valid live responses risked rendering gaps after navigation.
- Frontend defaults for live mode still pointed to `http://localhost:5002` even though the active FastAPI backend runs on `http://localhost:8000`.

## Engineering Approach

- Restore compatibility in the shared explore store rather than duplicating ad hoc mappings in individual views.
- Preserve mock-mode behavior while normalizing live backend responses into the UI shape already used by cards and detail templates.
- Keep the deployment table resilient to both the legacy mock response and the active backend experiment-oriented deployment payload.
- Align local and container defaults with the active backend's supported port so fresh frontend environments can connect without local overrides.

## Implementation

- Added normalization helpers in `app/src/stores/explore.js` for:
  - model-card list/detail payloads
  - datasheet list/detail payloads
  - nested creator, publisher, title, description, rights, related identifier, and geo-location data
- Updated live model-card handling to normalize:
  - `mc_id` -> `id`
  - `categories` -> `category`
  - nested `ai_model.framework`, `ai_model.model_type`, and `ai_model.test_accuracy` -> top-level card fields
- Updated live datasheet handling to normalize:
  - `identifier` -> `id`
  - `titles` / `descriptions` / `creators` -> the existing card/detail view field shape
  - flat `resource_type` plus `resource_type_general` -> the existing nested badge/detail shape
- Updated `app/src/views/ModelDetailView.vue` so deployment rendering supports:
  - legacy mock deployment rows
  - live backend experiment rows with precision/recall
- Updated frontend live defaults from `5002` to `8000` in:
  - `app/src/config/api.js`
  - `app/.env.example`
  - `app/README.md`
  - `Dockerfile`
  - `deploy/frontend-env.sh`

## Validation Performed

- `npm --prefix app run build` -> passed
- Live-mode click-through validation:
  - `/explore-model-cards` -> first card -> `/explore-model-cards/1`
  - `/explore-datasheets` -> first card -> `/explore-datasheets/1`
  - both detail pages rendered without `not found`
- Live workflow validation in the browser:
  - asset-link submission queued successfully
  - support ticket submission succeeded
  - admin submission approval succeeded
  - admin ticket resolution succeeded
  - user-visible ticket response confirmed after admin update

## Version 0.3.0

## Summary

Version `0.3.0` extends the `0.2.0` intake workflow with a more explicit guest-versus-member dashboard model. The application still supports manual model card and datasheet entry, asset-link intake, and bulk submission, but the homepage now behaves differently for guests and signed-in Tapis users. The repository is now frontend-only and continues to support live API mode and local mock mode.

## Workspace Structure

- `app`: Vue 3 + Vite application
- `mock-server`: local mock API for frontend development
- `agent-submission-plan.md`: high-automation agent-mode design document

## Runtime Modes

The frontend supports two runtime modes:

1. Normal mode
   - targets the Patra REST API
   - default base URL: `http://localhost:5002`

2. Test mode
   - targets the local mock server
   - default base URL: `http://localhost:5003`

Mode selection is stored locally, can be changed from the header, and triggers data refetch in views that depend on backend data.

## Core Application Features

### Shared API Layer

- Centralized API configuration and URL selection
- Shared `apiFetch()` access pattern for frontend data calls
- Single place to switch between live and mock backends

### Authentication

- Tapis login flow through `/auth/tapis`
- Local admin shortcut for development
- persisted auth state in local storage
- admin/user role awareness in navigation and route guards
- authenticated identity reused across dashboard, ticket, and submission workflows

### Homepage and Dashboard Personalization

The root route `/` now serves two different experiences:

1. Guest homepage
   - general product-facing landing experience
   - platform snapshot for public models, datasheets, and support activity
   - featured public models
   - clear entry points for explore, submit, and tickets
   - sign-in value framing for Tapis users

2. Logged-in user dashboard
   - personalized workspace summary
   - `My Models`
   - `My Recent Submissions`
   - `My Tickets`
   - pending-submission and asset-intake counts
   - quick actions for submission, support, and catalog workflows

Dashboard behavior:

- refreshes when API mode changes
- refreshes when auth state changes
- avoids submission-queue fetches for guest users

### Public Routes

- `/`
- `/explore-model-cards`
- `/explore-model-cards/:id`
- `/explore-datasheets`
- `/explore-datasheets/:id`
- `/submit`
- `/tickets`

Legacy explore routes continue to redirect to the current route set.

### Admin Routes

- `/models`
- `/submissions`
- `/ticket-management`
- `/audit-log`
- `/settings`

Non-admin users are redirected away from admin-only routes.

### Explore Workflows

Model card pages support:

- search and filtering
- detail metadata
- AI model metadata
- metrics, bias analysis, and XAI sections
- deployment and download links

Datasheet pages support:

- search and filtering
- creator and publisher metadata
- rights, identifiers, descriptions, and geo information

## Submission Features

Submission supports two content types:

- `model_card`
- `datasheet`

Each type now provides three submission modes:

- `Manual Entry`
- `From Asset Link`
- `Bulk Asset Links`

### Manual Entry

Manual entry remains the default mode for both tabs. Existing structured forms continue to work without behavioral regression and still submit through `POST /submissions`.

### From Asset Link

Single-link intake is intended for existing assets that should be included in the ICICLE ecosystem. The UI uses the following shared prompt copy:

> Create ICICLE model card or datasheet for the existing model or dataset you want to include in the ICICLE ecosystem.

Implemented behavior:

- requires submitter name
- requires asset URL
- supports optional display name
- supports optional notes
- validates URL format before submission
- infers provider from hostname or DOI pattern
- records `asset_host` and `asset_provider`
- submits queue-only intake payloads without scraping or auto-completing schema fields

Recognized providers:

- `huggingface.co` -> `huggingface`
- `github.com` -> `github`
- `kaggle.com` -> `kaggle`
- DOI input -> `doi`
- fallback -> `other`

### Bulk Asset Links

Bulk intake is an extension of the single-link flow and is designed for high-volume queue creation without agent automation.

Implemented behavior:

- accepts one URL per line
- trims whitespace and drops empty lines
- deduplicates links locally before submission
- blocks the full batch if any invalid lines are present
- shows invalid line numbers and values in the UI
- creates one submission per asset rather than one combined batch record
- submits with `Promise.allSettled`
- reports total, success count, failure count, and failed links
- preserves partial success and does not roll back completed items

Each created submission includes batch metadata when applicable:

- `batch_id`
- `batch_index`
- `batch_total`
- `submission_origin`

## Review Queue Improvements

The admin submission review page now distinguishes intake origin directly in the queue.

Implemented behavior:

- badge for `Manual Entry`
- badge for `Asset Link`
- badge for `Bulk`
- clickable asset URL in submission details
- prioritized rendering for:
  - `asset_url`
  - `asset_provider`
  - `display_name`
  - `submitter_notes`
  - batch position metadata
- existing approve, reject, and admin-note actions remain unchanged

This release does not add an in-app schema editor for reviewers. Link-based submissions are still intended to feed a later manual completion workflow.

## Mock Server Support

The local mock server continues to support:

- authentication
- model cards and datasheets
- submission creation and review
- tickets
- users and groups

For `0.3.0`, the mock submission set includes asset-link examples so the review badges, personalized dashboard counts, and metadata views can be exercised in test mode.

## Agent Mode Planning

`0.3.0` continues to include a design document for a future high-automation agent workflow in [agent-submission-plan.md](./agent-submission-plan.md).

The planned agent mode is not implemented in this release. The document covers:

- ingestion job architecture
- provider adapters
- draft generation contract
- provenance and confidence handling
- review workflow
- rollout stages

## Developer Notes

- Frontend state management uses Pinia.
- Routing uses Vue Router with `createWebHistory()`.
- Submission intake automation in this release is intentionally limited to client-side validation and metadata inference.
- Ticket and submission forms default to the signed-in user's display name when available.
- `app/package.json` is aligned with this release and now reports version `0.3.0`.

## Validation Performed

The implementation target for this release includes:

- manual model card submission remains functional
- manual datasheet submission remains functional
- single-link model card submission succeeds
- single-link datasheet submission succeeds
- invalid single-link input is blocked on the client
- bulk submission creates one queue item per valid unique URL
- duplicate bulk URLs are deduplicated before submission
- bulk input with invalid lines is rejected before network submission
- admin review displays asset-link metadata and batch badges correctly
- guest users receive a general-purpose discovery homepage
- logged-in Tapis users receive a personalized dashboard with user-scoped tickets, models, and submissions
- mock mode remains usable end to end
- live-mode production build completes successfully

## Known Limitations

- Link-based intake does not fetch remote asset metadata in `0.3.0`.
- Reviewer-side manual completion still happens outside the frontend workflow.
- Some admin pages still use demo-oriented state rather than a fully production-backed integration.
- Personalized dashboard matching is currently identity-string based and depends on consistent submitter naming.
- No formal automated frontend test suite is included yet.

## Recommended Next Steps

- add automated frontend tests for the new submission modes
- define backend validation for asset-intake payload fields
- implement reviewer-side structured completion for queued link submissions
- build the agent-mode ingestion service described in `agent-submission-plan.md`
