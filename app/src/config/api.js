const runtimeConfig = typeof window !== 'undefined' ? window.__PATRA_CONFIG__ || {} : {}

export const API_BASE_URL = normalizeBaseUrl(
  runtimeConfig.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
)

export const MCP_BASE_URL = normalizeBaseUrl(
  runtimeConfig.MCP_BASE_URL || import.meta.env.VITE_MCP_BASE_URL || 'http://localhost:8050',
)

export const ADMIN_USERNAMES = parseCsvList(
  runtimeConfig.ADMIN_USERNAMES,
  import.meta.env.VITE_ADMIN_USERNAMES,
  'williamq96',
)

export function resolveApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '')
}

function parseCsvList(runtimeValue, envValue, fallback) {
  const value = runtimeValue ?? envValue ?? fallback
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}
