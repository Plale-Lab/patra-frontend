<template>
  <div>
    <!-- Back link + Edit -->
    <div class="top-bar">
      <RouterLink to="/explore-model-cards" class="back-link">
        <IconArrowLeft :size="16" stroke-width="2" /> Back to Model Cards
      </RouterLink>
      <div v-if="auth.isLoggedIn && model && !store.loading" style="display: flex; gap: 8px;">
        <template v-if="editing">
          <button class="btn btn-primary" @click="saveEdit" :disabled="store.loading">Save</button>
          <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
        </template>
        <button v-else class="btn btn-secondary" @click="startEdit" style="background: #6c5ce7; color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: 600;">
          <IconPencil :size="14" stroke-width="2" /> Edit Model Card
        </button>
      </div>
    </div>

    <!-- Save success banner -->
    <div v-if="saveSuccess" style="background: #00b894; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 12px; font-weight: 600;">
      Changes saved successfully.
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="store.loading">
      <IconLoader2 :size="32" stroke-width="1.5" class="spin" />
      <span>Loading model card…</span>
    </div>

    <!-- Error -->
    <div class="empty-state" v-else-if="!model">
      <IconAlertCircle :size="48" stroke-width="1.2" />
      <h3>Model not found</h3>
      <RouterLink to="/explore-model-cards" class="btn btn-primary">← Back to Model Cards</RouterLink>
    </div>

    <!-- Detail Content -->
    <template v-else>
      <!-- Header Card -->
      <div class="detail-header card">
        <div class="card-body">
          <div class="detail-top">
            <div>
              <div class="flex items-center gap-8" style="margin-bottom: 6px;">
                <template v-if="editing">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="editForm.is_private" />
                    {{ editForm.is_private ? 'Private' : 'Public' }}
                  </label>
                </template>
                <template v-else>
                  <span class="badge" :class="model.is_private ? 'badge-private' : 'badge-public'">
                    {{ model.is_private ? 'Private' : 'Public' }}
                  </span>
                </template>
                <span v-if="model.is_gated" class="badge badge-accent">Gated</span>
                <span v-if="model.ai_model?.framework" class="badge badge-info">{{ model.ai_model.framework }}</span>
                <span class="badge badge-accent" v-if="!editing">v{{ model.version }}</span>
              </div>
              <template v-if="editing">
                <input v-model="editForm.name" class="edit-input edit-input-title" placeholder="Name" />
                <textarea v-model="editForm.full_description" class="edit-input" rows="3" placeholder="Full description"></textarea>
              </template>
              <template v-else>
                <h1 class="detail-name">{{ model.name }}</h1>
                <p class="detail-desc">{{ model.full_description }}</p>
              </template>
              <div class="detail-meta" v-if="!editing">
                <span><IconUser :size="14" stroke-width="1.8" /> {{ model.author }}</span>
                <span><IconTag :size="14" stroke-width="1.8" /> {{ model.category }}</span>
                <span><IconFileText :size="14" stroke-width="1.8" /> {{ model.input_type }}</span>
                <span v-if="model.foundational_model && model.foundational_model !== 'None'">
                  <IconStack2 :size="14" stroke-width="1.8" /> {{ model.foundational_model }}
                </span>
              </div>
            </div>
            <div class="detail-header-actions">
              <div class="detail-accuracy-ring" v-if="model.ai_model?.test_accuracy && !editing">
                <svg viewBox="0 0 100 100" class="accuracy-ring">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" stroke-width="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-primary)" stroke-width="6"
                    :stroke-dasharray="264"
                    :stroke-dashoffset="264 - (264 * model.ai_model.test_accuracy)"
                    stroke-linecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div class="ring-text">
                  <div class="ring-value">{{ (model.ai_model.test_accuracy * 100).toFixed(1) }}%</div>
                  <div class="ring-label">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="editError" class="edit-error">{{ editError }}</div>
        </div>
      </div>

      <!-- Edit Form Fields -->
      <div class="card edit-form-card" v-if="editing">
        <div class="card-header">
          <span class="flex items-center gap-8"><IconPencil :size="18" stroke-width="1.8" /> General Information</span>
        </div>
        <div class="card-body">
          <div class="edit-grid">
            <div class="edit-field">
              <label class="info-label">Version</label>
              <input v-model="editForm.version" class="edit-input" placeholder="Version" />
            </div>
            <div class="edit-field">
              <label class="info-label">Author</label>
              <input v-model="editForm.author" class="edit-input" placeholder="Author" />
            </div>
            <div class="edit-field">
              <label class="info-label">Category</label>
              <select v-model="editForm.category" class="edit-input">
                <option value="">-- Select --</option>
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="edit-field">
              <label class="info-label">Input Type</label>
              <select v-model="editForm.input_type" class="edit-input">
                <option value="">-- Select --</option>
                <option v-for="t in inputTypeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="edit-field full-width">
              <label class="info-label">Short Description</label>
              <input v-model="editForm.short_description" class="edit-input" placeholder="Short description" />
            </div>
            <div class="edit-field full-width">
              <label class="info-label">Keywords</label>
              <input v-model="editForm.keywords" class="edit-input" placeholder="Comma-separated keywords" />
            </div>
            <div class="edit-field">
              <label class="info-label">Input Data URL</label>
              <input v-model="editForm.input_data" class="edit-input" placeholder="Input data URL" />
            </div>
            <div class="edit-field">
              <label class="info-label">Output Data URL</label>
              <input v-model="editForm.output_data" class="edit-input" placeholder="Output data URL" />
            </div>
            <div class="edit-field full-width">
              <label class="info-label">Citation</label>
              <input v-model="editForm.citation" class="edit-input" placeholder="Citation" />
            </div>
            <div class="edit-field">
              <label class="info-label">Documentation URL</label>
              <input v-model="editForm.documentation" class="edit-input" placeholder="Documentation URL" />
            </div>
            <div class="edit-field">
              <label class="info-label">Base Model</label>
              <input v-model="editForm.foundational_model" class="edit-input" placeholder="Base model" />
            </div>
          </div>
        </div>
      </div>

      <!-- AI Model Edit Fields -->
      <div class="card edit-form-card" v-if="editing">
        <div class="card-header">
          <span class="flex items-center gap-8"><IconBrain :size="18" stroke-width="1.8" /> Model Metadata</span>
        </div>
        <div class="card-body">
          <div class="edit-grid">
            <div class="edit-field">
              <label class="info-label">Model Name</label>
              <input v-model="editForm.ai_model_name" class="edit-input" placeholder="AI model name" />
            </div>
            <div class="edit-field">
              <label class="info-label">Model Version</label>
              <input v-model="editForm.ai_model_version" class="edit-input" placeholder="Model version" />
            </div>
            <div class="edit-field full-width">
              <label class="info-label">Model Description</label>
              <textarea v-model="editForm.ai_model_description" class="edit-input" rows="2" placeholder="Model description"></textarea>
            </div>
            <div class="edit-field">
              <label class="info-label">Owner</label>
              <input v-model="editForm.ai_model_owner" class="edit-input" placeholder="Owner" />
            </div>
            <div class="edit-field">
              <label class="info-label">Repository URL</label>
              <input v-model="editForm.ai_model_location" class="edit-input" placeholder="https://..." />
            </div>
            <div class="edit-field">
              <label class="info-label">License</label>
              <input v-model="editForm.ai_model_license" class="edit-input" placeholder="e.g. MIT, Apache-2.0" />
            </div>
            <div class="edit-field">
              <label class="info-label">Framework</label>
              <select v-model="editForm.ai_model_framework" class="edit-input">
                <option value="">-- Select --</option>
                <option v-for="f in frameworkOptions" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
            <div class="edit-field">
              <label class="info-label">Model Type</label>
              <input v-model="editForm.ai_model_model_type" class="edit-input" placeholder="e.g. CNN, Transformer" />
            </div>
            <div class="edit-field">
              <label class="info-label">Test Accuracy (%)</label>
              <input v-model.number="editForm.ai_model_test_accuracy" class="edit-input" type="number" step="0.01" min="0" max="1" placeholder="e.g. 0.95" />
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="detail-grid">
        <!-- AI Model Info -->
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconBrain :size="18" stroke-width="1.8" /> Model Details</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">{{ model.ai_model?.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Type</span>
                <span class="info-value">{{ model.ai_model?.model_type }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Framework</span>
                <span class="info-value">{{ model.ai_model?.framework }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">License</span>
                <span class="info-value">{{ model.ai_model?.license }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Owner</span>
                <span class="info-value">{{ model.ai_model?.owner }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Repository</span>
                <a v-if="model.ai_model?.location" :href="model.ai_model.location" class="info-link" target="_blank">{{ model.ai_model.location }}</a>
                <span v-else class="info-value">—</span>
              </div>
              <div class="info-item">
                <span class="info-label">Access</span>
                <span class="info-value">
                  <span class="badge badge-accent" v-if="model.is_gated">Gated</span>
                  <span v-else>Open</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Training Metrics -->
        <div class="card" v-if="model.ai_model?.metrics && Object.keys(model.ai_model.metrics).length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconChartBar :size="18" stroke-width="1.8" /> Training Metrics</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(val, key) in model.ai_model.metrics" :key="key">
                  <td style="font-weight: 500;">{{ formatMetricKey(key) }}</td>
                  <td>{{ formatMetricValue(val) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bias Analysis -->
        <div class="card" v-if="model.bias_analysis && Object.keys(model.bias_analysis).length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconScale :size="18" stroke-width="1.8" /> Bias Analysis</span>
          </div>
          <div class="card-body">
            <MetricBar
              v-for="(val, key) in model.bias_analysis"
              :key="key"
              :label="formatMetricKey(key)"
              :value="val"
              :max="1"
              format="raw"
              :color="val > 0.1 ? 'var(--color-danger)' : 'var(--color-success)'"
            />
          </div>
        </div>

        <!-- XAI Analysis -->
        <div class="card" v-if="model.xai_analysis && Object.keys(model.xai_analysis).length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconSparkles :size="18" stroke-width="1.8" /> XAI Feature Importance</span>
          </div>
          <div class="card-body">
            <MetricBar
              v-for="(val, key) in sortedXai"
              :key="key"
              :label="formatMetricKey(key)"
              :value="val"
              :max="maxXai"
              format="raw"
              color="var(--color-primary)"
            />
          </div>
        </div>

        <!-- Deployments -->
        <div class="card" v-if="store.deployments.length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconServer :size="18" stroke-width="1.8" /> Deployments</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr v-if="deploymentMode === 'legacy'">
                  <th>Device</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Avg Inference</th>
                </tr>
                <tr v-else>
                  <th>Experiment</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Precision</th>
                  <th>Recall</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dep in store.deployments" :key="dep.experiment_id ?? dep.device_id">
                  <template v-if="deploymentMode === 'legacy'">
                    <td style="font-weight: 500;">{{ dep.device_id }}</td>
                    <td>{{ dep.device_type }}</td>
                    <td>{{ dep.location }}</td>
                    <td>
                      <span class="badge" :class="dep.status === 'active' ? 'badge-public' : 'badge-info'">
                        {{ dep.status }}
                      </span>
                    </td>
                    <td>{{ dep.avg_inference_ms }}ms</td>
                  </template>
                  <template v-else>
                    <td style="font-weight: 500;">#{{ dep.experiment_id }}</td>
                    <td>{{ dep.device_id }}</td>
                    <td>
                      <span class="badge" :class="dep.status === 'active' ? 'badge-public' : 'badge-info'">
                        {{ dep.status }}
                      </span>
                    </td>
                    <td>{{ formatPercent(dep.precision) }}</td>
                    <td>{{ formatPercent(dep.recall) }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Data Links -->
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconLink :size="18" stroke-width="1.8" /> Data Links</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item" v-if="model.input_data">
                <span class="info-label">Input Data</span>
                <a :href="model.input_data" class="info-link" target="_blank">{{ model.input_data }}</a>
              </div>
              <div class="info-item" v-if="model.output_data">
                <span class="info-label">Output Data</span>
                <a :href="model.output_data" class="info-link" target="_blank">{{ model.output_data }}</a>
              </div>
            </div>
            <div class="keywords-row" v-if="model.keywords">
              <span class="info-label" style="margin-bottom: 6px; display: block;">Keywords</span>
              <div class="flex" style="flex-wrap: wrap; gap: 6px;">
                <span class="chip" v-for="kw in model.keywords.split(',')" :key="kw">{{ kw.trim() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useAuthStore } from '../stores/auth'
import MetricBar from '../components/MetricBar.vue'
import {
  IconArrowLeft, IconLoader2, IconAlertCircle,
  IconUser, IconTag, IconFileText, IconStack2,
  IconBrain, IconChartBar, IconScale, IconSparkles,
  IconServer, IconLink, IconPencil,
} from '@tabler/icons-vue'

const route = useRoute()
const store = useExploreStore()
const auth = useAuthStore()

const model = computed(() => store.currentModel)
const editing = ref(false)
const editError = ref('')
const saveSuccess = ref(false)
const editForm = reactive({
  name: '',
  version: '',
  short_description: '',
  full_description: '',
  keywords: '',
  author: '',
  category: '',
  input_type: '',
  input_data: '',
  output_data: '',
  citation: '',
  documentation: '',
  foundational_model: '',
  is_private: false,
  // AI Model fields
  ai_model_name: '',
  ai_model_version: '',
  ai_model_description: '',
  ai_model_owner: '',
  ai_model_location: '',
  ai_model_license: '',
  ai_model_framework: '',
  ai_model_model_type: '',
  ai_model_test_accuracy: null,
})

const categoryOptions = ['Classification', 'Image Classification', 'Regression', 'NLP', 'Object Detection']
const inputTypeOptions = ['Tabular', 'Image', 'Text', 'Audio', 'Video', 'Time Series']
const frameworkOptions = ['PyTorch', 'TensorFlow', 'JAX', 'Transformers', 'Keras', 'Diffusers', 'timm', 'scikit-learn']

function startEdit() {
  if (!model.value) return
  const m = model.value
  const ai = m.ai_model || {}
  editForm.name = m.name || ''
  editForm.version = m.version || ''
  editForm.short_description = m.short_description || ''
  editForm.full_description = m.full_description || ''
  editForm.keywords = m.keywords || ''
  editForm.author = m.author || ''
  editForm.category = m.category || m.categories || ''
  editForm.input_type = m.input_type || ''
  editForm.input_data = m.input_data || ''
  editForm.output_data = m.output_data || ''
  editForm.citation = m.citation || ''
  editForm.documentation = m.documentation || ''
  editForm.foundational_model = m.foundational_model || ''
  editForm.is_private = m.is_private || false
  editForm.ai_model_name = ai.name || ''
  editForm.ai_model_version = ai.version || ''
  editForm.ai_model_description = ai.description || ''
  editForm.ai_model_owner = ai.owner || ''
  editForm.ai_model_location = ai.location || ''
  editForm.ai_model_license = ai.license || ''
  editForm.ai_model_framework = ai.framework || ''
  editForm.ai_model_model_type = ai.model_type || ''
  editForm.ai_model_test_accuracy = ai.test_accuracy ?? null
  editError.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editError.value = ''
}

async function saveEdit() {
  editError.value = ''
  saveSuccess.value = false
  try {
    const { ai_model_name, ai_model_version, ai_model_description, ai_model_owner,
            ai_model_location, ai_model_license, ai_model_framework,
            ai_model_model_type, ai_model_test_accuracy, ...cardFields } = editForm

    const ai_model = {}
    if (ai_model_name) ai_model.name = ai_model_name
    if (ai_model_version) ai_model.version = ai_model_version
    if (ai_model_description) ai_model.description = ai_model_description
    if (ai_model_owner) ai_model.owner = ai_model_owner
    if (ai_model_location) ai_model.location = ai_model_location
    if (ai_model_license) ai_model.license = ai_model_license
    if (ai_model_framework) ai_model.framework = ai_model_framework
    if (ai_model_model_type) ai_model.model_type = ai_model_model_type
    if (ai_model_test_accuracy != null && ai_model_test_accuracy !== '') ai_model.test_accuracy = Number(ai_model_test_accuracy)

    const payload = { ...cardFields }
    if (Object.keys(ai_model).length) payload.ai_model = ai_model

    await store.updateModelCard(route.params.id, payload)
    editing.value = false
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    editError.value = e.message || 'Failed to save changes'
  }
}
const deploymentMode = computed(() => {
  if (!store.deployments.length) return 'legacy'
  const first = store.deployments[0]
  return first?.avg_inference_ms != null || first?.device_type || first?.location ? 'legacy' : 'experiments'
})

const sortedXai = computed(() => {
  if (!model.value?.xai_analysis) return {}
  const entries = Object.entries(model.value.xai_analysis).sort((a, b) => b[1] - a[1])
  return Object.fromEntries(entries)
})

const maxXai = computed(() => {
  if (!model.value?.xai_analysis) return 1
  const vals = Object.values(model.value.xai_analysis)
  return vals.length ? Math.max(...vals) : 1
})

function formatMetricKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

function formatMetricValue(val) {
  if (typeof val === 'number') {
    return val % 1 !== 0 ? val.toFixed(4) : val.toLocaleString()
  }
  if (Array.isArray(val)) return val.join(' × ')
  return String(val)
}

function formatPercent(val) {
  if (typeof val !== 'number') return '—'
  return `${(val * 100).toFixed(1)}%`
}

function loadModel() {
  const id = route.params.id
  if (id) {
    store.fetchModelById(id)
    store.fetchDeployments(id)
  }
}

onMounted(loadModel)
watch(() => route.params.id, loadModel)
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: .88rem;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  margin-bottom: 18px;
  transition: opacity var(--transition);
}
.back-link:hover { opacity: .7; }

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.top-bar .back-link { margin-bottom: 0; }
.edit-actions { display: flex; gap: 8px; }

.detail-header { margin-bottom: 20px; }
.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}
.detail-header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
}
.edit-actions { display: flex; gap: 8px; }
.detail-name { font-size: 1.6rem; font-weight: 700; margin-bottom: 8px; }
.detail-desc { font-size: .92rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 12px; max-width: 700px; }
.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.detail-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: .82rem;
  color: var(--color-text-muted);
}

.detail-accuracy-ring {
  position: relative;
  width: 120px; height: 120px;
  flex-shrink: 0;
}
.accuracy-ring { width: 100%; height: 100%; }
.ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-value { font-size: 1.3rem; font-weight: 700; color: var(--color-primary); }
.ring-label { font-size: .72rem; color: var(--color-text-muted); }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: .75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .5px; }
.info-value { font-size: .9rem; font-weight: 500; }
.info-link {
  font-size: .82rem;
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-all;
}
.info-link:hover { text-decoration: underline; }

.keywords-row { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-border); }

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-muted);
  gap: 10px;
}
.empty-state h3 { font-size: 1.1rem; color: var(--color-text-secondary); }

.edit-input {
  width: 100%;
  padding: 6px 10px;
  font-size: .88rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
}
.edit-input:focus { outline: none; border-color: var(--color-primary); }
.edit-input-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 8px; }
.edit-form-card { margin-bottom: 20px; }
.edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.edit-field { display: flex; flex-direction: column; gap: 4px; }
.edit-field.full-width { grid-column: 1 / -1; }
.edit-error {
  margin-top: 10px;
  padding: 8px 12px;
  font-size: .85rem;
  color: var(--color-danger, #c0392b);
  background: rgba(192, 57, 43, .08);
  border-radius: 6px;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .82rem;
  font-weight: 500;
  cursor: pointer;
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
