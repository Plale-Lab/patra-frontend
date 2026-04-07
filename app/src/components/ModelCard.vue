<template>
  <RouterLink :to="`/explore-model-cards/${model.id}`" class="model-card">
    <div class="model-card-header">
      <span class="badge" :class="model.is_private ? 'badge-private' : 'badge-public'">
        {{ model.is_private ? 'Private' : 'Public' }}
      </span>
      <span v-if="model.is_gated" class="badge badge-accent">Gated</span>
      <span v-if="model.framework" class="badge badge-info">{{ model.framework }}</span>
    </div>
    <h3 class="model-card-name">{{ model.name }}</h3>
    <p class="model-card-desc">{{ model.short_description }}</p>
    <div class="model-card-meta">
      <div class="meta-row">
        <IconUser :size="14" stroke-width="1.8" />
        <span>{{ model.author }}</span>
      </div>
      <div class="meta-row">
        <IconTag :size="14" stroke-width="1.8" />
        <span>{{ model.category }}</span>
      </div>
      <div class="meta-row">
        <IconGitBranch :size="14" stroke-width="1.8" />
        <span>v{{ model.version }}</span>
      </div>
    </div>
    <div class="model-card-accuracy" v-if="model.test_accuracy">
      <div class="accuracy-header">
        <span class="accuracy-label">Accuracy</span>
        <span class="accuracy-value">{{ (model.test_accuracy * 100).toFixed(1) }}%</span>
      </div>
      <div class="accuracy-bar-bg">
        <div class="accuracy-bar-fill" :style="{ width: (model.test_accuracy * 100) + '%' }"></div>
      </div>
    </div>
    <div class="model-card-footer">
      <span v-if="model.model_type" class="model-type-badge">{{ model.model_type }}</span>
      <IconChevronRight :size="16" stroke-width="1.8" class="card-arrow" />
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { IconUser, IconTag, IconGitBranch, IconChevronRight } from '@tabler/icons-vue'

defineProps({
  model: { type: Object, required: true },
})
</script>

<style scoped>
.model-card {
  background: linear-gradient(180deg, rgba(255,255,255,.9) 0%, var(--color-surface) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-decoration: none;
  transition: all var(--transition);
  cursor: pointer;
}
.model-card:hover {
  box-shadow: var(--shadow-md);
  border-color: rgba(47, 78, 162, .2);
  transform: translateY(-2px);
}

.model-card-header {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.model-card-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.model-card-desc {
  font-size: .84rem;
  color: var(--color-text-secondary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.model-card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .8rem;
  color: var(--color-text-muted);
}

.model-card-accuracy { margin-top: auto; }
.accuracy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.accuracy-label { font-size: .75rem; color: var(--color-text-muted); }
.accuracy-value { font-size: .82rem; font-weight: 700; color: var(--color-primary); }
.accuracy-bar-bg {
  height: 6px;
  background: var(--color-bg);
  border-radius: 3px;
  overflow: hidden;
}
.accuracy-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 3px;
  transition: width .4s ease;
}

.model-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}
.model-type-badge {
  font-size: .72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  padding: 3px 8px;
  border-radius: 999px;
}
.card-arrow {
  margin-left: auto;
  color: var(--color-text-muted);
  transition: color var(--transition);
}
.model-card:hover .card-arrow { color: var(--color-primary); }
</style>
