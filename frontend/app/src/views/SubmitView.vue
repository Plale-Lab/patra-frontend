<template>
  <div>
    <div class="page-header">
      <h1>Submit to Knowledge Base</h1>
      <p>Submit a model card or datasheet for admin review</p>
    </div>

    <div class="success-banner" v-if="submissionResult">
      <IconCircleCheck :size="20" stroke-width="1.8" />
      <div v-if="submissionResult.kind === 'single'">
        <strong>Submission received!</strong> Your {{ activeTab === 'model_card' ? 'model card' : 'datasheet' }} has been submitted for review. An admin will review it shortly.
      </div>
      <div v-else>
        <strong>Bulk submission completed.</strong>
        <span>
          Submitted {{ submissionResult.successCount }} of {{ submissionResult.totalCount }} asset links for review.
        </span>
        <span v-if="submissionResult.failureCount > 0" class="bulk-summary-warning">
          {{ submissionResult.failureCount }} link{{ submissionResult.failureCount === 1 ? '' : 's' }} failed validation or submission.
        </span>
      </div>
      <button class="btn btn-outline btn-sm" @click="resetForm">Submit Another</button>
    </div>

    <template v-else>
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'model_card' }" @click="switchType('model_card')">
          <IconCube :size="16" stroke-width="1.8" /> Model Card
        </button>
        <button class="tab" :class="{ active: activeTab === 'datasheet' }" @click="switchType('datasheet')">
          <IconTable :size="16" stroke-width="1.8" /> Datasheet
        </button>
      </div>

      <div class="submit-layout">
        <div class="card submit-form">
          <div class="card-header">
            <div class="submit-header-content">
              <span class="flex items-center gap-8">
                <component :is="activeTab === 'model_card' ? IconCube : IconTable" :size="18" stroke-width="1.8" />
                {{ activeTab === 'model_card' ? 'Model Card Submission' : 'Datasheet Submission' }}
              </span>
              <div class="submission-modes">
                <button class="mode-pill" :class="{ active: submitMode === 'manual' }" @click="switchMode('manual')">Manual Entry</button>
                <button class="mode-pill" :class="{ active: submitMode === 'asset_link' }" @click="switchMode('asset_link')">From Asset Link</button>
                <button class="mode-pill" :class="{ active: submitMode === 'bulk_asset_links' }" @click="switchMode('bulk_asset_links')">Bulk Asset Links</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="intake-prompt" v-if="submitMode !== 'manual'">
              <div class="intake-prompt-title">ICICLE Intake</div>
              <p>{{ assetIntakePrompt }}</p>
            </div>

            <div class="form-group" v-if="submitMode !== 'manual'">
              <label class="form-label">Your Name <span class="required">*</span></label>
              <input class="form-input" v-model="submittedBy" placeholder="e.g. Alice Chen" />
            </div>

            <div class="form-error" v-if="validationError">
              {{ validationError }}
            </div>

            <template v-if="submitMode === 'manual'">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Your Name <span class="required">*</span></label>
                  <input class="form-input" v-model="submittedBy" placeholder="e.g. Alice Chen" />
                </div>
                <div class="form-group">
                  <label class="form-label">Name <span class="required">*</span></label>
                  <input
                    class="form-input"
                    v-model="currentForm.name"
                    :placeholder="activeTab === 'model_card' ? 'e.g. ResNet-50 Classifier' : 'e.g. UCI Adult Dataset'"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Version <span class="required">*</span></label>
                  <input class="form-input" v-model="currentForm.version" placeholder="e.g. 1.0" />
                </div>
                <div class="form-group">
                  <label class="form-label">License</label>
                  <input class="form-input" v-model="currentForm.license" placeholder="e.g. BSD-3 Clause, CC BY 4.0" />
                </div>
              </div>

              <template v-if="activeTab === 'model_card'">
                <div class="form-group">
                  <label class="form-label">Short Description <span class="required">*</span></label>
                  <textarea
                    class="form-input form-textarea"
                    v-model="modelForm.shortDescription"
                    rows="2"
                    placeholder="Brief summary of the model"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Full Description</label>
                  <textarea
                    class="form-input form-textarea"
                    v-model="modelForm.fullDescription"
                    rows="4"
                    placeholder="Longer description of the model card"
                  ></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" v-model="modelForm.category">
                      <option value="">Select category</option>
                      <option value="classification">Classification</option>
                      <option value="regression">Regression</option>
                      <option value="natural language processing">Natural Language Processing</option>
                      <option value="computer vision">Computer Vision</option>
                      <option value="graph learning">Graph Learning</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Input Type</label>
                    <select class="form-input" v-model="modelForm.inputType">
                      <option value="">Select input type</option>
                      <option>Tabular</option>
                      <option>Text</option>
                      <option>Images</option>
                      <option>Audio</option>
                      <option>Video</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Framework</label>
                    <select class="form-input" v-model="modelForm.framework">
                      <option value="">Select framework</option>
                      <option>tensorflow</option>
                      <option>pytorch</option>
                      <option>scikit-learn</option>
                      <option>keras</option>
                      <option>other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Test Accuracy</label>
                    <input
                      class="form-input"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      v-model.number="modelForm.testAccuracy"
                      placeholder="0.00 – 1.00"
                    />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Input Data URL</label>
                    <input class="form-input" v-model="modelForm.inputData" placeholder="https://..." />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Output Data URL</label>
                    <input class="form-input" v-model="modelForm.outputData" placeholder="https://..." />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Keywords</label>
                  <input class="form-input" v-model="modelForm.keywords" placeholder="Comma-separated keywords" />
                </div>
                <div class="form-group">
                  <label class="form-label">Visibility</label>
                  <div class="filter-chips">
                    <button type="button" class="chip" :class="{ active: !modelForm.isPrivate }" @click="modelForm.isPrivate = false">Public</button>
                    <button type="button" class="chip" :class="{ active: modelForm.isPrivate }" @click="modelForm.isPrivate = true">Private</button>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="form-group">
                  <label class="form-label">Description <span class="required">*</span></label>
                  <textarea
                    class="form-input form-textarea"
                    v-model="datasheetForm.description"
                    rows="3"
                    placeholder="Describe the dataset"
                  ></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Source</label>
                    <input class="form-input" v-model="datasheetForm.source" placeholder="e.g. UCI Repository, Kaggle" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Datapoints</label>
                    <input class="form-input" type="number" v-model.number="datasheetForm.datapoints" placeholder="e.g. 50000" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Publisher</label>
                    <input class="form-input" v-model="datasheetForm.publisher" placeholder="e.g. Indiana University" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Publication Year</label>
                    <input class="form-input" v-model="datasheetForm.publicationYear" placeholder="e.g. 2026" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Creators</label>
                  <input class="form-input" v-model="datasheetForm.creators" placeholder="Comma-separated creator names" />
                </div>
                <div class="form-group">
                  <label class="form-label">Features</label>
                  <input class="form-input" v-model="datasheetForm.features" placeholder="Comma-separated feature names" />
                </div>
                <div class="form-group">
                  <label class="form-label">Download URL</label>
                  <input class="form-input" v-model="datasheetForm.downloadUrl" placeholder="https://..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Visibility</label>
                  <div class="filter-chips">
                    <button type="button" class="chip" :class="{ active: !datasheetForm.isPrivate }" @click="datasheetForm.isPrivate = false">Public</button>
                    <button type="button" class="chip" :class="{ active: datasheetForm.isPrivate }" @click="datasheetForm.isPrivate = true">Private</button>
                  </div>
                </div>
              </template>
            </template>

            <template v-else-if="submitMode === 'asset_link'">
              <div class="form-group">
                <label class="form-label">Asset URL <span class="required">*</span></label>
                <input class="form-input" v-model="currentAssetLinkForm.assetUrl" placeholder="https://huggingface.co/..." />
              </div>
              <div class="form-group">
                <label class="form-label">Optional Display Name</label>
                <input class="form-input" v-model="currentAssetLinkForm.displayName" placeholder="Optional title shown to reviewers" />
              </div>
              <div class="form-group">
                <label class="form-label">Optional Notes</label>
                <textarea
                  class="form-input form-textarea"
                  v-model="currentAssetLinkForm.notes"
                  rows="3"
                  placeholder="Add any context for the ICICLE team"
                ></textarea>
              </div>
            </template>

            <template v-else>
              <div class="form-group">
                <label class="form-label">Asset Links <span class="required">*</span></label>
                <textarea
                  class="form-input bulk-links-input"
                  v-model="currentBulkForm.urls"
                  rows="8"
                  placeholder="Paste one asset link per line"
                ></textarea>
                <div class="form-helper">One URL per line. Duplicate links will be removed before submission.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Optional Batch Notes</label>
                <textarea
                  class="form-input form-textarea"
                  v-model="currentBulkForm.notes"
                  rows="3"
                  placeholder="Shared notes for all submitted asset links"
                ></textarea>
              </div>
              <div class="invalid-list" v-if="invalidAssetLines.length > 0">
                <div class="invalid-list-title">Invalid asset links</div>
                <ul>
                  <li v-for="item in invalidAssetLines" :key="item.line">
                    Line {{ item.line }}: {{ item.value }}
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </div>

        <div class="submit-info">
          <div class="card">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconInfoCircle :size="18" stroke-width="1.8" /> How it works</span>
            </div>
            <div class="card-body">
              <div class="info-step" v-for="(step, i) in steps" :key="`${submitMode}-${i}`">
                <div class="step-number">{{ i + 1 }}</div>
                <div>
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-desc">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card" v-if="submissionResult && submissionResult.failureCount > 0">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconAlertTriangle :size="18" stroke-width="1.8" /> Failed Links</span>
            </div>
            <div class="card-body">
              <ul class="failed-links-list">
                <li v-for="failure in submissionResult.failures" :key="failure.url">
                  <strong>{{ failure.url }}</strong>
                  <span>{{ failure.error }}</span>
                </li>
              </ul>
            </div>
          </div>

          <button class="btn btn-primary btn-submit" :disabled="!canSubmit || store.loading" @click="handleSubmit">
            <IconSend :size="16" stroke-width="1.8" />
            {{ store.loading ? 'Submitting…' : submitButtonLabel }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useSubmissionsStore } from '../stores/submissions'
