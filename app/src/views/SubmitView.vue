<template>
  <div>
    <div class="page-header">
      <h1>Submit to Knowledge Base</h1>
      <p>{{ pageSubtitle }}</p>
    </div>

    <div v-if="apiMode.supportsAskPatra" class="ask-patra-callout">
      <div>
        <div class="ask-patra-callout-title">Start in Ask Patra</div>
        <div class="ask-patra-callout-text">
          Use Ask Patra if you want help choosing between manual entry, record-link intake, or automated ingestion before submitting.
        </div>
      </div>
      <RouterLink
        :to="{ path: '/ask-patra', query: { prompt: 'Help me decide how to submit this record.' } }"
        class="btn btn-outline"
      >
        Open Ask Patra
      </RouterLink>
    </div>

    <div class="success-banner" v-if="submissionResult">
      <IconCircleCheck :size="20" stroke-width="1.8" />
      <div v-if="submissionResult.kind === 'single' && submissionResult.directRecord">
        <strong>Record saved.</strong>
        {{ submissionResult.duplicate ? 'This matched an existing catalog record.' : 'Your record was created in the catalog.' }}
        <span v-if="submissionResult.recordId != null"> Record id: {{ submissionResult.recordId }}.</span>
      </div>
      <div v-else-if="submissionResult.kind === 'single'">
        <strong>Submission queued.</strong> Your {{ activeTab === 'model_card' ? 'model card' : 'datasheet' }} is now waiting for admin review.
      </div>
      <div v-else>
        <strong>Bulk submission queued.</strong>
        <span>
          Queued {{ submissionResult.successCount }} of {{ submissionResult.totalCount }} record links for admin review.
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
                <button class="mode-pill" :class="{ active: submitMode === 'asset_link' }" @click="switchMode('asset_link')">From Record Link</button>
                <button class="mode-pill" :class="{ active: submitMode === 'bulk_asset_links' }" @click="switchMode('bulk_asset_links')">Bulk Record Links</button>
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

            <div class="form-error" v-if="formErrorMessage">
              {{ formErrorMessage }}
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
                <label class="form-label">Record URL <span class="required">*</span></label>
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
                <label class="form-label">Record links <span class="required">*</span></label>
                <textarea
                  class="form-input bulk-links-input"
                  v-model="currentBulkForm.urls"
                  rows="8"
                  placeholder="Paste one record link per line"
                ></textarea>
                <div class="form-helper">One URL per line. Duplicate links will be removed before submission.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Optional Batch Notes</label>
                <textarea
                  class="form-input form-textarea"
                  v-model="currentBulkForm.notes"
                  rows="3"
                  placeholder="Shared notes for all submitted record links"
                ></textarea>
              </div>
              <div class="invalid-list" v-if="invalidAssetLines.length > 0">
                <div class="invalid-list-title">Invalid record links</div>
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

    <Teleport to="body">
      <div v-if="submissionDialog" class="modal-overlay" @click.self="closeSubmissionDialog">
        <div class="submission-dialog">
          <div class="submission-dialog-header">
            <div class="submission-dialog-title" :class="`is-${submissionDialog.variant}`">
              <IconCircleCheck v-if="submissionDialog.variant === 'success'" :size="18" stroke-width="1.8" />
              <IconAlertTriangle v-else :size="18" stroke-width="1.8" />
              <span>{{ submissionDialog.title }}</span>
            </div>
            <button class="btn-icon" @click="closeSubmissionDialog">×</button>
          </div>
          <div class="submission-dialog-body">
            <p>{{ submissionDialog.message }}</p>
            <ul v-if="submissionDialog.details?.length" class="submission-dialog-details">
              <li v-for="detail in submissionDialog.details" :key="detail">{{ detail }}</li>
            </ul>
          </div>
          <div class="submission-dialog-actions">
            <button class="btn btn-primary" @click="closeSubmissionDialog">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useSubmissionsStore } from '../stores/submissions'
import { useExploreStore } from '../stores/explore'
import { useAuthStore } from '../stores/auth'
import { USE_V1_ASSET_CREATE } from '../config/api'
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
const exploreStore = useExploreStore()
const auth = useAuthStore()
const route = useRoute()

