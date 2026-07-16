# Frontend Dev Log

## Version 0.8.0 - 2026-07-16

## Summary

Version `0.8.0` adds a lightweight editorial Story Portal to the existing PATRA public catalog. Contributors can key in a story through the browser, preview it against the existing resource-story template, and generate a draft page. A separate administrator workspace controls editing, publication, homepage visibility, and deletion.

## Product and Design Direction

- The contributor editor uses a Linear-inspired operating layout: low-noise surfaces, compact utility spacing, hairline boundaries, and one restrained blue accent.
- The live preview retains the current warm, photography-led story treatment with a Notion-like editorial reading surface.
- The admin workspace favors a searchable table over a decorative card grid so publication state and homepage visibility remain easy to scan.
- Motion is limited to existing route transitions, hover feedback, and state changes.
- Responsive testing caught and corrected a mid-width editor/preview bleed issue by reducing grid minimums and explicitly containing both panels.

## Story Portal

- Added `/story-portal` with browser-based fields for:
  - story identity, summary, introduction, author, and read time
  - cover image URL, alt text, and accent color
  - two narrative sections and a pull quote
  - one related model card and one related datasheet
- Added a sticky live preview based on the existing resource-story presentation.
- Generated stories receive collision-safe slugs, a complete detail route, related records, and a five-node evidence graph.
- New submissions are stored as drafts and immediately open in a clearly labeled draft preview.
- Administrators can return to the editor without changing an existing story URL or publication state.

## Story Administration

- Added `/story-admin` with the requested prototype credentials:
  - username: `admin`
  - password: `admin`
- Added an explicit prototype-auth notice so the hardcoded credential is not mistaken for production security.
- Added story search and All, Drafts, Published, and Homepage filters.
- Added independent controls for publish/unpublish and homepage visibility.
- Enforced that only published stories can be featured; unpublishing automatically removes a story from the homepage.
- Added preview, edit, and confirmed-delete actions for every story.

## Data, Homepage, and Observability

- Added a Pinia Story Store backed by versioned browser `localStorage` and an admin `sessionStorage` flag.
- Seeded the store with the three existing resource stories as published and homepage-visible.
- Updated the homepage to render only stories that are both published and featured.
- Updated story detail lookup and next-story navigation to use the managed story collection.
- Added structured `[Patra UI]` logging for create, update, publish, homepage visibility, delete, admin login, and logout events.
- Logs exclude passwords, narrative content, image URLs, and full story payloads.

## Validation Performed

- `npm run build` -> passed.
- `npm test` -> passed: 9 test files, 21 tests.
- Added store coverage for default seeds, draft behavior, publication gating, homepage visibility, hardcoded admin login, persistence, and collision-safe slugs.
- Browser acceptance verified the complete workflow:
  - create a story from the Portal
  - open the generated draft detail page
  - sign in with `admin / admin`
  - publish the draft
  - add it to the homepage
  - confirm the fourth homepage story card appears
  - delete the acceptance-test story and restore clean preview data
- Confirmed no page-level horizontal overflow on the Story Portal or homepage at the active 1270px preview viewport.

## Prototype Boundary

- Story data is local to the current browser and is not shared between devices or users.
- The hardcoded admin credential is suitable only for the requested prototype; a production rollout requires server-side authentication, authorization, persistence, validation, sanitization, and media storage.
- Related-record selection currently accepts catalog routes and generates a standard evidence chain; it is not yet backed by a live record picker.

## Local Preview

- Frontend: `http://127.0.0.1:4174/story-portal`
- Admin: `http://127.0.0.1:4174/story-admin`
- No remote push or deployment was performed.

## Version 0.7.1 - 2026-07-09

## Summary

Version `0.7.1` aligns this working tree with the latest public-catalog landing direction from Codex thread `019ee216-ed22-7410-94d0-93073d366057`, then corrects the first Record Map and Story-detail visual pass.

## Design Sources

- Latest catalog implementation reference: `dev` commit `3644123` from the maintained PATRA frontend workspace.
- Primary visual reference: Airbnb-style photography-first browsing and dense repeated content.
- Supporting application reference: Linear-style flat surfaces, fine hairlines, restrained blue focus, and product-workspace hierarchy.
- Supporting editorial reference: Notion-style warm paper canvas, compact reading scale, and minimal elevation.
- Project identity, typography, colors, routes, and content remain ICICLE-specific; no reference brand identity was copied.

## Homepage

- Replaced the dashboard greeting and documentation hero with the latest public-catalog shell:
  - `Discover connected AI resources.`
  - full-width agricultural photography
  - primary public-resource search
  - shared landing behavior for guests and signed-in users
- Moved identity and login controls to the top-right header.
- Reframed the sidebar around Home, Search, Browse, Resource Stories, Record Map, and About & Help.
- Removed all homepage resource counts:
  - no model-card count
  - no datasheet count
  - no contributor count
  - no linked-record count inside story cards
- Kept the three Resource Story cards image-led and routed to their dedicated editorial pages.

## Record Map

