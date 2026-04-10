<template>
  <div>
    <div class="page-header">
      <h1>Browse Datasheets</h1>
      <p>Browse and search the Patra Knowledge Base datasheets</p>
    </div>

    <div v-if="apiMode.supportsAskPatra && (auth.isTapisUser || auth.isAdmin)" class="ask-patra-callout">
      <div>
        <div class="ask-patra-callout-title">Start in Ask Patra</div>
        <div class="ask-patra-callout-text">
          Use Ask Patra when you want a guided route to datasheets, planning tools, or workflow surfaces.
        </div>
      </div>
      <RouterLink
        :to="{ path: '/ask-patra', query: { prompt: 'Help me find datasheets about ' + (filters.search || 'my topic') } }"
        class="btn btn-outline"
      >
        Open Ask Patra
      </RouterLink>
    </div>

    <div class="connection-banner error" v-if="store.error">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Cannot connect to {{ apiMode.displayLabel.toLowerCase() }} at <code>{{ apiMode.apiBaseUrl }}</code>. {{ apiMode.helpText }}</span>
    </div>

    <div class="explore-layout">
      <DatasheetFilterSidebar
        v-model="filters"
        :allResourceTypes="allResourceTypes"
        :allPublishers="allPublishers"
        :filteredCount="filteredDatasheets.length"
        :totalCount="store.datasheets.length"
      />

      <div class="explore-main">
        <div class="loading-state" v-if="store.loading">
          <IconLoader2 :size="32" stroke-width="1.5" class="spin" />
          <span>Loading datasheets...</span>
        </div>

        <div class="empty-state" v-else-if="filteredDatasheets.length === 0 && !store.error">
          <IconDatabaseOff :size="48" stroke-width="1.2" />
          <h3>No datasheets found</h3>
          <p>Try adjusting your filters or search query.</p>
          <button class="btn btn-outline" @click="filters = { search: '', resourceType: '', publisher: '', visibility: 'all' }">Reset Filters</button>
        </div>

        <div class="ds-grid" v-else>
          <DatasheetCard v-for="ds in filteredDatasheets" :key="ds.id" :ds="ds" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useApiModeStore } from '../stores/apiMode'
import { useAuthStore } from '../stores/auth'
import DatasheetCard from '../components/DatasheetCard.vue'
import DatasheetFilterSidebar from '../components/DatasheetFilterSidebar.vue'
import { IconAlertCircle, IconLoader2, IconDatabaseOff } from '@tabler/icons-vue'

const store = useExploreStore()
const apiMode = useApiModeStore()
const auth = useAuthStore()
const route = useRoute()
const filters = ref({ search: '', resourceType: '', publisher: '', visibility: 'all' })

function loadDatasheets() {
  store.fetchDatasheets()
}

function syncRouteQuery() {
  filters.value = {
    ...filters.value,
    search: typeof route.query.q === 'string' ? route.query.q : '',
  }
}

onMounted(() => {
  syncRouteQuery()
  loadDatasheets()
})
watch(() => apiMode.mode, loadDatasheets)
watch(() => route.query.q, syncRouteQuery)

function getTitle(ds) {
  if (Array.isArray(ds.title) && ds.title.length) {
    const t = ds.title[0]
    return typeof t === 'object' ? t.title : t
  }
  return ds.title || ''
}

function getCreator(ds) {
  if (Array.isArray(ds.creator) && ds.creator.length) {
    return ds.creator[0].creatorName?.name || ''
  }
  return ''
}

function getPublisher(ds) {
  if (ds.publisher && typeof ds.publisher === 'object') return ds.publisher.name || ''
  return ds.publisher || ''
}

function getResourceType(ds) {
  return ds.resource_type?.resourceType || 'Dataset'
}

const allResourceTypes = computed(() => [...new Set(store.datasheets.map(getResourceType))])
const allPublishers = computed(() => [...new Set(store.datasheets.map(getPublisher).filter(Boolean))])

const filteredDatasheets = computed(() => {
  let list = store.datasheets

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    list = list.filter(ds =>
      getTitle(ds).toLowerCase().includes(q) ||
      getCreator(ds).toLowerCase().includes(q) ||
      getPublisher(ds).toLowerCase().includes(q)
    )
  }

  if (filters.value.resourceType) {
    list = list.filter(ds => getResourceType(ds) === filters.value.resourceType)
  }

  if (filters.value.publisher) {
    list = list.filter(ds => getPublisher(ds) === filters.value.publisher)
  }

  if (filters.value.visibility === 'public') {
    list = list.filter(ds => !ds.is_private)
  } else if (filters.value.visibility === 'private') {
    list = list.filter(ds => ds.is_private)
  }

  return list
})
</script>

<style scoped>
.explore-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.explore-main {
  flex: 1;
}

.ds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 18px;
}

.ask-patra-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.72);
  margin-bottom: 18px;
}

.ask-patra-callout-title {
  font-weight: 700;
  color: var(--color-text);
}

.ask-patra-callout-text {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: .88rem;
}

.connection-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  font-size: .88rem;
}

.connection-banner.error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.connection-banner code {
  background: rgba(0, 0, 0, .08);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: .82rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-muted);
  gap: 10px;
}

.empty-state h3 {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}

.empty-state p {
  font-size: .88rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

@media (max-width: 860px) {
  .ask-patra-callout {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
