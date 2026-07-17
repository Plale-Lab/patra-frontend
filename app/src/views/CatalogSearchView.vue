<template>
  <main class="catalog-page">
    <header class="catalog-heading rise">
      <div>
        <span class="eyebrow">Public resource catalog</span>
        <h1>Find the right record, with context.</h1>
        <p>Search and filter public model cards and datasheets in one connected catalog.</p>
      </div>
      <div class="catalog-count"><strong>{{ records.length }}</strong><span>public records</span></div>
    </header>

    <form class="catalog-search" role="search" @submit.prevent="submitSearch">
      <IconSearch :size="21" />
      <label class="sr-only" for="catalog-search-page">Search the public resource catalog</label>
      <input id="catalog-search-page" v-model="query" type="search" placeholder="Search titles, authors, categories, frameworks, or identifiers" />
      <button type="submit">Search <IconArrowRight :size="17" /></button>
    </form>

    <div v-if="store.loading" class="loading-state" role="status"><IconLoader2 :size="28" class="spin" /><span>Loading the catalog…</span></div>
    <div v-else-if="store.error" class="catalog-notice"><IconAlertCircle :size="19" /><span>The catalog API is unavailable. Try refreshing this page when the service is available.</span></div>

    <div v-else class="catalog-workspace">
      <aside class="facet-panel" :class="{ open: facetsOpen }" aria-label="Catalog filters">
        <div class="facet-panel-header">
          <div><IconAdjustmentsHorizontal :size="17" /><strong>Refine</strong><small v-if="activeFilterCount">{{ activeFilterCount }} active</small></div>
          <div class="facet-header-actions">
            <button v-if="hasFilters" type="button" @click="clearFilters">Reset</button>
            <button class="facet-toggle" type="button" :aria-expanded="facetsOpen" @click="facetsOpen = !facetsOpen">
              {{ facetsOpen ? 'Hide' : 'Show' }} <IconChevronDown :size="15" />
            </button>
          </div>
        </div>

        <fieldset class="facet-group facet-group--type">
          <legend>Resource type</legend>
          <button v-for="option in typeOptions" :key="option.value" type="button" :class="{ active: typeFilter === option.value }" @click="setFilter('type', option.value)">
            <span>{{ option.label }}</span><small>{{ option.count }}</small>
          </button>
        </fieldset>

        <label class="facet-select">
          <span>Category</span>
          <select v-model="categoryFilter" @change="syncFilters">
            <option value="">All categories</option>
            <option v-for="option in categoryOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <label class="facet-select">
          <span>Framework or format</span>
          <select v-model="technologyFilter" @change="syncFilters">
            <option value="">All technologies</option>
            <option v-for="option in technologyOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <fieldset class="facet-group">
          <legend>Access</legend>
          <button v-for="option in accessOptions" :key="option.value" type="button" :class="{ active: accessFilter === option.value }" @click="setFilter('access', option.value)">
            <span>{{ option.label }}</span><small>{{ option.count }}</small>
          </button>
        </fieldset>

        <label class="facet-select">
          <span>Rights</span>
          <select v-model="rightsFilter" @change="syncFilters">
            <option value="">Any rights statement</option>
            <option v-for="option in rightsOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <p class="facet-help"><IconInfoCircle :size="15" /> Filters are reflected in the page URL for easy sharing.</p>
      </aside>

      <section class="results-panel" aria-labelledby="catalog-results-title">
        <header class="results-header">
          <div>
            <span>{{ resultSummary }}</span>
            <h2 id="catalog-results-title">Catalog records</h2>
          </div>
          <span class="results-order"><IconArrowsSort :size="15" /> Relevance and title</span>
        </header>

        <div v-if="filteredRecords.length" class="result-list stagger">
          <article v-for="record in filteredRecords" :key="record.key" class="result-row">
            <RouterLink :to="record.route" class="result-main" @click="logRecordOpen(record)">
              <span class="result-icon" :class="`result-icon--${record.type}`">
                <IconCube v-if="record.type === 'model'" :size="19" />
                <IconDatabase v-else :size="19" />
              </span>
              <span class="result-copy">
                <span class="result-type">{{ record.typeLabel }}</span>
                <strong>{{ record.title }}</strong>
                <small>{{ record.description }}</small>
                <span class="result-meta">
                  <span v-if="record.category">{{ record.category }}</span>
                  <span v-if="record.technology">{{ record.technology }}</span>
                  <span v-if="record.version">{{ record.version }}</span>
                </span>
              </span>
            </RouterLink>
            <span class="access-label" :class="`access-label--${record.access}`"><span></span>{{ accessLabel(record.access) }}</span>
            <button
              type="button"
              class="save-record"
              :class="{ saved: savedSet.contains(record.key) }"
              :disabled="savedSet.isFull && !savedSet.contains(record.key)"
              :aria-label="savedSet.contains(record.key) ? `Remove ${record.title} from saved set` : `Save ${record.title} to set`"
              @click="savedSet.toggle(record)"
            >
              <IconBookmarkFilled v-if="savedSet.contains(record.key)" :size="17" />
              <IconBookmarkPlus v-else :size="17" />
            </button>
            <RouterLink :to="record.route" class="open-record" :aria-label="`Open ${record.title}`"><IconArrowUpRight :size="18" /></RouterLink>
          </article>
        </div>

        <div v-else class="empty-results">
          <IconSearchOff :size="32" />
          <h3>No records match these filters</h3>
          <p>Try a broader search or reset the catalog filters.</p>
          <button type="button" @click="clearFilters">Reset filters</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconArrowRight,
  IconArrowUpRight,
  IconArrowsSort,
  IconBookmarkFilled,
  IconBookmarkPlus,
  IconChevronDown,
  IconCube,
  IconDatabase,
  IconInfoCircle,
  IconLoader2,
  IconSearch,
  IconSearchOff,
} from '@tabler/icons-vue'
import { useExploreStore } from '../stores/explore'
import { useSavedSetStore } from '../stores/savedSet'
import { logUiEvent } from '../lib/uiLogger'

