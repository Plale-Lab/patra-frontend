<template>
  <aside class="sidebar">
    <RouterLink to="/" class="sidebar-brand" aria-label="ICICLE AI Resource Catalog home">
      <strong>ICICLE</strong>
      <span>AI Resource Catalog</span>
    </RouterLink>

    <nav class="sidebar-nav" aria-label="Public catalog navigation">
      <div class="sidebar-section-label">Public catalog</div>
      <RouterLink to="/" class="sidebar-link" :class="{ active: $route.path === '/' }"><IconHomeSearch :size="19" /><span>Home</span></RouterLink>
      <RouterLink to="/search" class="sidebar-link" :class="{ active: catalogActive }"><IconLibrary :size="19" /><span>Catalog</span></RouterLink>
      <RouterLink to="/#resource-stories" class="sidebar-link"><IconBook2 :size="19" /><span>Stories</span></RouterLink>
      <RouterLink to="/record-map" class="sidebar-link" :class="{ active: $route.path === '/record-map' }"><IconRoute :size="19" /><span>Record Map</span></RouterLink>
      <RouterLink to="/#catalog-about" class="sidebar-link"><IconHelpCircle :size="19" /><span>About &amp; Help</span></RouterLink>
      <div class="sidebar-section-label sidebar-section-label--publishing">Publishing</div>
      <RouterLink to="/story-portal" class="sidebar-link" :class="{ active: $route.path === '/story-portal' }"><IconPencilPlus :size="19" /><span>Story Portal</span></RouterLink>
      <RouterLink to="/story-admin" class="sidebar-link" :class="{ active: $route.path === '/story-admin' }"><IconShieldLock :size="19" /><span>Story Admin</span></RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'
import { IconBook2, IconHelpCircle, IconHomeSearch, IconLibrary, IconPencilPlus, IconRoute, IconShieldLock } from '@tabler/icons-vue'

const route = useRoute()
const catalogActive = computed(() => ['/search', '/modelcards', '/datasheets'].includes(route.path)
  || route.path.startsWith('/modelcard/')
  || route.path.startsWith('/datasheet/'))
</script>

<style scoped>
.sidebar { position: fixed; inset: 0 auto 0 0; z-index: 100; width: var(--sidebar-width); display: flex; flex-direction: column; border-right: 1px solid var(--color-border); background: rgba(255,253,249,.95); backdrop-filter: blur(12px); }
.sidebar-brand { display: block; padding: 22px 24px 20px; border-bottom: 1px solid var(--color-border); }
.sidebar-brand strong,.sidebar-brand span { display: block; }
.sidebar-brand strong { color: var(--color-primary); font-size: 1.14rem; font-weight: 800; letter-spacing: .04em; }
.sidebar-brand span { margin-top: 2px; color: var(--color-text-muted); font-size: .69rem; letter-spacing: .03em; }
.sidebar-nav { flex: 1; padding: 18px 12px; overflow-y: auto; }
.sidebar-section-label { padding: 10px 12px 8px; color: var(--color-text-muted); font-size: .64rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.sidebar-section-label--publishing { margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--color-border); }
.sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 11px; border: 1px solid transparent; border-radius: 10px; color: var(--color-text-secondary); font-size: .86rem; font-weight: 500; transition: color var(--transition),background var(--transition),border-color var(--transition); }
.sidebar-link:hover { border-color: var(--color-border); color: var(--color-text); background: rgba(255,255,255,.75); }
.sidebar-link.active { border-color: rgba(var(--color-primary-rgb),.16); color: var(--color-primary); background: var(--color-primary-bg); font-weight: 650; }
@media (max-width: 860px) { .sidebar { display: none; } }
</style>
