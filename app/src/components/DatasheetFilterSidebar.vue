<template>
  <aside class="filter-sidebar">
    <div class="filter-header">
      <span class="filter-title">
        <IconFilter :size="18" stroke-width="1.8" />
        Filters
      </span>
      <button class="btn btn-sm btn-outline" @click="resetFilters">Reset</button>
    </div>

    <!-- Search -->
    <div class="filter-section">
      <label class="filter-label">Search</label>
      <div class="search-box">
        <IconSearch :size="16" stroke-width="1.8" class="search-icon" />
        <input
          class="form-input search-input"
          :value="modelValue.search"
          @input="$emit('update:modelValue', { ...modelValue, search: $event.target.value })"
          placeholder="Title, creator, publisher…"
        />
      </div>
    </div>

    <!-- Resource Type -->
    <div class="filter-section" v-if="allResourceTypes.length">
      <label class="filter-label">Resource Type</label>
      <div class="filter-chips">
        <button
          class="chip"
          v-for="rt in allResourceTypes"
          :key="rt"
          :class="{ active: modelValue.resourceType === rt }"
          @click="$emit('update:modelValue', { ...modelValue, resourceType: modelValue.resourceType === rt ? '' : rt })"
        >
          {{ rt }}
        </button>
      </div>
    </div>

    <!-- Publisher -->
    <div class="filter-section" v-if="allPublishers.length">
      <label class="filter-label">Publisher</label>
      <select class="form-input" :value="modelValue.publisher" @change="$emit('update:modelValue', { ...modelValue, publisher: $event.target.value })">
        <option value="">All Publishers</option>
        <option v-for="p in allPublishers" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <!-- Visibility -->
    <div class="filter-section">
      <label class="filter-label">Visibility</label>
      <div class="filter-chips">
        <button class="chip" :class="{ active: modelValue.visibility === 'all' }" @click="$emit('update:modelValue', { ...modelValue, visibility: 'all' })">All</button>
        <button class="chip" :class="{ active: modelValue.visibility === 'public' }" @click="$emit('update:modelValue', { ...modelValue, visibility: 'public' })">Public</button>
        <button class="chip" :class="{ active: modelValue.visibility === 'private' }" @click="$emit('update:modelValue', { ...modelValue, visibility: 'private' })">Private</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="filter-stats">
      <span>{{ filteredCount }} of {{ totalCount }} datasheets</span>
    </div>
  </aside>
</template>

<script setup>
import { IconFilter, IconSearch } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  allResourceTypes: { type: Array, default: () => [] },
  allPublishers: { type: Array, default: () => [] },
  filteredCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue'])

function resetFilters() {
  emit('update:modelValue', { search: '', resourceType: '', publisher: '', visibility: 'all' })
}
</script>

<style scoped>
.filter-sidebar {
  width: 260px; flex-shrink: 0;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius); padding: 18px;
  height: fit-content; position: sticky;
  top: calc(var(--header-height) + 28px);
}
.filter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.filter-title { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 1rem; }
.filter-section { margin-bottom: 18px; }
.filter-label { display: block; font-weight: 600; font-size: .78rem; text-transform: uppercase; letter-spacing: .5px; color: var(--color-text-secondary); margin-bottom: 8px; }
.search-box { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
.search-input { padding-left: 32px; }
.filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-stats { padding-top: 14px; border-top: 1px solid var(--color-border); font-size: .78rem; color: var(--color-text-muted); text-align: center; }
</style>
