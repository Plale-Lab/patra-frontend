<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="header-greeting">
        <span class="greeting-text">Good {{ timeOfDay }},</span>
        <span class="greeting-name">{{ auth.displayName }}</span>
      </div>
      <span class="header-subtitle">Patra Knowledge Base {{ auth.isAdmin ? 'administration' : 'platform' }}</span>
    </div>
    <div class="header-right">
      <div class="api-mode-panel">
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
      <div class="header-date">
        <IconCalendar :size="16" stroke-width="1.8" />
        <span>{{ currentDate }}</span>
      </div>
      <button class="btn-icon" title="Search">
        <IconSearch :size="18" stroke-width="1.8" />
      </button>
      <button class="btn-icon" title="Notifications">
        <IconBell :size="18" stroke-width="1.8" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { IconCalendar, IconSearch, IconBell } from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'

const auth = useAuthStore()
const apiMode = useApiModeStore()

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
})

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
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left { display: flex; flex-direction: column; }
.greeting-text { font-size: 1rem; color: var(--color-text-secondary); }
.greeting-name { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.header-subtitle { font-size: .78rem; color: var(--color-text-muted); margin-top: 1px; }

.header-right { display: flex; align-items: center; gap: 8px; }

.api-mode-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  min-width: 280px;
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

.header-date {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: .85rem;
  color: var(--color-text-secondary);
  margin-right: 4px;
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

  .api-mode-panel {
    min-width: 0;
    width: 100%;
  }
}
</style>
