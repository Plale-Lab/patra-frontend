# Catalog and trust refresh

Date: 2026-07-17

## Added

- Unified Catalog experience for model cards and datasheets.
- Shareable URL filters for resource type, category, framework or format, access, and rights.
- Compact, text-first catalog result rows with access status and record metadata.
- Trust Summary on model card and datasheet detail pages using only supplied catalog metadata.
- Lightweight Saved Set for up to five records, persisted locally in the browser.
- Saved Set share links and machine-readable JSON export.
- Structured UI logging for catalog searches, filter changes, record opens, Saved Set changes, sharing, and export.

## Changed

- Consolidated the former Search and Browse navigation into a single Catalog entry.
- Redirected legacy `/modelcards`, `/datasheets`, and `/explore` routes into filtered Catalog views.
- Updated record-detail back links to retain the relevant Catalog resource type.
- Applied a restrained institutional/editorial visual hierarchy: warm neutral surfaces, compact metadata, one primary action color, and reduced card chrome.
- Improved mobile record details by stacking summary content, metrics, and detail cards without horizontal overflow.

## Guardrails

- Missing verification or update metadata is shown as `Not supplied`; the interface does not invent trust claims.
- Saved Sets remain a lightweight browser feature rather than a new top-level content type.
- Stories remain the narrative publishing format; Saved Sets only group records for review and sharing.

## Verification

- Production build completed successfully with Vite.
- Automated test suite passed, including Saved Set persistence and share-token coverage.
- Desktop and 390 px viewport checks completed for Catalog, Saved Set, and Trust Summary layouts.
