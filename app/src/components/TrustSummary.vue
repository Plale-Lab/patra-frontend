<template>
  <section class="trust-summary" aria-labelledby="trust-summary-title">
    <header class="trust-header">
      <div>
        <span>Record trust summary</span>
        <h2 id="trust-summary-title">At a glance</h2>
      </div>
      <span class="metadata-status"><IconRosetteDiscountCheck :size="16" /> Catalog metadata</span>
    </header>

    <dl class="trust-facts">
      <div v-for="fact in facts" :key="fact.label">
        <dt>{{ fact.label }}</dt>
        <dd :title="fact.value">{{ fact.value }}</dd>
      </div>
    </dl>

    <footer class="trust-actions">
      <p><IconInfoCircle :size="15" /> Verify rights and version before reuse.</p>
      <div>
        <button type="button" @click="copyLink"><IconCheck v-if="copied" :size="16" /><IconShare2 v-else :size="16" />{{ copied ? 'Link copied' : 'Copy link' }}</button>
        <button type="button" class="save-action" :class="{ saved: isSaved }" :disabled="savedSet.isFull && !isSaved" @click="toggleSaved">
          <IconBookmarkFilled v-if="isSaved" :size="16" /><IconBookmarkPlus v-else :size="16" />
          {{ isSaved ? 'Saved' : savedSet.isFull ? 'Set is full' : 'Save to set' }}
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconBookmarkFilled, IconBookmarkPlus, IconCheck, IconInfoCircle, IconRosetteDiscountCheck, IconShare2 } from '@tabler/icons-vue'
import { useSavedSetStore } from '../stores/savedSet'
import { logUiEvent } from '../lib/uiLogger'

const props = defineProps({
  type: { type: String, required: true },
  recordId: { type: [String, Number], required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  route: { type: String, required: true },
  access: { type: String, default: '' },
  steward: { type: String, default: '' },
  version: { type: String, default: '' },
  rights: { type: String, default: '' },
  updated: { type: [String, Number], default: '' },
})

const savedSet = useSavedSetStore()
const copied = ref(false)
const key = computed(() => `${props.type}:${props.recordId}`)
const isSaved = computed(() => savedSet.contains(key.value))

function display(value) {
  const normalized = String(value || '').trim()
  return normalized || 'Not supplied'
}

function displayDate(value) {
  if (!value) return 'Not supplied'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const facts = computed(() => [
  { label: 'Access', value: display(props.access) },
  { label: 'Steward', value: display(props.steward) },
  { label: 'Version', value: display(props.version) },
  { label: 'Rights', value: display(props.rights) },
  { label: 'Last updated', value: displayDate(props.updated) },
  { label: 'Stable identifier', value: display(props.recordId) },
])

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    logUiEvent('record-share-link-copy', { recordType: props.type })
    window.setTimeout(() => { copied.value = false }, 1600)
  } catch { /* Clipboard permissions are browser-controlled. */ }
}

function toggleSaved() {
  savedSet.toggle({
    key: key.value,
    type: props.type,
    id: props.recordId,
    title: props.title,
    subtitle: props.subtitle,
    route: props.route,
  })
}
</script>

<style scoped>
.trust-summary { margin: -4px 0 20px; overflow: hidden; border: 1px solid var(--color-border); border-radius: 14px; background: rgba(255,253,249,.72); }
.trust-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 17px 11px; border-bottom: 1px solid var(--color-border); }
.trust-header > div > span { color: var(--color-primary); font-size: .62rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.trust-header h2 { margin-top: 1px; font-size: .96rem; }
.metadata-status { display: inline-flex; align-items: center; gap: 6px; color: var(--color-success); font-size: .68rem; font-weight: 700; }
.trust-facts { display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); }
.trust-facts > div { min-width: 0; padding: 13px 16px; border-right: 1px solid var(--color-border); }
.trust-facts > div:last-child { border-right: 0; }
.trust-facts dt { margin-bottom: 4px; color: var(--color-text-muted); font-size: .61rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
.trust-facts dd { overflow: hidden; color: var(--color-text); font-size: .76rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.trust-actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 12px 10px 16px; border-top: 1px solid var(--color-border); background: rgba(255,255,255,.5); }
.trust-actions p { display: flex; align-items: center; gap: 6px; color: var(--color-text-muted); font-size: .68rem; }
.trust-actions > div { display: flex; gap: 7px; }
.trust-actions button { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text-secondary); background: #fff; font-size: .7rem; font-weight: 700; }
.trust-actions button:hover { border-color: var(--color-primary); color: var(--color-primary); }
.trust-actions .save-action { color: #fff; border-color: var(--color-primary); background: var(--color-primary); }
.trust-actions .save-action.saved { color: var(--color-primary); background: var(--color-primary-bg); }
.trust-actions button:disabled { opacity: .5; cursor: not-allowed; }
@media (max-width:1100px) { .trust-facts { grid-template-columns: repeat(3,1fr); } .trust-facts > div:nth-child(3) { border-right: 0; } .trust-facts > div:nth-child(-n+3) { border-bottom: 1px solid var(--color-border); } }
@media (max-width:640px) { .trust-facts { grid-template-columns: 1fr 1fr; } .trust-facts > div:nth-child(3) { border-right: 1px solid var(--color-border); } .trust-facts > div:nth-child(2n) { border-right: 0; } .trust-facts > div:nth-child(-n+4) { border-bottom: 1px solid var(--color-border); } .trust-actions { align-items: flex-start; flex-direction: column; } }
</style>
