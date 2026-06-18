<template>
  <div class="starter-strip" v-if="prompts.length">
    <button
      v-for="starter in prompts"
      :key="starter.title"
      class="starter-chip"
      type="button"
      @click="emit('pick', starter.prompt)"
    >
      <span class="starter-chip-title">{{ starter.title }}</span>
      <span class="starter-chip-prompt">{{ starter.prompt }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  prompts: { type: Array, default: () => [] },
})
const emit = defineEmits(['pick'])
</script>

<style scoped>
.starter-strip {
  display: grid;
  gap: 10px;
}

.starter-chip {
  width: 100%;
  text-align: left;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}

.starter-chip:hover {
  border-color: rgba(var(--color-primary-rgb), 0.4);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.starter-chip-title {
  display: block;
  font-weight: 700;
  color: var(--color-text);
}

.starter-chip-prompt {
  display: block;
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: .85rem;
  line-height: 1.45;
}
</style>
