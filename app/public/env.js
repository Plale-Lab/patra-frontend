// Placeholder; Docker entrypoint overwrites /env.js at container start.
// Empty strings let app/config/api.js fall back to build-time Vite env values.
window.__PATRA_CONFIG__ = window.__PATRA_CONFIG__ || {
  API_BASE_URL: '',
  MOCK_API_BASE_URL: '',
  DEFAULT_API_MODE: '',
  SHOW_API_MODE: '',
  SUPPORTS_TICKETS: '',
  SUPPORTS_SUBMISSIONS_API: '',
  SUPPORTS_AGENT_TOOLS: '',
  SUPPORTS_EDIT_RECORDS: '',
  ADMIN_USERNAMES: '',
  USE_V1_ASSET_CREATE: '',
  ASSET_ORG: '',
  ASSET_API_KEY: '',
}
