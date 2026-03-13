import { resolveApiUrl } from '../config/api'

export function apiUrl(path) {
  return resolveApiUrl(path)
}

export function apiFetch(path, options) {
  const headers = new Headers(options?.headers || {})
  const token = localStorage.getItem('patra_token')

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (token && !headers.has('X-Tapis-Token')) {
    headers.set('X-Tapis-Token', token)
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
  })
}