const pageSubtitle = computed(() =>
  USE_V1_ASSET_CREATE
    ? 'Create a model card or datasheet directly in the catalog (manual entry), or use record links for the review queue.'
    : 'Create a model card or datasheet submission for admin review',
)
const activeTab = ref('model_card')
const submitMode = ref('manual')
const submittedBy = ref(auth.isLoggedIn ? auth.displayName : '')
const submissionResult = ref(null)
const submissionDialog = ref(null)
const validationError = ref('')

const modelForm = reactive(createModelForm())
const datasheetForm = reactive(createDatasheetForm())
const assetLinkForms = reactive(createAssetLinkForms())
const bulkForms = reactive(createBulkForms())

const currentForm = computed(() => (activeTab.value === 'model_card' ? modelForm : datasheetForm))
const currentAssetLinkForm = computed(() => assetLinkForms[activeTab.value])
const currentBulkForm = computed(() => bulkForms[activeTab.value])
const assetIntakePrompt = ASSET_INTAKE_PROMPT

const manualStepsV1 = [
  { title: 'Fill the form', desc: 'Provide details about your model or dataset.' },
  { title: 'Create record', desc: 'The app POSTs to /v1/assets/model-cards or /v1/assets/datasheets with your Tapis credentials.' },
  { title: 'Catalog', desc: 'On success, the record is available in the Patra catalog (see Browse).' },
]

const manualStepsQueue = [
  { title: 'Fill the form', desc: 'Provide details about your model or dataset.' },
  { title: 'Queue the submission', desc: 'The frontend sends the mapped payload to the Patra submission queue.' },
  { title: 'Admin review', desc: 'An admin reviews the pending item and decides whether to approve it.' },
  { title: 'Record published', desc: 'Approved submissions are written into the Patra catalog.' },
]

const assetSteps = [
  { title: 'Paste the record link', desc: 'Provide the existing model or dataset URL you want added to Patra.' },
  { title: 'Generate queue payload', desc: 'The frontend converts the link into a backend-compatible review item.' },
  { title: 'Wait for approval', desc: 'The Patra backend stores the request in the review queue until an admin approves it.' },
]

const steps = computed(() => {
  if (submitMode.value === 'manual') {
    return USE_V1_ASSET_CREATE ? manualStepsV1 : manualStepsQueue
  }
  return assetSteps
})

const submitButtonLabel = computed(() => {
  if (submitMode.value === 'manual') {
    return USE_V1_ASSET_CREATE ? 'Create record' : 'Queue for Review'
  }
  if (submitMode.value === 'asset_link') return 'Queue Record Link'
  return 'Queue Record Links'
})

const invalidAssetLines = computed(() => {
  if (submitMode.value !== 'bulk_asset_links') return []

  return parseBulkLines(currentBulkForm.value.urls)
    .filter((item) => !item.parsed)
    .map(({ line, value }) => ({ line, value }))
})

const formErrorMessage = computed(() => validationError.value || store.error || '')

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

function syncRoutePrefill() {
  if (typeof route.query.type === 'string' && (route.query.type === 'model_card' || route.query.type === 'datasheet')) {
    activeTab.value = route.query.type
  }
  if (typeof route.query.mode === 'string' && ['manual', 'asset_link', 'bulk_asset_links'].includes(route.query.mode)) {
    submitMode.value = route.query.mode
  }
  if (typeof route.query.asset_url === 'string' && route.query.asset_url.trim()) {
    currentAssetLinkForm.value.assetUrl = route.query.asset_url
  }
}

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
    if (result._directRecord) {
      submissionResult.value = {
        kind: 'single',
        directRecord: true,
        recordId: result.asset_id,
        duplicate: Boolean(result.duplicate),
        created: result.created !== false,
        recordType: result.asset_type,
        successCount: 1,
        failureCount: 0,
        totalCount: 1,
        failures: [],
      }
      await Promise.allSettled([exploreStore.fetchModels(), exploreStore.fetchDatasheets()])
      const label = activeTab.value === 'model_card' ? 'model card' : 'datasheet'
      const idPart = result.asset_id != null ? ` Record id: ${result.asset_id}.` : ''
      openSubmissionDialog({
        variant: 'success',
        title: result.duplicate ? 'Catalog match' : 'Record created',
        message: result.duplicate
          ? `Your ${label} matched an existing catalog record.${idPart}`
          : `Your ${label} was created in the catalog.${idPart}`,
      })
      return
    }

    submissionResult.value = {
      kind: 'single',
      successCount: 1,
      failureCount: 0,
      totalCount: 1,
      failures: [],
    }
    openSubmissionDialog({
      variant: 'success',
      title: 'Submission queued',
      message: `Your ${activeTab.value === 'model_card' ? 'model card' : 'datasheet'} is now waiting in the review queue.`,
    })
    return
  }

  openFailureDialog()
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
    openSubmissionDialog({
      variant: 'success',
      title: 'Submission queued',
      message: `Your ${activeTab.value === 'model_card' ? 'model card' : 'datasheet'} link is now waiting in the review queue.`,
    })
    return
  }

  openFailureDialog()
}

