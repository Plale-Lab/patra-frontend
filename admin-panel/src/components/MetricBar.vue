<template>
  <div class="metric-bar">
    <div class="metric-bar-label">
      <span class="metric-name">{{ label }}</span>
      <span class="metric-value">{{ displayValue }}</span>
    </div>
    <div class="metric-bar-track">
      <div class="metric-bar-fill" :style="{ width: barWidth + '%', background: barColor }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: Number, default: 0 },
  max: { type: Number, default: 1 },
  format: { type: String, default: 'percent' }, // percent | number | raw
  color: { type: String, default: '' },
})

const barWidth = computed(() => Math.min((props.value / props.max) * 100, 100))

const barColor = computed(() => {
  if (props.color) return props.color
  const pct = barWidth.value
  if (pct >= 80) return 'var(--color-success)'
  if (pct >= 50) return 'var(--color-primary)'
  if (pct >= 25) return 'var(--color-accent)'
  return 'var(--color-danger)'
})

const displayValue = computed(() => {
  if (props.format === 'percent') return (props.value * 100).toFixed(1) + '%'
  if (props.format === 'number') return props.value.toLocaleString()
  return String(props.value)
})
</script>

<style scoped>
.metric-bar { margin-bottom: 10px; }
.metric-bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.metric-name { font-size: .82rem; color: var(--color-text-secondary); }
.metric-value { font-size: .82rem; font-weight: 600; }
.metric-bar-track {
  height: 8px;
  background: var(--color-bg);
  border-radius: 4px;
  overflow: hidden;
}
.metric-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width .5s ease;
}
</style>
