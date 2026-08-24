<template>
  <div>
    <div v-if="!(auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS)" class="card">
      <div class="card-body">
        <div class="empty-state compact">
          <IconLock :size="34" stroke-width="1.5" />
          <p>Sign in with the sidebar login to create cards.</p>
        </div>
      </div>
    </div>

    <div class="card" v-else-if="submitSuccess">
      <div class="card-body">
        <InlineFeedback type="success">
          Card created successfully (UUID: {{ createdUuid || createdId }}).
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
          <RouterLink :to="detailLink" class="btn btn-primary">View card</RouterLink>
          <button class="btn btn-outline" @click="resetForm">Create Another</button>
        </div>
      </div>
    </div>

    <div class="card" v-else>
      <div class="card-body">
        <div class="form-section">
          <div class="form-section-label">Card Type</div>
          <div class="filter-chips">
            <button type="button" class="chip" :class="{ active: assetType === 'model_card' }" @click="chooseType('model_card')">Model Card</button>
            <button type="button" class="chip" :class="{ active: assetType === 'datasheet' }" @click="chooseType('datasheet')">Datasheet</button>
          </div>
        </div>

        <div class="form-section" :class="{ 'chooser-inert': !assetType }">
          <div class="form-section-label">Source</div>
          <div class="filter-chips">
            <button
              v-if="SUPPORTS_HF_IMPORT"
              type="button"
              class="chip chip-huggingface"
              :class="{ active: startMode === 'prefill' }"
              @click="chooseStart('prefill')"
            >
              <IconHuggingFace :size="13" />
              Pre-fill from Hugging Face
            </button>
            <button type="button" class="chip" :class="{ active: startMode === 'manual' }" @click="chooseStart('manual')">Fill in manually</button>
            <button v-if="showForm" type="button" class="start-over-link" @click="resetForm">Start over</button>
          </div>
        </div>

        <template v-if="showForm">
          <InlineFeedback v-if="importBanner" type="success" class="import-banner" :message="importBanner" />

          <div class="form-section" v-for="section in sections" :key="section.id">
            <div class="form-section-label">{{ section.title }}</div>
            <div class="section-fields">
              <FormField
                v-for="field in section.fields"
                :key="field.key"
                :field="field"
                v-model="activeForm[field.key]"
                :error="errors[field.key]"
                :class="{ 'field-span-2': field.type === 'textarea' }"
                @blur="validateOnBlur(field)"
              />
            </div>
          </div>

          <InlineFeedback v-if="error" type="error" :message="error" />

          <div class="submit-footer">
            <div class="link-toggle" v-if="assetType === 'model_card'">
              <span class="link-toggle-label">Validate links on submit</span>
              <div class="filter-chips">
                <button type="button" class="chip" :class="{ active: validateLinks }" @click="validateLinks = true">On</button>
                <button type="button" class="chip" :class="{ active: !validateLinks }" @click="validateLinks = false">Skip</button>
              </div>
            </div>
            <button class="btn btn-primary submit-btn" :disabled="loading" @click="handleSubmit">
              {{ loading ? 'Creating…' : 'Create Card' }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <HuggingFaceImportModal
      v-if="showImportModal"
      :asset-type="assetType"
      @close="showImportModal = false"
      @imported="handleImported"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconLock } from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'
import { SUPPORTS_DEV_OPEN_ACCESS, SUPPORTS_HF_IMPORT } from '../config/api'
import { apiFetch } from '../lib/api'
import { parseErrorMessage } from '../lib/errorParsing'
import { sectionsFor, fieldsFor } from '../lib/assetFields'
import { buildModelCardPayload, buildDatasheetPayload } from '../lib/assetPayloads'
import { validateForm, validateField } from '../lib/fieldValidation'
import FormField from '../components/FormField.vue'
import InlineFeedback from '../components/InlineFeedback.vue'
import HuggingFaceImportModal from '../components/HuggingFaceImportModal.vue'
import IconHuggingFace from '../components/icons/IconHuggingFace.vue'

const auth = useAuthStore()

