<template>
  <main class="catalog-home">
    <section class="catalog-hero">
      <img
        class="hero-image"
        src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=2200&q=88"
        alt="Rows of crops extending across a sunlit agricultural landscape"
      />
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-inner">
        <span class="hero-brand">ICICLE AI Resource Catalog</span>
        <h1>Discover connected AI resources.</h1>
        <p>Search models, datasets, workflows, devices, evaluations, and provenance across the ICICLE ecosystem.</p>

        <form class="hero-search" role="search" @submit.prevent="searchCatalog">
          <IconSearch :size="21" aria-hidden="true" />
          <label class="sr-only" for="catalog-home-search">Search the public resource catalog</label>
          <input
            id="catalog-home-search"
            v-model="searchQuery"
            type="search"
            placeholder="Search models, datasets, workflows, devices, or identifiers"
          />
          <button type="submit">Search <IconArrowRight :size="17" aria-hidden="true" /></button>
        </form>
      </div>
      <a class="hero-credit" href="https://images.unsplash.com/photo-1560493676-04071c5f467b" target="_blank" rel="noreferrer">Dan Meyers / Unsplash</a>
    </section>

    <div class="catalog-body">
      <section id="resource-stories" class="stories-section" aria-labelledby="featured-stories">
        <header class="section-heading">
          <div>
            <span class="section-kicker">Featured connections</span>
            <h2 id="featured-stories">Resource stories</h2>
          </div>
          <p>Follow a use case through its documented model, data, compute, run, and result.</p>
        </header>

        <div v-if="homepageStories.length" class="stories-layout">
          <RouterLink
            v-for="story in homepageStories"
            :key="story.slug"
            :to="`/stories/${story.slug}`"
            class="story-card"
            @click="logStoryOpen(story)"
          >
            <div class="story-media">
              <img :src="story.image" :alt="story.imageAlt" :style="{ objectPosition: story.imagePosition }" loading="lazy" />
              <div class="story-media-shade" aria-hidden="true"></div>
              <span class="story-domain">{{ story.domain }}</span>
              <span class="story-open"><IconArrowUpRight :size="17" aria-hidden="true" /></span>
            </div>
            <div class="story-copy">
              <h3>{{ story.title }}</h3>
              <p>{{ story.summary }}</p>
              <span class="story-read">Read story <IconArrowRight :size="15" aria-hidden="true" /></span>
            </div>
          </RouterLink>
        </div>
        <div v-else class="stories-empty">
          <div><IconBook2 :size="22" /><span>No stories are featured yet</span></div>
          <p>Published resource stories selected by the editorial team will appear here.</p>
          <RouterLink to="/story-portal">Create a story <IconArrowRight :size="15" /></RouterLink>
        </div>
      </section>

      <section id="browse-catalog" class="browse-section" aria-labelledby="browse-heading">
        <header class="section-heading browse-heading">
          <div>
            <span class="section-kicker">Browse the repository</span>
            <h2 id="browse-heading">Explore by resource type</h2>
          </div>
          <RouterLink to="/search" class="section-link">Search everything <IconArrowRight :size="17" /></RouterLink>
        </header>

        <nav class="browse-list" aria-label="Catalog resource types">
          <RouterLink to="/modelcards">
            <span class="browse-icon"><IconCube :size="19" /></span>
            <span><strong>Models</strong><small>Documentation, versions, metrics, and deployment context</small></span>
            <IconArrowUpRight :size="20" />
          </RouterLink>
          <RouterLink to="/datasheets">
            <span class="browse-icon"><IconDatabase :size="19" /></span>
            <span><strong>Datasets</strong><small>Datasheets, creators, identifiers, rights, and provenance</small></span>
            <IconArrowUpRight :size="20" />
          </RouterLink>
          <RouterLink to="/record-map">
            <span class="browse-icon"><IconRoute :size="19" /></span>
            <span><strong>Record Map</strong><small>Interactive relationships across models and datasets</small></span>
            <IconArrowUpRight :size="20" />
          </RouterLink>
          <RouterLink v-if="SUPPORTS_DOMAIN_EXPERIMENTS" to="/animal-ecology">
            <span class="browse-icon"><IconActivity :size="19" /></span>
            <span><strong>Workflows and runs</strong><small>Operational inference, evaluations, devices, images, and power</small></span>
            <IconArrowUpRight :size="20" />
          </RouterLink>
        </nav>
      </section>

      <footer id="catalog-about" class="catalog-about">
        <div>
          <strong>About this catalog</strong>
          <p>Public browsing does not require a Tapis account. Sign in only for private resources and contributor tools.</p>
        </div>
        <RouterLink to="/record-map">Explore catalog relationships <IconArrowRight :size="16" /></RouterLink>
      </footer>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import {
  IconActivity,
  IconArrowRight,
  IconArrowUpRight,
  IconBook2,
  IconCube,
  IconDatabase,
  IconRoute,
  IconSearch,
} from '@tabler/icons-vue'
import { SUPPORTS_DOMAIN_EXPERIMENTS } from '../config/api'
import { logUiEvent } from '../lib/uiLogger'
import { useStoriesStore } from '../stores/stories'

