const runtimeConfig = typeof window !== 'undefined' ? window.__PATRA_CONFIG__ || {} : {}

const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:8002' : 'http://localhost:8000'

export const SUPPORTS_AGENT_TOOLS = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_AGENT_TOOLS,
  import.meta.env.VITE_SUPPORTS_AGENT_TOOLS,
  false,
)
const editResourcesRuntimeFlag = firstSet(runtimeConfig.SUPPORTS_EDIT_EXISTING_RESOURCES, runtimeConfig.SUPPORTS_EDIT_RECORDS)
const editResourcesEnvFlag = firstSet(import.meta.env.VITE_SUPPORTS_EDIT_EXISTING_RESOURCES, import.meta.env.VITE_SUPPORTS_EDIT_RECORDS)
export const SUPPORTS_EDIT_RECORDS = resolveFeatureFlag(
  editResourcesRuntimeFlag,
  editResourcesEnvFlag,
  import.meta.env.DEV,
)
export const SUPPORTS_ASK_PATRA = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_ASK_PATRA,
  import.meta.env.VITE_SUPPORTS_ASK_PATRA,
  import.meta.env.DEV,
)
export const SUPPORTS_MCP_EXPLORER = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_MCP_EXPLORER,
  import.meta.env.VITE_SUPPORTS_MCP_EXPLORER,
  false,
)
export const SUPPORTS_DOMAIN_EXPERIMENTS = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_DOMAIN_EXPERIMENTS,
  import.meta.env.VITE_SUPPORTS_DOMAIN_EXPERIMENTS,
  false,
)
export const SUPPORTS_HF_IMPORT = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_HF_IMPORT,
  import.meta.env.VITE_SUPPORTS_HF_IMPORT,
  true,
)
export const SUPPORTS_DEV_OPEN_ACCESS = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_DEV_OPEN_ACCESS,
  import.meta.env.VITE_SUPPORTS_DEV_OPEN_ACCESS,
  false,
)
export const EMBEDDED_AUTH_ENABLED = resolveFeatureFlag(
  runtimeConfig.EMBEDDED_AUTH_ENABLED,
  import.meta.env.VITE_EMBEDDED_AUTH_ENABLED,
  false,
)
export const PORTAL_AUTH_ORIGINS = parseOriginList(
  runtimeConfig.PORTAL_AUTH_ORIGINS,
  import.meta.env.VITE_PORTAL_AUTH_ORIGINS,
)
export const PORTAL_AUTH_TIMEOUT_MS = parsePositiveInteger(
  runtimeConfig.PORTAL_AUTH_TIMEOUT_MS,
  import.meta.env.VITE_PORTAL_AUTH_TIMEOUT_MS,
  3000,
)

export function getAssetOrg() {
  const v = runtimeConfig.ASSET_ORG ?? import.meta.env.VITE_ASSET_ORG
  return v != null && String(v).length > 0 ? String(v) : ''
}

export function getAssetApiKey() {
  const v = runtimeConfig.ASSET_API_KEY ?? import.meta.env.VITE_ASSET_API_KEY
  return v != null && String(v).length > 0 ? String(v) : ''
}

export const API_BASE_URL = normalizeBaseUrl(
  runtimeConfig.API_BASE_URL || import.meta.env.VITE_LIVE_API_BASE_URL || DEFAULT_API_BASE_URL,
)

export const MCP_BASE_URL = normalizeBaseUrl(
  runtimeConfig.MCP_BASE_URL || import.meta.env.VITE_MCP_BASE_URL || 'http://localhost:8050',
)

export function resolveApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function resolveMcpUrl(path = '') {
  if (!path) return MCP_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${MCP_BASE_URL}${normalizedPath}`
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '')
}

// Return the first value that is actually set, treating '' (the placeholder
// public/env.js ships in dev) and null/undefined as "not set".
function firstSet(...values) {
  for (const value of values) {
    if (value !== '' && value != null) return value
  }
  return null
}

function resolveFeatureFlag(runtimeValue, envValue, fallback) {
  // Each flag resolves independently: runtime config > build-time env > fallback.
  // Empty strings fall through (window.__PATRA_CONFIG__ ships '' placeholders in
  // dev), so an unset runtime value lets the .env value drive the flag.
  const value = firstSet(runtimeValue, envValue)
  if (value == null) {
    return Boolean(fallback)
  }

  return String(value).toLowerCase() === 'true'
}

function parseOriginList(runtimeValue, envValue) {
  const value = firstSet(runtimeValue, envValue)
  return Array.from(new Set(String(value || '')
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean)))
}

function normalizeOrigin(value) {
  const candidate = String(value || '').trim()
  if (!candidate) return ''

  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    if (url.username || url.password || url.search || url.hash) return ''
    if (url.pathname && url.pathname !== '/') return ''
    return url.origin
  } catch {
    return ''
  }
}

function parsePositiveInteger(runtimeValue, envValue, fallback) {
  const parsed = Number.parseInt(firstSet(runtimeValue, envValue), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
