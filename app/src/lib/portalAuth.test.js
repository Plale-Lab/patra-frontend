import { describe, expect, it, vi } from 'vitest'
import {
  MIN_PORTAL_TOKEN_REMAINING_MS,
  PORTAL_AUTH_REQUEST_TYPE,
  PORTAL_AUTH_RESPONSE_TYPE,
  PORTAL_AUTH_PROTOCOL_VERSION,
  parseTapisAccessToken,
  requestPortalAuth,
} from './portalAuth'

const NOW = 2_000_000_000_000
const PORTAL_ORIGIN = 'https://portal.example.org'

describe('portal authentication protocol', () => {
  it('accepts a valid response from the configured parent and derives the Tapis username', async () => {
    const harness = createMessageHarness()
    const authPromise = requestPortalAuth({
      allowedOrigins: [PORTAL_ORIGIN],
      timeoutMs: 3000,
      hostWindow: harness.hostWindow,
      parentWindow: harness.parentWindow,
      now: () => NOW,
      requestIdFactory: () => 'nonce-1',
    })

    expect(harness.messages).toEqual([{
      message: {
        type: PORTAL_AUTH_REQUEST_TYPE,
        version: PORTAL_AUTH_PROTOCOL_VERSION,
        requestId: 'nonce-1',
      },
      targetOrigin: PORTAL_ORIGIN,
    }])

    harness.emit({
      source: harness.parentWindow,
      origin: PORTAL_ORIGIN,
      data: {
        type: PORTAL_AUTH_RESPONSE_TYPE,
        version: PORTAL_AUTH_PROTOCOL_VERSION,
        requestId: 'nonce-1',
        accessToken: makeJwt({ exp: (NOW + 300_000) / 1000, 'tapis/username': 'portal-user' }),
        tokenType: 'Bearer',
      },
    })

    await expect(authPromise).resolves.toMatchObject({
      username: 'portal-user',
      expiresAt: NOW + 300_000,
    })
  })

  it('ignores unexpected sources, origins, and request IDs until a valid response arrives', async () => {
    const harness = createMessageHarness()
    const authPromise = requestPortalAuth({
      allowedOrigins: [PORTAL_ORIGIN],
      timeoutMs: 3000,
      hostWindow: harness.hostWindow,
      parentWindow: harness.parentWindow,
      now: () => NOW,
      requestIdFactory: () => 'nonce-2',
    })
    const validData = {
      type: PORTAL_AUTH_RESPONSE_TYPE,
      version: PORTAL_AUTH_PROTOCOL_VERSION,
      requestId: 'nonce-2',
      accessToken: makeJwt({ exp: (NOW + 300_000) / 1000, sub: 'fallback-user@tacc' }),
      tokenType: 'Bearer',
    }

    harness.emit({ source: {}, origin: PORTAL_ORIGIN, data: validData })
    harness.emit({ source: harness.parentWindow, origin: 'https://evil.example.org', data: validData })
    harness.emit({
      source: harness.parentWindow,
      origin: PORTAL_ORIGIN,
      data: { ...validData, requestId: 'old-nonce' },
    })
    harness.emit({ source: harness.parentWindow, origin: PORTAL_ORIGIN, data: validData })

    await expect(authPromise).resolves.toMatchObject({ username: 'fallback-user' })
  })

  it('rejects an invalid token type after consuming the matching nonce', async () => {
    const harness = createMessageHarness()
    const authPromise = requestPortalAuth({
      allowedOrigins: [PORTAL_ORIGIN],
      timeoutMs: 3000,
      hostWindow: harness.hostWindow,
      parentWindow: harness.parentWindow,
      now: () => NOW,
      requestIdFactory: () => 'nonce-3',
    })

    harness.emit({
      source: harness.parentWindow,
      origin: PORTAL_ORIGIN,
      data: {
        type: PORTAL_AUTH_RESPONSE_TYPE,
        version: PORTAL_AUTH_PROTOCOL_VERSION,
        requestId: 'nonce-3',
        accessToken: makeJwt({ exp: (NOW + 300_000) / 1000, sub: 'user@tacc' }),
        tokenType: 'Basic',
      },
    })

    await expect(authPromise).rejects.toMatchObject({ code: 'invalid_token_type' })
    expect(harness.listenerCount()).toBe(0)
  })

  it('times out safely when no valid response arrives', async () => {
    vi.useFakeTimers()
    const harness = createMessageHarness()
    const authPromise = requestPortalAuth({
      allowedOrigins: [PORTAL_ORIGIN],
      timeoutMs: 3000,
      hostWindow: harness.hostWindow,
      parentWindow: harness.parentWindow,
      requestIdFactory: () => 'nonce-4',
    })

    const rejection = expect(authPromise).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(3000)
    await rejection
    vi.useRealTimers()
  })
})

describe('Tapis JWT validation', () => {
  it('rejects malformed, expired, and near-expiry tokens', () => {
    expect(() => parseTapisAccessToken('not-a-jwt', { now: NOW })).toThrowError(
      expect.objectContaining({ code: 'malformed_token' }),
    )
    expect(() => parseTapisAccessToken(
      makeJwt({ exp: (NOW - 1000) / 1000, sub: 'user@tacc' }),
      { now: NOW },
    )).toThrowError(expect.objectContaining({ code: 'expired_token' }))
    expect(() => parseTapisAccessToken(
      makeJwt({ exp: (NOW + MIN_PORTAL_TOKEN_REMAINING_MS - 1) / 1000, sub: 'user@tacc' }),
      { now: NOW },
    )).toThrowError(expect.objectContaining({ code: 'near_expiry_token' }))
  })
})

function createMessageHarness() {
  const listeners = new Set()
  const messages = []
  const hostWindow = {
    addEventListener(type, listener) {
      if (type === 'message') listeners.add(listener)
    },
    removeEventListener(type, listener) {
      if (type === 'message') listeners.delete(listener)
    },
    setTimeout,
    clearTimeout,
  }
  const parentWindow = {
    postMessage(message, targetOrigin) {
      messages.push({ message, targetOrigin })
    },
  }
  hostWindow.parent = parentWindow

  return {
    hostWindow,
    parentWindow,
    messages,
    emit(event) {
      for (const listener of [...listeners]) listener(event)
    },
    listenerCount() {
      return listeners.size
    },
  }
}

function makeJwt(payload) {
  return [
    encodePart({ alg: 'RS256', typ: 'JWT' }),
    encodePart(payload),
    'signature',
  ].join('.')
}

function encodePart(value) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
