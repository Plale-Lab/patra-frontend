import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { useAuthStore } from './stores/auth'

describe('authentication initialization UI', () => {
  it('shows a neutral resolving state without rendering Guest', async () => {
    localStorage.clear()
    sessionStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    const neverResolves = new Promise(() => {})
    void auth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: ['https://portal.example.org'],
      requestPortalAuth: vi.fn(() => neverResolves),
    })

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: {
          Sidebar: true,
          RouterView: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Connecting to ICICLE/Tapis')
    expect(wrapper.text()).not.toContain('Guest')
  })
})
