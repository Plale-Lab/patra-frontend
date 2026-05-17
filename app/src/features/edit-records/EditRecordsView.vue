<template>
  <div>
    <div class="page-header">
      <h1>Edit Records</h1>
      <p>Select a published record, edit its visible fields, and save the updated record directly.</p>
    </div>

    <div v-if="!(auth.isTapisUser || auth.isAdmin || apiMode.supportsDevOpenAccess)" class="card">
      <div class="card-body">
        <div class="empty-state compact">
          <IconLock :size="34" stroke-width="1.5" />
          <p>Sign in with the sidebar login to edit records.</p>
        </div>
      </div>
    </div>

    <div v-else class="edit-records-pane">
      <aside class="search-pane card">
        <div class="card-header">
          <span class="flex items-center gap-8">
            <IconSearch :size="18" stroke-width="1.8" />
            Find a record
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
              {{ searching ? 'Searching' : 'Search' }}
            </button>
          </div>

          <div class="filter-chips type-chips">
            <button type="button" class="chip" :class="{ active: typeFilter === 'all' }" @click="typeFilter = 'all'">All</button>
            <button type="button" class="chip" :class="{ active: typeFilter === 'model_card' }" @click="typeFilter = 'model_card'">Model Cards</button>
            <button type="button" class="chip" :class="{ active: typeFilter === 'datasheet' }" @click="typeFilter = 'datasheet'">Datasheets</button>
          </div>

          <div class="form-error" v-if="searchError">{{ searchError }}</div>

          <div class="suggestions-block">
            <div class="section-label">{{ searchQuery.trim() ? 'Matching records' : 'Suggested records' }}</div>
            <div class="record-list" v-if="filteredRecords.length">
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
              <p>No matching records.</p>
            </div>
          </div>
        </div>
      </aside>

      <section class="edit-pane card">
        <div v-if="!selectedRecord" class="card-body">
          <div class="empty-state compact">
            <IconEdit :size="34" stroke-width="1.5" />
            <p>Select a record from the list to start editing.</p>
          </div>
        </div>

        <div v-else>
          <div class="card-header edit-pane-header">
            <div class="edit-title">
              <span class="record-kind">{{ selectedRecord.kindLabel }}</span>
              <span class="edit-name">{{ selectedAssetName }}</span>
              <span v-if="currentVersion" class="version-badge">v{{ currentVersion }}</span>
              <span v-if="isDirty" class="dirty-badge" title="Unsaved changes">●</span>
            </div>
            <button class="btn btn-link" @click="tryCancel">Cancel</button>
          </div>

          <div class="card-body">
            <template v-if="selectedRecord.assetType === 'model_card'">
              <div class="form-section">
                <div class="form-section-label">Identity</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Name</label>
                    <input class="form-input" v-model="editForm.name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Metadata Version</label>
                    <input class="form-input" v-model="editForm.version" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Author</label>
                    <input class="form-input" v-model="editForm.author" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Category</label>
                    <input class="form-input" v-model="editForm.category" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-label">Description</div>
                <div class="form-group">
                  <label class="form-label">Short Description</label>
                  <textarea class="form-input form-textarea" rows="2" v-model="editForm.short_description"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Full Description</label>
                  <textarea class="form-input form-textarea" rows="4" v-model="editForm.full_description"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Keywords</label>
                  <input class="form-input" v-model="editForm.keywords" />
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-label">AI Model</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Framework</label>
                    <input class="form-input" v-model="editForm.framework" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Test Accuracy</label>
                    <input class="form-input" type="number" step="0.01" min="0" max="1" v-model="editForm.test_accuracy" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">License</label>
                    <input class="form-input" v-model="editForm.license" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Input Type</label>
                    <input class="form-input" v-model="editForm.input_type" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Input Data URL</label>
                    <input class="form-input" v-model="editForm.input_data" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Output Data URL</label>
                    <input class="form-input" v-model="editForm.output_data" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Foundational Model</label>
                    <input class="form-input" v-model="editForm.foundational_model" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Documentation URL</label>
                    <input class="form-input" v-model="editForm.documentation" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Citation</label>
                  <textarea class="form-input form-textarea" rows="2" v-model="editForm.citation"></textarea>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="form-section">
                <div class="form-section-label">Identity</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Title</label>
                    <input class="form-input" v-model="editForm.name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Metadata Version</label>
                    <input class="form-input" v-model="editForm.version" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input form-textarea" rows="4" v-model="editForm.description"></textarea>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-label">DataCite</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Resource Type</label>
                    <input class="form-input" v-model="editForm.source" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Publication Year</label>
                    <input class="form-input" v-model="editForm.publication_year" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Publisher</label>
                    <input class="form-input" v-model="editForm.publisher" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Download URL</label>
                    <input class="form-input" v-model="editForm.download_url" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Creators</label>
                    <input class="form-input" v-model="editForm.creator" placeholder="Comma-separated names" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Subjects</label>
                    <input class="form-input" v-model="editForm.features" placeholder="Comma-separated tags" />
                  </div>
                </div>
              </div>
            </template>

            <div class="form-section">
              <div class="form-section-label">Visibility</div>
              <div class="form-group">
                <label class="form-label">Visibility</label>
                <div class="filter-chips">
                  <button type="button" class="chip" :class="{ active: !editForm.is_private }" @click="editForm.is_private = false">Public</button>
                  <button type="button" class="chip" :class="{ active: editForm.is_private }" @click="editForm.is_private = true">Private</button>
                </div>
              </div>
              <div class="form-group" v-if="selectedRecord.assetType === 'model_card'">
                <label class="form-label">Access</label>
                <div class="filter-chips">
                  <button type="button" class="chip" :class="{ active: !editForm.is_gated }" @click="editForm.is_gated = false">Open</button>
                  <button type="button" class="chip" :class="{ active: editForm.is_gated }" @click="editForm.is_gated = true">Gated</button>
                </div>
              </div>
            </div>

            <div class="form-error" v-if="submitError">{{ submitError }}</div>

            <div class="action-row">
              <button class="btn btn-ghost" @click="tryCancel" :disabled="submitting">Cancel</button>
              <button class="btn btn-primary" @click="submitEdit" :disabled="submitting || !isDirty">
                {{ submitting ? 'Saving' : 'Save' }}
              </button>
              <span class="save-hint">⌘ S</span>
            </div>

            <div class="success-banner inline-success" v-if="saveResult">
              <IconCircleCheck :size="18" stroke-width="1.8" />
              <span>Saved.</span>
              <RouterLink v-if="savedRecordLink" :to="savedRecordLink" class="success-link">View record →</RouterLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { IconCircleCheck, IconEdit, IconLock, IconSearch, IconSearchOff } from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { useApiModeStore } from '../../stores/apiMode'
