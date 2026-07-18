<template>
  <div>
    <div class="page-header">
      <h1>Submit Records</h1>
      <p>Create a new model card or datasheet. Records are published immediately.</p>
    </div>

    <div v-if="!(auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS)" class="card">
      <div class="card-body">
        <div class="empty-state compact">
          <IconLock :size="34" stroke-width="1.5" />
          <p>Sign in with the sidebar login to submit records.</p>
        </div>
      </div>
    </div>

    <div class="card" v-else-if="submitSuccess">
      <div class="card-body">
        <InlineFeedback type="success">
          Record created successfully (UUID: {{ createdUuid || createdId }}).
        </InlineFeedback>

        <div class="link-report" v-if="displayLinkReport.length">
          <div class="link-report-title">Link check</div>
          <div class="link-row" v-for="entry in displayLinkReport" :key="entry.field">
            <span class="link-field">{{ entry.label }}</span>
            <a class="link-url" :href="entry.url" target="_blank" rel="noopener">{{ entry.url }}</a>
            <span class="link-status" :class="`link-${entry.status}`">{{ statusLabel(entry) }}</span>
          </div>
        </div>

        <div class="success-cta">
          <RouterLink :to="detailLink" class="btn btn-primary">View record</RouterLink>
          <button class="btn btn-outline" @click="resetForm">Submit Another</button>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="card type-card">
        <div class="card-header">
          <span>Record Type</span>
        </div>
        <div class="card-body">
          <div class="filter-chips">
            <button type="button" class="chip" :class="{ active: assetType === 'model_card' }" @click="switchType('model_card')">Model Card</button>
            <button type="button" class="chip" :class="{ active: assetType === 'datasheet' }" @click="switchType('datasheet')">Datasheet</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <SubmitStepper :steps="steps" :current="currentStep" @goto="goToStep" />

          <template v-if="isReviewStep">
            <SubmitReview :sections="sections" :form="activeForm" />

            <div class="form-section" v-if="assetType === 'model_card'">
              <div class="form-section-label">Link validation</div>
              <div class="filter-chips">
                <button type="button" class="chip" :class="{ active: validateLinks }" @click="validateLinks = true">Validate links on submit</button>
                <button type="button" class="chip" :class="{ active: !validateLinks }" @click="validateLinks = false">Skip</button>
              </div>
            </div>

            <InlineFeedback v-if="error" type="error" :message="error" />

            <div class="stepper-actions">
              <button class="btn btn-outline back-btn" @click="prevStep">Back</button>
              <button class="btn btn-primary" :disabled="loading" @click="handleSubmit">
                {{ loading ? 'Creating…' : 'Create Record' }}
              </button>
            </div>
          </template>

          <template v-else>
            <div class="form-section">
              <div class="form-section-label">{{ currentSection.title }}</div>
              <div class="section-fields">
                <FormField
                  v-for="field in currentSection.fields"
                  :key="field.key"
                  :field="field"
                  v-model="activeForm[field.key]"
                  :error="errors[field.key]"
                  :class="{ 'field-span-2': field.type === 'textarea' || field.type === 'segmented' }"
                  @blur="validateOnBlur(field)"
                />
              </div>
            </div>

            <InlineFeedback v-if="currentStepHasErrors" type="error" message="Please fix the highlighted fields." />

            <div class="stepper-actions">
              <button v-if="currentStep > 0" class="btn btn-outline back-btn" @click="prevStep">Back</button>
              <button class="btn btn-primary" @click="nextStep">Continue</button>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconLock } from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'
import { SUPPORTS_DEV_OPEN_ACCESS } from '../config/api'
import { apiFetch } from '../lib/api'
import { parseErrorMessage } from '../lib/errorParsing'
import { sectionsFor, fieldsFor } from '../lib/assetFields'
import { buildModelCardPayload, buildDatasheetPayload } from '../lib/assetPayloads'
import { validateForm, validateField } from '../lib/fieldValidation'
import FormField from '../components/FormField.vue'
import InlineFeedback from '../components/InlineFeedback.vue'
import SubmitStepper from './submit/SubmitStepper.vue'
import SubmitReview from './submit/SubmitReview.vue'

const auth = useAuthStore()

const assetType = ref('model_card')
const currentStep = ref(0)
const errors = reactive({})
const loading = ref(false)
const error = ref('')
const submitSuccess = ref(false)
const createdId = ref(null)
const createdUuid = ref(null)
const validateLinks = ref(true)
const linkReport = ref(null)

const mcForm = reactive({
  name: '', version: '', short_description: '', full_description: '',
  category: '', input_type: '', author: '', keywords: '',
  framework: '', license: '', test_accuracy: '', foundational_model: '',
  training_datasheet_uuid: '',
  input_data: '', output_data: '', citation: '', documentation: '',
  location: '',
  is_private: false, is_gated: false,
})

const dsForm = reactive({
  title: '', version: '', description: '', creator: '', publisher: '',
  resource_type: 'Dataset', publication_year: '', subjects: '',
  download_url: '', is_private: false,
})

// Human labels for the validated pointer fields. `citation` is intentionally
// omitted — it's a BibTeX/plain-text field, so it would always read "malformed".
const LINK_FIELD_LABELS = {
  input_data: 'Input Data URL',
  output_data: 'Output Data URL',
  documentation: 'Documentation URL',
  location: 'Model Location',
}

