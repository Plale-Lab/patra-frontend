import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import DashboardView from './DashboardView.vue'

describe('public catalog landing page', () => {
  it('uses the search-led landing design without dashboard counts', async () => {
    localStorage.clear()
    sessionStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Dashboard', component: DashboardView },
        { path: '/search', name: 'CatalogSearch', component: { template: '<div />' } },
        { path: '/stories/:slug', component: { template: '<div />' } },
        { path: '/modelcards', component: { template: '<div />' } },
        { path: '/datasheets', component: { template: '<div />' } },
        { path: '/record-map', component: { template: '<div />' } },
        { path: '/animal-ecology', component: { template: '<div />' } },
      ],
    })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(DashboardView, { global: { plugins: [pinia, router] } })

    expect(wrapper.text()).toContain('Discover connected AI resources')
    expect(wrapper.findAll('.story-card')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('Model Cards')
    expect(wrapper.text()).not.toContain('Contributors')
    expect(wrapper.text()).not.toContain('linked records')
    expect(wrapper.find('.hero-stats').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Good (Morning|Afternoon|Evening)/)
  })
})
