import { resolveApiUrl } from '../config/api'

export function apiUrl(path) {
  return resolveApiUrl(path)
}

export function apiFetch(path, options) {
  const headers = new Headers(options?.headers || {})
  const token = localStorage.getItem('patra_token')
  const user = parseStoredUser()

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

  return fetch(apiUrl(path), {
    ...options,
    headers,
  })
}

function parseStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('patra_user') || 'null')
  } catch {
    return null
  }
}