const route = useRoute()
const router = useRouter()
const store = useExploreStore()
const savedSet = useSavedSetStore()

const query = ref(String(route.query.q || ''))
const typeFilter = ref(String(route.query.type || ''))
const categoryFilter = ref(String(route.query.category || ''))
const technologyFilter = ref(String(route.query.technology || ''))
const accessFilter = ref(String(route.query.access || ''))
const rightsFilter = ref(String(route.query.rights || ''))
const facetsOpen = ref(false)

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function datasetTitle(dataset) {
  const value = firstValue(dataset.title)
  return typeof value === 'object' ? value?.title || 'Untitled datasheet' : value || 'Untitled datasheet'
}

function datasetDescription(dataset) {
  const value = firstValue(dataset.description)
  return typeof value === 'object' ? value?.description || 'Catalog datasheet' : value || 'Catalog datasheet'
}

function datasetPublisher(dataset) {
  return typeof dataset.publisher === 'object' ? dataset.publisher?.name || '' : dataset.publisher || ''
}

function datasetRights(dataset) {
  const value = firstValue(dataset.rights)
  return typeof value === 'object' ? value?.rights || '' : value || ''
}

const records = computed(() => {
  const models = store.models.filter((item) => !item.is_private).map((model) => ({
    key: `model:${model.uuid}`,
    type: 'model',
    typeLabel: 'Model card',
    id: model.uuid,
    title: model.name || 'Untitled model',
    subtitle: model.ai_model?.owner || model.author || 'Model card',
    description: model.short_description || model.full_description || 'Documented AI model',
    route: `/modelcard/${model.uuid}`,
    category: String(model.category || '').trim(),
    technology: String(model.framework || model.ai_model?.framework || '').trim(),
    access: model.is_gated ? 'gated' : 'open',
    rights: String(model.ai_model?.license || '').trim(),
    version: String(model.version || model.ai_model?.version || '').trim(),
    searchText: JSON.stringify(model).toLowerCase(),
  }))
  const datasheets = store.datasheets.filter((item) => !item.is_private).map((dataset) => ({
    key: `datasheet:${dataset.uuid}`,
    type: 'datasheet',
    typeLabel: 'Datasheet',
    id: dataset.uuid,
    title: datasetTitle(dataset),
    subtitle: datasetPublisher(dataset) || 'Datasheet',
    description: datasetDescription(dataset),
    route: `/datasheet/${dataset.uuid}`,
    category: String(dataset.resource_type?.resourceType || dataset.resource_type?.resourceTypeGeneral || 'Dataset').trim(),
    technology: String(firstValue(dataset.format) || '').trim(),
    access: 'open',
    rights: String(datasetRights(dataset)).trim(),
    version: String(dataset.version || dataset.publication_year || '').trim(),
    searchText: JSON.stringify(dataset).toLowerCase(),
  }))
  return [...models, ...datasheets].sort((a, b) => a.title.localeCompare(b.title))
})

