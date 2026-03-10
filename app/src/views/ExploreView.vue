<template>
  <div>
    <div class="page-header">
      <h1>Browse Model Cards</h1>
      <p>Browse and query the Patra Knowledge Base model cards</p>
    </div>

    <!-- Connection banner -->
    <div class="connection-banner error" v-if="store.error">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Cannot connect to {{ apiMode.displayLabel.toLowerCase() }} at <code>{{ apiMode.apiBaseUrl }}</code>. {{ apiMode.helpText }}</span>
    </div>

    <div class="explore-layout">
      <!-- Filter Sidebar -->
      <FilterSidebar />

      <!-- Main Grid -->
      <div class="explore-main">
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
        <div class="model-grid" v-else>
          <ModelCard
            v-for="model in store.filteredModels"
            :key="model.id"
            :model="model"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useExploreStore } from '../stores/explore'
import { useApiModeStore } from '../stores/apiMode'
import FilterSidebar from '../components/FilterSidebar.vue'
import ModelCard from '../components/ModelCard.vue'
import { IconAlertCircle, IconLoader2, IconDatabaseOff } from '@tabler/icons-vue'

const store = useExploreStore()
const apiMode = useApiModeStore()

function loadModels() {
  store.fetchModels()
}

onMounted(loadModels)
watch(() => apiMode.mode, loadModels)
</script>

<style scoped>
.explore-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.explore-main { flex: 1; }

.model-grid {
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
