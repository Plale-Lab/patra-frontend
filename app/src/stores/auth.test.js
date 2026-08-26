import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRuntimeAuth } from '../lib/runtimeAuth'
import { useAuthStore } from './auth'

const PORTAL_ORIGIN = 'https://portal.example.org'

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('uses a memory-only portal session ahead of a persisted standalone session', async () => {
    seedStandaloneSession('standalone-user', makeJwt('standalone-user', Date.now() + 300_000))
    setActivePinia(createPinia())
    const auth = useAuthStore()
    const portalToken = makeJwt('portal-user', Date.now() + 300_000)

    await auth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: [PORTAL_ORIGIN],
      requestPortalAuth: vi.fn().mockResolvedValue({
        username: 'portal-user',
        token: portalToken,
        expiresAt: Date.now() + 300_000,
      }),
    })

    expect(auth.source).toBe('portal')
    expect(auth.displayName).toBe('portal-user')
    expect(auth.isPortalUser).toBe(true)
    expect(getRuntimeAuth()).toMatchObject({
      source: 'portal',
      token: portalToken,
      user: { username: 'portal-user' },
    })
    expect(localStorage.getItem('patra_token')).not.toBe(portalToken)
    expect(sessionStorage.getItem('patra_session_token')).not.toBe(portalToken)
  })

  it('does not expose standalone login state when embedded auth is unavailable', async () => {
    const standaloneToken = makeJwt('standalone-user', Date.now() + 300_000)
    seedStandaloneSession('standalone-user', standaloneToken)
    setActivePinia(createPinia())
    const fallbackAuth = useAuthStore()

    await fallbackAuth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: [PORTAL_ORIGIN],
      requestPortalAuth: vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { code: 'timeout' })),
    })

    expect(fallbackAuth.source).toBe('guest')
    expect(fallbackAuth.displayName).toBe('Guest')
    expect(fallbackAuth.portalAuthUnavailable).toBe(true)
    expect(fallbackAuth.portalAuthErrorCode).toBe('timeout')

    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    const guestAuth = useAuthStore()
    await guestAuth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: [PORTAL_ORIGIN],
      requestPortalAuth: vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { code: 'timeout' })),
    })

    expect(guestAuth.source).toBe('guest')
    expect(guestAuth.displayName).toBe('Guest')
    expect(guestAuth.portalAuthUnavailable).toBe(true)
  })

  it('preserves standalone login persistence and logout', async () => {
    const auth = useAuthStore()
    await auth.initialize({ embeddedAuthEnabled: false })
    const standaloneToken = makeJwt('standalone-user', Date.now() + 300_000)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { access_token: { access_token: standaloneToken } } }),
    }))

    await expect(auth.loginTapis('standalone-user', 'password', { rememberMe: true })).resolves.toBe(true)
    expect(auth.source).toBe('standalone')
    expect(localStorage.getItem('patra_token')).toBe(standaloneToken)

    setActivePinia(createPinia())
    const reloadedAuth = useAuthStore()
    await reloadedAuth.initialize({ embeddedAuthEnabled: false })
    expect(reloadedAuth.source).toBe('standalone')
    expect(reloadedAuth.displayName).toBe('standalone-user')

    expect(reloadedAuth.logout()).toBe(true)
    expect(reloadedAuth.source).toBe('guest')
    expect(localStorage.getItem('patra_token')).toBeNull()
  })

  it('refreshes portal auth before expiry and clears portal identity if a later refresh fails', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    const now = Date.now()
    const initialToken = makeJwt('portal-user', now + 121_000)
    const refreshedToken = makeJwt('portal-user', now + 600_000)
    const request = vi.fn()
      .mockResolvedValueOnce({ username: 'portal-user', token: initialToken, expiresAt: now + 121_000 })
      .mockResolvedValueOnce({ username: 'portal-user', token: refreshedToken, expiresAt: now + 600_000 })
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'timeout' }))
    const auth = useAuthStore()

    await auth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: [PORTAL_ORIGIN],
      requestPortalAuth: request,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(auth.effectiveToken).toBe(refreshedToken)
    expect(request).toHaveBeenCalledTimes(2)

    await auth.refreshPortalAuth()
    expect(auth.source).toBe('guest')
    expect(auth.isPortalUser).toBe(false)
    expect(auth.portalAuthUnavailable).toBe(true)
  })

  describe('redirect login', () => {
    it('begins redirect login by navigating to the authorize URL and storing state', async () => {
      const auth = useAuthStore()
      await auth.initialize({ embeddedAuthEnabled: false })
      const navigate = vi.fn()
      const storeState = vi.fn()

      const ok = auth.beginRedirectLogin({
        clientId: 'patra-client',
        tenantBaseUrl: 'https://icicleai.tapis.io',
        redirectUri: 'https://patra.example/auth/callback',
        createState: () => 'nonce-1',
        storeState,
        navigate,
      })

      expect(ok).toBe(true)
      expect(storeState).toHaveBeenCalledWith('nonce-1')
      expect(navigate).toHaveBeenCalledWith(
        'https://icicleai.tapis.io/v3/oauth2/authorize?client_id=patra-client&redirect_uri=https%3A%2F%2Fpatra.example%2Fauth%2Fcallback&response_type=code&state=nonce-1',
      )
    })

    it('does not navigate and sets an error when no client ID is configured', async () => {
      const auth = useAuthStore()
      await auth.initialize({ embeddedAuthEnabled: false })
      const navigate = vi.fn()

      const ok = auth.beginRedirectLogin({ clientId: '', navigate })

      expect(ok).toBe(false)
      expect(navigate).not.toHaveBeenCalled()
      expect(auth.error).toMatch(/not configured/)
    })

    it('completes redirect login and establishes a standalone session', async () => {
      const auth = useAuthStore()
      await auth.initialize({ embeddedAuthEnabled: false })
      const token = makeJwt('redirect-user', Date.now() + 300_000)

      const ok = await auth.completeRedirectLogin(
        { code: 'abc123', state: 'nonce-1' },
        {
          consumeState: () => 'nonce-1',
          exchangeTapisAuthCode: vi.fn().mockResolvedValue({ accessToken: token, username: 'redirect-user' }),
        },
      )

      expect(ok).toBe(true)
      expect(auth.source).toBe('standalone')
      expect(auth.displayName).toBe('redirect-user')
      expect(localStorage.getItem('patra_token')).toBe(token)
    })

    it('rejects on state mismatch without establishing a session', async () => {
      const auth = useAuthStore()
      await auth.initialize({ embeddedAuthEnabled: false })
      const exchange = vi.fn()

      const ok = await auth.completeRedirectLogin(
        { code: 'abc123', state: 'nonce-1' },
        { consumeState: () => 'different-nonce', exchangeTapisAuthCode: exchange },
      )

      expect(ok).toBe(false)
      expect(auth.source).toBe('guest')
      expect(exchange).not.toHaveBeenCalled()
    })

    it('short-circuits on a provider error without consuming state or exchanging', async () => {
      const auth = useAuthStore()
      await auth.initialize({ embeddedAuthEnabled: false })
      const consumeState = vi.fn()
      const exchange = vi.fn()

      const ok = await auth.completeRedirectLogin(
        { error: 'access_denied' },
        { consumeState, exchangeTapisAuthCode: exchange },
      )

      expect(ok).toBe(false)
      expect(auth.error).toMatch(/access_denied/)
      expect(consumeState).not.toHaveBeenCalled()
      expect(exchange).not.toHaveBeenCalled()
    })

    it('surfaces an exchange rejection without establishing a session', async () => {
      const auth = useAuthStore()
      await auth.initialize({ embeddedAuthEnabled: false })

      const ok = await auth.completeRedirectLogin(
        { code: 'abc123', state: 'nonce-1' },
        {
          consumeState: () => 'nonce-1',
          exchangeTapisAuthCode: vi.fn().mockRejectedValue(new Error('Tapis authentication failed')),
        },
      )

      expect(ok).toBe(false)
      expect(auth.source).toBe('guest')
      expect(auth.error).toBe('Tapis authentication failed')
    })
  })
})

function seedStandaloneSession(username, token) {
  localStorage.setItem('patra_auth_schema_version', '2')
  sessionStorage.setItem('patra_auth_schema_version', '2')
  localStorage.setItem('patra_user', JSON.stringify({
    username,
    name: username,
    role: 'user',
    auth_type: 'tapis',
  }))
  localStorage.setItem('patra_token', token)
  localStorage.setItem('patra_auth_expires_at', String(Date.now() + 300_000))
}

function makeJwt(username, expiresAt) {
  return [
    encodePart({ alg: 'RS256', typ: 'JWT' }),
    encodePart({ exp: expiresAt / 1000, 'tapis/username': username, sub: `${username}@tacc` }),
    'signature',
  ].join('.')
}

function encodePart(value) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
