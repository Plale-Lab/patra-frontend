import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('router guard', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('open access bypasses the login requirement but still hides feature-flagged routes', async () => {
    vi.doMock('../config/api', async () => {
      const actual = await vi.importActual('../config/api')
      return {
        ...actual,
        SUPPORTS_DEV_OPEN_ACCESS: true,
        SUPPORTS_AGENT_TOOLS: false,
      }
    })

    const { default: router } = await import('./index')

    await router.push('/agent-tools')
    expect(router.currentRoute.value.name).toBe('Dashboard')

    await router.push('/create-cards')
    expect(router.currentRoute.value.name).toBe('Submit')
  })

  it('without open access, a tapis-only route redirects an unauthenticated visitor', async () => {
    vi.doMock('../config/api', async () => {
      const actual = await vi.importActual('../config/api')
      return {
        ...actual,
        SUPPORTS_DEV_OPEN_ACCESS: false,
      }
    })

    const { default: router } = await import('./index')

    await router.push('/create-cards')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})
