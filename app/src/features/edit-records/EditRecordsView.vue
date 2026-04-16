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

    <template v-else>
      <div class="card">
        <div class="card-header">
          <span class="flex items-center gap-8">
            <IconSearch :size="18" stroke-width="1.8" />
            Record Search
          </span>
        </div>
        <div class="card-body">
          <div class="toolbar-row">
            <div class="search-help">
              Search across model cards and datasheets by record name, author or creator, description, and related metadata.
            </div>
            <div class="session-badge">
              Signed in as <strong>{{ auth.displayName }}</strong>
            </div>
          </div>

          <div class="search-row">
            <input
              class="form-input"
              v-model="searchQuery"
              placeholder="Type any metadata, record name, author, creator, title, or keyword"
            />
            <button class="btn btn-primary" @click="runSearchNow" :disabled="searching">
              {{ searching ? 'Searching...' : 'Search' }}
            </button>
          </div>

          <div class="helper-row">
            <span class="helper-pill">Unified search</span>
            <span class="helper-pill">Model cards + datasheets</span>
            <span class="helper-text">Suggestions refresh automatically after a short typing pause.</span>
          </div>

          <div class="form-error" v-if="searchError">{{ searchError }}</div>

          <div class="suggestions-block">
            <div class="section-label">{{ searchQuery.trim() ? 'Matching records' : 'Suggested records' }}</div>
            <div class="record-grid" v-if="suggestedRecords.length">
              <button
                v-for="record in suggestedRecords"
                :key="recordKey(record)"
                class="record-card"
                :class="{ active: isSelected(record) }"
                @click="selectRecord(record)"
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
              <p>No matching records were found.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card" v-if="selectedDetail && selectedRecord">
        <div class="card-header">
          <span class="flex items-center gap-8">
            <IconEdit :size="18" stroke-width="1.8" />
            Edit Record
          </span>
        </div>
        <div class="card-body">
          <div class="section-label selected-label">
            Editing record: {{ selectedAssetName }}
            <span class="selected-kind">{{ selectedRecord.kindLabel }}</span>
          </div>

          <template v-if="selectedRecord.assetType === 'model_card'">
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

            <div class="form-group">
              <label class="form-label">Short Description</label>
              <textarea class="form-input form-textarea" rows="2" v-model="editForm.short_description"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Full Description</label>
              <textarea class="form-input form-textarea" rows="4" v-model="editForm.full_description"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <input class="form-input" v-model="editForm.category" />
              </div>
              <div class="form-group">
                <label class="form-label">Input Type</label>
                <input class="form-input" v-model="editForm.input_type" />
              </div>
            </div>

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
                <label class="form-label">License</label>
                <input class="form-input" v-model="editForm.license" />
              </div>
              <div class="form-group">
                <label class="form-label">Keywords</label>
                <input class="form-input" v-model="editForm.keywords" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Author</label>
                <input class="form-input" v-model="editForm.author" />
              </div>
              <div class="form-group">
                <label class="form-label">Foundational Model</label>
                <input class="form-input" v-model="editForm.foundational_model" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Citation</label>
              <textarea class="form-input form-textarea" rows="2" v-model="editForm.citation"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Documentation URL</label>
              <input class="form-input" v-model="editForm.documentation" />
            </div>
          </template>

          <template v-else>
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

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Source</label>
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
                <input class="form-input" v-model="editForm.creator" />
              </div>
              <div class="form-group">
                <label class="form-label">Features</label>
                <input class="form-input" v-model="editForm.features" />
              </div>
            </div>
          </template>

          <div class="form-group">
            <label class="form-label">Visibility</label>
            <div class="filter-chips">
              <button type="button" class="chip" :class="{ active: !editForm.is_private }" @click="editForm.is_private = false">Public</button>
              <button type="button" class="chip" :class="{ active: editForm.is_private }" @click="editForm.is_private = true">Private</button>
            </div>
          </div>

          <div class="form-group" v-if="selectedRecord?.assetType === 'model_card'">
            <label class="form-label">Access</label>
            <div class="filter-chips">
              <button type="button" class="chip" :class="{ active: !editForm.is_gated }" @click="editForm.is_gated = false">Open</button>
              <button type="button" class="chip" :class="{ active: editForm.is_gated }" @click="editForm.is_gated = true">Gated</button>
            </div>
          </div>

          <div class="form-error" v-if="submitError">{{ submitError }}</div>

          <div class="action-row">
            <button class="btn btn-primary" @click="submitEdit" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save' }}
            </button>
          </div>

          <div class="success-banner inline-success" v-if="saveResult">
            <IconCircleCheck :size="18" stroke-width="1.8" />
            <span>Record saved successfully.</span>
          </div>
        </div>
      </div>

      <div class="card" v-if="selectedRecord && changeLog.length">
        <div class="card-header">
          <span class="flex items-center gap-8">Recent Changes</span>
        </div>
        <div class="card-body">
          <div class="changelog-list">
            <div class="changelog-item" v-for="entry in changeLog" :key="entry.id">
              <div class="changelog-meta">
                <div class="changelog-actor">
                  <span class="changelog-user">{{ entry.changed_by || 'unknown user' }}</span>
                  <span class="changelog-dot"></span>
                  <span class="changelog-time">{{ formatTimestamp(entry.changed_at) }}</span>
                </div>
                <span class="changelog-count">{{ changeCountLabel(entry) }}</span>
              </div>
              <div class="changelog-code">
                <div class="changelog-line" v-for="change in entry.changes" :key="`${entry.id}-${change.field}`">
                  <span class="changelog-field">{{ formatFieldName(change.field) }}</span>
                  <span class="changelog-arrow">-></span>
                  <span class="changelog-values">{{ formatChangeValues(change.before, change.after) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { IconCircleCheck, IconEdit, IconLock, IconSearch, IconSearchOff } from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { useApiModeStore } from '../../stores/apiMode'
import {
  fetchExistingRecordDetail,
  fetchRecordChangeLog,
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

const selectedRecord = ref(null)
const selectedDetail = ref(null)
const changeLog = ref([])
const editForm = reactive({})
const submitting = ref(false)
const submitError = ref('')
const saveResult = ref(null)

let searchTimer = null
const DEBOUNCE_MS = 350

const selectedAssetName = computed(() => (
  selectedRecord.value && selectedDetail.value
    ? getRecordDisplayName(selectedRecord.value, selectedDetail.value)
    : ''
))

onMounted(() => {
  if (auth.isTapisUser || auth.isAdmin || apiMode.supportsDevOpenAccess) {
    loadSuggestions()
  }
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})

watch(searchQuery, () => {
  if (!(auth.isTapisUser || auth.isAdmin || apiMode.supportsDevOpenAccess)) return
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    runSearch()
  }, DEBOUNCE_MS)
})

function recordKey(record) {
  return `${record.assetType}:${record.assetId}`
}

function isSelected(record) {
  return selectedRecord.value && recordKey(selectedRecord.value) === recordKey(record)
}

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function formatFieldName(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatChangeValues(before, after) {
  return `${formatValue(before)} -> ${formatValue(after)}`
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'null'
  }
  return JSON.stringify(value)
}

function changeCountLabel(entry) {
  const count = Array.isArray(entry?.changes) ? entry.changes.length : 0
  return count === 1 ? '1 field updated' : `${count} fields updated`
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
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  await runSearch()
}

async function selectRecord(record) {
  selectedRecord.value = record
  submitError.value = ''
  saveResult.value = null
  try {
    const detail = await fetchExistingRecordDetail(record)
    selectedDetail.value = detail
    changeLog.value = await fetchRecordChangeLog(record)
    const mapped = mapRecordDetailToEditForm(record, detail)
    Object.keys(editForm).forEach((key) => delete editForm[key])
    Object.assign(editForm, mapped)
  } catch (error) {
    submitError.value = error.message || 'Could not load the selected record.'
  }
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
    changeLog.value = await fetchRecordChangeLog(selectedRecord.value)
    Object.keys(editForm).forEach((key) => delete editForm[key])
    Object.assign(editForm, mapRecordDetailToEditForm(selectedRecord.value, newDetail))
    await loadSuggestions(searchQuery.value)
  } catch (error) {
    submitError.value = error.message || 'Save failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-help {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  max-width: 760px;
}

.session-badge {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  background: var(--color-primary-bg);
  border: 1px solid rgba(88, 108, 255, 0.18);
  border-radius: 999px;
  padding: 8px 12px;
}

.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.helper-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.helper-pill {
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--color-surface-2, #f3f5fb);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.helper-text {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.section-label {
  margin-top: 18px;
  margin-bottom: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.selected-label {
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.selected-kind,
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

.record-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.record-card {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  min-height: 138px;
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
  margin-bottom: 10px;
}

.record-card-title {
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.35;
}

.record-card-subtitle {
  margin-top: 8px;
  font-size: 0.86rem;
  color: var(--color-text-secondary);
}

.record-card-description {
  margin-top: 10px;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.changelog-list {
  display: grid;
  gap: 14px;
}

.changelog-item {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(246, 248, 252, 0.95), #ffffff);
}

.changelog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.changelog-actor {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.changelog-user {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(88, 108, 255, 0.1);
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
}

.changelog-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-text-muted);
  opacity: 0.6;
}

.changelog-time {
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.changelog-count {
  font-size: 0.76rem;
  color: var(--color-text-muted);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.changelog-code {
  display: grid;
  gap: 8px;
}

.changelog-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  border-radius: 10px;
  background: rgba(18, 25, 38, 0.03);
  padding: 9px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.82rem;
  color: #24324a;
}

.changelog-field {
  font-weight: 700;
  color: #24408e;
}

.changelog-arrow {
  color: var(--color-text-muted);
  font-weight: 700;
}

.changelog-values {
  color: var(--color-text);
}

.inline-success {
  margin-top: 16px;
}

@media (max-width: 720px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
