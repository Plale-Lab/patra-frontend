<template>
  <div>
    <div class="page-header">
      <h1>Models & Datasheets</h1>
      <p>Manage visibility and field-level access for model cards and datasheets</p>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'models' }" @click="activeTab = 'models'">
        <IconCube :size="16" stroke-width="1.8" /> Models ({{ store.models.length }})
      </button>
      <button class="tab" :class="{ active: activeTab === 'datasheets' }" @click="activeTab = 'datasheets'">
        <IconTable :size="16" stroke-width="1.8" /> Datasheets ({{ store.datasheets.length }})
      </button>
    </div>

    <!-- Models Table -->
    <div class="card" v-if="activeTab === 'models'">
      <div class="card-body" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Model Name</th>
              <th>Version</th>
              <th>Author</th>
              <th>Category</th>
              <th>Framework</th>
              <th>Accuracy</th>
              <th>Visibility</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="model in store.models" :key="model.id">
              <tr>
                <td style="font-weight: 600;">{{ model.name }}</td>
                <td>v{{ model.version }}</td>
                <td>{{ model.author }}</td>
                <td>{{ model.category }}</td>
                <td>
                  <span class="badge badge-info">{{ model.framework }}</span>
                </td>
                <td>{{ (model.accuracy * 100).toFixed(1) }}%</td>
                <td>
                  <div class="flex items-center gap-8">
                    <label class="toggle-switch">
                      <input type="checkbox" :checked="!model.isPrivate" @change="store.toggleModelVisibility(model.id)" />
                      <span class="slider"></span>
                    </label>
                    <span class="badge" :class="model.isPrivate ? 'badge-private' : 'badge-public'">
                      {{ model.isPrivate ? 'Private' : 'Public' }}
                    </span>
                  </div>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline" @click="toggleExpand(model.id)">
                    <IconChevronDown :size="14" :style="{ transform: expanded === model.id ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }" />
                    Fields
                  </button>
                </td>
              </tr>
              <!-- Expanded field controls -->
              <tr v-if="expanded === model.id">
                <td colspan="8" style="padding: 0 14px 14px;">
                  <div class="expand-panel">
                    <div class="expand-panel-title">Model Card Field Visibility</div>
                    <div class="expand-row" v-for="(field, key) in model.fields" :key="key">
                      <span class="text-sm">{{ field.label }}</span>
                      <div class="flex items-center gap-8">
                        <label class="toggle-switch">
                          <input type="checkbox" :checked="field.visible" @change="store.toggleModelCardField(model.id, key)" />
                          <span class="slider"></span>
                        </label>
                        <span class="text-sm text-muted">{{ field.visible ? 'Shown' : 'Hidden' }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Datasheets Table -->
    <div class="card" v-if="activeTab === 'datasheets'">
      <div class="card-body" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Dataset Name</th>
              <th>Version</th>
              <th>Source</th>
              <th>Category</th>
              <th>Datapoints</th>
              <th>Visibility</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ds in store.datasheets" :key="ds.id">
              <td style="font-weight: 600;">{{ ds.name }}</td>
              <td>v{{ ds.version }}</td>
              <td>{{ ds.source }}</td>
              <td>{{ ds.category }}</td>
              <td>{{ ds.datapoints.toLocaleString() }}</td>
              <td>
                <div class="flex items-center gap-8">
                  <label class="toggle-switch">
                    <input type="checkbox" :checked="!ds.isPrivate" @change="store.toggleDatasheetVisibility(ds.id)" />
                    <span class="slider"></span>
                  </label>
                  <span class="badge" :class="ds.isPrivate ? 'badge-private' : 'badge-public'">
                    {{ ds.isPrivate ? 'Private' : 'Public' }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useModelsStore } from '../stores/models'
import { IconCube, IconTable, IconChevronDown } from '@tabler/icons-vue'

const store = useModelsStore()
const activeTab = ref('models')
const expanded = ref(null)

function toggleExpand(id) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<style scoped>
.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.expand-panel-title {
  font-weight: 600;
  font-size: .82rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 10px;
}
</style>
