import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStoriesStore } from './stories'

describe('story publishing store', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('seeds published homepage stories and protects homepage visibility by publication state', () => {
    const store = useStoriesStore()
    expect(store.homepageStories).toHaveLength(3)

    const story = store.createStory(sampleDraft())
    expect(story.status).toBe('draft')
    expect(store.setFeatured(story.id, true)).toBe(false)
    expect(store.homepageStories.some((item) => item.id === story.id)).toBe(false)

    store.setPublished(story.id, true)
    expect(store.setFeatured(story.id, true)).toBe(true)
    expect(store.homepageStories.some((item) => item.id === story.id)).toBe(true)

    store.setPublished(story.id, false)
    expect(store.getBySlug(story.slug).featured).toBe(false)
  })

  it('uses the requested hardcoded prototype administrator credentials', () => {
    const store = useStoriesStore()
    expect(store.login('admin', 'wrong')).toBe(false)
    expect(store.isAdmin).toBe(false)
    expect(store.login('admin', 'admin')).toBe(true)
    expect(store.isAdmin).toBe(true)
    expect(sessionStorage.getItem('patra_story_admin_session')).toBe('active')
  })

  it('persists created stories and generates collision-safe slugs', () => {
    const firstStore = useStoriesStore()
    const first = firstStore.createStory(sampleDraft())
    const second = firstStore.createStory(sampleDraft())
    expect(first.slug).toBe('community-field-note')
    expect(second.slug).toBe('community-field-note-2')

    setActivePinia(createPinia())
    const restored = useStoriesStore()
    expect(restored.getBySlug(first.slug)?.title).toBe('Community field note')
    expect(restored.stories).toHaveLength(5)
  })
})

function sampleDraft() {
  return {
    title: 'Community field note',
    domain: 'Animal ecology',
    author: 'Field team',
    summary: 'A concise story summary.',
    dek: 'A documented workflow connects evidence across a field deployment.',
    image: 'https://example.org/story.jpg',
    imageAlt: 'A field deployment',
    readTime: '4 min read',
    accent: '#c78928',
    sectionOneEyebrow: 'The problem',
    sectionOneTitle: 'Work with local context',
    sectionOneBody: 'First paragraph.\n\nSecond paragraph.',
    sectionTwoEyebrow: 'The result',
    sectionTwoTitle: 'Keep evidence connected',
    sectionTwoBody: 'Reviewers can follow the complete record.',
    modelTitle: 'Field model',
    modelRoute: '/modelcards',
    datasetTitle: 'Field data',
    datasetRoute: '/datasheets',
  }
}
