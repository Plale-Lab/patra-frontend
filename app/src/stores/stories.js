import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { resourceStories } from '../content/resourceStories'
import { logUiEvent } from '../lib/uiLogger'

const STORAGE_KEY = 'patra_resource_stories_v1'
const ADMIN_SESSION_KEY = 'patra_story_admin_session'
const DEFAULT_AUTO_CAROUSEL = false

export const STORY_ADMIN_USERNAME = 'admin'
export const STORY_ADMIN_PASSWORD = 'admin'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function seedStories() {
  return resourceStories.map((story, index) => ({
    ...clone(story),
    id: `seed-${story.slug}`,
    status: 'published',
    featured: true,
    isSeed: true,
    createdAt: new Date(Date.UTC(2026, 6, 8 - index)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 6, 8 - index)).toISOString(),
    createdBy: 'Patra Editorial Team',
  }))
}

function loadStoryState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { stories: seedStories(), autoCarousel: DEFAULT_AUTO_CAROUSEL }
    const parsed = JSON.parse(raw)
    return {
      stories: Array.isArray(parsed?.stories) ? parsed.stories : seedStories(),
      autoCarousel: typeof parsed?.settings?.autoCarousel === 'boolean'
        ? parsed.settings.autoCarousel
        : DEFAULT_AUTO_CAROUSEL,
    }
  } catch {
    return { stories: seedStories(), autoCarousel: DEFAULT_AUTO_CAROUSEL }
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function slugifyStoryTitle(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `story-${Date.now()}`
}

function paragraphs(value) {
  return String(value || '')
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildGraph(slug, relatedRecords) {
  const model = relatedRecords.find((record) => record.type === 'model')
  const dataset = relatedRecords.find((record) => record.type === 'dataset')
  return {
    nodes: [
      { id: `${slug}-model`, type: 'model', title: model?.title || 'Documented model', meta: 'Model card', x: 120, y: 190, route: model?.route },
      { id: `${slug}-data`, type: 'dataset', title: dataset?.title || 'Source dataset', meta: 'Datasheet', x: 330, y: 92, route: dataset?.route },
      { id: `${slug}-compute`, type: 'compute', title: 'Documented compute', meta: 'Compute profile', x: 535, y: 190 },
      { id: `${slug}-run`, type: 'run', title: 'Operational run', meta: 'Run · traced', x: 740, y: 92 },
      { id: `${slug}-result`, type: 'result', title: 'Reviewed result', meta: 'Result · verified', x: 940, y: 190 },
    ],
    edges: [
      { source: `${slug}-model`, target: `${slug}-compute`, label: 'deployed to' },
      { source: `${slug}-data`, target: `${slug}-compute`, label: 'evaluated on' },
      { source: `${slug}-compute`, target: `${slug}-run`, label: 'executed' },
      { source: `${slug}-run`, target: `${slug}-result`, label: 'produced' },
    ],
  }
}

function storyFromDraft(draft, slug) {
  const relatedRecords = [
    {
      id: `${slug}-model-record`,
      type: 'model',
      title: draft.modelTitle || 'Related model card',
      subtitle: draft.modelSubtitle || 'Supporting model documentation',
      meta: draft.modelMeta || 'Model card',
      route: draft.modelRoute || '/modelcards',
    },
    {
      id: `${slug}-dataset-record`,
      type: 'dataset',
      title: draft.datasetTitle || 'Related datasheet',
      subtitle: draft.datasetSubtitle || 'Supporting dataset documentation',
      meta: draft.datasetMeta || 'Datasheet',
      route: draft.datasetRoute || '/datasheets',
    },
  ]

  return {
    slug,
    domain: String(draft.domain || 'Field note').trim(),
    title: String(draft.title || 'Untitled resource story').trim(),
    summary: String(draft.summary || draft.dek || '').trim(),
    dek: String(draft.dek || draft.summary || '').trim(),
    image: String(draft.image || '').trim(),
    imageAlt: String(draft.imageAlt || draft.title || 'Resource story cover').trim(),
    imagePosition: String(draft.imagePosition || 'center 50%').trim(),
    author: String(draft.author || 'Community contributor').trim(),
    publishedAt: String(draft.publishedAt || new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date())).trim(),
    readTime: String(draft.readTime || '5 min read').trim(),
    accent: String(draft.accent || '#c78928').trim(),
    quote: String(draft.quote || 'Connected records turn an account of the work into evidence a team can revisit.').trim(),
    sections: [
      {
        eyebrow: String(draft.sectionOneEyebrow || 'The field problem').trim(),
        title: String(draft.sectionOneTitle || 'Document the work in context').trim(),
        paragraphs: paragraphs(draft.sectionOneBody),
      },
      {
        eyebrow: String(draft.sectionTwoEyebrow || 'What changed').trim(),
        title: String(draft.sectionTwoTitle || 'Keep the evidence connected').trim(),
        paragraphs: paragraphs(draft.sectionTwoBody),
      },
    ].filter((section) => section.paragraphs.length),
    relatedRecords,
    graph: buildGraph(slug, relatedRecords),
  }
}

export const useStoriesStore = defineStore('stories', () => {
  const initialState = loadStoryState()
  const stories = ref(initialState.stories)
  const autoCarousel = ref(initialState.autoCarousel)
  const isAdmin = ref(sessionStorage.getItem(ADMIN_SESSION_KEY) === 'active')

  const publishedStories = computed(() => stories.value.filter((story) => story.status === 'published'))
  const homepageStories = computed(() => publishedStories.value.filter((story) => story.featured))
  const sortedStories = computed(() => [...stories.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2,
        stories: stories.value,
        settings: { autoCarousel: autoCarousel.value },
      }))
      return true
    } catch {
      logUiEvent('story-storage-error')
      return false
    }
  }

  function uniqueSlug(title, currentId = null) {
    const base = slugifyStoryTitle(title)
    let candidate = base
    let suffix = 2
    while (stories.value.some((story) => story.slug === candidate && story.id !== currentId)) {
      candidate = `${base}-${suffix}`
      suffix += 1
    }
    return candidate
  }

  function previewFromDraft(draft, currentId = null) {
    const existing = currentId ? stories.value.find((story) => story.id === currentId) : null
    return storyFromDraft(draft, existing?.slug || uniqueSlug(draft.title, currentId))
  }

  function createStory(draft) {
    const now = new Date().toISOString()
    const story = {
      ...storyFromDraft(draft, uniqueSlug(draft.title)),
      id: makeId(),
      status: 'draft',
      featured: false,
      isSeed: false,
      createdAt: now,
      updatedAt: now,
      createdBy: String(draft.author || 'Community contributor').trim(),
    }
    stories.value.push(story)
    persist()
    logUiEvent('story-created', { storyId: story.id, status: story.status })
    return story
  }

  function updateStory(id, draft) {
    const index = stories.value.findIndex((story) => story.id === id)
    if (index < 0) return null
    const current = stories.value[index]
    const updated = {
      ...current,
      ...storyFromDraft(draft, current.slug),
      id: current.id,
      slug: current.slug,
      status: current.status,
      featured: current.featured,
      isSeed: current.isSeed,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      createdBy: current.createdBy,
    }
    stories.value.splice(index, 1, updated)
    persist()
    logUiEvent('story-updated', { storyId: id, status: updated.status })
    return updated
  }

  function setPublished(id, published) {
    const story = stories.value.find((item) => item.id === id)
    if (!story) return false
    story.status = published ? 'published' : 'draft'
    if (!published) story.featured = false
    story.updatedAt = new Date().toISOString()
    persist()
    logUiEvent('story-publication-changed', { storyId: id, status: story.status })
    return true
  }

  function setFeatured(id, featured) {
    const story = stories.value.find((item) => item.id === id)
    if (!story || (featured && story.status !== 'published')) return false
    story.featured = Boolean(featured)
    story.updatedAt = new Date().toISOString()
    persist()
    logUiEvent('story-homepage-visibility-changed', { storyId: id, featured: story.featured })
    return true
  }

  function setAutoCarousel(enabled) {
    autoCarousel.value = Boolean(enabled)
    persist()
    logUiEvent('story-carousel-setting-changed', { autoCarousel: autoCarousel.value })
    return autoCarousel.value
  }

  function deleteStory(id) {
    const index = stories.value.findIndex((story) => story.id === id)
    if (index < 0) return false
    stories.value.splice(index, 1)
    persist()
    logUiEvent('story-deleted', { storyId: id })
    return true
  }

  function getBySlug(slug) {
    return stories.value.find((story) => story.slug === slug) || null
  }

  function login(username, password) {
    const accepted = username === STORY_ADMIN_USERNAME && password === STORY_ADMIN_PASSWORD
    if (accepted) {
      isAdmin.value = true
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'active')
    }
    logUiEvent('story-admin-login', { accepted })
    return accepted
  }

  function logout() {
    isAdmin.value = false
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    logUiEvent('story-admin-logout')
  }

  return {
    stories,
    sortedStories,
    publishedStories,
    homepageStories,
    autoCarousel,
    isAdmin,
    previewFromDraft,
    createStory,
    updateStory,
    setPublished,
    setFeatured,
    setAutoCarousel,
    deleteStory,
    getBySlug,
    login,
    logout,
  }
})