async function submitBulkAssetLinks() {
  const parsedLines = parseBulkLines(currentBulkForm.value.urls)
  const invalidLines = parsedLines.filter((item) => !item.parsed)

  if (invalidLines.length > 0) {
    validationError.value = 'Fix the invalid record links before submitting the batch.'
    return
  }

  const uniqueUrls = [...new Set(parsedLines.map((item) => item.parsed.normalized))]

  if (uniqueUrls.length === 0) {
    validationError.value = 'Add at least one record link to submit.'
    return
  }

  if (uniqueUrls.length > 25) {
    validationError.value = 'Bulk submission supports up to 25 record links per request.'
    return
  }

  const result = await store.createBulkSubmissions(
    activeTab.value,
    uniqueUrls,
    submittedBy.value,
    currentBulkForm.value.notes,
  )

  if (!result) {
    openFailureDialog()
    return
  }

  submissionResult.value = {
    kind: 'bulk',
    totalCount: uniqueUrls.length,
    successCount: result.successes.length,
    failureCount: result.failures.length,
    failures: result.failures,
  }

  openSubmissionDialog({
    variant: result.failures.length > 0 ? 'error' : 'success',
    title: result.failures.length > 0 ? 'Bulk submission partially failed' : 'Bulk submission succeeded',
    message: result.failures.length > 0
      ? `Submitted ${result.successes.length} of ${uniqueUrls.length} record links.`
      : `Queued all ${uniqueUrls.length} record links successfully.`,
    details: result.failures.map((failure) => `${failure.url}: ${failure.error}`),
  })
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
  store.error = null
  submissionDialog.value = null
}

function resetForm() {
  submittedBy.value = auth.isLoggedIn ? auth.displayName : ''
  activeTab.value = 'model_card'
  submitMode.value = 'manual'
  submissionResult.value = null
  submissionDialog.value = null
  validationError.value = ''
  Object.assign(modelForm, createModelForm())
  Object.assign(datasheetForm, createDatasheetForm())
  Object.assign(assetLinkForms.model_card, createSingleAssetForm())
  Object.assign(assetLinkForms.datasheet, createSingleAssetForm())
  Object.assign(bulkForms.model_card, createBulkAssetForm())
  Object.assign(bulkForms.datasheet, createBulkAssetForm())
}

function openFailureDialog() {
  openSubmissionDialog({
    variant: 'error',
    title: 'Submission failed',
    message: store.error || 'The backend rejected this submission.',
  })
}

function openSubmissionDialog({ variant, title, message, details = [] }) {
  submissionDialog.value = { variant, title, message, details }
}

function closeSubmissionDialog() {
  submissionDialog.value = null
}

watch(() => auth.displayName, (nextName, previousName) => {
  if (!submittedBy.value.trim() || submittedBy.value === previousName) {
    submittedBy.value = auth.isLoggedIn ? nextName : ''
  }
})

onMounted(syncRoutePrefill)
watch(() => route.query, syncRoutePrefill, { deep: true })

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
.ask-patra-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.72);
  margin-bottom: 18px;
}

.ask-patra-callout-title {
  font-weight: 700;
  color: var(--color-text);
}

.ask-patra-callout-text {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: .88rem;
}

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

.submission-dialog {
  width: min(100%, 480px);
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.submission-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border);
}

.submission-dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.submission-dialog-title.is-success {
  color: var(--color-success);
}

.submission-dialog-title.is-error {
  color: var(--color-danger);
}

.submission-dialog-body {
  padding: 18px 20px;
  color: var(--color-text-secondary);
}

.submission-dialog-body p {
  margin: 0;
  line-height: 1.6;
}

.submission-dialog-details {
  margin: 12px 0 0;
  padding-left: 18px;
}

.submission-dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 20px;
}

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
