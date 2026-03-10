import { resolveApiUrl } from '../config/api'

export function apiUrl(path) {
  return resolveApiUrl(path)
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options)
}
