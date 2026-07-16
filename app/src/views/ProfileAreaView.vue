<template>
  <main class="profile-area">
    <div class="profile-icon"><component :is="content.icon" :size="27" /></div>
    <div><span>Personal area</span><h1>{{ content.title }}</h1><p>{{ content.description }}</p><RouterLink v-if="area === 'collections'" to="/modelcards" class="btn btn-primary">Browse public resources</RouterLink></div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { IconBell, IconFolders, IconSend, IconUserCircle } from '@tabler/icons-vue'
const props = defineProps({ area: { type: String, required: true } })
const content = computed(() => ({
  collections: { title: 'My Collections', description: 'Collection storage is not yet exposed by the current API. This is the intended personal entry point for that integration.', icon: IconFolders },
  submissions: { title: 'My Submissions', description: 'User-scoped submission history will appear here when the backend endpoint is available.', icon: IconSend },
  notifications: { title: 'Notifications', description: 'Catalog and workflow notifications will appear here when notification APIs are available.', icon: IconBell },
  account: { title: 'Account and profile', description: 'Authentication is managed by Tapis. Profile editing is not currently supported inside the catalog.', icon: IconUserCircle },
}[props.area] || { title: 'Personal area', description: '', icon: IconUserCircle }))
</script>

<style scoped>
.profile-area { display: grid; grid-template-columns: auto minmax(0,680px); gap: 22px; align-items: start; padding-top: 34px; }
.profile-icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 15px; color: var(--color-primary); background: var(--color-primary-bg); }
.profile-area span { color: var(--color-primary); font-size: .72rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.profile-area h1 { margin: 8px 0 10px; font-size: 2rem; letter-spacing: -.03em; }
.profile-area p { margin-bottom: 22px; color: var(--color-text-secondary); line-height: 1.7; }
@media(max-width:640px){.profile-area{grid-template-columns:1fr}}
</style>
