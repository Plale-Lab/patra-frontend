<template>
  <div>

    <!-- Connection banner -->
    <div class="connection-banner error" v-if="store.error">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Cannot connect to the Patra API at <code>{{ API_BASE_URL }}</code>.</span>
    </div>

    <div class="explore-layout">
      <!-- Filter column -->
      <div class="filter-col">
        <div class="filter-chips type-toggle">
          <button type="button" class="chip" :class="{ active: activeType === 'model_card' }" @click="activeType = 'model_card'">Model Cards</button>
          <button type="button" class="chip" :class="{ active: activeType === 'datasheet' }" @click="activeType = 'datasheet'">Datasheets</button>
        </div>
        <FilterSidebar v-if="activeType === 'model_card'" />
        <DatasheetFilterSidebar
          v-else
          v-model="filters"
          :allResourceTypes="allResourceTypes"
          :allPublishers="allPublishers"
          :filteredCount="filteredDatasheets.length"
          :totalCount="store.datasheets.length"
        />
      </div>

      <!-- Main Grid -->
      <div class="explore-main">
        <template v-if="activeType === 'model_card'">
          <!-- Loading -->
          <div class="loading-state" v-if="store.loading">
            <IconLoader2 :size="32" stroke-width="1.5" class="spin" />
            <span>Loading model cards…</span>
          </div>

          <!-- Empty -->
          <div class="empty-state" v-else-if="store.filteredModels.length === 0 && !store.error">
            <IconDatabaseOff :size="48" stroke-width="1.2" />
            <h3>No models found</h3>
            <p>Try adjusting your filters or search query.</p>
            <button class="btn btn-outline" @click="store.resetFilters()">Reset Filters</button>
          </div>

          <!-- Grid -->
          <div class="card-grid" v-else>
            <ModelCard
              v-for="model in pagedModels"
              :key="model.id"
              :model="model"
            />
          </div>

          <PaginationBar
            v-if="!store.loading && !store.error && modelTotal > 0"
            v-model:page="modelPage"
            v-model:page-size="modelPageSize"
            :total="modelTotal"
            :page-size-options="modelPageSizeOptions"
            item-label="model cards"
            label="Model cards pagination"
          />
        </template>

        <template v-else>
          <!-- Loading -->
          <div class="loading-state" v-if="store.loading">
            <IconLoader2 :size="32" stroke-width="1.5" class="spin" />
            <span>Loading datasheets…</span>
          </div>

          <!-- Empty -->
          <div class="empty-state" v-else-if="filteredDatasheets.length === 0 && !store.error">
            <IconDatabaseOff :size="48" stroke-width="1.2" />
            <h3>No datasheets found</h3>
            <p>Try adjusting your filters or search query.</p>
            <button class="btn btn-outline" @click="filters = { search: '', resourceType: '', publisher: '', visibility: 'all' }">Reset Filters</button>
          </div>

          <!-- Grid -->
          <div class="card-grid" v-else>
            <DatasheetCard v-for="ds in pagedDatasheets" :key="ds.id" :ds="ds" />
          </div>

          <PaginationBar
            v-if="!store.loading && !store.error && datasheetTotal > 0"
            v-model:page="datasheetPage"
            v-model:page-size="datasheetPageSize"
            :total="datasheetTotal"
            :page-size-options="datasheetPageSizeOptions"
            item-label="datasheets"
            label="Datasheets pagination"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { API_BASE_URL } from '../config/api'
import { usePagination } from '../composables/usePagination'
import FilterSidebar from '../components/FilterSidebar.vue'
import DatasheetFilterSidebar from '../components/DatasheetFilterSidebar.vue'
import ModelCard from '../components/ModelCard.vue'
import DatasheetCard from '../components/DatasheetCard.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { IconAlertCircle, IconLoader2, IconDatabaseOff } from '@tabler/icons-vue'

const route = useRoute()
const store = useExploreStore()

const activeType = ref(route.name === 'ExploreDatasheets' ? 'datasheet' : 'model_card')

const modelsLoaded = ref(false)
const datasheetsLoaded = ref(false)

function loadModels() {
  if (modelsLoaded.value) return
  modelsLoaded.value = true
  store.fetchModels()
}

function loadDatasheets() {
  if (datasheetsLoaded.value) return
  datasheetsLoaded.value = true
  store.fetchDatasheets()
}

onMounted(() => {
  if (activeType.value === 'model_card') loadModels()
  else loadDatasheets()
})

// The other tab's data is fetched lazily, on first visit, since store.loading/
// store.error are shared flags across both fetches — running them concurrently
// would let one clobber the other's state.
watch(activeType, (type) => {
  if (type === 'model_card') loadModels()
  else loadDatasheets()
})

const {
  page: modelPage,
  pageSize: modelPageSize,
  pageSizeOptions: modelPageSizeOptions,
  total: modelTotal,
  pagedItems: pagedModels,
} = usePagination(() => store.filteredModels)

// Datasheet filters + helpers (datasheets have no store-level filter state,
// unlike models via FilterSidebar).
const filters = ref({ search: '', resourceType: '', publisher: '', visibility: 'all' })

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

const {
  page: datasheetPage,
  pageSize: datasheetPageSize,
  pageSizeOptions: datasheetPageSizeOptions,
  total: datasheetTotal,
  pagedItems: pagedDatasheets,
} = usePagination(() => filteredDatasheets.value)
</script>

<style scoped>
.explore-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.filter-col {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-toggle {
  display: flex;
}

.explore-main { flex: 1; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 18px;
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
  background: rgba(0,0,0,.08);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: .82rem;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-muted);
  gap: 10px;
}
.empty-state h3 { font-size: 1.1rem; color: var(--color-text-secondary); }
.empty-state p { font-size: .88rem; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
