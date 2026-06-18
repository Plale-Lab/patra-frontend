import { resolveApiUrl, getAssetOrg, getAssetApiKey, SUPPORTS_DEV_OPEN_ACCESS } from '../config/api'
import { getRuntimeAuth } from './runtimeAuth'

export function apiUrl(path) {
  return resolveApiUrl(path)
}

export function apiFetch(path, options) {
  const headers = new Headers(options?.headers || {})
  let { token, user } = getRuntimeAuth()

  if (!token && SUPPORTS_DEV_OPEN_ACCESS) {
    token = '__patra_dev_open_access__'
    user = {
      username: 'dev-open-access',
      name: 'Dev Open Access',
      role: 'admin',
      auth_type: 'tapis',
    }
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (token && !headers.has('X-Tapis-Token')) {
    headers.set('X-Tapis-Token', token)
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
