<template>
  <div>
    <div class="page-header">
      <h1>Submit Records</h1>
      <p>Create a new model card or datasheet. Records are published immediately.</p>
    </div>

    <div v-if="!(auth.isTapisUser || auth.isAdmin || apiMode.supportsDevOpenAccess)" class="card">
      <div class="card-body">
        <div class="empty-state compact">
          <IconLock :size="34" stroke-width="1.5" />
          <p>Sign in with the sidebar login to submit records.</p>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="card">
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

      <div class="card" v-if="submitSuccess">
        <div class="card-body">
          <div class="success-block">
            <IconCheck :size="20" stroke-width="2" />
            <span>Record created successfully (ID: {{ createdId }}). <RouterLink :to="detailLink">View record</RouterLink></span>
          </div>
          <button class="btn btn-outline" @click="resetForm">Submit Another</button>
        </div>
      </div>

      <div class="card" v-else>
        <div class="card-header">
          <span>{{ assetType === 'model_card' ? 'Model Card Details' : 'Datasheet Details' }}</span>
        </div>
        <div class="card-body">
          <template v-if="assetType === 'model_card'">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Name <span class="required">*</span></label>
                <input class="form-input" v-model="mcForm.name" placeholder="e.g. ResNet-50 Image Classifier" />
              </div>
              <div class="form-group">
                <label class="form-label">Version</label>
                <input class="form-input" v-model="mcForm.version" placeholder="e.g. 1.0" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Short Description</label>
              <textarea class="form-input form-textarea" rows="2" v-model="mcForm.short_description" placeholder="Brief summary of the model"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Full Description</label>
              <textarea class="form-input form-textarea" rows="4" v-model="mcForm.full_description" placeholder="Detailed description of what the model does"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <input class="form-input" v-model="mcForm.category" placeholder="e.g. Image Classification" />
              </div>
              <div class="form-group">
                <label class="form-label">Input Type</label>
                <input class="form-input" v-model="mcForm.input_type" placeholder="e.g. Image, Text, Tabular" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Author</label>
                <input class="form-input" v-model="mcForm.author" :placeholder="auth.displayName" />
              </div>
              <div class="form-group">
                <label class="form-label">Keywords</label>
                <input class="form-input" v-model="mcForm.keywords" placeholder="e.g. computer vision, deep learning" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Framework</label>
                <input class="form-input" v-model="mcForm.framework" placeholder="e.g. PyTorch, TensorFlow" />
              </div>
              <div class="form-group">
                <label class="form-label">License</label>
                <input class="form-input" v-model="mcForm.license" placeholder="e.g. Apache 2.0, MIT" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Test Accuracy</label>
                <input class="form-input" type="number" step="0.01" min="0" max="1" v-model="mcForm.test_accuracy" placeholder="e.g. 0.95" />
              </div>
              <div class="form-group">
                <label class="form-label">Foundational Model</label>
                <input class="form-input" v-model="mcForm.foundational_model" placeholder="e.g. GPT-4, BERT" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Input Data URL</label>
                <input class="form-input" v-model="mcForm.input_data" />
              </div>
              <div class="form-group">
                <label class="form-label">Output Data URL</label>
                <input class="form-input" v-model="mcForm.output_data" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Citation</label>
              <textarea class="form-input form-textarea" rows="2" v-model="mcForm.citation" placeholder="BibTeX or plain-text citation"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Documentation URL</label>
              <input class="form-input" v-model="mcForm.documentation" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Visibility</label>
                <div class="filter-chips">
                  <button type="button" class="chip" :class="{ active: !mcForm.is_private }" @click="mcForm.is_private = false">Public</button>
                  <button type="button" class="chip" :class="{ active: mcForm.is_private }" @click="mcForm.is_private = true">Private</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Access</label>
                <div class="filter-chips">
                  <button type="button" class="chip" :class="{ active: !mcForm.is_gated }" @click="mcForm.is_gated = false">Open</button>
                  <button type="button" class="chip" :class="{ active: mcForm.is_gated }" @click="mcForm.is_gated = true">Gated</button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Title <span class="required">*</span></label>
                <input class="form-input" v-model="dsForm.title" placeholder="e.g. CIFAR-10 Dataset" />
              </div>
              <div class="form-group">
                <label class="form-label">Version</label>
                <input class="form-input" v-model="dsForm.version" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-input form-textarea" rows="3" v-model="dsForm.description" placeholder="What this dataset contains and how it was collected"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Creator</label>
                <input class="form-input" v-model="dsForm.creator" :placeholder="auth.displayName" />
              </div>
              <div class="form-group">
                <label class="form-label">Publisher</label>
                <input class="form-input" v-model="dsForm.publisher" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Resource Type</label>
                <input class="form-input" v-model="dsForm.resource_type" placeholder="e.g. Dataset" />
              </div>
              <div class="form-group">
                <label class="form-label">Publication Year</label>
                <input class="form-input" type="number" v-model="dsForm.publication_year" placeholder="e.g. 2025" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Features / Subjects</label>
                <input class="form-input" v-model="dsForm.subjects" placeholder="Comma-separated keywords" />
              </div>
              <div class="form-group">
                <label class="form-label">Download URL</label>
                <input class="form-input" v-model="dsForm.download_url" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Visibility</label>
              <div class="filter-chips">
                <button type="button" class="chip" :class="{ active: !dsForm.is_private }" @click="dsForm.is_private = false">Public</button>
                <button type="button" class="chip" :class="{ active: dsForm.is_private }" @click="dsForm.is_private = true">Private</button>
              </div>
            </div>
          </template>

          <div class="form-error" v-if="error">{{ error }}</div>

          <div class="form-actions">
            <button class="btn btn-primary" :disabled="!canSubmit || loading" @click="handleSubmit">
              {{ loading ? 'Creating...' : 'Create Record' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconLock, IconCheck } from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'
import { apiFetch } from '../lib/api'
import { parseErrorMessage } from '../lib/errorParsing'

const auth = useAuthStore()
const apiMode = useApiModeStore()

const assetType = ref('model_card')
const loading = ref(false)
const error = ref('')
const submitSuccess = ref(false)
const createdId = ref(null)

const mcForm = reactive({
  name: '', version: '', short_description: '', full_description: '',
  category: '', input_type: '', author: '', keywords: '',
  framework: '', license: '', test_accuracy: '', foundational_model: '',
  input_data: '', output_data: '', citation: '', documentation: '',
  is_private: false, is_gated: false,
})

const dsForm = reactive({
  title: '', version: '', description: '', creator: '', publisher: '',
  resource_type: 'Dataset', publication_year: '', subjects: '',
  download_url: '', is_private: false,
})

const canSubmit = computed(() => {
  if (assetType.value === 'model_card') return mcForm.name.trim().length > 0
  return dsForm.title.trim().length > 0
})

const detailLink = computed(() => {
  if (!createdId.value) return '/'
  return assetType.value === 'model_card'
    ? `/explore-model-cards/${createdId.value}`
    : `/explore-datasheets/${createdId.value}`
})

function switchType(type) {
  assetType.value = type
  error.value = ''
}

function resetForm() {
  submitSuccess.value = false
  createdId.value = null
  error.value = ''
  Object.assign(mcForm, {
    name: '', version: '', short_description: '', full_description: '',
    category: '', input_type: '', author: '', keywords: '',
    framework: '', license: '', test_accuracy: '', foundational_model: '',
    input_data: '', output_data: '', citation: '', documentation: '',
    is_private: false, is_gated: false,
  })
  Object.assign(dsForm, {
    title: '', version: '', description: '', creator: '', publisher: '',
    resource_type: 'Dataset', publication_year: '', subjects: '',
    download_url: '', is_private: false,
  })
}

function buildModelCardPayload() {
  const authorName = mcForm.author.trim() || auth.displayName
  const payload = {
    name: mcForm.name.trim(),
    version: mcForm.version.trim() || null,
    short_description: mcForm.short_description.trim() || null,
    full_description: mcForm.full_description.trim() || null,
    category: mcForm.category.trim() || null,
    input_type: mcForm.input_type.trim() || null,
    author: authorName,
    keywords: mcForm.keywords.trim() || null,
    foundational_model: mcForm.foundational_model.trim() || null,
    input_data: mcForm.input_data.trim() || null,
    output_data: mcForm.output_data.trim() || null,
    citation: mcForm.citation.trim() || null,
    documentation: mcForm.documentation.trim() || null,
    is_private: mcForm.is_private,
    is_gated: mcForm.is_gated,
  }
  const hasAiModel = mcForm.framework.trim() || mcForm.license.trim() || mcForm.test_accuracy
  if (hasAiModel) {
    payload.ai_model = {
      name: mcForm.name.trim(),
      framework: mcForm.framework.trim() || null,
      license: mcForm.license.trim() || null,
      test_accuracy: mcForm.test_accuracy ? parseFloat(mcForm.test_accuracy) : null,
      owner: authorName,
    }
  }
  return payload
}

function buildDatasheetPayload() {
  const creatorName = dsForm.creator.trim() || auth.displayName
  const subjects = dsForm.subjects.split(',').map((s) => s.trim()).filter(Boolean)
  const payload = {
    version: dsForm.version.trim() || null,
    resource_type: dsForm.resource_type.trim() || null,
    publication_year: dsForm.publication_year ? parseInt(dsForm.publication_year) : null,
    is_private: dsForm.is_private,
    titles: [{ title: dsForm.title.trim() }],
    creators: [{ creator_name: creatorName }],
    subjects: subjects.map((s) => ({ subject: s })),
    descriptions: dsForm.description.trim()
      ? [{ description: dsForm.description.trim(), description_type: 'Abstract' }]
      : [],
  }
  if (dsForm.publisher.trim()) {
    payload.publisher = { name: dsForm.publisher.trim() }
  }
  if (dsForm.download_url.trim()) {
    payload.related_identifiers = [{
      related_identifier: dsForm.download_url.trim(),
      related_identifier_type: 'URL',
      relation_type: 'IsDescribedBy',
    }]
  }
  return payload
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const endpoint = assetType.value === 'model_card' ? '/v1/assets/model-cards' : '/v1/assets/datasheets'
    const payload = assetType.value === 'model_card' ? buildModelCardPayload() : buildDatasheetPayload()
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
    submitSuccess.value = true
  } catch (e) {
    error.value = e.message || 'Failed to create record'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: .9rem; }

.form-row { display: flex; gap: 16px; }
.form-row > .form-group { flex: 1; }
.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: .82rem; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 8px; font-size: .88rem; background: var(--color-bg); }
.form-textarea { resize: vertical; font-family: inherit; }
.form-actions { margin-top: 16px; }
.form-error { color: var(--color-danger, #d32f2f); font-size: .86rem; margin-top: 8px; }
.required { color: var(--color-danger, #d32f2f); }

.filter-chips { display: flex; gap: 6px; }
.chip {
  padding: 5px 14px; border-radius: 20px; border: 1px solid var(--color-border);
  background: transparent; font-size: .82rem; cursor: pointer; transition: all .15s;
}
.chip.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.success-block {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 10px;
  background: var(--color-success-bg, #e8f5e9); color: var(--color-success, #2e7d32);
  margin-bottom: 12px; font-size: .9rem;
}
.success-block a { color: inherit; font-weight: 600; text-decoration: underline; }

.empty-state { text-align: center; padding: 32px 16px; color: var(--color-text-muted); }
.empty-state.compact { padding: 20px 16px; }

@media (max-width: 640px) {
  .form-row { flex-direction: column; gap: 0; }
}
</style>
