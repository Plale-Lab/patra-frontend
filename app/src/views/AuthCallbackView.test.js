import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import AuthCallbackView from './AuthCallbackView.vue'
import { useAuthStore } from '../stores/auth'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/auth/callback', name: 'TapisAuthCallback', component: AuthCallbackView },
    ],
  })
}

describe('AuthCallbackView', () => {
  it('passes query params through and navigates to Dashboard on success', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    await auth.initialize({ embeddedAuthEnabled: false })
    const completeRedirectLogin = vi.spyOn(auth, 'completeRedirectLogin').mockResolvedValue(true)

    const router = createTestRouter()
    await router.push('/auth/callback?code=abc123&state=nonce-1')
    await router.isReady()

    mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(completeRedirectLogin).toHaveBeenCalledWith({ code: 'abc123', state: 'nonce-1', error: undefined })
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('shows the error and stays put on failure, without auto-redirecting', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    await auth.initialize({ embeddedAuthEnabled: false })
    vi.spyOn(auth, 'completeRedirectLogin').mockImplementation(async () => {
      auth.error = 'Tapis sign-in was cancelled or failed (access_denied)'
      return false
    })

    const router = createTestRouter()
    await router.push('/auth/callback?error=access_denied')
    await router.isReady()

    const wrapper = mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Sign-in failed')
    expect(wrapper.text()).toContain('access_denied')
    expect(router.currentRoute.value.name).toBe('TapisAuthCallback')
  })
})
