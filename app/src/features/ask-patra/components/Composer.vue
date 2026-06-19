<template>
  <div class="composer-shell">
    <label class="visually-hidden" for="ask-patra-composer">Ask Patra a question</label>
    <textarea
      id="ask-patra-composer"
      class="composer-input"
      rows="3"
      :value="modelValue"
      :placeholder="placeholder"
      @input="emit('update:modelValue', $event.target.value)"
      @keydown.enter.exact.prevent="onEnter"
    ></textarea>
    <div class="composer-footer">
      <div class="composer-helper">Enter sends. Shift+Enter for a new line.</div>
      <button class="btn btn-primary" type="button" :disabled="disabled" @click="emit('send')">
        <IconSend :size="16" stroke-width="1.8" />
        {{ buttonLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { IconSend } from '@tabler/icons-vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  buttonLabel: { type: String, default: 'Send' },
})
const emit = defineEmits(['update:modelValue', 'send'])

// Don't send while an IME candidate is being composed (Vue's .enter modifier
// doesn't account for composition).
function onEnter(event) {
  if (event.isComposing || event.keyCode === 229) return
  emit('send')
}
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.composer-shell {
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 12px;
  background: var(--color-surface);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.composer-shell:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.composer-input {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  line-height: 1.5;
  min-height: 84px;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.composer-helper {
  font-size: .78rem;
  color: var(--color-text-muted);
}

@media (max-width: 720px) {
  .composer-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
