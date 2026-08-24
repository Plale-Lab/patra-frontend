<template>
  <div>
    <div v-if="!(auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS)" class="card">
      <div class="card-body">
        <div class="empty-state compact">
          <IconLock :size="34" stroke-width="1.5" />
          <p>Sign in with the sidebar login to edit cards.</p>
        </div>
      </div>
    </div>

    <div v-else class="edit-records-pane">
      <aside class="search-pane card">
        <div class="card-header">
          <span class="flex items-center gap-8">
            <IconSearch :size="18" stroke-width="1.8" />
            Find a card
          </span>
        </div>
        <div class="card-body">
          <div class="search-row">
            <input
              ref="searchInput"
              class="form-input"
              v-model="searchQuery"
              placeholder="Name, author, creator, keyword..."
              @keyup.enter="runSearchNow"
            />
            <button class="btn btn-primary" @click="runSearchNow" :disabled="searching">
              {{ searching ? 'Searching…' : 'Search' }}
            </button>
          </div>

          <div class="filter-chips type-chips">
            <button type="button" class="chip" :class="{ active: typeFilter === 'all' }" @click="typeFilter = 'all'">All</button>
            <button type="button" class="chip" :class="{ active: typeFilter === 'model_card' }" @click="typeFilter = 'model_card'">Model Cards</button>
            <button type="button" class="chip" :class="{ active: typeFilter === 'datasheet' }" @click="typeFilter = 'datasheet'">Datasheets</button>
          </div>

          <InlineFeedback v-if="searchError" type="error" :message="searchError" class="search-feedback" />

          <div class="suggestions-block">
            <div class="section-label">{{ searchQuery.trim() ? 'Matching cards' : 'Suggested cards' }}</div>
            <div class="record-list stagger" v-if="filteredRecords.length">
              <button
                v-for="record in filteredRecords"
                :key="recordKey(record)"
                class="record-card"
                :class="{ active: isSelected(record) }"
                @click="trySelectRecord(record)"
              >
                <div class="record-card-header">
                  <span class="record-kind">{{ record.kindLabel }}</span>
                </div>
                <div class="record-card-title">{{ record.title }}</div>
                <div class="record-card-subtitle">{{ record.subtitle }}</div>
                <div class="record-card-description" v-if="record.description">{{ record.description }}</div>
              </button>
            </div>

            <div class="empty-state compact" v-else-if="hasSearched && !searching">
              <IconSearchOff :size="32" stroke-width="1.4" />
              <p>No matching cards.</p>
            </div>
          </div>
        </div>
      </aside>

      <section class="edit-pane card">
        <div v-if="!selectedRecord" class="card-body">
          <div class="empty-state compact">
            <IconEdit :size="34" stroke-width="1.5" />
            <p>Select a card from the list to start editing.</p>
          </div>
        </div>

        <div v-else-if="detailLoading" class="card-body">
          <div class="loading-state">
            <IconLoader2 :size="30" stroke-width="1.6" class="spin" />
            <span>Loading card…</span>
          </div>
        </div>

        <div v-else-if="detailError" class="card-body">
          <div class="empty-state compact">
            <IconAlertCircle :size="32" stroke-width="1.5" />
            <p>{{ detailError }}</p>
            <button class="btn btn-outline btn-sm" @click="retryLoadDetail">
              <IconRefresh :size="15" stroke-width="1.8" /> Retry
            </button>
          </div>
        </div>

        <div v-else>
          <div class="card-header edit-pane-header">
            <div class="edit-title">
              <span class="record-kind">{{ selectedRecord.kindLabel }}</span>
              <span class="edit-name">{{ selectedAssetName }}</span>
              <span v-if="formatVersion(currentVersion)" class="version-badge">{{ formatVersion(currentVersion) }}</span>
              <span v-if="isDirty" class="dirty-badge" title="Unsaved changes" aria-label="Unsaved changes">●</span>
            </div>
            <button class="btn btn-outline btn-sm" @click="tryCancel">Close</button>
          </div>

          <div class="card-body">
            <div class="form-section" v-for="section in editSections" :key="section.id">
              <div class="form-section-label">{{ section.title }}</div>
              <div class="section-fields">
                <FormField
                  v-for="field in section.fields"
                  :key="field.key"
                  :field="field"
                  v-model="editForm[field.key]"
                  :error="errors[field.key]"
                  :class="{ 'field-span-2': field.type === 'textarea' }"
                  @blur="validateOnBlur(field)"
                />
              </div>
            </div>

            <InlineFeedback v-if="submitError" type="error" :message="submitError" />
            <InlineFeedback v-else-if="saveResult" type="success">
              Saved.
              <RouterLink v-if="savedRecordLink" :to="savedRecordLink" class="success-link">View card →</RouterLink>
            </InlineFeedback>

            <div class="action-row">
              <button class="btn btn-outline" @click="tryCancel" :disabled="submitting">Cancel</button>
              <button class="btn btn-primary" @click="submitEdit" :disabled="submitting || !isDirty">
                {{ submitting ? 'Saving…' : 'Save changes' }}
              </button>
              <span class="save-hint">⌘S</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, RouterLink } from 'vue-router'
