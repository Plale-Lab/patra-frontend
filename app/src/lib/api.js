import { resolveApiUrl, getAssetOrg, getAssetApiKey, SUPPORTS_DEV_OPEN_ACCESS, ADMIN_USERNAMES } from '../config/api'

const LOCAL_USER_KEY = 'patra_user'
const LOCAL_TOKEN_KEY = 'patra_token'
const LOCAL_EXPIRY_KEY = 'patra_auth_expires_at'
const SESSION_USER_KEY = 'patra_session_user'
const SESSION_TOKEN_KEY = 'patra_session_token'

export function apiUrl(path) {
  return resolveApiUrl(path)
}

export function apiFetch(path, options) {
  const headers = new Headers(options?.headers || {})
  const { token, user } = getStoredAuth()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (token && !headers.has('X-Tapis-Token')) {
    headers.set('X-Tapis-Token', token)
  }

  if (user?.username && !headers.has('X-Patra-Username')) {
    headers.set('X-Patra-Username', user.username)
  }

  if (user?.role && !headers.has('X-Patra-Role')) {
    headers.set('X-Patra-Role', user.role)
  }

  const assetOrg = getAssetOrg()
  if (assetOrg && !headers.has('X-Asset-Org')) {
    headers.set('X-Asset-Org', assetOrg)
  }

  const assetApiKey = getAssetApiKey()
  if (assetApiKey && !headers.has('X-Asset-Api-Key')) {
    headers.set('X-Asset-Api-Key', assetApiKey)
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
  })
}

function getStoredAuth() {
  const expiresAt = Number(localStorage.getItem(LOCAL_EXPIRY_KEY) || 0)
  let storedToken = ''
  let storedUser = null

  if (expiresAt && Date.now() < expiresAt) {
    storedToken = localStorage.getItem(LOCAL_TOKEN_KEY) || ''
    storedUser = parseStoredUser(localStorage.getItem(LOCAL_USER_KEY))
  } else {
    if (expiresAt) {
      clearLocalAuth()
    }

    storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || ''
    storedUser = parseStoredUser(sessionStorage.getItem(SESSION_USER_KEY))
  }

  if (SUPPORTS_DEV_OPEN_ACCESS) {
    return {
      token: storedToken || '__patra_dev_open_access__',
      user: {
        username: storedUser?.username || 'dev-open-access',
        name: storedUser?.name || storedUser?.username || 'Dev Open Access',
        role: 'admin',
        auth_type: storedUser?.auth_type || 'tapis',
      },
    }
  }

  return {
    token: storedToken,
    user: storedUser,
  }
}

function parseStoredUser(rawValue) {
  try {
    const user = JSON.parse(rawValue || 'null')
    if (!user || typeof user !== 'object') return user

    if (user.auth_type === 'tapis') {
      const normalizedUsername = String(user.username || '').trim().toLowerCase()
      return {
        ...user,
        role: ADMIN_USERNAMES.includes(normalizedUsername) ? 'admin' : 'user',
      }
    }

    return user
  } catch {
    return null
  }
}

function clearLocalAuth() {
  localStorage.removeItem(LOCAL_USER_KEY)
  localStorage.removeItem(LOCAL_TOKEN_KEY)
  localStorage.removeItem(LOCAL_EXPIRY_KEY)
}
