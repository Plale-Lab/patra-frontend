import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import HeaderBar from './HeaderBar.vue'
import { useAuthStore } from '../stores/auth'

describe('catalog header embedded authentication state', () => {
  it('shows a portal-managed error instead of a second login form', async () => {
    localStorage.clear()
    sessionStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    await auth.initialize({
      embeddedAuthEnabled: true,
      isEmbedded: true,
      allowedOrigins: ['https://icicleai.tapis.io'],
      requestPortalAuth: vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { code: 'timeout' })),
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/search', name: 'CatalogSearch', component: { template: '<div />' } },
      ],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HeaderBar, { global: { plugins: [pinia, router], stubs: { Teleport: true } } })
    expect(wrapper.text()).toContain('Portal unavailable')
    expect(wrapper.text()).not.toContain('Tapis Login')
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
  })
})
