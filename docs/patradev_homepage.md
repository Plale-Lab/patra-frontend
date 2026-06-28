# `patradev` public catalog homepage

## Design goal

The `patradev` branch reframes the frontend as a public AI resource catalog. The homepage now leads with discovery and connected resource stories instead of a signed-in dashboard, model-card counts, contributor counts, greetings, or PATRA platform marketing.

The public label **Resource stories** was chosen because the existing system contains model and dataset records plus operational domain-run data, while the long-term object name is still unresolved. The label can cover training, evaluation/test, and operational inference without treating every activity as the same kind of experiment.

## Beth's direction represented here

- Logged-in and logged-out users share the same `/` homepage.
- Public search and interesting repository content are the primary entry points.
- Model cards remain available as one catalog resource type.
- Personal functions live in the top-right identity menu.
- System branding is secondary to catalog contents.
- Existing embedded and standalone Tapis authentication behavior is retained.

## Implemented

- Search-led public homepage with copy covering models, datasets, workflows/runs, devices, agents, evaluations, and provenance.
- A `/search` route that currently searches real public model-card and datasheet responses.
- Three responsive, keyboard-accessible resource-story cards with a model → dataset → device → run → result chain.
- Existing domain experiment pages reframed in navigation as workflow/run views.
- Browse links for models, datasets, workflow/runs, and tools/agents when their feature flags are enabled.
- Top-right identity menu with:
  - My Collections
  - My Submissions
  - Drafts
  - Notifications
  - Account / Profile
  - Contributor tools only when an explicit contributor/editor/admin role or catalog permission is present
  - Logout for standalone sessions, or a portal-managed-session notice for embedded sessions
- Standalone sign-in remains available to logged-out users. Public browsing does not require Tapis.

## Real data versus development mapping

The homepage fetches the existing `/modelcards` and `/datasheets` APIs. The resource-story adapter selects public records using domain keywords and links those records to their real detail routes.

The current APIs do **not** expose a durable, queryable model → datasheet → device → run → result relationship graph. Therefore:

- model and datasheet names/links are real when matching public records exist;
- story descriptions, device/run/result labels, and cross-resource relationships are explicitly labeled **development relationship mappings** in the UI;
- no fake numeric metric, resource count, latency, throughput, accuracy, or contributor value is presented;
- when no records are available, the UI says the story is awaiting linked public records.

Replace `app/src/lib/resourceStories.js` with an API-backed adapter when stable relationship identifiers are available.

## Routes changed or added

- `/` — public resource catalog homepage for every authentication state
- `/search` — public cross-catalog search for models and datasheets
- `/my-collections` — authenticated placeholder; backend support is not present
- `/notifications` — authenticated placeholder; notification service is not present
- `/my-submissions` — authenticated placeholder; user-scoped submission history API is not present
- `/drafts` — authenticated placeholder; draft persistence API is not present
- `/account` — authenticated Tapis account information placeholder

Existing model-card, datasheet, submission, domain-run, agent, Ask PATRA, edit, and MCP routes remain intact.

## Profile menu and personal areas

My Collections was removed from homepage-level emphasis and placed in the identity menu. Because no collection routes, tables, or API clients exist in the current frontend/backend, the route is a transparent empty-state placeholder. Notifications, My Submissions, and Drafts are handled the same way: the intended information architecture is visible without inventing records or backend behavior.

Contributor tools no longer appear in the public sidebar. They appear in the profile menu only when authentication supplies a `contributor`, `editor`, or `admin` role, or a matching catalog permission. The current standalone and embedded authentication payloads do not provide those claims by default, so role/permission propagation remains an integration gap.

## Known limitations and future work

- Add stable relationship APIs for models, datasheets, parameters, devices, workflows/runs, results, evaluations, agents, and provenance.
- Replace keyword-based development story selection with curated or API-ranked featured resources.
- Add search indexing for workflows/runs, devices, agents, evaluations, and provenance.
- Add real collection and notification services before making those pages interactive.
- Add user submission history and drafts only after supported backend routes exist.
- Link datasheet related identifiers and model deployment records into one public lineage view.
- Distinguish training, evaluation/test, and operational inference in shared API types.
- For operational inference telemetry, prefer aggregates, sliding windows, and sampling rather than indefinite raw-event retention.
- Add latency, throughput, FlexServe, Ultralytics, and device summaries when available.
- Treat token usage, context windows, prompt/completion metrics, and agent evaluation as future LLM-specific work.

## Verification

From the repository root:

```bash
npm test
npm run build
```

Manual checks:

1. Open `/` while logged out and confirm public content and search are usable.
2. Sign in with standalone Tapis and confirm `/` remains the same homepage.
3. Open the identity menu and verify My Collections, Notifications, Account/Profile, submission access, and logout.
4. In embedded mode, confirm the portal handshake still initializes before rendering and the profile menu identifies a portal-managed session.
5. Activate each resource-story card with mouse and keyboard and confirm it opens a real domain or catalog route.
6. Disable domain-run feature flags and confirm story links safely fall back to available catalog records.
7. Confirm no greeting, model-card count hero, contributor count, or empty `0 model cards` metric appears.
