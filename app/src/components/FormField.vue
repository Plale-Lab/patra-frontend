<template>
  <div class="form-group">
    <div class="form-label-row">
      <label class="form-label" :for="field.type === 'segmented' ? undefined : fieldId">
        {{ field.label }}<span v-if="field.required" class="required"> *</span>
      </label>
      <span v-if="field.help" class="field-tooltip-wrap">
        <button type="button" class="field-help-trigger" :aria-label="`About ${field.label}`" :aria-describedby="`${fieldId}-help`">
          <IconInfoCircle :size="14" stroke-width="1.8" />
        </button>
        <span :id="`${fieldId}-help`" class="field-tooltip" role="tooltip">{{ field.help }}</span>
      </span>
    </div>

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

    <div v-if="error" :id="`${fieldId}-error`" class="field-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconInfoCircle } from '@tabler/icons-vue'

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
