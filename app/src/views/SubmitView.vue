<template>
  <div>
    <div class="page-header">
      <h1>New Submission</h1>
      <p>Add a model card or datasheet to Patra</p>
    </div>

    <div class="success-banner" v-if="createdRecord">
      <IconCircleCheck :size="20" stroke-width="1.8" />
      <div>
        <strong>{{ activeTab === 'model_card' ? 'Model card' : 'Datasheet' }} created.</strong> It has been added to Patra.
        <RouterLink :to="createdRecordLink" class="record-link">View {{ activeTab === 'model_card' ? 'model card' : 'datasheet' }} #{{ createdRecord.asset_id ?? createdRecord.id }}</RouterLink>
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
            <span class="flex items-center gap-8">
              <component :is="activeTab === 'model_card' ? IconCube : IconTable" :size="18" stroke-width="1.8" />
              {{ activeTab === 'model_card' ? 'New Model Card' : 'New Datasheet' }}
            </span>
          </div>
          <div class="card-body">
            <div class="form-error" v-if="formErrorMessage">
              {{ formErrorMessage }}
            </div>

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
          </div>
        </div>

        <div class="submit-info">
          <div class="card">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconInfoCircle :size="18" stroke-width="1.8" /> How it works</span>
            </div>
            <div class="card-body">
              <div class="info-step" v-for="(step, i) in steps" :key="i">
                <div class="step-number">{{ i + 1 }}</div>
                <div>
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-desc">{{ step.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-submit" :disabled="!canSubmit || exploreStore.loading" @click="handleSubmit">
            <IconSend :size="16" stroke-width="1.8" />
            {{ exploreStore.loading ? 'Creating…' : (activeTab === 'model_card' ? 'Create Model Card' : 'Create Datasheet') }}
          </button>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="resultDialog" class="modal-overlay" @click.self="closeResultDialog">
        <div class="submission-dialog">
          <div class="submission-dialog-header">
            <div class="submission-dialog-title" :class="`is-${resultDialog.variant}`">
              <IconCircleCheck v-if="resultDialog.variant === 'success'" :size="18" stroke-width="1.8" />
              <IconAlertTriangle v-else :size="18" stroke-width="1.8" />
              <span>{{ resultDialog.title }}</span>
            </div>
            <button class="btn-icon" @click="closeResultDialog">×</button>
          </div>
          <div class="submission-dialog-body">
            <p>{{ resultDialog.message }}</p>
          </div>
          <div class="submission-dialog-actions">
            <button class="btn btn-primary" @click="closeResultDialog">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useAuthStore } from '../stores/auth'
import { mapFormToPayload } from '../lib/submissionPayloads'
import {
  IconCube,
  IconTable,
  IconInfoCircle,
  IconSend,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-vue'

const exploreStore = useExploreStore()
const auth = useAuthStore()
const activeTab = ref('model_card')
const submittedBy = ref(auth.isLoggedIn ? auth.displayName : '')
const createdRecord = ref(null)
const resultDialog = ref(null)
const validationError = ref('')

const modelForm = reactive(createModelForm())
const datasheetForm = reactive(createDatasheetForm())

const currentForm = computed(() => (activeTab.value === 'model_card' ? modelForm : datasheetForm))

const steps = [
  { title: 'Fill the form', desc: 'Provide details about your model or dataset.' },
  { title: 'Submit', desc: 'The form data is sent to the Patra API.' },
  { title: 'Published', desc: 'Your model card or datasheet is immediately available in Patra.' },
]

const createdRecordLink = computed(() => {
  if (!createdRecord.value) return '/'
  const id = createdRecord.value.asset_id ?? createdRecord.value.id
  return activeTab.value === 'model_card'
    ? `/explore-model-cards/${id}`
    : `/explore-datasheets/${id}`
})

const formErrorMessage = computed(() => validationError.value || exploreStore.error || '')

const canSubmit = computed(() => {
  if (!submittedBy.value.trim()) return false
  if (!currentForm.value.name || !currentForm.value.version) return false
  if (activeTab.value === 'model_card' && !modelForm.shortDescription) return false
  if (activeTab.value === 'datasheet' && !datasheetForm.description) return false
  return true
})

async function handleSubmit() {
  validationError.value = ''

  const data =
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

  const payload = mapFormToPayload(activeTab.value, data, submittedBy.value)

  try {
    const result = activeTab.value === 'model_card'
      ? await exploreStore.createModelCard(payload)
      : await exploreStore.createDatasheet(payload)

    createdRecord.value = result
    resultDialog.value = {
      variant: 'success',
      title: `${activeTab.value === 'model_card' ? 'Model card' : 'Datasheet'} created`,
      message: `Your ${activeTab.value === 'model_card' ? 'model card' : 'datasheet'} has been added to Patra.`,
    }
  } catch (e) {
    if (e.status === 409) {
      resultDialog.value = {
        variant: 'error',
        title: 'Duplicate detected',
        message: e.message || 'A record with this name already exists in Patra.',
      }
    } else {
      resultDialog.value = {
        variant: 'error',
        title: 'Creation failed',
        message: e.message || 'The backend rejected this submission.',
      }
    }
  }
}

function switchType(type) {
  activeTab.value = type
  clearTransientState()
}

function clearTransientState() {
  createdRecord.value = null
  validationError.value = ''
  exploreStore.error = null
  resultDialog.value = null
}

function resetForm() {
  submittedBy.value = auth.isLoggedIn ? auth.displayName : ''
  activeTab.value = 'model_card'
  createdRecord.value = null
  resultDialog.value = null
  validationError.value = ''
  Object.assign(modelForm, createModelForm())
  Object.assign(datasheetForm, createDatasheetForm())
}

function closeResultDialog() {
  resultDialog.value = null
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

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-error {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-size: .84rem;
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

.record-link {
  display: inline-block;
  margin-top: 4px;
  color: var(--color-success);
  font-weight: 600;
  text-decoration: underline;
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
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
