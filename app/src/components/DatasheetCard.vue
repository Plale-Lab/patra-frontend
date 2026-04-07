<template>
  <RouterLink :to="`/explore-datasheets/${ds.id}`" class="ds-card">
    <div class="ds-card-header">
      <span class="badge" :class="ds.is_private ? 'badge-private' : 'badge-public'">
        {{ ds.is_private ? 'Private' : 'Public' }}
      </span>
      <span class="badge badge-accent">{{ ds.resource_type?.resourceTypeGeneral || 'Dataset' }}</span>
    </div>
    <h3 class="ds-card-name">{{ displayTitle }}</h3>
    <p class="ds-card-desc">{{ displayDescription }}</p>
    <div class="ds-card-meta">
      <div class="meta-row">
        <IconUser :size="14" stroke-width="1.8" />
        <span>{{ displayCreator }}</span>
      </div>
      <div class="meta-row">
        <IconBuilding :size="14" stroke-width="1.8" />
        <span>{{ displayPublisher }}</span>
      </div>
      <div class="meta-row">
        <IconCalendar :size="14" stroke-width="1.8" />
        <span>{{ ds.publication_year }}</span>
      </div>
    </div>
    <div class="ds-card-footer">
      <span class="ds-type-badge">{{ ds.resource_type?.resourceType || 'Dataset' }}</span>
      <IconChevronRight :size="16" stroke-width="1.8" class="card-arrow" />
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { IconUser, IconBuilding, IconCalendar, IconChevronRight } from '@tabler/icons-vue'

const props = defineProps({
  ds: { type: Object, required: true },
})

const displayTitle = computed(() => {
  if (Array.isArray(props.ds.title) && props.ds.title.length) {
    const t = props.ds.title[0]
    return typeof t === 'object' ? t.title : t
  }
  return props.ds.title || 'Untitled'
})

const displayDescription = computed(() => {
  if (Array.isArray(props.ds.description) && props.ds.description.length) {
    const d = props.ds.description[0]
    return typeof d === 'object' ? d.description : d
  }
  return props.ds.description || ''
})

const displayCreator = computed(() => {
  if (Array.isArray(props.ds.creator) && props.ds.creator.length) {
    const c = props.ds.creator[0]
    return c.creatorName?.name || c.creatorName || 'Unknown'
  }
  return 'Unknown'
})

const displayPublisher = computed(() => {
  if (props.ds.publisher && typeof props.ds.publisher === 'object') {
    return props.ds.publisher.name || 'Unknown'
  }
  return props.ds.publisher || 'Unknown'
})
</script>

<style scoped>
.ds-card {
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
.ds-card:hover {
  box-shadow: var(--shadow-md);
  border-color: rgba(47, 78, 162, .2);
  transform: translateY(-2px);
}
.ds-card-header { display: flex; gap: 6px; flex-wrap: wrap; }
.ds-card-name {
  font-size: 1.05rem; font-weight: 700;
  color: var(--color-text); line-height: 1.3;
}
.ds-card-desc {
  font-size: .84rem; color: var(--color-text-secondary);
  line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.ds-card-meta { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
.meta-row { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: var(--color-text-muted); }
.ds-card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 10px; border-top: 1px solid var(--color-border); margin-top: 4px;
}
.ds-type-badge {
  font-size: .72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .5px; color: var(--color-text-muted);
  background: var(--color-bg-elevated); padding: 3px 8px; border-radius: 999px;
}
.card-arrow { color: var(--color-text-muted); transition: color var(--transition); }
.ds-card:hover .card-arrow { color: var(--color-primary); }
</style>
