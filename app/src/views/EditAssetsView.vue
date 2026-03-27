<template>
  <div>
    <div class="page-header">
      <h1>Edit Existing Assets</h1>
      <p>Find a published model card or datasheet, prefill its fields, and submit an edited version for admin review.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="flex items-center gap-8">
          <IconSearch :size="18" stroke-width="1.8" />
          Asset Search
        </span>
      </div>
      <div class="card-body">
        <div class="filter-chips">
          <button type="button" class="chip" :class="{ active: assetType === 'model_card' }" @click="switchAssetType('model_card')">Model Card</button>
          <button type="button" class="chip" :class="{ active: assetType === 'datasheet' }" @click="switchAssetType('datasheet')">Datasheet</button>
        </div>

        <div class="search-row">
          <input
            class="form-input"
            v-model="searchQuery"
            :placeholder="assetType === 'model_card' ? 'Search model cards by name or author' : 'Search datasheets by title or creator'"
            @keydown.enter="runSearch"
          />
          <button class="btn btn-primary" @click="runSearch" :disabled="searching || !searchQuery.trim()">
            {{ searching ? 'Searching…' : 'Search' }}
          </button>
        </div>

        <div class="form-error" v-if="searchError">{{ searchError }}</div>

        <div class="results-list" v-if="results.length">
          <button
            v-for="result in results"
            :key="result.mc_id || result.identifier"
            class="result-item"
            :class="{ active: selectedAssetId === normalizeResultId(result) }"
            @click="selectAsset(result)"
          >
            <div class="result-title">{{ normalizeResultTitle(result) }}</div>
            <div class="result-meta">
              <span>Version {{ result.asset_version || 1 }}</span>
              <span v-if="assetType === 'model_card' && result.author">{{ result.author }}</span>
              <span v-if="assetType === 'datasheet' && result.creator">{{ result.creator }}</span>
            </div>
          </button>
        </div>

        <div class="empty-state compact" v-else-if="hasSearched">
          <IconSearchOff :size="32" stroke-width="1.4" />
          <p>No matching assets were found.</p>
        </div>
      </div>
    </div>

    <div class="card" v-if="selectedDetail">
      <div class="card-header">
        <span class="flex items-center gap-8">
          <IconEdit :size="18" stroke-width="1.8" />
          Edit Draft
        </span>
      </div>
      <div class="card-body">
        <div class="version-banner">
          <div>
            Editing <strong>{{ selectedAssetName }}</strong>
          </div>
          <div>
            Current version <strong>{{ currentAssetVersion }}</strong> → pending version <strong>{{ nextAssetVersion }}</strong>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Your Name <span class="required">*</span></label>
            <input class="form-input" v-model="submittedBy" placeholder="e.g. Alice Chen" />
          </div>
          <div class="form-group">
            <label class="form-label">Edit Notes</label>
            <input class="form-input" v-model="editNotes" placeholder="Optional summary for reviewers" />
          </div>
        </div>

        <template v-if="assetType === 'model_card'">
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

        <div class="form-error" v-if="submitError">{{ submitError }}</div>
        <div class="action-row">
          <button class="btn btn-primary" @click="submitEdit" :disabled="submitting || !submittedBy.trim()">
            {{ submitting ? 'Submitting…' : 'Submit Edited Version for Review' }}
          </button>
        </div>

        <div class="success-banner inline-success" v-if="submissionResult">
          <IconCircleCheck :size="18" stroke-width="1.8" />
          <span>
            Submission {{ submissionResult.id }} queued for review. If approved, this will become version {{ nextAssetVersion }} linked to the current asset.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { IconCircleCheck, IconEdit, IconSearch, IconSearchOff } from '@tabler/icons-vue'
import { useSubmissionsStore } from '../stores/submissions'
import { buildEditSubmissionData, fetchExistingAssetDetail, getDisplayName, mapAssetDetailToEditForm, searchExistingAssets } from '../lib/assetEditing'

const submissions = useSubmissionsStore()

const assetType = ref('model_card')
const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const hasSearched = ref(false)
const results = ref([])

const selectedAssetId = ref(null)
const selectedDetail = ref(null)
const editForm = reactive({})
const submittedBy = ref('')
const editNotes = ref('')
const submitting = ref(false)
const submitError = ref('')
const submissionResult = ref(null)

const selectedAssetName = computed(() => (selectedDetail.value ? getDisplayName(assetType.value, selectedDetail.value) : ''))
const currentAssetVersion = computed(() => selectedDetail.value?.asset_version || 1)
const nextAssetVersion = computed(() => currentAssetVersion.value + 1)

function switchAssetType(nextType) {
  assetType.value = nextType
  results.value = []
  selectedAssetId.value = null
  selectedDetail.value = null
  hasSearched.value = false
  searchError.value = ''
  submitError.value = ''
  submissionResult.value = null
  Object.keys(editForm).forEach((key) => delete editForm[key])
}

function normalizeResultId(result) {
  return assetType.value === 'model_card' ? result.mc_id : result.identifier
}

function normalizeResultTitle(result) {
  return assetType.value === 'model_card' ? result.name : result.title
}

async function runSearch() {
  searching.value = true
  searchError.value = ''
  hasSearched.value = true
  results.value = []
  selectedAssetId.value = null
  selectedDetail.value = null
  submissionResult.value = null
  try {
    results.value = await searchExistingAssets(assetType.value, searchQuery.value)
  } catch (error) {
    searchError.value = error.message || 'Search failed.'
  } finally {
    searching.value = false
  }
}

async function selectAsset(result) {
  selectedAssetId.value = normalizeResultId(result)
  submitError.value = ''
  submissionResult.value = null
  try {
    const detail = await fetchExistingAssetDetail(assetType.value, selectedAssetId.value)
    selectedDetail.value = detail
    const mapped = mapAssetDetailToEditForm(assetType.value, detail)
    Object.keys(editForm).forEach((key) => delete editForm[key])
    Object.assign(editForm, mapped)
  } catch (error) {
    submitError.value = error.message || 'Could not load the selected asset.'
  }
}

async function submitEdit() {
  if (!selectedDetail.value) return
  submitting.value = true
  submitError.value = ''
  submissionResult.value = null
  try {
    const payload = buildEditSubmissionData(assetType.value, { ...editForm }, selectedDetail.value, editNotes.value)
    const result = await submissions.createSubmission(assetType.value, payload, submittedBy.value.trim())
    if (!result) {
      throw new Error(submissions.error || 'Submission failed.')
    }
    submissionResult.value = result
  } catch (error) {
    submitError.value = error.message || 'Submission failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.results-list {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.result-item {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
}

.result-item.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(88, 108, 255, 0.12);
}

.result-title {
  font-weight: 600;
  color: var(--color-text);
}

.result-meta {
  margin-top: 4px;
  display: flex;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.version-banner {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.action-row {
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
}

.compact {
  padding: 24px 0 8px;
}

.inline-success {
  margin-top: 16px;
}
</style>
