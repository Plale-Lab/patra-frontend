<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-label="title || 'Dialog'">
        <div class="modal-header">
          <span>{{ title }}</span>
          <button class="btn-icon" type="button" aria-label="Close" @click="$emit('close')">
            <IconX :size="18" stroke-width="2" />
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { IconX } from '@tabler/icons-vue'

defineProps({ title: { type: String, default: '' } })
const emit = defineEmits(['close'])

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>