- Replaced the two-column list composition with a balanced orbital node-edge map.
- Added a central non-interactive catalog index node that gives every visible record a stable relationship anchor.
- Retained model-to-datasheet relationship edges and added a limited number of secondary reference edges.
- Visually separated catalog membership edges from record relationships using quiet dashed versus solid strokes.
- Updated vertical and horizontal edge routing so curves follow the dominant axis.
- Removed the SVG minimum-width constraint and clipped the graph inside its own rounded workspace.
- Preserved hover preview, drag, zoom, filters, keyboard selection, and the record inspector.

## Story Detail

- Reduced the editorial hero from near-full-screen scale to 480px desktop / 430px mobile.
- Reduced the display-title ceiling from 5.7rem to 4rem.
- Tightened the hero copy width, metadata spacing, corner radius, and toolbar gap so article content enters the first viewport sooner.

## Navigation and Search

- Added the public `/search` route and catalog search view.
- Added identity-menu placeholders for collections, submissions, notifications, and account areas without inventing backend records.
- Preserved standalone and embedded Tapis authentication behavior.

## Validation Performed

- Production build passes.
- Vitest passes (18 tests).
- Browser verification at 1920px, 1440px, and 390px widths:
  - homepage contains no graph nodes or resource-count blocks
  - Record Map contains all mock API model cards and datasheets
  - every rendered graph node remains inside the graph boundary
  - graph hover preview and inspector selection work
  - homepage, Record Map, and Story page have zero page-level horizontal overflow
  - no console or page errors were observed

## Local Preview

- Frontend: `http://127.0.0.1:4173/`
- Mock API: `http://127.0.0.1:5003/`
- No Git remote push was performed.

## Development Pod Deployment - 2026-07-10

- Deployed the validated `0.7.1` static build to the actual development Pod ID `patradev` at `https://patradev.pods.icicleai.tapis.io`.
- Used the authenticated TapisV3 CLI runtime with Tapipy `25.4.0`; no production Pod was modified.
- Transferred the 243,958-byte build through chunked Pods exec after the multipart upload endpoint returned a truncated archive.
- Verified the remote archive before extraction with SHA-256 `54dd5d7110d9efb41a66bf8cd5e8d840af0e935d1d7f608b74d329d1090a53df`.
- Preserved the Pod-generated `env.js`, so the deployed UI continues to use `patrabackenddev.pods.icicleai.tapis.io` rather than the production backend.
- Published a versioned `index-DSUt2BzH.html` entry and validated the live Nginx configuration before reload.
- Acceptance checks passed for `/`, `/index.html`, `/record-map`, the wildlife story route, JavaScript, CSS, and runtime configuration.
- Browser acceptance found no horizontal overflow, console errors, page errors, or failed network responses.
- The Pod remained `AVAILABLE`, networking remained live, and the container restart count remained zero.
- The Pod image reference remains `plalelab/patra-frontend:dev-2026-06-29`; this direct filesystem deployment will revert if the Pod is restarted, so a durable rollout still requires Docker registry write access and an immutable image update.

## Version 0.7.0 - 2026-07-09

## Summary

Version `0.7.0` moves relationship visualization out of the homepage story cards and into dedicated editorial and catalog exploration surfaces. Resource stories now open as shareable long-form pages, while the new `Record Map` gives the full model-card and datasheet catalog an interactive node-edge view.

## Product Decisions

- Keep the homepage focused on discovery:
  - story image
  - domain
  - title and short summary
  - number of related catalog records
- Do not render linked graphs inside homepage cards.
- Treat stories as editorial containers that can explain why records are related, not as alternate model-detail pages.
- Keep story content and relationships in an isolated mock content module until a CMS or editorial API is available.
- Build the catalog map from live normalized Pinia records when the API is available, with a visibly labeled prototype fallback for local development.

## Implementation

- Added three mock resource stories with:
  - shareable `/stories/:slug` routes
  - image-led article headers
  - long-form editorial sections
  - related model-card and datasheet links
  - full workflow relationship graphs
- Added a reusable SVG `RecordGraph` component with:
  - node and connected-edge highlighting
  - hover preview cards
  - keyboard-accessible node selection
  - drag-to-pan
  - wheel and button zoom
  - reduced-motion compatibility through the shared style system
- Added `/record-map` and a sidebar entry beneath the catalog browse links.
- Added catalog-wide model/datasheet graph construction, search, record-type filters, counts, selection inspector, and direct detail links.
- Added mobile shell behavior so the fixed navigation collapses to an icon rail and graph canvases remain contained without page-level horizontal overflow.

## Observability

- Added structured, privacy-conscious `[Patra UI]` events for:
  - story open, view, share, and related-record navigation
  - graph node hover and selection
  - graph zoom/reset
  - Record Map load source, filters, inspection, and record navigation
- Logging intentionally excludes auth data, full record payloads, and free-form user content.

## Validation Performed

- `npm --prefix app run build` -> passed
- `npm --prefix app test` -> passed (17 tests)
- Browser validation against the local mock API:
  - homepage contains zero graph nodes
  - all three story cards route to dedicated story pages
  - story relationship hover previews render
  - Record Map loads 8 model cards, 6 datasheets, and 8 prototype relationships
  - node selection opens the record inspector
  - model-only filtering renders 8 nodes
  - no console or page errors on homepage, Story, or Record Map
  - no page-level horizontal overflow at 390px viewport width

## Local Preview

- Frontend: `http://127.0.0.1:4173/`
- Mock API: `http://localhost:5003/`
- No remote push or deployment was performed.

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
