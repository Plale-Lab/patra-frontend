<template>
  <div>
    <div class="page-header">
      <h1>Submit to Knowledge Base</h1>
      <p>Submit a model card or datasheet for admin review</p>
    </div>

    <!-- Success Banner -->
    <div class="success-banner" v-if="submitted">
      <IconCircleCheck :size="20" stroke-width="1.8" />
      <div>
        <strong>Submission received!</strong> Your {{ form.type === 'model_card' ? 'model card' : 'datasheet' }} has been submitted for review. An admin will review it shortly.
      </div>
      <button class="btn btn-outline btn-sm" @click="resetForm">Submit Another</button>
    </div>

    <template v-else>
      <!-- Type Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: form.type === 'model_card' }" @click="form.type = 'model_card'">
          <IconCube :size="16" stroke-width="1.8" /> Model Card
        </button>
        <button class="tab" :class="{ active: form.type === 'datasheet' }" @click="form.type = 'datasheet'">
          <IconTable :size="16" stroke-width="1.8" /> Datasheet
        </button>
      </div>

      <div class="submit-layout">
        <!-- Form -->
        <div class="card submit-form">
          <div class="card-header">
            <span class="flex items-center gap-8">
              <component :is="form.type === 'model_card' ? IconCube : IconTable" :size="18" stroke-width="1.8" />
              {{ form.type === 'model_card' ? 'Model Card Details' : 'Datasheet Details' }}
            </span>
          </div>
          <div class="card-body">
            <!-- Common fields -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Your Name <span class="required">*</span></label>
                <input class="form-input" v-model="form.submittedBy" placeholder="e.g. Alice Chen" />
              </div>
              <div class="form-group">
                <label class="form-label">Name <span class="required">*</span></label>
                <input class="form-input" v-model="form.name" :placeholder="form.type === 'model_card' ? 'e.g. ResNet-50 Classifier' : 'e.g. UCI Adult Dataset'" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Version <span class="required">*</span></label>
                <input class="form-input" v-model="form.version" placeholder="e.g. 1.0" />
              </div>
              <div class="form-group">
                <label class="form-label">License</label>
                <input class="form-input" v-model="form.license" placeholder="e.g. BSD-3 Clause, CC BY 4.0" />
              </div>
            </div>

            <!-- Model Card specific -->
            <template v-if="form.type === 'model_card'">
              <div class="form-group">
                <label class="form-label">Short Description <span class="required">*</span></label>
                <textarea class="form-input form-textarea" v-model="form.shortDescription" rows="2" placeholder="Brief summary of the model"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-input" v-model="form.category">
                    <option value="">Select category</option>
                    <option>Classification</option>
                    <option>Regression</option>
                    <option>NLP</option>
                    <option>Image Classification</option>
                    <option>Object Detection</option>
                    <option>Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Input Type</label>
                  <select class="form-input" v-model="form.inputType">
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
                  <select class="form-input" v-model="form.framework">
                    <option value="">Select framework</option>
                    <option>tensorflow</option>
                    <option>pytorch</option>
                    <option>scikit-learn</option>
                    <option>keras</option>
                    <option>Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Test Accuracy</label>
                  <input class="form-input" type="number" step="0.01" min="0" max="1" v-model.number="form.testAccuracy" placeholder="0.00 – 1.00" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Keywords</label>
                <input class="form-input" v-model="form.keywords" placeholder="Comma-separated keywords" />
              </div>
              <div class="form-group">
                <label class="form-label">Visibility</label>
                <div class="filter-chips">
                  <button class="chip" :class="{ active: !form.isPrivate }" @click="form.isPrivate = false">Public</button>
                  <button class="chip" :class="{ active: form.isPrivate }" @click="form.isPrivate = true">Private</button>
                </div>
              </div>
            </template>

            <!-- Datasheet specific -->
            <template v-else>
              <div class="form-group">
                <label class="form-label">Description <span class="required">*</span></label>
                <textarea class="form-input form-textarea" v-model="form.description" rows="3" placeholder="Describe the dataset"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Source</label>
                  <input class="form-input" v-model="form.source" placeholder="e.g. UCI Repository, Kaggle" />
                </div>
                <div class="form-group">
                  <label class="form-label">Datapoints</label>
                  <input class="form-input" type="number" v-model.number="form.datapoints" placeholder="e.g. 50000" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Features</label>
                <input class="form-input" v-model="form.features" placeholder="Comma-separated feature names" />
              </div>
              <div class="form-group">
                <label class="form-label">Download URL</label>
                <input class="form-input" v-model="form.downloadUrl" placeholder="https://..." />
              </div>
            </template>
          </div>
        </div>

        <!-- Sidebar Info -->
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

const form = reactive({
  type: 'model_card',
  submittedBy: '',
  name: '', version: '', license: '',
  // Model card
  shortDescription: '', category: '', inputType: '', framework: '',
  testAccuracy: null, keywords: '', isPrivate: false,
  // Datasheet
  description: '', source: '', datapoints: null, features: '', downloadUrl: '',
})

const steps = [
  { title: 'Fill the form', desc: 'Provide details about your model or dataset.' },
  { title: 'Submit for review', desc: 'Your submission enters a review queue.' },
  { title: 'Admin reviews', desc: 'An admin will approve or request changes.' },
  { title: 'Published', desc: 'Once approved, it appears in the Knowledge Base.' },
]

const canSubmit = computed(() => {
  if (!form.submittedBy || !form.name || !form.version) return false
  if (form.type === 'model_card' && !form.shortDescription) return false
  if (form.type === 'datasheet' && !form.description) return false
  return true
})

async function handleSubmit() {
  let data = {}
  if (form.type === 'model_card') {
    data = {
      name: form.name, version: form.version, author: form.submittedBy,
      short_description: form.shortDescription, category: form.category,
      input_type: form.inputType, framework: form.framework,
      test_accuracy: form.testAccuracy || 0, keywords: form.keywords,
      is_private: form.isPrivate, license: form.license,
    }
  } else {
    data = {
      name: form.name, version: form.version,
      description: form.description, source: form.source,
      datapoints: form.datapoints || 0, license: form.license,
      features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      download_url: form.downloadUrl,
    }
  }
  const result = await store.createSubmission(form.type, data, form.submittedBy)
  if (result) submitted.value = true
}

function resetForm() {
  submitted.value = false
  Object.assign(form, {
    type: 'model_card', submittedBy: '', name: '', version: '', license: '',
    shortDescription: '', category: '', inputType: '', framework: '',
    testAccuracy: null, keywords: '', isPrivate: false,
    description: '', source: '', datapoints: null, features: '', downloadUrl: '',
  })
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
