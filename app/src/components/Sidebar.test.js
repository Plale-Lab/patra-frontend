import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import Sidebar from './Sidebar.vue'
import { useAuthStore } from '../stores/auth'

describe('Sidebar embedded authentication state', () => {
  it('shows a portal-managed error instead of a second login button', async () => {
    localStorage.clear()
    sessionStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    await auth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: ['https://icicleai.tapis.io'],
      requestPortalAuth: vi.fn().mockRejectedValue(
        Object.assign(new Error('timeout'), { code: 'timeout' }),
      ),
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [pinia, router],
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Portal session unavailable')
    expect(wrapper.text()).not.toContain('Tapis Login')
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
  })
})
