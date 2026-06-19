<template>
  <div class="form-group">
    <label class="form-label" :for="field.type === 'segmented' ? undefined : fieldId">
      {{ field.label }}<span v-if="field.required" class="required"> *</span>
    </label>

    <div v-if="field.type === 'segmented'" class="filter-chips" role="group" :aria-label="field.label">
      <button
        v-for="opt in field.options"
        :key="String(opt.value)"
        type="button"
        class="chip"
        :class="{ active: modelValue === opt.value }"
        :aria-pressed="modelValue === opt.value"
        @click="emit('update:modelValue', opt.value)"
      >{{ opt.label }}</button>
    </div>

    <textarea
      v-else-if="field.type === 'textarea'"
      :id="fieldId"
      class="form-input form-textarea"
      :rows="field.rows || 3"
      :placeholder="field.placeholder"
      :value="modelValue"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    ></textarea>

    <input
      v-else-if="field.type === 'number'"
      :id="fieldId"
      class="form-input"
      type="number"
      :step="field.step"
      :min="field.min"
      :max="field.max"
      :placeholder="field.placeholder"
      :value="modelValue"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    />

    <input
      v-else
      :id="fieldId"
      class="form-input"
      type="text"
      :placeholder="field.placeholder"
      :value="modelValue"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    />

    <div v-if="field.help && !error" :id="`${fieldId}-help`" class="field-help">{{ field.help }}</div>
    <div v-if="error" :id="`${fieldId}-error`" class="field-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number, Boolean, null], default: '' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'blur'])

const fieldId = computed(() => `field-${props.field.key}`)

const describedBy = computed(() => {
  if (props.error) return `${fieldId.value}-error`
  if (props.field.help) return `${fieldId.value}-help`
  return undefined
})
</script>
