export const API_MODES = ['live', 'mock']
export const API_MODE_STORAGE_KEY = 'patra_api_mode'

const DEFAULT_LIVE_API_BASE_URL = 'http://localhost:5002'
const DEFAULT_MOCK_API_BASE_URL = 'http://localhost:5003'

export const DEFAULT_API_MODE =
  import.meta.env.VITE_DEFAULT_API_MODE === 'mock' ? 'mock' : 'live'

const LIVE_API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_LIVE_API_BASE_URL || DEFAULT_LIVE_API_BASE_URL,
)

const MOCK_API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_MOCK_API_BASE_URL || DEFAULT_MOCK_API_BASE_URL,
)

export function isApiMode(value) {
  return API_MODES.includes(value)
}

export function getStoredApiMode() {
  const stored = localStorage.getItem(API_MODE_STORAGE_KEY)
  return isApiMode(stored) ? stored : DEFAULT_API_MODE
}

export function setStoredApiMode(mode) {
  localStorage.setItem(API_MODE_STORAGE_KEY, isApiMode(mode) ? mode : DEFAULT_API_MODE)
}

export function getApiBaseUrl(mode = getStoredApiMode()) {
  return mode === 'mock' ? MOCK_API_BASE_URL : LIVE_API_BASE_URL
}

export function getApiModeMeta(mode = getStoredApiMode()) {
  if (mode === 'mock') {
    return {
      key: 'mock',
      shortLabel: 'Test',
      label: 'Test Mode',
      description: 'Use the local mock server for frontend testing.',
      helpText: 'Start the local mock server with `cd frontend/mock-server && npm start`.',
    }
  }

  return {
    key: 'live',
    shortLabel: 'Normal',
    label: 'Normal Mode',
    description: 'Call the real Patra REST API.',
    helpText: 'Ensure the Patra REST server is running on the live API URL.',
  }
}

export function resolveApiUrl(path, mode = getStoredApiMode()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl(mode)}${normalizedPath}`
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '')
}
