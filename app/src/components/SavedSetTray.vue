<template>
  <Transition name="tray">
    <aside v-if="saved.count" class="saved-tray" :class="{ expanded }" aria-label="Saved record set">
      <button class="tray-summary" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
        <span class="tray-icon"><IconBookmarks :size="19" /></span>
        <span><strong>Saved set</strong><small>{{ saved.count }} of 5 records</small></span>
        <IconChevronUp class="tray-chevron" :size="18" />
      </button>

      <div v-if="expanded" class="tray-body">
        <header>
          <div><span>Working set</span><strong>Compare and share records</strong></div>
          <button type="button" @click="saved.clear()">Clear</button>
        </header>
        <div class="tray-records">
          <div v-for="record in saved.records" :key="record.key" class="tray-record">
            <span class="record-type" :class="`record-type--${record.type}`">
              <IconCube v-if="record.type === 'model'" :size="15" />
              <IconDatabase v-else :size="15" />
            </span>
            <RouterLink :to="record.route"><strong>{{ record.title }}</strong><small>{{ record.subtitle || record.type }}</small></RouterLink>
            <button type="button" :aria-label="`Remove ${record.title} from saved set`" @click="saved.remove(record.key)"><IconX :size="16" /></button>
          </div>
        </div>
        <footer>
          <button type="button" class="tray-action" @click="exportSet"><IconDownload :size="16" /> Export JSON</button>
          <button type="button" class="tray-action tray-action--primary" @click="copyShareLink">
            <IconCheck v-if="copied" :size="16" /><IconLink v-else :size="16" />
            {{ copied ? 'Link copied' : 'Copy share link' }}
          </button>
        </footer>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { IconBookmarks, IconCheck, IconChevronUp, IconCube, IconDatabase, IconDownload, IconLink, IconX } from '@tabler/icons-vue'
import { useSavedSetStore } from '../stores/savedSet'
import { logUiEvent } from '../lib/uiLogger'

const saved = useSavedSetStore()
const route = useRoute()
const expanded = ref(false)
const copied = ref(false)

function importSharedSet(token) {
  if (token && saved.hydrateFromShareToken(token)) expanded.value = true
}

async function copyShareLink() {
  const url = new URL('/search', window.location.origin)
  url.searchParams.set('set', saved.shareToken())
  try {
    await navigator.clipboard.writeText(url.toString())
    copied.value = true
    logUiEvent('saved-set-share', { setSize: saved.count })
    window.setTimeout(() => { copied.value = false }, 1800)
  } catch {
    window.prompt('Copy this saved set link', url.toString())
  }
}

function exportSet() {
  const payload = { name: 'Patra saved record set', exportedAt: new Date().toISOString(), records: saved.records }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = 'patra-saved-records.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
  logUiEvent('saved-set-export', { setSize: saved.count })
}

onMounted(() => importSharedSet(route.query.set))
watch(() => route.query.set, importSharedSet)
</script>

<style scoped>
.saved-tray { position: fixed; right: 24px; bottom: 22px; z-index: 180; width: 226px; overflow: hidden; border: 1px solid rgba(29,39,56,.16); border-radius: 15px; background: rgba(255,253,249,.97); box-shadow: 0 18px 50px rgba(27,35,49,.16); backdrop-filter: blur(18px); transition: width var(--transition-slow); }
.saved-tray.expanded { width: min(430px,calc(100vw - 36px)); }
.tray-summary { width: 100%; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 10px 12px; border: 0; color: var(--color-text); background: transparent; text-align: left; }
.tray-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; color: #fff; background: var(--color-primary); }
.tray-summary strong,.tray-summary small { display: block; }
.tray-summary strong { font-size: .82rem; }
.tray-summary small { margin-top: 1px; color: var(--color-text-muted); font-size: .67rem; }
.tray-chevron { color: var(--color-text-muted); transition: transform var(--transition); }
.expanded .tray-chevron { transform: rotate(180deg); }
.tray-body { border-top: 1px solid var(--color-border); }
.tray-body > header { display: flex; align-items: center; justify-content: space-between; padding: 14px 15px 10px; }
.tray-body > header span,.tray-body > header strong { display: block; }
.tray-body > header span { color: var(--color-accent); font-size: .61rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.tray-body > header strong { margin-top: 2px; font-size: .86rem; }
.tray-body > header button { border: 0; color: var(--color-text-muted); background: transparent; font-size: .7rem; }
.tray-records { padding: 0 10px; }
.tray-record { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 9px 5px; border-top: 1px solid var(--color-border); }
.record-type { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; color: var(--color-primary); background: var(--color-primary-bg); }
.record-type--datasheet { color: #a56d19; background: var(--color-accent-bg); }
.tray-record a { min-width: 0; }
.tray-record a strong,.tray-record a small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tray-record a strong { font-size: .76rem; }
.tray-record a small { margin-top: 1px; color: var(--color-text-muted); font-size: .65rem; }
.tray-record > button { width: 28px; height: 28px; display: grid; place-items: center; border: 0; border-radius: 8px; color: var(--color-text-muted); background: transparent; }
.tray-record > button:hover { color: var(--color-danger); background: var(--color-danger-bg); }
.tray-body footer { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px; border-top: 1px solid var(--color-border); }
.tray-action { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 10px; border: 1px solid var(--color-border); border-radius: 9px; color: var(--color-text-secondary); background: #fff; font-size: .72rem; font-weight: 700; }
.tray-action--primary { border-color: var(--color-primary); color: #fff; background: var(--color-primary); }
.tray-enter-active,.tray-leave-active { transition: opacity var(--transition),transform var(--transition); }
.tray-enter-from,.tray-leave-to { opacity: 0; transform: translateY(10px); }
@media (max-width:640px) { .saved-tray { right: 12px; bottom: 12px; } .saved-tray:not(.expanded) { width: 200px; } }
</style>
