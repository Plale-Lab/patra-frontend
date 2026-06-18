<template>
  <div class="inline-citations-block" v-if="citations.length" role="list" aria-label="Relevant records">
    <div class="inline-citations-title">Relevant records</div>
    <div class="citation-list">
      <a
        v-for="citation in citations"
        :key="`${citation.resource_type}-${citation.resource_id}`"
        class="citation-card"
        role="listitem"
        :href="citation.route"
      >
        <div class="citation-kind">{{ citation.resource_type === 'model_card' ? 'Model Card' : 'Datasheet' }}</div>
        <div class="citation-title">{{ citation.title }}</div>
        <div class="citation-subtitle">{{ citation.subtitle || 'Published record' }}</div>
        <div class="citation-description" v-if="citation.description">{{ citation.description }}</div>
        <div class="citation-match" v-if="citation.matched_on?.length">Matched on: {{ citation.matched_on.join(', ') }}</div>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  citations: { type: Array, default: () => [] },
})
</script>

<style scoped>
.inline-citations-block {
  margin-left: 48px;
  display: grid;
  gap: 10px;
}

.inline-citations-title {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-text-muted);
}

.citation-list {
  display: grid;
  gap: 12px;
}

.citation-card {
  display: block;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}

.citation-card:hover {
  border-color: rgba(var(--color-primary-rgb), 0.4);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.citation-kind {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: .72rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.citation-title {
  font-weight: 700;
  color: var(--color-text);
}

.citation-subtitle {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: .82rem;
}

.citation-description,
.citation-match {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: .84rem;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .inline-citations-block {
    margin-left: 0;
  }
}
</style>
