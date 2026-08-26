import { apiFetch } from './api'
import { parseErrorMessage } from './errorParsing'

export const TAPIS_AUTH_STATE_STORAGE_KEY = 'patra_tapis_oauth_state'

export class TapisRedirectAuthError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'TapisRedirectAuthError'
    this.code = code
  }
}

export function createTapisAuthState(cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.getRandomValues) {
    throw new TapisRedirectAuthError('crypto_unavailable', 'Secure random generation is unavailable')
  }

  const bytes = new Uint8Array(24)
  cryptoApi.getRandomValues(bytes)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

export function buildTapisAuthorizeUrl({ tenantBaseUrl, clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  })
  return `${tenantBaseUrl}/v3/oauth2/authorize?${params.toString()}`
}

// state must live in sessionStorage, not a closure variable: beginRedirectLogin
// does a full top-level navigation away to Tapis and back, tearing down the JS
// context. sessionStorage (scoped to tab + origin) survives that round trip.
export function storeTapisAuthState(state, { storage = sessionStorage } = {}) {
  storage.setItem(TAPIS_AUTH_STATE_STORAGE_KEY, state)
}

export function consumeTapisAuthState({ storage = sessionStorage } = {}) {
  const stored = storage.getItem(TAPIS_AUTH_STATE_STORAGE_KEY)
  storage.removeItem(TAPIS_AUTH_STATE_STORAGE_KEY)
  return stored
}

export function validateTapisAuthState(returnedState, storedState) {
  if (!returnedState || !storedState || returnedState !== storedState) {
    throw new TapisRedirectAuthError('invalid_state', 'Tapis sign-in response did not match the expected request')
  }
}

export async function exchangeTapisAuthCode({ code, redirectUri }) {
  const response = await apiFetch('/auth/tapis/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })
  if (!response.ok) {
    throw new TapisRedirectAuthError(
      'exchange_failed',
      await parseErrorMessage(response, 'Tapis authentication failed'),
    )
  }
  const data = await response.json()
  return {
    accessToken: data.access_token,
    username: data.username,
    expiresAt: data.expires_at ?? null,
  }
}
