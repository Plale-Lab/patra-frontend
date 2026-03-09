<template>
  <div class="schema-field">
    <!-- Enum → dropdown -->
    <template v-if="fieldSchema.enum">
      <label class="form-label">
        {{ label }} <span class="required" v-if="isRequired">*</span>
      </label>
      <select class="form-input" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">Select {{ label.toLowerCase() }}</option>
        <option v-for="opt in fieldSchema.enum" :key="opt" :value="opt">{{ formatEnum(opt) }}</option>
      </select>
    </template>

    <!-- Nested object → fieldset -->
    <template v-else-if="fieldSchema.type === 'object' || (Array.isArray(fieldSchema.type) && fieldSchema.type.includes('object'))">
      <fieldset class="nested-fieldset">
        <legend class="nested-legend">
          {{ label }} <span class="required" v-if="isRequired">*</span>
        </legend>
        <div class="nested-body">
          <template v-for="(subSchema, subKey) in (fieldSchema.properties || {})" :key="subKey">
            <SchemaField
              :fieldKey="subKey"
              :fieldSchema="subSchema"
              :modelValue="(modelValue || {})[subKey]"
              :isRequired="(fieldSchema.required || []).includes(subKey)"
              @update:modelValue="updateNested(subKey, $event)"
            />
          </template>
        </div>
      </fieldset>
    </template>

    <!-- Array of strings → comma input -->
    <template v-else-if="fieldSchema.type === 'array' && fieldSchema.items && fieldSchema.items.type === 'string'">
      <label class="form-label">
        {{ label }} <span class="required" v-if="isRequired">*</span>
      </label>
      <input
        class="form-input"
        :value="Array.isArray(modelValue) ? modelValue.join(', ') : (modelValue || '')"
        @input="$emit('update:modelValue', $event.target.value.split(',').map(s => s.trim()).filter(Boolean))"
        :placeholder="'Comma-separated ' + label.toLowerCase()"
      />
    </template>

    <!-- Array of objects → add-row list -->
    <template v-else-if="fieldSchema.type === 'array' && fieldSchema.items && (fieldSchema.items.type === 'object' || fieldSchema.items.$ref)">
      <fieldset class="nested-fieldset">
        <legend class="nested-legend">
          {{ label }} <span class="required" v-if="isRequired">*</span>
          <button type="button" class="btn btn-sm btn-outline add-row-btn" @click="addArrayItem">
            + Add
          </button>
        </legend>
        <div class="array-items">
          <div v-for="(item, idx) in (modelValue || [])" :key="idx" class="array-item">
            <div class="array-item-header">
              <span class="array-item-label">{{ label }} #{{ idx + 1 }}</span>
              <button type="button" class="btn btn-sm btn-danger" @click="removeArrayItem(idx)">Remove</button>
            </div>
            <div class="nested-body">
              <template v-for="(subSchema, subKey) in (resolvedItemSchema.properties || {})" :key="subKey">
                <SchemaField
                  :fieldKey="subKey"
                  :fieldSchema="subSchema"
                  :modelValue="(item || {})[subKey]"
                  :isRequired="(resolvedItemSchema.required || []).includes(subKey)"
                  @update:modelValue="updateArrayItem(idx, subKey, $event)"
                />
              </template>
            </div>
          </div>
          <div v-if="!(modelValue && modelValue.length)" class="array-empty">
            No items yet. Click "+ Add" to add one.
          </div>
        </div>
      </fieldset>
    </template>

    <!-- Number -->
    <template v-else-if="fieldSchema.type === 'number'">
      <label class="form-label">
        {{ label }} <span class="required" v-if="isRequired">*</span>
      </label>
      <input
        class="form-input"
        type="number"
        step="any"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))"
        :placeholder="fieldSchema.description || label"
      />
    </template>

    <!-- Textarea for description-like fields -->
    <template v-else-if="isTextarea">
      <label class="form-label">
        {{ label }} <span class="required" v-if="isRequired">*</span>
      </label>
      <textarea
        class="form-input form-textarea"
        rows="3"
        :value="modelValue || ''"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="fieldSchema.description || label"
      ></textarea>
    </template>

    <!-- Default string input -->
    <template v-else>
      <label class="form-label">
        {{ label }} <span class="required" v-if="isRequired">*</span>
      </label>
      <input
        class="form-input"
        type="text"
        :value="modelValue || ''"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="fieldSchema.description || label"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fieldKey: { type: String, required: true },
  fieldSchema: { type: Object, required: true },
  modelValue: { default: null },
  isRequired: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const label = computed(() => {
  return props.fieldKey
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
})

const isTextarea = computed(() => {
  const key = props.fieldKey.toLowerCase()
  return (
    props.fieldSchema.type === 'string' &&
    (key.includes('description') || key.includes('full_description') || key.includes('citation'))
  )
})

const resolvedItemSchema = computed(() => {
  if (props.fieldSchema.items && props.fieldSchema.items.type === 'object') {
    return props.fieldSchema.items
  }
  return { properties: {}, required: [] }
})

function formatEnum(val) {
  if (!val) return val
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function updateNested(subKey, value) {
  const current = props.modelValue || {}
  emit('update:modelValue', { ...current, [subKey]: value })
}

function addArrayItem() {
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  current.push({})
  emit('update:modelValue', current)
}

function removeArrayItem(idx) {
  const current = [...(props.modelValue || [])]
  current.splice(idx, 1)
  emit('update:modelValue', current)
}

function updateArrayItem(idx, subKey, value) {
  const current = [...(props.modelValue || [])]
  current[idx] = { ...current[idx], [subKey]: value }
  emit('update:modelValue', current)
}
</script>

<style scoped>
.schema-field {
  margin-bottom: 16px;
}

.nested-fieldset {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0;
  margin-bottom: 16px;
}

.nested-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: .92rem;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius) var(--radius) 0 0;
  margin: 0;
  width: 100%;
}

.nested-body {
  padding: 18px;
}

.add-row-btn {
  margin-left: auto;
  font-size: .78rem;
  padding: 3px 10px;
}

.array-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
  overflow: hidden;
}

.array-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  font-size: .85rem;
  font-weight: 500;
}

.array-item-label {
  color: var(--color-text-secondary);
}

.array-empty {
  color: var(--color-text-muted);
  font-size: .85rem;
  text-align: center;
  padding: 20px;
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
}

.required { color: var(--color-danger); }
</style>
