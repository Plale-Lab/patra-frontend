<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="header-greeting">
        <span class="greeting-text">Good {{ timeOfDay }}, </span>
        <span class="greeting-name">{{ auth.displayName }}</span>
      </div>
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
.greeting-text { font-size: 1rem; color: var(--color-text-secondary); }
.greeting-name { font-size: 1rem; font-weight: 700; color: var(--color-text); }

@media (max-width: 1080px) {
  .header-bar {
    align-items: flex-start;
    padding: 16px 24px;
  }
}

@media (max-width: 768px) {
  .header-bar {
    height: auto;
    min-height: 58px;
    padding: 14px 16px;
    position: static;
  }
}
</style>
