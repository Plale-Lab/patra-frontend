import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStoriesStore } from '../stores/stories'
import StoryAdminView from './StoryAdminView.vue'

describe('story administration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('lets the administrator control automatic homepage carousel behavior', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const stories = useStoriesStore()
    stories.login('admin', 'admin')
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/story-admin', component: StoryAdminView },
        { path: '/story-portal', name: 'StoryPortal', component: { template: '<div />' } },
        { path: '/stories/:slug', name: 'ResourceStory', component: { template: '<div />' } },
      ],
    })
    await router.push('/story-admin')
    await router.isReady()
    const wrapper = mount(StoryAdminView, { global: { plugins: [pinia, router] } })
    const toggle = wrapper.get('input[aria-label="Enable automatic homepage story carousel"]')

    expect(stories.autoCarousel).toBe(false)
    expect(wrapper.text()).toContain('Manual')

    await toggle.setValue(true)
    expect(stories.autoCarousel).toBe(true)
    expect(wrapper.text()).toContain('Automatic')
  })
})
