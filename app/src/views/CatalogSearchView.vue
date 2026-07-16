<template>
  <main class="search-page">
    <header class="page-header">
      <span class="eyebrow">Public catalog search</span>
      <h1>Search connected AI resources</h1>
      <p>Search currently covers public model cards and datasheets. Additional workflow, device, evaluation, and provenance indexing will follow linked APIs.</p>
    </header>

    <form class="catalog-search" role="search" @submit.prevent="submitSearch">
      <IconSearch :size="21" />
      <label class="sr-only" for="catalog-search-page">Search the public resource catalog</label>
      <input id="catalog-search-page" v-model="query" type="search" placeholder="Search models, datasets, authors, categories, or identifiers" />
      <button type="submit">Search</button>
    </form>

    <div v-if="store.loading" class="loading-state" role="status"><IconLoader2 :size="28" class="spin" /><span>Searching the catalog…</span></div>
    <div v-else-if="store.error" class="search-notice">The catalog API is unavailable. Public navigation remains available.</div>
    <template v-else>
      <section class="result-section">
        <div class="result-heading"><h2>Models</h2><span>{{ modelResults.length }} results</span></div>
        <div v-if="modelResults.length" class="result-list">
          <RouterLink v-for="model in modelResults" :key="model.uuid" :to="`/modelcard/${model.uuid}`" class="result-row">
            <IconCube :size="19" /><span><strong>{{ model.name || 'Untitled model' }}</strong><small>{{ model.short_description || model.category || 'Model card' }}</small></span><IconArrowRight :size="17" />
          </RouterLink>
        </div>
        <p v-else class="empty-copy">No matching public models.</p>
      </section>
      <section class="result-section">
        <div class="result-heading"><h2>Datasets and datasheets</h2><span>{{ datasheetResults.length }} results</span></div>
        <div v-if="datasheetResults.length" class="result-list">
          <RouterLink v-for="dataset in datasheetResults" :key="dataset.uuid" :to="`/datasheet/${dataset.uuid}`" class="result-row">
            <IconDatabase :size="19" /><span><strong>{{ datasetTitle(dataset) }}</strong><small>{{ dataset.publisher?.name || dataset.publisher || 'Datasheet' }}</small></span><IconArrowRight :size="17" />
          </RouterLink>
        </div>
        <p v-else class="empty-copy">No matching public datasheets.</p>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { IconArrowRight, IconCube, IconDatabase, IconLoader2, IconSearch } from '@tabler/icons-vue'
import { useExploreStore } from '../stores/explore'
import { logUiEvent } from '../lib/uiLogger'

const route = useRoute()
const router = useRouter()
const store = useExploreStore()
const query = ref(String(route.query.q || ''))
const needle = computed(() => query.value.trim().toLowerCase())
const matches = (record) => needle.value && JSON.stringify(record || {}).toLowerCase().includes(needle.value)
const modelResults = computed(() => store.models.filter((item) => !item.is_private && matches(item)).slice(0, 24))
const datasheetResults = computed(() => store.datasheets.filter((item) => !item.is_private && matches(item)).slice(0, 24))

function datasetTitle(dataset) {
  const value = Array.isArray(dataset.title) ? dataset.title[0] : dataset.title
  return typeof value === 'object' ? value?.title || 'Untitled datasheet' : value || 'Untitled datasheet'
}
function submitSearch() {
  const value = query.value.trim()
  logUiEvent('catalog-search-submit', { source: 'search-page', queryLength: value.length })
  router.replace({ name: 'CatalogSearch', query: value ? { q: value } : {} })
}
onMounted(() => { void Promise.allSettled([store.fetchModels(), store.fetchDatasheets()]) })
watch(() => route.query.q, (value) => { query.value = String(value || '') })
</script>

<style scoped>
.search-page { max-width: 1040px; }
.eyebrow { display: block; margin-bottom: 8px; color: var(--color-primary); font-size: .72rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.catalog-search { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; margin-bottom: 32px; padding: 9px 9px 9px 17px; border: 1px solid var(--color-border-strong); border-radius: 13px; color: var(--color-text-muted); background: #fff; }
.catalog-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),.08); }
.catalog-search input { min-width: 0; border: 0; outline: 0; color: var(--color-text); background: transparent; }
.catalog-search button { padding: 10px 18px; border: 0; border-radius: 8px; color: #fff; background: var(--color-primary); font-weight: 700; }
.result-section { padding: 24px 0; border-top: 1px solid var(--color-border); }
.result-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.result-heading h2 { font-size: 1.18rem; }
.result-heading span { color: var(--color-text-muted); font-size: .8rem; }
.result-list { display: grid; }
.result-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px 4px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); }
.result-row:hover { color: var(--color-primary); }
.result-row strong,.result-row small { display: block; }
.result-row strong { color: var(--color-text); }
.result-row small { margin-top: 3px; overflow: hidden; color: var(--color-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.empty-copy,.search-notice { color: var(--color-text-muted); }
.search-notice { padding: 20px; border: 1px dashed var(--color-border-strong); border-radius: 12px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width:640px) { .catalog-search { grid-template-columns: auto 1fr; } .catalog-search button { grid-column: 1/-1; } }
</style>
