<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <span>{{ title }}</span>
          <button class="btn-icon" @click="$emit('close')">
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
import { IconX } from '@tabler/icons-vue'
defineProps({ title: { type: String, default: '' } })
defineEmits(['close'])
</script>
