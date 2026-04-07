<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="header-greeting">
        <span class="greeting-text">Good {{ timeOfDay }},</span>
        <span class="greeting-name">{{ auth.displayName }}</span>
      </div>
      <span class="header-subtitle">Patra Knowledge Base</span>
    </div>
    <div class="header-right">
      <div v-if="apiMode.showSelector" class="api-mode-panel">
        <label class="api-mode-label" for="api-mode-select">API Mode</label>
        <div class="api-mode-controls">
          <select
            id="api-mode-select"
            class="api-mode-select"
            :value="apiMode.mode"
            @change="apiMode.setMode($event.target.value)"
          >
            <option v-for="option in apiMode.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <span class="api-mode-target">{{ apiMode.apiBaseUrl }}</span>
        </div>
      </div>
      <button class="btn-icon" title="Search">
        <IconSearch :size="18" stroke-width="1.8" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { IconSearch } from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 18) return 'Afternoon'
  return 'Evening'
})
</script>

<style scoped>
.header-bar {
  height: var(--header-height);
  background: rgba(255, 253, 249, 0.86);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(14px);
}

.header-left { display: flex; flex-direction: column; gap: 2px; }
.greeting-text { font-size: 1rem; color: var(--color-text-secondary); }
.greeting-name { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.header-subtitle { font-size: .78rem; color: var(--color-text-muted); margin-top: 1px; letter-spacing: .01em; }

.header-right { display: flex; align-items: center; gap: 10px; }

.api-mode-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  min-width: 280px;
  background: rgba(255,255,255,.58);
}

.api-mode-label {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.api-mode-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.api-mode-select {
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: .86rem;
  font-weight: 600;
  outline: none;
  min-width: 120px;
}

.api-mode-target {
  font-size: .78rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1080px) {
  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
    gap: 12px;
    padding: 16px 24px;
  }

  .header-right {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