const router = useRouter()
const storyStore = useStoriesStore()
const { homepageStories } = storeToRefs(storyStore)
const searchQuery = ref('')

function searchCatalog() {
  const query = searchQuery.value.trim()
  logUiEvent('catalog-search-submit', { source: 'hero', queryLength: query.length })
  router.push({ name: 'CatalogSearch', query: query ? { q: query } : {} })
}

function logStoryOpen(story) {
  logUiEvent('resource-story-open', { slug: story.slug, source: 'dashboard' })
}
</script>

<style scoped>
.catalog-home { margin: -32px -36px 0; color: #171918; }
.catalog-hero { position: relative; min-height: 442px; overflow: hidden; isolation: isolate; color: #fff; background: #17211a; }
.hero-image { position: absolute; inset: 0; z-index: -3; width: 100%; height: 100%; object-fit: cover; object-position: center 58%; animation: hero-settle 900ms var(--ease-out) both; }
.hero-shade { position: absolute; inset: 0; z-index: -2; background: linear-gradient(90deg, rgba(9,18,12,.9), rgba(9,18,12,.62) 43%, rgba(9,18,12,.12) 78%), linear-gradient(0deg, rgba(8,13,9,.32), transparent 55%); }
.hero-inner { width: min(1280px, calc(100% - 80px)); margin: 0 auto; padding: 54px 0 42px; animation: hero-copy-in 650ms 80ms var(--ease-out) both; }
.hero-brand { display: block; margin-bottom: 16px; font-size: .7rem; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; }
.catalog-hero h1 { max-width: 700px; font-size: clamp(3.2rem, 5vw, 5.1rem); font-weight: 700; line-height: .96; letter-spacing: -.06em; text-wrap: balance; }
.catalog-hero p { max-width: 660px; margin-top: 16px; color: rgba(255,255,255,.82); font-size: .96rem; line-height: 1.55; }
.hero-search { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 13px; width: min(820px, 100%); margin-top: 25px; padding: 7px 7px 7px 17px; border: 1px solid rgba(255,255,255,.32); border-radius: 12px; color: #60645f; background: rgba(255,255,255,.97); box-shadow: 0 16px 40px rgba(0,0,0,.16); }
.hero-search:focus-within { box-shadow: 0 18px 44px rgba(0,0,0,.2), 0 0 0 3px rgba(255,255,255,.2); }
.hero-search input { min-width: 0; border: 0; outline: 0; color: #171918; background: transparent; font-size: .94rem; }
.hero-search button { min-height: 44px; display: inline-flex; align-items: center; gap: 8px; padding: 0 19px; border: 0; border-radius: 8px; color: #fff; background: var(--color-primary); font-weight: 650; }
.hero-search button:hover { background: #24428f; }
.hero-credit { position: absolute; right: 18px; bottom: 12px; color: rgba(255,255,255,.55); font-size: .62rem; }
.hero-credit:hover { color: #fff; }

.catalog-body { width: min(1280px, calc(100% - 80px)); margin: 0 auto; }
.stories-section { scroll-margin-top: 90px; padding: 52px 0 16px; }
.browse-section { scroll-margin-top: 90px; padding: 76px 0 8px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 40px; margin-bottom: 22px; }
.section-kicker { display: block; margin-bottom: 7px; color: #c27e16; font-size: .67rem; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
.section-heading h2 { font-size: clamp(2rem, 2.8vw, 2.8rem); line-height: 1.03; letter-spacing: -.05em; }
.section-heading > p { max-width: 450px; color: #676a65; font-size: .82rem; line-height: 1.55; text-align: right; }

.stories-layout { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.stories-empty { display: grid; justify-items: start; gap: 8px; padding: 28px 0; border-top: 1px solid #d8d8d2; border-bottom: 1px solid #d8d8d2; }
.stories-empty > div { display: flex; align-items: center; gap: 9px; color: #252b28; font-weight: 700; }
.stories-empty > div svg { color: var(--color-primary); }
.stories-empty p { color: #737771; font-size: .78rem; }
.stories-empty a { display: inline-flex; align-items: center; gap: 6px; margin-top: 7px; color: var(--color-primary); font-size: .75rem; font-weight: 700; }
.story-card { min-width: 0; overflow: hidden; border: 1px solid #dfdfda; border-radius: 14px; color: inherit; background: #fff; transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition); }
.story-card:hover, .story-card:focus-visible { border-color: #bfc2bc; transform: translateY(-3px); box-shadow: 0 12px 30px rgba(20,24,21,.08); }
.story-media { position: relative; height: 205px; overflow: hidden; color: #fff; }
.story-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 650ms var(--ease-out); }
.story-card:hover .story-media img { transform: scale(1.035); }
.story-media-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,11,8,.22), transparent 55%, rgba(7,11,8,.28)); }
.story-domain { position: absolute; top: 14px; left: 14px; padding: 5px 8px; border: 1px solid rgba(255,255,255,.42); border-radius: 999px; background: rgba(11,16,12,.3); font-size: .62rem; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; backdrop-filter: blur(8px); }
.story-open { position: absolute; top: 13px; right: 13px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; color: #171918; background: rgba(255,255,255,.94); transition: transform var(--transition), background var(--transition), color var(--transition); }
.story-card:hover .story-open { color: #fff; background: var(--color-primary); transform: translate(2px,-2px); }
.story-copy { min-height: 174px; display: flex; flex-direction: column; padding: 20px; }
.story-copy h3 { font-size: 1.16rem; line-height: 1.2; letter-spacing: -.03em; }
.story-copy p { margin-top: 8px; color: #666962; font-size: .79rem; line-height: 1.55; }
.story-read { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; margin-top: auto; padding-top: 16px; color: var(--color-primary); font-size: .72rem; font-weight: 700; }

.browse-heading { margin-bottom: 10px; }
.section-link { display: inline-flex; align-items: center; gap: 8px; color: var(--color-primary); font-weight: 650; }
.browse-list { border-top: 1px solid #cfcfca; }
.browse-list a { display: grid; grid-template-columns: 42px minmax(0,1fr) auto; gap: 17px; align-items: center; padding: 21px 4px; border-bottom: 1px solid #deded9; color: #62655f; transition: padding var(--transition), color var(--transition), background var(--transition); }
.browse-list a:hover { padding-right: 12px; padding-left: 12px; color: var(--color-primary); background: rgba(255,255,255,.55); }
.browse-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; color: var(--color-primary); background: var(--color-primary-bg); }
.browse-list strong, .browse-list small { display: block; }
.browse-list strong { color: #171918; font-size: 1rem; }
.browse-list small { margin-top: 3px; color: #777a74; font-size: .78rem; }
.catalog-about { scroll-margin-top: 90px; display: flex; justify-content: space-between; gap: 48px; margin-top: 68px; padding: 24px 0 30px; border-top: 1px solid #deded9; color: #777a74; font-size: .75rem; }
.catalog-about strong { color: #171918; }
.catalog-about p { max-width: 620px; margin-top: 4px; }
.catalog-about > a { display: inline-flex; align-items: center; gap: 7px; align-self: center; color: var(--color-primary); font-weight: 650; white-space: nowrap; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@keyframes hero-settle { from { opacity: .45; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }
@keyframes hero-copy-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1040px) {
  .stories-layout { grid-template-columns: 1fr; }
  .story-card { display: grid; grid-template-columns: minmax(270px,.72fr) minmax(0,1fr); }
  .story-media { height: 100%; min-height: 230px; }
}
@media (max-width: 760px) {
  .catalog-home { margin: -16px -12px 0; }
  .catalog-hero { min-height: 520px; }
  .hero-inner, .catalog-body { width: calc(100% - 32px); }
  .hero-inner { padding: 44px 0 36px; }
  .catalog-hero h1 { font-size: clamp(3rem,13vw,4.2rem); }
  .hero-search { grid-template-columns: auto minmax(0,1fr); }
  .hero-search button { grid-column: 1/-1; justify-content: center; }
  .hero-credit { display: none; }
  .section-heading { display: block; }
  .section-heading > p { margin-top: 10px; text-align: left; }
  .story-card { display: block; }
  .story-media { height: 210px; min-height: 0; }
  .section-link { margin-top: 12px; }
  .catalog-about { display: block; }
  .catalog-about > a { margin-top: 16px; }
}
</style>