import {
  IconAlertCircle, IconEdit, IconLoader2, IconLock, IconRefresh, IconSearch, IconSearchOff,
} from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { SUPPORTS_DEV_OPEN_ACCESS } from '../../config/api'
import { sectionsFor } from '../../lib/assetFields'
import { validateField } from '../../lib/fieldValidation'
import { formatVersion } from '../../lib/formatVersion'
import FormField from '../../components/FormField.vue'
import InlineFeedback from '../../components/InlineFeedback.vue'
import {
  fetchExistingRecordDetail,
  fetchSuggestedEditableRecords,
  getRecordDisplayName,
  mapRecordDetailToEditForm,
  saveEditedRecord,
} from './api'

const auth = useAuthStore()

const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const hasSearched = ref(false)
const suggestedRecords = ref([])
const typeFilter = ref('all')

const selectedRecord = ref(null)
const selectedDetail = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
const editForm = reactive({})
const errors = reactive({})
const originalFormJson = ref('')
const submitting = ref(false)
const submitError = ref('')
const saveResult = ref(null)

let searchTimer = null
let detailToken = 0
const DEBOUNCE_MS = 350

const filteredRecords = computed(() => (
  typeFilter.value === 'all'
    ? suggestedRecords.value
    : suggestedRecords.value.filter((r) => r.assetType === typeFilter.value)
))

const editSections = computed(() => (
  selectedRecord.value ? sectionsFor(selectedRecord.value.assetType) : []
))

const selectedAssetName = computed(() => (
  selectedRecord.value && selectedDetail.value
    ? getRecordDisplayName(selectedRecord.value, selectedDetail.value)
    : ''
))

const currentVersion = computed(() => selectedDetail.value?.asset_version || null)

// Dirty = the form differs from the snapshot taken when the record loaded.
// (Snapshot-based rather than patch-based so that records whose creator/subject
// names legitimately contain commas — e.g. "Doe, Jane" — are not reported dirty
// on load by the split/join round-trip, and so an untouched record can't be
// accidentally saved.)
function snapshotForm() {
  originalFormJson.value = JSON.stringify(editForm)
}

const isDirty = computed(() => (
  originalFormJson.value !== '' && JSON.stringify(editForm) !== originalFormJson.value
))

const savedRecordLink = computed(() => {
  if (!saveResult.value || !selectedDetail.value?.uuid) return null
  return selectedRecord.value?.assetType === 'model_card'
    ? { name: 'ModelDetail', params: { uuid: selectedDetail.value.uuid } }
    : { name: 'DatasheetDetail', params: { uuid: selectedDetail.value.uuid } }
})

// Dismiss the "Saved." banner as soon as the user starts editing again.
watch(isDirty, (dirty) => {
  if (dirty) saveResult.value = null
})

onMounted(() => {
  if (auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS) {
    loadSuggestions()
  }
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    next(false)
  } else {
    next()
  }
})

watch(searchQuery, () => {
  if (!(auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS)) return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, DEBOUNCE_MS)
})

function recordKey(record) {
  return `${record.assetType}:${record.assetId}`
}

function isSelected(record) {
  return selectedRecord.value && recordKey(selectedRecord.value) === recordKey(record)
}

function onKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    if (selectedRecord.value && isDirty.value && !submitting.value) submitEdit()
  }
}

