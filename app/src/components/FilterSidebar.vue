<template>
  <aside class="filter-sidebar">
    <div class="filter-header">
      <span class="filter-title">
        <IconFilter :size="18" stroke-width="1.8" />
        Filters
      </span>
      <button class="btn btn-sm btn-outline" @click="store.resetFilters()">Reset</button>
    </div>

    <!-- Search -->
    <div class="filter-section">
      <label class="filter-label">Search</label>
      <div class="search-box">
        <IconSearch :size="16" stroke-width="1.8" class="search-icon" />
        <input
          class="form-input search-input"
          v-model="store.searchQuery"
          placeholder="Name, keyword, author…"
        />
      </div>
    </div>

    <!-- Category -->
    <div class="filter-section">
      <label class="filter-label">Category</label>
      <div class="filter-checks">
        <label class="filter-check" v-for="cat in store.allCategories" :key="cat">
          <input
            type="checkbox"
            :value="cat"
            v-model="store.selectedCategories"
          />
          <span>{{ cat }}</span>
        </label>
      </div>
    </div>

    <!-- Framework -->
    <div class="filter-section">
      <label class="filter-label">Framework</label>
      <div class="filter-chips">
        <button
          class="chip"
          v-for="fw in store.allFrameworks"
          :key="fw"
          :class="{ active: store.selectedFrameworks.includes(fw) }"
          @click="toggleFramework(fw)"
        >
          {{ fw }}
        </button>
      </div>
    </div>

    <!-- Author -->
    <div class="filter-section">
      <label class="filter-label">Author</label>
      <select class="form-input" v-model="store.selectedAuthor">
        <option value="">All Authors</option>
        <option v-for="a in store.allAuthors" :key="a" :value="a">{{ a }}</option>
      </select>
    </div>

    <!-- Visibility -->
    <div class="filter-section">
      <label class="filter-label">Visibility</label>
      <div class="filter-chips">
        <button class="chip" :class="{ active: store.visibilityFilter === 'all' }" @click="store.visibilityFilter = 'all'">All</button>
        <button class="chip" :class="{ active: store.visibilityFilter === 'public' }" @click="store.visibilityFilter = 'public'">Public</button>
        <button class="chip" :class="{ active: store.visibilityFilter === 'private' }" @click="store.visibilityFilter = 'private'">Private</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="filter-stats">
      <span>{{ store.filteredModels.length }} of {{ store.models.length }} models</span>
    </div>
  </aside>
</template>

<script setup>
import { useExploreStore } from '../stores/explore'
import { IconFilter, IconSearch } from '@tabler/icons-vue'

const store = useExploreStore()

function toggleFramework(fw) {
  const idx = store.selectedFrameworks.indexOf(fw)
  if (idx === -1) {
    store.selectedFrameworks.push(fw)
  } else {
    store.selectedFrameworks.splice(idx, 1)
  }
}
</script>

<style scoped>
.filter-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 18px;
  height: fit-content;
  position: sticky;
  top: calc(var(--header-height) + 28px);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.filter-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 1rem;
}

.filter-section {
  margin-bottom: 18px;
}
.filter-label {
  display: block;
  font-weight: 600;
  font-size: .78rem;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.search-box { position: relative; }
.search-icon {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}
.search-input { padding-left: 32px; }

.filter-checks { display: flex; flex-direction: column; gap: 6px; }
.filter-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .88rem;
  cursor: pointer;
}
.filter-check input[type="checkbox"] {
  width: 16px; height: 16px;
  accent-color: var(--color-primary);
}

.filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.filter-stats {
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  font-size: .78rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
