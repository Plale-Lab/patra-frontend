<template>
  <div class="submit-review">
    <div class="form-section" v-for="section in sections" :key="section.id">
      <div class="form-section-label">{{ section.title }}</div>
      <dl class="review-list">
        <div class="review-row" v-for="field in section.fields" :key="field.key">
          <dt>{{ field.label }}</dt>
          <dd :class="{ 'is-empty': isEmpty(field) }">{{ displayValue(field) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  sections: { type: Array, required: true },
  form: { type: Object, required: true },
})

function isEmpty(field) {
  if (field.type === 'segmented') return false
  const v = props.form[field.key]
  return v == null || String(v).trim() === ''
}

function displayValue(field) {
  const v = props.form[field.key]
  if (field.type === 'segmented') {
    const opt = (field.options || []).find((o) => o.value === v)
    return opt ? opt.label : String(v)
  }
  const s = v == null ? '' : String(v).trim()
  return s || '—'
}
</script>

<style scoped>
.review-list {
  margin: 0;
  display: grid;
  gap: 2px;
}

.review-row {
  display: grid;
  grid-template-columns: minmax(140px, 200px) 1fr;
  gap: 16px;
  padding: 8px 0;
  border-top: 1px solid var(--color-border);
  align-items: baseline;
}

.review-row:first-child {
  border-top: none;
}

.review-row dt {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.review-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.review-row dd.is-empty {
  color: var(--color-text-muted);
}

@media (max-width: 600px) {
  .review-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
