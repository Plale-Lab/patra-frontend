<template>
  <div class="profile-area">
    <div class="profile-icon"><component :is="icon" :size="28" stroke-width="1.7" /></div>
    <div>
      <div class="eyebrow">Personal area</div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <RouterLink v-if="actionRoute" :to="actionRoute" class="btn btn-primary">{{ actionLabel }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { IconBell, IconFilePencil, IconFolders, IconSend, IconUserCircle } from '@tabler/icons-vue'

const props = defineProps({
  area: { type: String, required: true },
})

const content = computed(() => ({
  collections: {
    title: 'My Collections',
    description: 'Collections are positioned here in the identity area, but the current backend does not yet expose collection storage or management APIs. This page is a non-destructive placeholder for that future integration.',
    icon: IconFolders,
  },
  notifications: {
    title: 'Notifications',
    description: 'There are no notification APIs in the current project. Future catalog, submission, and workflow updates will appear here when that service is available.',
    icon: IconBell,
  },
  submissions: {
    title: 'My Submissions',
    description: 'Submission creation is supported, but the current backend does not expose a user-scoped submission history. This page marks the intended personal entry point without presenting invented records.',
    icon: IconSend,
  },
  drafts: {
    title: 'Drafts',
    description: 'Draft persistence is not yet available in the current API. Saved in-progress catalog deposits will appear here when backend support is added.',
    icon: IconFilePencil,
  },
  account: {
    title: 'Account and profile',
    description: 'Authentication is managed by Tapis. Profile editing is not currently supported inside this catalog.',
    icon: IconUserCircle,
  },
}[props.area] || {}))

const title = computed(() => content.value.title || 'Personal area')
const description = computed(() => content.value.description || '')
const icon = computed(() => content.value.icon || IconUserCircle)
const actionRoute = computed(() => props.area === 'collections' ? '/explore-model-cards' : '')
const actionLabel = computed(() => props.area === 'collections' ? 'Browse public resources' : '')
</script>

<style scoped>
.profile-area { display: grid; grid-template-columns: auto minmax(0, 680px); gap: 22px; align-items: start; padding-top: 36px; }
.profile-icon { display: flex; align-items: center; justify-content: center; width: 58px; height: 58px; border-radius: 16px; background: var(--color-primary-bg); color: var(--color-primary); }
.eyebrow { margin-bottom: 8px; color: var(--color-primary); font-size: .74rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin-bottom: 10px; font-size: 2rem; letter-spacing: -.03em; }
p { margin-bottom: 22px; color: var(--color-text-secondary); line-height: 1.7; }
@media (max-width: 640px) { .profile-area { grid-template-columns: 1fr; } }
</style>
