import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TAPIS_AUTH_STATE_STORAGE_KEY,
  buildTapisAuthorizeUrl,
  consumeTapisAuthState,
  createTapisAuthState,
  exchangeTapisAuthCode,
  storeTapisAuthState,
  validateTapisAuthState,
} from './tapisRedirectAuth'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildTapisAuthorizeUrl', () => {
  it('builds a correctly-encoded authorize URL', () => {
    const url = buildTapisAuthorizeUrl({
      tenantBaseUrl: 'https://icicleai.tapis.io',
      clientId: 'patra client',
      redirectUri: 'https://patra.example/auth/callback',
      state: 'nonce-1',
    })

    expect(url).toBe(
      'https://icicleai.tapis.io/v3/oauth2/authorize?' +
      'client_id=patra+client&redirect_uri=https%3A%2F%2Fpatra.example%2Fauth%2Fcallback' +
      '&response_type=code&state=nonce-1',
    )
  })
})

describe('createTapisAuthState', () => {
  it('returns a 48-character hex string from the injected crypto API', () => {
    const fakeCrypto = { getRandomValues: (bytes) => bytes.fill(0xab) }
    const state = createTapisAuthState(fakeCrypto)
    expect(state).toBe('ab'.repeat(24))
  })

  it('throws crypto_unavailable when getRandomValues is absent', () => {
    expect(() => createTapisAuthState({})).toThrowError(
      expect.objectContaining({ code: 'crypto_unavailable' }),
    )
  })
})

describe('storeTapisAuthState / consumeTapisAuthState', () => {
  it('round-trips a stored state and burns it on read (single-use)', () => {
    const storage = createFakeStorage()
    storeTapisAuthState('nonce-1', { storage })
    expect(storage.getItem(TAPIS_AUTH_STATE_STORAGE_KEY)).toBe('nonce-1')

    expect(consumeTapisAuthState({ storage })).toBe('nonce-1')
    expect(consumeTapisAuthState({ storage })).toBeNull()
  })
})

describe('validateTapisAuthState', () => {
  it('passes when the returned and stored states match', () => {
    expect(() => validateTapisAuthState('nonce-1', 'nonce-1')).not.toThrow()
  })

  it('throws invalid_state on mismatch, missing returned, or missing stored state', () => {
    expect(() => validateTapisAuthState('nonce-1', 'nonce-2')).toThrowError(
      expect.objectContaining({ code: 'invalid_state' }),
    )
    expect(() => validateTapisAuthState(null, 'nonce-2')).toThrowError(
      expect.objectContaining({ code: 'invalid_state' }),
    )
    expect(() => validateTapisAuthState('nonce-1', null)).toThrowError(
      expect.objectContaining({ code: 'invalid_state' }),
    )
  })
})

describe('exchangeTapisAuthCode', () => {
  it('resolves the token/username/expiry on a successful exchange', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tapis-jwt', username: 'alice', expires_at: 123 }),
    }))

    const result = await exchangeTapisAuthCode({ code: 'abc123', redirectUri: 'https://patra.example/auth/callback' })

    expect(result).toEqual({ accessToken: 'tapis-jwt', username: 'alice', expiresAt: 123 })
  })

  it('throws exchange_failed with the parsed error detail on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ detail: 'Tapis token exchange failed: bad code' }),
    }))

    await expect(
      exchangeTapisAuthCode({ code: 'bad', redirectUri: 'https://patra.example/auth/callback' }),
    ).rejects.toMatchObject({ code: 'exchange_failed', message: 'Tapis token exchange failed: bad code' })
  })
})

function createFakeStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  }
}