const needle = computed(() => query.value.trim().toLowerCase())
const searchedRecords = computed(() => records.value.filter((record) => !needle.value || record.searchText.includes(needle.value)))
const filteredRecords = computed(() => searchedRecords.value.filter((record) => {
  if (typeFilter.value && record.type !== typeFilter.value) return false
  if (categoryFilter.value && record.category !== categoryFilter.value) return false
  if (technologyFilter.value && record.technology !== technologyFilter.value) return false
  if (accessFilter.value && record.access !== accessFilter.value) return false
  if (rightsFilter.value && record.rights !== rightsFilter.value) return false
  return true
}))

const uniqueValues = (values) => [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
const categoryOptions = computed(() => uniqueValues(searchedRecords.value.map((record) => record.category)))
const technologyOptions = computed(() => uniqueValues(searchedRecords.value.map((record) => record.technology)))
const rightsOptions = computed(() => uniqueValues(searchedRecords.value.map((record) => record.rights)))
const typeOptions = computed(() => [
  { value: '', label: 'All records', count: searchedRecords.value.length },
  { value: 'model', label: 'Model cards', count: searchedRecords.value.filter((record) => record.type === 'model').length },
  { value: 'datasheet', label: 'Datasheets', count: searchedRecords.value.filter((record) => record.type === 'datasheet').length },
])
const accessOptions = computed(() => [
  { value: '', label: 'Any access', count: searchedRecords.value.length },
  { value: 'open', label: 'Open', count: searchedRecords.value.filter((record) => record.access === 'open').length },
  { value: 'gated', label: 'Gated', count: searchedRecords.value.filter((record) => record.access === 'gated').length },
])

const hasFilters = computed(() => Boolean(query.value.trim() || typeFilter.value || categoryFilter.value || technologyFilter.value || accessFilter.value || rightsFilter.value))
const activeFilterCount = computed(() => [typeFilter.value, categoryFilter.value, technologyFilter.value, accessFilter.value, rightsFilter.value].filter(Boolean).length)
const resultSummary = computed(() => `${filteredRecords.value.length} of ${records.value.length} public records`)

function accessLabel(access) {
  return access === 'gated' ? 'Gated' : 'Open'
}

function routeQuery() {
  return {
    ...(query.value.trim() ? { q: query.value.trim() } : {}),
    ...(typeFilter.value ? { type: typeFilter.value } : {}),
    ...(categoryFilter.value ? { category: categoryFilter.value } : {}),
    ...(technologyFilter.value ? { technology: technologyFilter.value } : {}),
    ...(accessFilter.value ? { access: accessFilter.value } : {}),
    ...(rightsFilter.value ? { rights: rightsFilter.value } : {}),
    ...(route.query.set ? { set: route.query.set } : {}),
  }
}

function submitSearch() {
  logUiEvent('catalog-search-submit', { source: 'catalog', queryLength: query.value.trim().length })
  router.replace({ name: 'CatalogSearch', query: routeQuery() })
}

function syncFilters() {
  logUiEvent('catalog-filter-change', {
    resourceType: typeFilter.value || 'all',
    hasCategory: Boolean(categoryFilter.value),
    hasTechnology: Boolean(technologyFilter.value),
    access: accessFilter.value || 'all',
    hasRights: Boolean(rightsFilter.value),
  })
  router.replace({ name: 'CatalogSearch', query: routeQuery() })
}

function setFilter(name, value) {
  if (name === 'type') typeFilter.value = value
  if (name === 'access') accessFilter.value = value
  syncFilters()
}

function clearFilters() {
  query.value = ''
  typeFilter.value = ''
  categoryFilter.value = ''
  technologyFilter.value = ''
  accessFilter.value = ''
  rightsFilter.value = ''
  router.replace({ name: 'CatalogSearch', query: route.query.set ? { set: route.query.set } : {} })
  logUiEvent('catalog-filter-reset')
}

function logRecordOpen(record) {
  logUiEvent('catalog-record-open', { recordType: record.type, source: 'catalog' })
}

function applyRouteFilters() {
  query.value = String(route.query.q || '')
  typeFilter.value = String(route.query.type || '')
  categoryFilter.value = String(route.query.category || '')
  technologyFilter.value = String(route.query.technology || '')
  accessFilter.value = String(route.query.access || '')
  rightsFilter.value = String(route.query.rights || '')
}

onMounted(() => { void Promise.allSettled([store.fetchModels(), store.fetchDatasheets()]) })
watch(() => route.query, applyRouteFilters)
</script>

<style scoped>
.catalog-page { max-width: 1280px; margin: 0 auto; padding-bottom: 92px; }
.catalog-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; margin-bottom: 24px; }
.eyebrow { display: block; margin-bottom: 7px; color: var(--color-primary); font-size: .67rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.catalog-heading h1 { max-width: 700px; font-size: clamp(2rem,3vw,3rem); line-height: 1.02; letter-spacing: -.045em; }
.catalog-heading p { margin-top: 9px; color: var(--color-text-secondary); font-size: .9rem; }
.catalog-count { display: flex; align-items: baseline; gap: 8px; padding-bottom: 4px; color: var(--color-text-muted); }
.catalog-count strong { color: var(--color-text); font-size: 1.4rem; }
.catalog-count span { font-size: .72rem; }
.catalog-search { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; margin-bottom: 25px; padding: 8px 8px 8px 16px; border: 1px solid var(--color-border-strong); border-radius: 13px; color: var(--color-text-muted); background: rgba(255,255,255,.88); box-shadow: 0 9px 25px rgba(37,44,60,.04); }
.catalog-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),.08); }
.catalog-search input { min-width: 0; padding: 3px 0; border: 0; outline: 0; color: var(--color-text); background: transparent; }
.catalog-search button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 15px; border: 0; border-radius: 8px; color: #fff; background: var(--color-primary); font-weight: 700; }
.catalog-workspace { display: grid; grid-template-columns: 230px minmax(0,1fr); align-items: start; gap: 30px; }
.facet-panel { position: sticky; top: calc(var(--header-height) + 20px); overflow: hidden; border: 1px solid var(--color-border); border-radius: 13px; background: rgba(255,253,249,.7); }
.facet-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 14px; border-bottom: 1px solid var(--color-border); }
.facet-panel-header > div { display: flex; align-items: center; gap: 8px; }
.facet-panel-header strong { font-size: .8rem; }
.facet-panel-header small { padding: 2px 6px; border-radius: 9px; color: var(--color-primary); background: var(--color-primary-bg); font-size: .58rem; }
.facet-header-actions { display: flex; align-items: center; gap: 8px; }
.facet-panel-header button { display: inline-flex; align-items: center; gap: 3px; border: 0; color: var(--color-primary); background: transparent; font-size: .67rem; font-weight: 700; }
.facet-toggle { display: none!important; }
.facet-group { padding: 13px 13px 12px; border: 0; border-bottom: 1px solid var(--color-border); }
.facet-group legend,.facet-select > span { width: 100%; margin-bottom: 7px; color: var(--color-text-muted); font-size: .62rem; font-weight: 750; letter-spacing: .09em; text-transform: uppercase; }
.facet-group button { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 6px 7px; border: 0; border-radius: 7px; color: var(--color-text-secondary); background: transparent; text-align: left; font-size: .74rem; }
.facet-group button small { min-width: 24px; padding: 1px 5px; border-radius: 10px; color: var(--color-text-muted); background: rgba(230,223,211,.55); text-align: center; font-size: .62rem; }
.facet-group button:hover,.facet-group button.active { color: var(--color-primary); background: var(--color-primary-bg); font-weight: 650; }
.facet-group button.active small { color: var(--color-primary); background: #fff; }
.facet-select { display: block; padding: 13px; border-bottom: 1px solid var(--color-border); }
.facet-select > span { display: block; }
.facet-select select { width: 100%; padding: 8px 27px 8px 9px; border: 1px solid var(--color-border); border-radius: 8px; outline: 0; color: var(--color-text-secondary); background: #fff; font-size: .72rem; }
.facet-select select:focus { border-color: var(--color-primary); }
.facet-help { display: flex; align-items: flex-start; gap: 7px; padding: 12px 13px 14px; color: var(--color-text-muted); font-size: .64rem; line-height: 1.45; }
.facet-help svg { flex: 0 0 auto; }
.results-panel { min-width: 0; }
.results-header { display: flex; align-items: end; justify-content: space-between; gap: 20px; padding: 1px 3px 12px; border-bottom: 1px solid var(--color-border-strong); }
.results-header > div > span { color: var(--color-text-muted); font-size: .68rem; }
.results-header h2 { margin-top: 1px; font-size: 1.1rem; }
.results-order { display: inline-flex; align-items: center; gap: 6px; color: var(--color-text-muted); font-size: .65rem; }
.result-list { display: grid; }
.result-row { display: grid; grid-template-columns: minmax(0,1fr) auto auto auto; align-items: center; gap: 13px; min-width: 0; padding: 15px 3px; border-bottom: 1px solid var(--color-border); transition: background var(--transition),padding var(--transition); }
.result-row:hover { padding-right: 10px; padding-left: 10px; background: rgba(255,255,255,.52); }
.result-main { min-width: 0; display: grid; grid-template-columns: auto minmax(0,1fr); align-items: center; gap: 13px; }
.result-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 11px; color: var(--color-primary); background: var(--color-primary-bg); }
.result-icon--datasheet { color: #a66d18; background: var(--color-accent-bg); }
.result-copy { min-width: 0; }
.result-type { display: block; margin-bottom: 1px; color: var(--color-text-muted); font-size: .58rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.result-copy strong,.result-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-copy strong { font-size: .86rem; }
.result-copy small { margin-top: 2px; color: var(--color-text-secondary); font-size: .71rem; }
.result-meta { display: flex; gap: 6px; margin-top: 6px; }
.result-meta > span { max-width: 170px; overflow: hidden; padding: 2px 6px; border-radius: 5px; color: var(--color-text-muted); background: rgba(230,223,211,.45); font-size: .59rem; text-overflow: ellipsis; white-space: nowrap; }
.access-label { display: inline-flex; align-items: center; gap: 6px; min-width: 58px; color: var(--color-text-muted); font-size: .65rem; }
.access-label > span { width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); }
.access-label--gated > span { background: var(--color-accent); }
.save-record,.open-record { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 9px; color: var(--color-text-muted); background: transparent; }
.save-record:hover,.open-record:hover { border-color: var(--color-border); color: var(--color-primary); background: #fff; }
.save-record.saved { color: var(--color-primary); background: var(--color-primary-bg); }
.save-record:disabled { opacity: .35; cursor: not-allowed; }
.empty-results { display: grid; justify-items: center; padding: 70px 20px; color: var(--color-text-muted); text-align: center; }
.empty-results h3 { margin-top: 12px; color: var(--color-text); font-size: 1rem; }
.empty-results p { margin-top: 4px; font-size: .76rem; }
.empty-results button { margin-top: 15px; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-primary); background: #fff; font-weight: 700; }
.catalog-notice { display: flex; align-items: center; gap: 10px; padding: 18px; border: 1px dashed var(--color-border-strong); border-radius: 12px; color: var(--color-text-muted); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width:900px) { .catalog-workspace { grid-template-columns: 1fr; } .facet-panel { position: static; display: grid; grid-template-columns: repeat(2,1fr); } .facet-panel-header,.facet-help { grid-column: 1/-1; } .facet-group,.facet-select { border-right: 1px solid var(--color-border); } }
@media (max-width:640px) { .catalog-heading { align-items: start; flex-direction: column; gap: 8px; } .catalog-count { display: none; } .catalog-search { grid-template-columns: auto 1fr; } .catalog-search button { grid-column: 1/-1; justify-content: center; } .facet-panel { display: block; } .facet-toggle { display: inline-flex!important; } .facet-toggle svg { transition: transform var(--transition); } .facet-panel.open .facet-toggle svg { transform: rotate(180deg); } .facet-panel:not(.open) > :not(.facet-panel-header) { display: none; } .result-row { grid-template-columns: minmax(0,1fr) auto auto; } .access-label { display: none; } .result-copy small { white-space: normal; } .results-order { display: none; } }
</style>
