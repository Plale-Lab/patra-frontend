# Frontend Dev Log

## Version 0.1.0

## Summary

Version `0.1.0` establishes the first structured frontend workspace for Patra. The frontend is now organized under a single `frontend/` directory, with the application and local mock backend separated into dedicated subprojects:

- `frontend/app`: Vue 3 + Vite application
- `frontend/mock-server`: local mock API for testing and UI development

This version also introduces runtime API mode switching, consolidates frontend network access behind a shared API layer, and stabilizes the current route set.

## Implemented Functionality

### Workspace and Project Structure

- Consolidated all frontend-related code into the `frontend/` workspace.
- Added a top-level frontend workspace package for common run/build entry points.
- Added compatibility wrapper packages under `frontend/frontend/...` so commands using nested `--prefix` paths still resolve correctly when run from inside `frontend/`.

### Application Modes

The frontend currently supports two execution modes:

1. Normal mode
   - Targets the live Patra REST API.
   - Default base URL: `http://localhost:5002`

2. Test mode
   - Targets the local mock server for development and UI validation.
   - Default base URL: `http://localhost:5003`

Mode behavior:

- Mode selection is persisted in local storage.
- Mode selection can be changed at runtime from the header bar.
- Pages that depend on API data automatically refetch when the mode changes.

### Shared API Layer

- Added a centralized API configuration module.
- Added a shared `apiFetch()` wrapper so views and stores no longer hardcode backend URLs.
- Standardized live/mock URL resolution in one place.

### Authentication

- Implemented Tapis-based login flow through the backend `/auth/tapis` endpoint.
- Added a local admin shortcut for development:
  - username: `admin`
  - password: `admin`
- Persisted user and token state in local storage.
- Added computed auth state:
  - logged-in status
  - admin status
  - Tapis-user status
  - display name and initials

### Public Routes

The following public routes are available:

- `/`
  - Dashboard overview
- `/explore-model-cards`
  - Browse and filter model cards
- `/explore-model-cards/:id`
  - Model card detail page
- `/explore-datasheets`
  - Browse and filter datasheets
- `/explore-datasheets/:id`
  - Datasheet detail page
- `/submit`
  - Submit a model card or datasheet for review
- `/tickets`
  - Submit and browse support tickets

Backward-compatibility redirects are in place for legacy `/explore` routes.

### Admin Routes

The following admin-only routes are available:

- `/models`
  - Manage model and datasheet visibility
  - Toggle field visibility for model card sections
- `/submissions`
  - Review pending submissions
  - Approve or reject submitted content
  - Add admin notes
- `/ticket-management`
  - Update ticket status
  - Add admin responses
- `/audit-log`
  - View recent audit activity
- `/settings`
  - Adjust system-level frontend settings

Route guards currently redirect non-admin users away from admin pages.

### Explore and Detail Workflows

Model card browsing supports:

- text search
- category filtering
- framework filtering
- author filtering
- visibility filtering

Model detail supports:

- core metadata
- AI model metadata
- training metrics
- bias analysis
- XAI feature importance
- deployment information
- data links and keywords

Datasheet browsing supports:

- text search
- resource type filtering
- publisher filtering
- visibility filtering

Datasheet detail supports:

- title and description display
- creators
- publisher metadata
- resource info
- rights
- dates
- related identifiers
- additional descriptions
- geo locations

### Submission Workflow

Submission flow currently supports two content types:

- model cards
- datasheets

Implemented behavior:

- form-based submission
- required-field gating before submit
- success-state confirmation after submit
- payload creation for backend review queue ingestion

### Ticket Workflow

User-side ticket flow supports:

- creating tickets
- setting category and priority
- reviewing recent submitted tickets
- opening ticket detail modals

Admin-side ticket flow supports:

- filtering by status
- reviewing ticket details
- updating status
- storing admin responses

### UI and Navigation

- Added persistent left sidebar navigation.
- Added top header with runtime API mode controls.
- Preserved separate public and admin navigation areas.
- Added connection-state banners to data-heavy views when backend access fails.

### Mock Server

The local mock server supports the frontend development flow for:

- authentication
- model cards
- model detail
- deployments
- datasheets
- submissions
- tickets
- users
- groups

Default mock server port is now `5003`.

## Developer Notes

- Frontend state management uses Pinia.
- Routing uses Vue Router with `createWebHistory()`.
- Network access for the main data flows has been centralized, but some parts of the admin surface still rely on local in-memory stores for demo/state simulation rather than live backend persistence.
- `frontend/app/package.json` still carries application version `0.0.0`; this dev log documents the shipped frontend milestone as `0.1.0`.

## Validation Performed

The following checks were completed for the current implementation:

- frontend dependencies installed successfully
- mock server dependencies installed successfully
- production build completed successfully with Vite
- mock server started successfully
- mock endpoint smoke test returned HTTP `200`

## Known Limitations

- Some admin pages use local/demo state instead of a production-backed API workflow.
- `UserManagementView.vue`, `GroupsView.vue`, and `LoginView.vue` exist in the codebase, but user/group routes remain disabled in the router.
- No formal frontend test suite is included yet.
- Environment configuration is lightweight and intended for local developer workflows.

## Recommended Next Steps

- Promote package versioning to match documented frontend releases.
- Add frontend linting and test automation.
- Finish API integration for remaining demo-backed admin pages.
- Enable or remove currently parked views to reduce dead surface area.
- Add environment-specific documentation for local, staging, and production deployments.
