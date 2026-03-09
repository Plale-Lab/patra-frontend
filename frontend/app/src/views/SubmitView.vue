<template>
  <div>
    <div class="page-header">
      <h1>Submit to Knowledge Base</h1>
      <p>Submit a model card or datasheet for admin review</p>
    </div>

    <div class="success-banner" v-if="submitted">
      <IconCircleCheck :size="20" stroke-width="1.8" />
      <div>
        <strong>Submission received!</strong> Your {{ activeTab === 'model_card' ? 'model card' : 'datasheet' }} has been submitted for review. An admin will review it shortly.
      </div>
      <button class="btn btn-outline btn-sm" @click="resetForm">Submit Another</button>
    </div>

    <template v-else>
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'model_card' }" @click="activeTab = 'model_card'">
          <IconCube :size="16" stroke-width="1.8" /> Model Card
        </button>
        <button class="tab" :class="{ active: activeTab === 'datasheet' }" @click="activeTab = 'datasheet'">
          <IconTable :size="16" stroke-width="1.8" /> Datasheet
        </button>
      </div>

      <div class="submit-layout">
        <div class="card submit-form">
          <div class="card-header">
            <span class="flex items-center gap-8">
              <component :is="activeTab === 'model_card' ? IconCube : IconTable" :size="18" stroke-width="1.8" />
              {{ activeTab === 'model_card' ? 'Model Card Details' : 'Datasheet Details' }}
            </span>
          </div>
          <div class="card-body">
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

          <button class="btn btn-primary btn-submit" :disabled="!canSubmit || store.loading" @click="handleSubmit">
            <IconSend :size="16" stroke-width="1.8" />
            {{ store.loading ? 'Submitting…' : 'Submit for Review' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useSubmissionsStore } from '../stores/submissions'
import {
  IconCube, IconTable, IconInfoCircle, IconSend, IconCircleCheck,
} from '@tabler/icons-vue'

const store = useSubmissionsStore()
const submitted = ref(false)
const activeTab = ref('model_card')
const submittedBy = ref('')

const modelForm = reactive(createModelForm())
const datasheetForm = reactive(createDatasheetForm())

const currentForm = computed(() => (activeTab.value === 'model_card' ? modelForm : datasheetForm))

const steps = [
  { title: 'Fill the form', desc: 'Provide details about your model or dataset.' },
  { title: 'Submit for review', desc: 'Your submission enters a review queue.' },
  { title: 'Admin reviews', desc: 'An admin will approve or request changes.' },
  { title: 'Published', desc: 'Once approved, it appears in the Knowledge Base.' },
]

const canSubmit = computed(() => {
  if (!submittedBy.value || !currentForm.value.name || !currentForm.value.version) return false
  if (activeTab.value === 'model_card' && !modelForm.shortDescription) return false
  if (activeTab.value === 'datasheet' && !datasheetForm.description) return false
  return true
})

async function handleSubmit() {
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
  if (result) submitted.value = true
}

function resetForm() {
  submitted.value = false
  submittedBy.value = ''
  activeTab.value = 'model_card'
  Object.assign(modelForm, createModelForm())
  Object.assign(datasheetForm, createDatasheetForm())
}

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
.required { color: var(--color-danger); }

.info-step {
  display: flex;
  gap: 12px;
  padding: 10px 0;
}
.info-step + .info-step { border-top: 1px solid var(--color-border); }
.step-number {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 700;
  font-size: .82rem;
  display: flex; align-items: center; justify-content: center;
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
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success);
  border-radius: var(--radius);
  font-size: .92rem;
}
.success-banner strong { display: block; margin-bottom: 2px; }

.filter-chips { display: flex; gap: 6px; }
</style>
