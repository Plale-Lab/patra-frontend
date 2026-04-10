export const API_MODES = ['live', 'mock']
export const API_MODE_STORAGE_KEY = 'patra_api_mode'

const runtimeConfig = typeof window !== 'undefined' ? window.__PATRA_CONFIG__ || {} : {}

const DEFAULT_LIVE_API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:8002' : 'http://localhost:8000'
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
  false,
)
export const SUPPORTS_SUBMISSIONS_API = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_SUBMISSIONS_API,
  import.meta.env.VITE_SUPPORTS_SUBMISSIONS_API,
  true,
)
export const SUPPORTS_AGENT_TOOLS = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_AGENT_TOOLS,
  import.meta.env.VITE_SUPPORTS_AGENT_TOOLS,
  false,
)
const editResourcesRuntimeFlag = runtimeConfig.SUPPORTS_EDIT_EXISTING_RESOURCES ?? runtimeConfig.SUPPORTS_EDIT_RECORDS
const editResourcesEnvFlag = import.meta.env.VITE_SUPPORTS_EDIT_EXISTING_RESOURCES ?? import.meta.env.VITE_SUPPORTS_EDIT_RECORDS
export const SUPPORTS_EDIT_RECORDS = resolveFeatureFlag(
  editResourcesRuntimeFlag,
  editResourcesEnvFlag,
  import.meta.env.DEV,
)
export const SUPPORTS_AUTOMATED_INGESTION = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_AUTOMATED_INGESTION,
  import.meta.env.VITE_SUPPORTS_AUTOMATED_INGESTION,
  import.meta.env.DEV,
)
export const SUPPORTS_ASK_PATRA = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_ASK_PATRA,
  import.meta.env.VITE_SUPPORTS_ASK_PATRA,
  import.meta.env.DEV,
)
export const SUPPORTS_INTENT_SCHEMA = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_INTENT_SCHEMA,
  import.meta.env.VITE_SUPPORTS_INTENT_SCHEMA,
  false,
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
export const SUPPORTS_DEV_OPEN_ACCESS = resolveFeatureFlag(
  runtimeConfig.SUPPORTS_DEV_OPEN_ACCESS,
  import.meta.env.VITE_SUPPORTS_DEV_OPEN_ACCESS,
  false,
)
export const ADMIN_USERNAMES = parseCsvList(
  runtimeConfig.ADMIN_USERNAMES,
  import.meta.env.VITE_ADMIN_USERNAMES,
  'williamq96,neelk',
)

export const USE_V1_ASSET_CREATE = resolveFeatureFlag(
  runtimeConfig.USE_V1_ASSET_CREATE,
  import.meta.env.VITE_USE_V1_ASSET_CREATE,
  true,
)

export function getAssetOrg() {
  const v = runtimeConfig.ASSET_ORG ?? import.meta.env.VITE_ASSET_ORG
  return v != null && String(v).length > 0 ? String(v) : ''
}

export function getAssetApiKey() {
  const v = runtimeConfig.ASSET_API_KEY ?? import.meta.env.VITE_ASSET_API_KEY
  return v != null && String(v).length > 0 ? String(v) : ''
}

const LIVE_API_BASE_URL = normalizeBaseUrl(
  runtimeConfig.API_BASE_URL || import.meta.env.VITE_LIVE_API_BASE_URL || DEFAULT_LIVE_API_BASE_URL,
)

const MOCK_API_BASE_URL = normalizeBaseUrl(
  runtimeConfig.MOCK_API_BASE_URL || import.meta.env.VITE_MOCK_API_BASE_URL || DEFAULT_MOCK_API_BASE_URL,
)

export const MCP_BASE_URL = normalizeBaseUrl(
  runtimeConfig.MCP_BASE_URL || import.meta.env.VITE_MCP_BASE_URL || 'http://localhost:8050',
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
      supportsTickets: false,
      supportsSubmissionQueue: true,
      supportsAgentTools: false,
      supportsEditRecords: true,
      supportsAutomatedIngestion: true,
      supportsAskPatra: true,
      supportsIntentSchema: false,
      supportsMcpExplorer: true,
      supportsDomainExperiments: true,
      supportsDevOpenAccess: false,
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
    supportsAgentTools: SUPPORTS_AGENT_TOOLS,
    supportsEditRecords: SUPPORTS_EDIT_RECORDS,
    supportsAutomatedIngestion: SUPPORTS_AUTOMATED_INGESTION,
    supportsAskPatra: SUPPORTS_ASK_PATRA,
    supportsIntentSchema: SUPPORTS_INTENT_SCHEMA,
    supportsMcpExplorer: SUPPORTS_MCP_EXPLORER,
    supportsDomainExperiments: SUPPORTS_DOMAIN_EXPERIMENTS,
    supportsDevOpenAccess: SUPPORTS_DEV_OPEN_ACCESS,
  }
}

export function resolveApiUrl(path, mode = getStoredApiMode()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl(mode)}${normalizedPath}`
}

export function resolveMcpUrl(path = '') {
  if (!path) return MCP_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${MCP_BASE_URL}${normalizedPath}`
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
  const runtimeResolved = runtimeValue === '' || runtimeValue == null ? null : runtimeValue
  const envResolved = envValue === '' || envValue == null ? null : envValue
  const value = runtimeResolved ?? envResolved ?? fallback
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}
