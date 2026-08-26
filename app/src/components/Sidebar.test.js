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

describe('Sidebar standalone login mode', () => {
  it('password mode (default): clicking the login button opens the modal', async () => {
    localStorage.clear()
    sessionStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    await auth.initialize({ embeddedAuthEnabled: false })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Sidebar, {
      global: { plugins: [pinia, router], stubs: { Teleport: true } },
    })

    expect(wrapper.text()).toContain('Tapis Login')
    await wrapper.find('.sidebar-login-btn').trigger('click')

    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('redirect mode: clicking the login button calls beginRedirectLogin and never opens the modal', async () => {
    vi.resetModules()
    localStorage.clear()
    sessionStorage.clear()
    vi.doMock('../config/api', async () => {
      const actual = await vi.importActual('../config/api')
      return { ...actual, STANDALONE_AUTH_MODE: 'redirect' }
    })

    const { useAuthStore: useAuthStoreMocked } = await import('../stores/auth')
    const { default: SidebarMocked } = await import('./Sidebar.vue')

    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStoreMocked()
    await auth.initialize({ embeddedAuthEnabled: false })
    const beginRedirectLogin = vi.spyOn(auth, 'beginRedirectLogin').mockReturnValue(true)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(SidebarMocked, {
      global: { plugins: [pinia, router], stubs: { Teleport: true } },
    })

    expect(wrapper.text()).toContain('Sign in with Tapis')
    await wrapper.find('.sidebar-login-btn').trigger('click')

    expect(beginRedirectLogin).toHaveBeenCalledTimes(1)
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)

    vi.doUnmock('../config/api')
  })
})