function onBeforeUnload(event) {
  if (isDirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function clearForm() {
  Object.keys(editForm).forEach((key) => delete editForm[key])
}

function validateOnBlur(field) {
  const msg = validateField(field, editForm[field.key], false)
  if (msg) errors[field.key] = msg
  else delete errors[field.key]
}

async function loadSuggestions(query = '') {
  searching.value = true
  searchError.value = ''
  try {
    suggestedRecords.value = await fetchSuggestedEditableRecords(query, 6)
    hasSearched.value = true
  } catch (error) {
    suggestedRecords.value = []
    searchError.value = error.message || 'Search failed.'
  } finally {
    searching.value = false
  }
}

async function runSearch() {
  await loadSuggestions(searchQuery.value)
}

async function runSearchNow() {
  if (searchTimer) clearTimeout(searchTimer)
  await runSearch()
}

function trySelectRecord(record) {
  if (isSelected(record)) return
  if (isDirty.value && !confirm('Discard unsaved changes?')) return
  selectRecord(record)
}

async function selectRecord(record) {
  const myToken = ++detailToken
  selectedRecord.value = record
  submitError.value = ''
  saveResult.value = null
  detailError.value = ''
  clearErrors()
  clearForm()
  originalFormJson.value = ''
  detailLoading.value = true
  selectedDetail.value = null
  try {
    const detail = await fetchExistingRecordDetail(record)
    if (myToken !== detailToken) return
    selectedDetail.value = detail
    Object.assign(editForm, mapRecordDetailToEditForm(record, detail))
    snapshotForm()
  } catch (error) {
    if (myToken !== detailToken) return
    detailError.value = error.message || 'Could not load the selected card.'
  } finally {
    if (myToken === detailToken) detailLoading.value = false
  }
}

function retryLoadDetail() {
  if (selectedRecord.value) selectRecord(selectedRecord.value)
}

function tryCancel() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) return
  selectedRecord.value = null
  selectedDetail.value = null
  detailError.value = ''
  saveResult.value = null
  submitError.value = ''
  clearErrors()
  clearForm()
  originalFormJson.value = ''
}

async function submitEdit() {
  if (!selectedRecord.value || !selectedDetail.value) return
  submitting.value = true
  submitError.value = ''
  saveResult.value = null
  try {
    saveResult.value = await saveEditedRecord(selectedRecord.value, { ...editForm }, selectedDetail.value)
    const newDetail = await fetchExistingRecordDetail(selectedRecord.value)
    selectedDetail.value = newDetail
    selectedRecord.value = {
      ...selectedRecord.value,
      title: getRecordDisplayName(selectedRecord.value, newDetail),
    }
    clearForm()
    Object.assign(editForm, mapRecordDetailToEditForm(selectedRecord.value, newDetail))
    snapshotForm()
    await loadSuggestions(searchQuery.value)
  } catch (error) {
    submitError.value = error.message || 'Save failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.edit-records-pane {
  display: grid;
  grid-template-columns: minmax(320px, 380px) 1fr;
  gap: 16px;
  align-items: start;
}

.search-pane,
.edit-pane {
  margin: 0;
  min-width: 0;
}

.search-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.type-chips {
  margin-top: 12px;
}

.search-feedback {
  margin-top: 12px;
}

.section-label {
  margin-top: 18px;
  margin-bottom: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.edit-pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.edit-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.edit-name {
  font-weight: 700;
  color: var(--color-text);
  overflow-wrap: anywhere;
  min-width: 0;
}

.version-badge {
  border-radius: 999px;
  padding: 2px 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 0.74rem;
  font-weight: 700;
}

.dirty-badge {
  color: var(--color-accent);
  font-size: 1.1rem;
  line-height: 1;
}

.record-kind {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 8px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.record-list {
  display: grid;
  gap: 10px;
}

.record-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  min-width: 0;
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}

.record-card:hover {
  border-color: rgba(var(--color-primary-rgb), 0.4);
  transform: translateY(-1px);
}

.record-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.14);
}

.record-card-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.record-card-title {
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.record-card-subtitle {
  margin-top: 6px;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.record-card-description {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.save-hint {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.success-link {
  margin-left: 4px;
}

@media (max-width: 980px) {
  .edit-records-pane {
    grid-template-columns: 1fr;
  }
}
</style>