const activeForm = computed(() => (assetType.value === 'model_card' ? mcForm : dsForm))
const sections = computed(() => sectionsFor(assetType.value))
const steps = computed(() => [...sections.value, { id: 'review', title: 'Review' }])
const isReviewStep = computed(() => currentStep.value === sections.value.length)
const currentSection = computed(() => sections.value[currentStep.value] || null)

const currentStepHasErrors = computed(() => (
  currentSection.value ? currentSection.value.fields.some((f) => errors[f.key]) : false
))

const detailLink = computed(() => {
  if (!createdUuid.value) return '/'
  return assetType.value === 'model_card'
    ? `/modelcard/${createdUuid.value}`
    : `/datasheet/${createdUuid.value}`
})

const displayLinkReport = computed(() => {
  if (!Array.isArray(linkReport.value)) return []
  return linkReport.value
    .filter((entry) => entry && LINK_FIELD_LABELS[entry.field])
    .map((entry) => ({ ...entry, label: LINK_FIELD_LABELS[entry.field] }))
})

function statusLabel(entry) {
  if (entry.status === 'broken' && entry.http_code) return `broken (${entry.http_code})`
  return entry.status
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function switchType(type) {
  if (assetType.value === type) return
  assetType.value = type
  currentStep.value = 0
  error.value = ''
  clearErrors()
}

function validateOnBlur(field) {
  const msg = validateField(field, activeForm.value[field.key], true)
  if (msg) errors[field.key] = msg
  else delete errors[field.key]
}

function nextStep() {
  const fields = currentSection.value.fields
  const stepErrors = validateForm(fields, activeForm.value, true)
  fields.forEach((f) => delete errors[f.key])
  Object.assign(errors, stepErrors)
  if (Object.keys(stepErrors).length) return
  if (currentStep.value < steps.value.length - 1) currentStep.value += 1
}

function prevStep() {
  error.value = ''
  if (currentStep.value > 0) currentStep.value -= 1
}

function goToStep(index) {
  if (index <= currentStep.value) {
    error.value = ''
    currentStep.value = index
  }
}

function goToFirstError() {
  const idx = sections.value.findIndex((s) => s.fields.some((f) => errors[f.key]))
  if (idx >= 0) currentStep.value = idx
}

function resetForm() {
  submitSuccess.value = false
  createdId.value = null
  createdUuid.value = null
  linkReport.value = null
  error.value = ''
  currentStep.value = 0
  clearErrors()
  Object.assign(mcForm, {
    name: '', version: '', short_description: '', full_description: '',
    category: '', input_type: '', author: '', keywords: '',
    framework: '', license: '', test_accuracy: '', foundational_model: '',
    input_data: '', output_data: '', citation: '', documentation: '',
    location: '',
    is_private: false, is_gated: false,
  })
  Object.assign(dsForm, {
    title: '', version: '', description: '', creator: '', publisher: '',
    resource_type: 'Dataset', publication_year: '', subjects: '',
    download_url: '', is_private: false,
  })
}

async function handleSubmit() {
  const allErrors = validateForm(fieldsFor(assetType.value), activeForm.value, true)
  clearErrors()
  Object.assign(errors, allErrors)
  if (Object.keys(allErrors).length) {
    error.value = 'Please fix the highlighted fields.'
    goToFirstError()
    return
  }

  error.value = ''
  linkReport.value = null
  loading.value = true
  try {
    const isModelCard = assetType.value === 'model_card'
    let endpoint = isModelCard ? '/v1/assets/model-cards' : '/v1/assets/datasheets'
    if (isModelCard && validateLinks.value) {
      endpoint += '?validate_links=true'
    }
    const payload = isModelCard
      ? buildModelCardPayload(mcForm, { authorName: auth.displayName })
      : buildDatasheetPayload(dsForm, { creatorName: auth.displayName })
    const res = await apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      error.value = await parseErrorMessage(res, `HTTP ${res.status}`)
      return
    }
    const result = await res.json()
    createdId.value = result.asset_id ?? result.identifier ?? result.id
    createdUuid.value = result.asset_uuid ?? result.uuid ?? null
    linkReport.value = result.link_report ?? null
    submitSuccess.value = true
  } catch (e) {
    error.value = e.message || 'Failed to create record'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.type-card {
  margin-bottom: 16px;
}

.stepper-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
  justify-content: flex-end;
}

.back-btn {
  margin-right: auto;
}

.success-cta {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.link-report {
  margin-top: 16px;
  margin-bottom: 4px;
}

.link-report-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-top: 1px solid var(--color-border);
  font-size: 0.84rem;
}

.link-field {
  flex: 0 0 130px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.link-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-primary);
}

.link-status {
  flex: 0 0 auto;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: capitalize;
}

.link-ok { background: var(--color-success-bg); color: var(--color-success); }
.link-gated { background: var(--color-accent-bg); color: #a8701f; }
.link-broken { background: var(--color-danger-bg); color: var(--color-danger); }
.link-malformed { background: var(--color-bg-elevated); color: var(--color-text-muted); }
</style>
