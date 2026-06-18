import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './api'
import { clearRuntimeAuth, setRuntimeAuth } from './runtimeAuth'

describe('apiFetch authentication', () => {
  beforeEach(() => {
    clearRuntimeAuth()
    vi.unstubAllGlobals()
  })

  it('uses the active memory-only portal credential without sending identity headers', async () => {
    setRuntimeAuth({
      source: 'portal',
      token: 'portal-token',
      user: {
        username: 'portal-user',
        role: 'user',
        auth_type: 'tapis',
      },
    })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/modelcards')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.get('Authorization')).toBe('Bearer portal-token')
    expect(options.headers.get('X-Tapis-Token')).toBe('portal-token')
    expect(options.headers.has('X-Patra-Username')).toBe(false)
    expect(options.headers.has('X-Patra-Role')).toBe(false)
  })
})
