<template>
  <div class="field-feedback" :class="`field-feedback--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <component :is="icon" :size="18" stroke-width="1.8" />
    <span><slot>{{ message }}</slot></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-vue'

const props = defineProps({
  type: { type: String, default: 'info' }, // 'error' | 'success' | 'info'
  message: { type: String, default: '' },
})

const icon = computed(() => {
  if (props.type === 'error') return IconAlertCircle
  if (props.type === 'success') return IconCircleCheck
  return IconInfoCircle
})
</script>