const assetType = ref(null)
const startMode = ref(null)
const errors = reactive({})
const loading = ref(false)
const error = ref('')
const submitSuccess = ref(false)
const createdId = ref(null)
const createdUuid = ref(null)
const validateLinks = ref(true)
const linkReport = ref(null)
const showImportModal = ref(false)
const importBanner = ref('')

const mcForm = reactive({
  name: '', version: '', short_description: '', full_description: '',
  category: '', input_type: '', author: '', keywords: '',
  framework: '', license: '', test_accuracy: '', foundational_model: '',
  model_type: '',
  training_datasheet_uuid: '',
  input_data: '', citation: '', documentation: '',
  location: '',
  is_private: false, is_gated: false,
})

const dsForm = reactive({
  title: '', version: '', description: '', creator: '', publisher: '',
  resource_type: 'Dataset', publication_year: '', subjects: '',
  download_url: '', license: '', license_uri: '', is_private: false,
})

// Human labels for the validated pointer fields. `citation` is intentionally
// omitted — it's a BibTeX/plain-text field, so it would always read "malformed".
const LINK_FIELD_LABELS = {
  input_data: 'Input Data URL',
  documentation: 'Documentation URL',
  location: 'Model Location',
}

const activeForm = computed(() => (assetType.value === 'model_card' ? mcForm : dsForm))
const sections = computed(() => sectionsFor(assetType.value))
const showForm = computed(() => assetType.value !== null && startMode.value !== null)

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

function chooseType(type) {
  if (assetType.value === type) return
  assetType.value = type
  startMode.value = null
  error.value = ''
  importBanner.value = ''
  clearErrors()
}

function chooseStart(mode) {
  startMode.value = mode
  error.value = ''
  if (mode === 'prefill') {
    showImportModal.value = true
  }
}

function handleImported(fields) {
  const count = Object.keys(fields || {}).length
  Object.assign(activeForm.value, fields)
  showImportModal.value = false
  importBanner.value = count
    ? `Imported ${count} field${count === 1 ? '' : 's'} from Hugging Face — review before submitting.`
    : 'Nothing importable was found for that URL.'
}

function validateOnBlur(field) {
  const msg = validateField(field, activeForm.value[field.key], true)
  if (msg) errors[field.key] = msg
  else delete errors[field.key]
}

function scrollToFirstError() {
  const fields = fieldsFor(assetType.value)
  const firstErrored = fields.find((f) => errors[f.key])
  if (!firstErrored) return
  const el = document.getElementById(`field-${firstErrored.key}`)
  if (!el) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

function resetForm() {
  submitSuccess.value = false
  createdId.value = null
  createdUuid.value = null
  linkReport.value = null
  error.value = ''
  importBanner.value = ''
  assetType.value = null
  startMode.value = null
  clearErrors()
  Object.assign(mcForm, {
    name: '', version: '', short_description: '', full_description: '',
    category: '', input_type: '', author: '', keywords: '',
    framework: '', license: '', test_accuracy: '', foundational_model: '',
    model_type: '',
    training_datasheet_uuid: '',
    input_data: '', citation: '', documentation: '',
    location: '',
    is_private: false, is_gated: false,
  })
  Object.assign(dsForm, {
    title: '', version: '', description: '', creator: '', publisher: '',
    resource_type: 'Dataset', publication_year: '', subjects: '',
    download_url: '', license: '', license_uri: '', is_private: false,
  })
}

async function handleSubmit() {
  const allErrors = validateForm(fieldsFor(assetType.value), activeForm.value, true)
  clearErrors()
  Object.assign(errors, allErrors)
  if (Object.keys(allErrors).length) {
    error.value = 'Please fix the highlighted fields.'
    scrollToFirstError()
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
    error.value = e.message || 'Failed to create card'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.chooser-inert {
  opacity: 0.45;
  pointer-events: none;
  transition: opacity var(--transition);
}

.chip-huggingface {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.chip-huggingface.active,
.chip-huggingface:hover {
  background: #fff3c4;
  border-color: #ffd21e;
  color: #7a5c05;
}

.start-over-link {
  background: none;
  border: none;
  padding: 5px 4px;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color var(--transition);
}

.start-over-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.import-banner {
  margin-bottom: 20px;
}

.submit-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.link-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
}

.link-toggle-label {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.submit-btn {
  flex-shrink: 0;
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
