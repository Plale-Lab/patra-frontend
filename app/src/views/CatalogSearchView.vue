<template>
  <div class="search-page">
    <header class="page-header">
      <div class="eyebrow">Public catalog search</div>
      <h1>Search connected AI resources</h1>
      <p>Current search covers public model cards and datasheets. Workflow, run, device, evaluation, agent, and provenance indexing will expand as linked APIs become available.</p>
    </header>

    <form class="catalog-search" role="search" @submit.prevent="submitSearch">
      <IconSearch :size="22" aria-hidden="true" />
      <label class="sr-only" for="catalog-search-page">Search the public resource catalog</label>
      <input id="catalog-search-page" v-model="query" type="search" placeholder="Search models, datasets, authors, categories, or identifiers" />
      <button type="submit">Search</button>
    </form>

    <div v-if="store.loading" class="loading-state" role="status">
      <IconLoader2 :size="30" class="spin" />
      <span>Searching the catalog…</span>
    </div>

    <div v-else-if="store.error" class="search-notice">
      The catalog API is unavailable. Public navigation remains available from the sidebar.
    </div>

    <template v-else>
      <section class="result-section">
        <div class="result-heading">
          <h2>Models</h2>
          <span>{{ modelResults.length }} result{{ modelResults.length === 1 ? '' : 's' }}</span>
        </div>
        <div v-if="modelResults.length" class="result-list">
          <RouterLink v-for="model in modelResults" :key="model.id" :to="modelRoute(model)" class="result-row">
            <IconCube :size="20" aria-hidden="true" />
            <span><strong>{{ modelTitle(model) }}</strong><small>{{ model.short_description || model.category || 'Model card' }}</small></span>
            <IconArrowRight :size="18" aria-hidden="true" />
          </RouterLink>
        </div>
        <p v-else class="empty-copy">No matching public models.</p>
      </section>

      <section class="result-section">
        <div class="result-heading">
          <h2>Datasets and datasheets</h2>
          <span>{{ datasheetResults.length }} result{{ datasheetResults.length === 1 ? '' : 's' }}</span>
        </div>
        <div v-if="datasheetResults.length" class="result-list">
          <RouterLink v-for="datasheet in datasheetResults" :key="datasheet.id" :to="datasheetRoute(datasheet)" class="result-row">
            <IconDatabase :size="20" aria-hidden="true" />
            <span><strong>{{ datasheetTitle(datasheet) }}</strong><small>{{ datasheet.publisher?.name || datasheet.publisher || 'Datasheet' }}</small></span>
            <IconArrowRight :size="18" aria-hidden="true" />
          </RouterLink>
        </div>
        <p v-else class="empty-copy">No matching public datasheets.</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { IconArrowRight, IconCube, IconDatabase, IconLoader2, IconSearch } from '@tabler/icons-vue'
import { useExploreStore } from '../stores/explore'
import { datasheetRoute, datasheetTitle, modelRoute, modelTitle } from '../lib/resourceStories'

const route = useRoute()
const router = useRouter()
const store = useExploreStore()
const query = ref(String(route.query.q || ''))

function matches(record) {
  const normalized = query.value.trim().toLowerCase()
  return normalized && JSON.stringify(record || {}).toLowerCase().includes(normalized)
}

const modelResults = computed(() => store.models.filter((item) => !item.is_private && matches(item)).slice(0, 24))
const datasheetResults = computed(() => store.datasheets.filter((item) => !item.is_private && matches(item)).slice(0, 24))

function submitSearch() {
  router.replace({ name: 'CatalogSearch', query: query.value.trim() ? { q: query.value.trim() } : {} })
}

onMounted(() => {
  void Promise.allSettled([store.fetchModels(), store.fetchDatasheets()])
})

watch(() => route.query.q, (value) => {
  query.value = String(value || '')
})
</script>

<style scoped>
.search-page { max-width: 1040px; }
.eyebrow { margin-bottom: 8px; color: var(--color-primary); font-size: .74rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.catalog-search { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 10px 10px 10px 18px; margin-bottom: 32px; border: 1px solid var(--color-border-strong); border-radius: 16px; background: #fff; box-shadow: var(--shadow-sm); color: var(--color-text-muted); }
.catalog-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), .1); }
.catalog-search input { min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-text); font-size: 1rem; }
.catalog-search button { border: 0; border-radius: 10px; padding: 10px 18px; background: var(--color-primary); color: #fff; font-weight: 700; }
.result-section { padding: 24px 0; border-top: 1px solid var(--color-border); }
.result-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.result-heading h2 { font-size: 1.2rem; }
.result-heading span { color: var(--color-text-muted); font-size: .82rem; }
.result-list { display: grid; gap: 8px; }
.result-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px 4px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); }
.result-row:hover { color: var(--color-primary); }
.result-row span { min-width: 0; }
.result-row strong, .result-row small { display: block; }
.result-row strong { color: var(--color-text); }
.result-row small { margin-top: 3px; overflow: hidden; color: var(--color-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.empty-copy, .search-notice { color: var(--color-text-muted); }
.search-notice { padding: 20px; border: 1px dashed var(--color-border-strong); border-radius: 12px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 640px) {
  .catalog-search { grid-template-columns: auto 1fr; }
  .catalog-search button { grid-column: 1 / -1; }
}
</style>