import { useAuthStore } from '../stores/auth'
import {
  ASSET_INTAKE_PROMPT,
  buildAssetIntakeData,
  parseAssetInput,
} from '../lib/assetIntake'
import {
  IconCube,
  IconTable,
  IconInfoCircle,
  IconSend,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-vue'

const store = useSubmissionsStore()
const auth = useAuthStore()
const activeTab = ref('model_card')
const submitMode = ref('manual')
const submittedBy = ref(auth.isLoggedIn ? auth.displayName : '')
const submissionResult = ref(null)
const validationError = ref('')

const modelForm = reactive(createModelForm())
const datasheetForm = reactive(createDatasheetForm())
const assetLinkForms = reactive(createAssetLinkForms())
const bulkForms = reactive(createBulkForms())

const currentForm = computed(() => (activeTab.value === 'model_card' ? modelForm : datasheetForm))
const currentAssetLinkForm = computed(() => assetLinkForms[activeTab.value])
const currentBulkForm = computed(() => bulkForms[activeTab.value])
const assetIntakePrompt = ASSET_INTAKE_PROMPT

const manualSteps = [
  { title: 'Fill the form', desc: 'Provide details about your model or dataset.' },
  { title: 'Submit for review', desc: 'Your submission enters a review queue.' },
  { title: 'Admin reviews', desc: 'An admin will approve or request changes.' },
  { title: 'Published', desc: 'Once approved, it appears in the Knowledge Base.' },
]

const assetSteps = [
  { title: 'Paste the asset link', desc: 'Provide the existing model or dataset URL you want added to ICICLE.' },
  { title: 'Queue a draft submission', desc: 'The system creates a pending intake entry with limited automated metadata.' },
  { title: 'ICICLE team completes details', desc: 'Reviewers use the link and your notes to finish the manual input.' },
  { title: 'Admin approves the entry', desc: 'Once reviewed, it can be published into the ecosystem.' },
]

const steps = computed(() => (submitMode.value === 'manual' ? manualSteps : assetSteps))

const submitButtonLabel = computed(() => {
  if (submitMode.value === 'manual') return 'Submit for Review'
  if (submitMode.value === 'asset_link') return 'Create Draft Submission'
  return 'Submit Asset Links'
})

const invalidAssetLines = computed(() => {
  if (submitMode.value !== 'bulk_asset_links') return []

  return parseBulkLines(currentBulkForm.value.urls)
    .filter((item) => !item.parsed)
    .map(({ line, value }) => ({ line, value }))
})

const canSubmit = computed(() => {
  if (!submittedBy.value.trim()) return false

  if (submitMode.value === 'manual') {
    if (!currentForm.value.name || !currentForm.value.version) return false
    if (activeTab.value === 'model_card' && !modelForm.shortDescription) return false
    if (activeTab.value === 'datasheet' && !datasheetForm.description) return false
    return true
  }

  if (submitMode.value === 'asset_link') {
    return !!currentAssetLinkForm.value.assetUrl.trim()
  }

  return !!currentBulkForm.value.urls.trim()
})

async function handleSubmit() {
  validationError.value = ''

  if (submitMode.value === 'manual') {
    await submitManualEntry()
    return
  }

  if (submitMode.value === 'asset_link') {
    await submitAssetLink()
    return
  }

  await submitBulkAssetLinks()
}

async function submitManualEntry() {
  const payload =
    activeTab.value === 'model_card'
      ? {
          name: modelForm.name,
          version: modelForm.version,
          author: submittedBy.value,
          short_description: modelForm.shortDescription,
          full_description: modelForm.fullDescription,
          category: modelForm.category,
          input_type: modelForm.inputType,
          input_data: modelForm.inputData,
          output_data: modelForm.outputData,
          framework: modelForm.framework,
          test_accuracy: modelForm.testAccuracy || 0,
          keywords: modelForm.keywords,
          is_private: modelForm.isPrivate,
          license: modelForm.license,
        }
      : {
          name: datasheetForm.name,
          version: datasheetForm.version,
          description: datasheetForm.description,
          source: datasheetForm.source,
          datapoints: datasheetForm.datapoints || 0,
          license: datasheetForm.license,
          publisher: datasheetForm.publisher,
          publication_year: datasheetForm.publicationYear,
          creator: splitList(datasheetForm.creators),
          features: splitList(datasheetForm.features),
          download_url: datasheetForm.downloadUrl,
          is_private: datasheetForm.isPrivate,
        }

  const result = await store.createSubmission(activeTab.value, payload, submittedBy.value)

  if (result) {
    submissionResult.value = {
      kind: 'single',
      successCount: 1,
      failureCount: 0,
      totalCount: 1,
      failures: [],
    }
  }
}

async function submitAssetLink() {
  const payload = buildSafeAssetPayload({
    assetUrl: currentAssetLinkForm.value.assetUrl,
    displayName: currentAssetLinkForm.value.displayName,
    notes: currentAssetLinkForm.value.notes,
  })

  if (!payload) return

  const result = await store.createSubmission(activeTab.value, payload, submittedBy.value)

  if (result) {
    submissionResult.value = {
      kind: 'single',
      successCount: 1,
      failureCount: 0,
      totalCount: 1,
      failures: [],
    }
  }
}

async function submitBulkAssetLinks() {
  const parsedLines = parseBulkLines(currentBulkForm.value.urls)
  const invalidLines = parsedLines.filter((item) => !item.parsed)

  if (invalidLines.length > 0) {
    validationError.value = 'Fix the invalid asset links before submitting the batch.'
    return
  }

  const uniqueUrls = [...new Set(parsedLines.map((item) => item.parsed.normalized))]

  if (uniqueUrls.length === 0) {
    validationError.value = 'Add at least one asset link to submit.'
    return
  }

  const result = await store.createBulkSubmissions(
    activeTab.value,
    uniqueUrls,
    submittedBy.value,
    currentBulkForm.value.notes,
  )

  if (!result) return

  submissionResult.value = {
    kind: 'bulk',
    totalCount: uniqueUrls.length,
    successCount: result.successes.length,
    failureCount: result.failures.length,
    failures: result.failures,
  }
}

function buildSafeAssetPayload(fields) {
  try {
    return buildAssetIntakeData(fields)
  } catch (error) {
    validationError.value = error.message
    return null
  }
}

function switchType(type) {
  activeTab.value = type
  clearTransientState()
}

function switchMode(mode) {
  submitMode.value = mode
  clearTransientState()
}

function clearTransientState() {
  submissionResult.value = null
  validationError.value = ''
}

function resetForm() {
  submittedBy.value = auth.isLoggedIn ? auth.displayName : ''
  activeTab.value = 'model_card'
  submitMode.value = 'manual'
  submissionResult.value = null
  validationError.value = ''
  Object.assign(modelForm, createModelForm())
  Object.assign(datasheetForm, createDatasheetForm())
  Object.assign(assetLinkForms.model_card, createSingleAssetForm())
  Object.assign(assetLinkForms.datasheet, createSingleAssetForm())
  Object.assign(bulkForms.model_card, createBulkAssetForm())
  Object.assign(bulkForms.datasheet, createBulkAssetForm())
}

watch(() => auth.displayName, (nextName, previousName) => {
  if (!submittedBy.value.trim() || submittedBy.value === previousName) {
    submittedBy.value = auth.isLoggedIn ? nextName : ''
  }
})

function createModelForm() {
  return {
    name: '',
    version: '',
    license: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    inputType: '',
    inputData: '',
    outputData: '',
    framework: '',
    testAccuracy: null,
    keywords: '',
    isPrivate: false,
  }
}

function createDatasheetForm() {
  return {
    name: '',
    version: '',
    license: '',
    description: '',
    source: '',
    datapoints: null,
    publisher: '',
    publicationYear: '',
    creators: '',
    features: '',
    downloadUrl: '',
    isPrivate: false,
  }
}

function createSingleAssetForm() {
  return {
    assetUrl: '',
    displayName: '',
    notes: '',
  }
}

function createBulkAssetForm() {
  return {
    urls: '',
    notes: '',
  }
}

function createAssetLinkForms() {
  return {
    model_card: createSingleAssetForm(),
    datasheet: createSingleAssetForm(),
  }
}

function createBulkForms() {
  return {
    model_card: createBulkAssetForm(),
    datasheet: createBulkAssetForm(),
  }
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseBulkLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item, index) => ({
      line: index + 1,
      value: item.trim(),
    }))
    .filter((item) => item.value)
    .map((item) => ({
      ...item,
      parsed: parseAssetInput(item.value),
    }))
}
</script>