import {
  fetchExistingRecordDetail,
  fetchSuggestedEditableRecords,
  getRecordDisplayName,
  mapRecordDetailToEditForm,
  saveEditedRecord,
} from './api'

const auth = useAuthStore()
const apiMode = useApiModeStore()

const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const hasSearched = ref(false)
const suggestedRecords = ref([])
const typeFilter = ref('all')

const selectedRecord = ref(null)
const selectedDetail = ref(null)
const editForm = reactive({})
const originalFormJson = ref('')
const submitting = ref(false)
const submitError = ref('')
const saveResult = ref(null)

let searchTimer = null
const DEBOUNCE_MS = 350

const filteredRecords = computed(() => (
  typeFilter.value === 'all'
    ? suggestedRecords.value
    : suggestedRecords.value.filter((r) => r.assetType === typeFilter.value)
))

const selectedAssetName = computed(() => (
  selectedRecord.value && selectedDetail.value
    ? getRecordDisplayName(selectedRecord.value, selectedDetail.value)
    : ''
))

const currentVersion = computed(() => selectedDetail.value?.asset_version || null)

const isDirty = computed(() => JSON.stringify(editForm) !== originalFormJson.value)

const savedRecordLink = computed(() => {
  if (!saveResult.value || !selectedDetail.value?.uuid) return null
  return selectedRecord.value?.assetType === 'model_card'
    ? { name: 'ModelDetail', params: { uuid: selectedDetail.value.uuid } }
    : { name: 'DatasheetDetail', params: { uuid: selectedDetail.value.uuid } }
})

onMounted(() => {
  if (auth.isTapisUser || auth.isAdmin || apiMode.supportsDevOpenAccess) {
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
  if (!(auth.isTapisUser || auth.isAdmin || apiMode.supportsDevOpenAccess)) return
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

function snapshotForm() {
  originalFormJson.value = JSON.stringify(editForm)
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
  selectedRecord.value = record
  submitError.value = ''
  saveResult.value = null
  try {
    const detail = await fetchExistingRecordDetail(record)
    selectedDetail.value = detail
    const mapped = mapRecordDetailToEditForm(record, detail)
    Object.keys(editForm).forEach((key) => delete editForm[key])
    Object.assign(editForm, mapped)
    snapshotForm()
  } catch (error) {
    submitError.value = error.message || 'Could not load the selected record.'
  }
}

function tryCancel() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) return
  selectedRecord.value = null
  selectedDetail.value = null
  saveResult.value = null
  submitError.value = ''
  Object.keys(editForm).forEach((key) => delete editForm[key])
  originalFormJson.value = ''
}

async function submitEdit() {
  if (!selectedRecord.value || !selectedDetail.value) return
  submitting.value = true
  submitError.value = ''
  saveResult.value = null
  try {
    saveResult.value = await saveEditedRecord(selectedRecord.value, { ...editForm }, selectedDetail.value, auth.displayName)
    const newDetail = await fetchExistingRecordDetail({
      ...selectedRecord.value,
      assetId: saveResult.value.asset_id,
    })
    selectedDetail.value = newDetail
    selectedRecord.value = {
      ...selectedRecord.value,
      title: getRecordDisplayName(selectedRecord.value, newDetail),
    }
    Object.keys(editForm).forEach((key) => delete editForm[key])
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
}

.search-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.type-chips {
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

.form-section {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 14px;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 10px;
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
}

.version-badge {
  border-radius: 999px;
  padding: 2px 8px;
  background: var(--color-surface-2, #f3f5fb);
  color: var(--color-text-secondary);
  font-size: 0.74rem;
  font-weight: 700;
}

.dirty-badge {
  color: var(--color-warning, #d97706);
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
  border-radius: 12px;
  background: var(--color-surface);
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.record-card:hover {
  border-color: rgba(88, 108, 255, 0.4);
  transform: translateY(-1px);
}

.record-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(88, 108, 255, 0.12);
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
}

.record-card-subtitle {
  margin-top: 6px;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.record-card-description {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.save-hint {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.inline-success {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.success-link {
  margin-left: 6px;
  font-weight: 600;
}

@media (max-width: 980px) {
  .edit-records-pane {
    grid-template-columns: 1fr;
  }
}
</style>
