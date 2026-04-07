<template>
  <div>
    <!-- Back link -->
    <RouterLink to="/explore-model-cards" class="back-link">
      <IconArrowLeft :size="16" stroke-width="2" /> Back to Model Cards
    </RouterLink>

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
                <span class="badge" :class="model.is_private ? 'badge-private' : 'badge-public'">
                  {{ model.is_private ? 'Private' : 'Public' }}
                </span>
                <span v-if="model.is_gated" class="badge badge-accent">Gated</span>
                <span v-if="model.ai_model?.framework" class="badge badge-info">{{ model.ai_model.framework }}</span>
                <span class="badge badge-accent">v{{ model.version }}</span>
              </div>
              <h1 class="detail-name">{{ model.name }}</h1>
              <p class="detail-desc">{{ model.full_description }}</p>
              <div class="detail-meta">
                <span><IconUser :size="14" stroke-width="1.8" /> {{ model.author }}</span>
                <span><IconTag :size="14" stroke-width="1.8" /> {{ model.category }}</span>
                <span><IconFileText :size="14" stroke-width="1.8" /> {{ model.input_type }}</span>
                <span v-if="model.foundational_model && model.foundational_model !== 'None'">
                  <IconStack2 :size="14" stroke-width="1.8" /> {{ model.foundational_model }}
                </span>
              </div>
            </div>
            <div class="detail-accuracy-ring" v-if="model.ai_model?.test_accuracy">
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
      </div>

      <!-- Content Grid -->
      <div class="detail-grid">
        <!-- AI Model Info -->
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconBrain :size="18" stroke-width="1.8" /> AI Model</span>
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
                <span class="info-label">Location</span>
                <a v-if="model.ai_model?.location" :href="model.ai_model.location" class="info-link" target="_blank">{{ model.ai_model.location }}</a>
                <span v-else class="info-value">—</span>
              </div>
              <div class="info-item">
                <span class="info-label">Is Gated</span>
                <span class="info-value">{{ model.is_gated ? 'Yes' : 'No' }}</span>
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
import { computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useApiModeStore } from '../stores/apiMode'
import MetricBar from '../components/MetricBar.vue'
import {
  IconArrowLeft, IconLoader2, IconAlertCircle,
  IconUser, IconTag, IconFileText, IconStack2,
  IconBrain, IconChartBar, IconScale, IconSparkles,
  IconServer, IconLink,
} from '@tabler/icons-vue'

const route = useRoute()
const store = useExploreStore()
const apiMode = useApiModeStore()

const model = computed(() => store.currentModel)
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
watch(() => apiMode.mode, loadModel)
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

.detail-header { margin-bottom: 20px; }
.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}
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

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
