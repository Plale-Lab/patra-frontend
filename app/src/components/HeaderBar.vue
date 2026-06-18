<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="header-greeting">
        <span class="greeting-text">Good {{ timeOfDay }},</span>
        <span class="greeting-name">{{ auth.displayName }}</span>
      </div>
      <span class="header-subtitle">Patra Knowledge Base platform</span>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
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
.header-greeting { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
.greeting-text { font-size: 1rem; color: var(--color-text-secondary); }
.greeting-name { font-size: 1rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
.header-subtitle {
  font-size: .78rem;
  font-weight: 500;
  letter-spacing: .01em;
  color: var(--color-text-muted);
  margin-top: 2px;
}

@media (max-width: 1080px) {
  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
    gap: 12px;
    padding: 16px 24px;
  }
}
</style>
