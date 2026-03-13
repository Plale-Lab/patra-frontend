export const API_MODES = ['live', 'mock']
export const API_MODE_STORAGE_KEY = 'patra_api_mode'

const runtimeConfig = typeof window !== 'undefined' ? window.__PATRA_CONFIG__ || {} : {}

const DEFAULT_LIVE_API_BASE_URL = 'http://localhost:5002'
const DEFAULT_MOCK_API_BASE_URL = 'http://localhost:5003'

export const DEFAULT_API_MODE =
  resolveApiMode(runtimeConfig.DEFAULT_API_MODE || import.meta.env.VITE_DEFAULT_API_MODE)
export const SHOW_API_MODE = resolveFeatureFlag(
  runtimeConfig.SHOW_API_MODE,
  import.meta.env.VITE_SHOW_API_MODE,
  import.meta.env.DEV,
)
export const SUPPORTS_TICKETS = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_TICKETS,
  import.meta.env.VITE_SUPPORTS_TICKETS,
  true,
)
export const SUPPORTS_SUBMISSIONS_API = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_SUBMISSIONS_API,
  import.meta.env.VITE_SUPPORTS_SUBMISSIONS_API,
  true,
)
export const ADMIN_USERNAMES = parseCsvList(
  runtimeConfig.ADMIN_USERNAMES,
  import.meta.env.VITE_ADMIN_USERNAMES,
  'williamq96',
)

const LIVE_API_BASE_URL = normalizeBaseUrl(
  runtimeConfig.API_BASE_URL || import.meta.env.VITE_LIVE_API_BASE_URL || DEFAULT_LIVE_API_BASE_URL,
)

const MOCK_API_BASE_URL = normalizeBaseUrl(
  runtimeConfig.MOCK_API_BASE_URL || import.meta.env.VITE_MOCK_API_BASE_URL || DEFAULT_MOCK_API_BASE_URL,
)

export function isApiMode(value) {
  return API_MODES.includes(value)
}

export function getStoredApiMode() {
  if (!SHOW_API_MODE) {
    return DEFAULT_API_MODE
  }

  const stored = localStorage.getItem(API_MODE_STORAGE_KEY)
  return isApiMode(stored) ? stored : DEFAULT_API_MODE
}

export function setStoredApiMode(mode) {
  if (!SHOW_API_MODE) {
    localStorage.removeItem(API_MODE_STORAGE_KEY)
    return
  }

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
      supportsTickets: true,
      supportsSubmissionQueue: true,
    }
  }

  return {
    key: 'live',
    shortLabel: 'Normal',
    label: 'Normal Mode',
    description: 'Call the real Patra REST API.',
    helpText: 'Ensure the Patra REST server is running on the live API URL.',
    supportsTickets: SUPPORTS_TICKETS,
    supportsSubmissionQueue: SUPPORTS_SUBMISSIONS_API,
  }
}

export function resolveApiUrl(path, mode = getStoredApiMode()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl(mode)}${normalizedPath}`
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '')
}

function resolveApiMode(value) {
  return value === 'mock' ? 'mock' : 'live'
}

function resolveFeatureFlag(runtimeValue, envValue, fallback) {
  const value = runtimeValue ?? envValue
  if (value === '' || value == null) {
    return Boolean(fallback)
  }

  return String(value).toLowerCase() === 'true'
}

function parseCsvList(runtimeValue, envValue, fallback) {
  const value = runtimeValue ?? envValue ?? fallback
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}