<style scoped>
.submit-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.submit-form { flex: 1; }

.submit-info {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--header-height) + 28px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.submit-header-content {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.submission-modes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-pill {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.mode-pill.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.intake-prompt {
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.intake-prompt-title {
  font-size: .76rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 6px;
}

.intake-prompt p {
  margin: 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.bulk-links-input {
  min-height: 180px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.form-helper {
  margin-top: 8px;
  font-size: .78rem;
  color: var(--color-text-muted);
}

.form-error {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-size: .84rem;
}

.invalid-list {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.invalid-list-title {
  font-size: .78rem;
  font-weight: 700;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.invalid-list ul {
  margin: 0;
  padding-left: 18px;
}

.required { color: var(--color-danger); }

.info-step {
  display: flex;
  gap: 12px;
  padding: 10px 0;
}

.info-step + .info-step { border-top: 1px solid var(--color-border); }

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 700;
  font-size: .82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-title { font-weight: 600; font-size: .88rem; }
.step-desc { font-size: .78rem; color: var(--color-text-muted); margin-top: 2px; }

.btn-submit {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: .95rem;
}

.btn-submit:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.success-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px;
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success);
  border-radius: var(--radius);
  font-size: .92rem;
}

.success-banner strong { display: block; margin-bottom: 2px; }

.bulk-summary-warning {
  display: block;
  margin-top: 4px;
}

.failed-links-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.failed-links-list li {
  color: var(--color-text-secondary);
}

.failed-links-list span {
  display: block;
  font-size: .8rem;
  color: var(--color-text-muted);
}

.filter-chips { display: flex; gap: 6px; }

@media (max-width: 1080px) {
  .submit-layout {
    flex-direction: column;
  }

  .submit-info {
    width: 100%;
    position: static;
  }

  .submit-header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
