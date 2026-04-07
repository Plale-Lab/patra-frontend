<template>
  <div>
    <div class="page-header">
      <h1>{{ pageTitle }}</h1>
      <p>Browse edge experiment telemetry, detection metrics, image traces, and power usage for {{ domainLabel }}.</p>
    </div>

    <div class="loading-bar warning-bar">
      {{ domainLabel }} remains visible even when the backend is not ready. If experiment data cannot be loaded, this page will show warnings instead of disappearing from the sidebar.
    </div>

    <div class="card domain-banner">
      <div class="card-body domain-banner-body">
        <div class="domain-icon">
          <component :is="domainIcon" :size="28" stroke-width="1.8" />
        </div>
        <div>
          <div class="domain-title">{{ domainLabel }}</div>
          <p class="domain-copy">
            This view aggregates experiment events, raw image decisions, and deployment power metrics from the Patra
            knowledge base.
          </p>
        </div>
      </div>
    </div>

    <div v-if="store.error" class="loading-bar error-bar">{{ store.error }}</div>
    <div v-if="store.loading" class="loading-bar">Loading...</div>

    <section class="card block-spacing">
      <div class="card-header"><span>Select User</span></div>
      <div class="card-body">
        <select v-model="selectedUser" class="domain-select" @change="onUserChange">
          <option :value="null">Choose a user</option>
          <option v-for="user in store.users" :key="user.user_id" :value="user.user_id">
            {{ user.username || `User ${user.user_id}` }}
          </option>
        </select>
      </div>
    </section>

    <section v-if="store.userSummary.length" class="card block-spacing">
      <div class="card-header"><span>Experiment Summary</span></div>
      <div class="card-body table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Model</th>
              <th>Device</th>
              <th>Start</th>
              <th>Images</th>
              <th>Saved</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in store.userSummary" :key="row.experiment_id">
              <td>{{ row.experiment_id }}</td>
              <td>{{ row.model_id }}</td>
              <td>{{ row.device_id || '—' }}</td>
              <td>{{ formatDate(row.start_at) }}</td>
              <td>{{ row.total_images ?? '—' }}</td>
              <td>{{ row.saved_images ?? '—' }}</td>
              <td>{{ fmtPct(row.precision) }}</td>
              <td>{{ fmtPct(row.recall) }}</td>
              <td>{{ fmtPct(row.f1_score) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="store.experimentList.length" class="card block-spacing">
      <div class="card-header"><span>Select Experiment</span></div>
      <div class="card-body">
        <select v-model="selectedExperiment" class="domain-select" @change="onExperimentChange">
          <option :value="null">Choose an experiment</option>
          <option v-for="experiment in store.experimentList" :key="experiment.experiment_id" :value="experiment.experiment_id">
            {{ experiment.experiment_id }} — {{ experiment.model_id }} ({{ experiment.device_id || 'unknown device' }})
          </option>
        </select>
      </div>
    </section>

    <template v-if="detail">
      <div class="stats-grid block-spacing">
        <div class="card">
          <div class="card-body">
            <div class="metric-label">Model</div>
            <div class="metric-value">{{ detail.model_id }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="metric-label">Device</div>
            <div class="metric-value">{{ detail.device_id || '—' }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="metric-label">Start</div>
            <div class="metric-value">{{ formatDate(detail.start_at) }}</div>
          </div>
        </div>
      </div>

      <details class="domain-details" open>
        <summary>Detection Metrics</summary>
        <div class="domain-grid">
          <div class="domain-item"><span>Total Images</span><strong>{{ detail.total_images ?? '—' }}</strong></div>
          <div class="domain-item"><span>Total Predictions</span><strong>{{ detail.total_predictions ?? '—' }}</strong></div>
          <div class="domain-item"><span>Ground Truth Objects</span><strong>{{ detail.total_ground_truth_objects ?? '—' }}</strong></div>
          <div class="domain-item"><span>True Positives</span><strong>{{ detail.true_positives ?? '—' }}</strong></div>
          <div class="domain-item"><span>False Positives</span><strong>{{ detail.false_positives ?? '—' }}</strong></div>
          <div class="domain-item"><span>False Negatives</span><strong>{{ detail.false_negatives ?? '—' }}</strong></div>
        </div>
      </details>

      <details class="domain-details" open>
        <summary>Quality Metrics</summary>
        <div class="bar-list">
          <div class="bar-row">
            <span class="bar-label">Precision</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: pct(detail.precision) }"></div></div>
            <span class="bar-value">{{ fmtPct(detail.precision) }}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Recall</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: pct(detail.recall) }"></div></div>
            <span class="bar-value">{{ fmtPct(detail.recall) }}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">F1 Score</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: pct(detail.f1_score) }"></div></div>
            <span class="bar-value">{{ fmtPct(detail.f1_score) }}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">mAP@50</span>
            <div class="bar-track"><div class="bar-fill bar-fill-map" :style="{ width: pct(detail.map_50) }"></div></div>
            <span class="bar-value">{{ fmtPct(detail.map_50) }}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">mAP@50:95</span>
            <div class="bar-track"><div class="bar-fill bar-fill-map" :style="{ width: pct(detail.map_50_95) }"></div></div>
            <span class="bar-value">{{ fmtPct(detail.map_50_95) }}</span>
          </div>
        </div>
      </details>

      <section v-if="store.experimentImages.length" class="card block-spacing">
        <div class="card-header"><span>Raw Image Data</span></div>
        <div class="card-body table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Ground Truth</th>
                <th>Label</th>
                <th>Probability</th>
                <th>Decision</th>
                <th>Received</th>
                <th>Scored</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(image, index) in store.experimentImages" :key="`${image.image_name}-${index}`">
                <td>{{ image.image_name }}</td>
                <td>{{ image.ground_truth || '—' }}</td>
                <td>{{ image.label || '—' }}</td>
                <td>{{ image.probability != null ? image.probability.toFixed(3) : '—' }}</td>
                <td>
                  <span class="badge" :class="image.image_decision === 'Save' ? 'badge-public' : 'badge-accent'">
                    {{ image.image_decision || 'Unknown' }}
                  </span>
                </td>
                <td>{{ formatDate(image.image_receiving_timestamp) }}</td>
                <td>{{ formatDate(image.image_scoring_timestamp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card block-spacing">
        <div class="card-header"><span>Power Information</span></div>
        <div class="card-body" v-if="store.experimentPower">
          <div class="domain-grid">
            <div class="domain-item">
              <span>Total CPU (W)</span>
              <strong>{{ store.experimentPower.total_cpu_power_consumption ?? '—' }}</strong>
            </div>
            <div class="domain-item">
              <span>Total GPU (W)</span>
              <strong>{{ store.experimentPower.total_gpu_power_consumption ?? '—' }}</strong>
            </div>
          </div>
          <div class="table-wrap power-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Plugin</th>
                  <th>CPU (W)</th>
                  <th>GPU (W)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Image Generating</td>
                  <td>{{ store.experimentPower.image_generating_plugin_cpu_power_consumption ?? '—' }}</td>
                  <td>{{ store.experimentPower.image_generating_plugin_gpu_power_consumption ?? '—' }}</td>
                </tr>
                <tr>
                  <td>Power Monitor</td>
                  <td>{{ store.experimentPower.power_monitor_plugin_cpu_power_consumption ?? '—' }}</td>
                  <td>{{ store.experimentPower.power_monitor_plugin_gpu_power_consumption ?? '—' }}</td>
                </tr>
                <tr>
                  <td>Image Scoring</td>
                  <td>{{ store.experimentPower.image_scoring_plugin_cpu_power_consumption ?? '—' }}</td>
                  <td>{{ store.experimentPower.image_scoring_plugin_gpu_power_consumption ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="card-body text-muted">No power information available for this experiment.</div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { IconLeaf, IconTractor } from '@tabler/icons-vue'
import { useExperimentsStore } from '../../stores/experiments'

const props = defineProps({
  domain: {
    type: String,
    required: true,
  },
})

const DOMAIN_LABELS = {
  'animal-ecology': 'Animal Ecology',
  'digital-ag': 'Digital Agriculture',
}

const domainLabel = computed(() => DOMAIN_LABELS[props.domain] || props.domain)
const pageTitle = computed(() => `${domainLabel.value} Experiments`)
const domainIcon = computed(() => (props.domain === 'animal-ecology' ? IconLeaf : IconTractor))

const store = useExperimentsStore()
const selectedUser = ref(null)
const selectedExperiment = ref(null)
const detail = computed(() => store.experimentDetail)

onMounted(() => {
  store.fetchUsers(props.domain)
})

watch(
  () => props.domain,
  (nextDomain) => {
    selectedUser.value = null
    selectedExperiment.value = null
    store.reset()
    store.fetchUsers(nextDomain)
  },
)

function onUserChange() {
  selectedExperiment.value = null
  store.selectUser(props.domain, selectedUser.value)
}

function onExperimentChange() {
  store.selectExperiment(props.domain, selectedExperiment.value)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function fmtPct(value) {
  return value != null ? `${(value * 100).toFixed(1)}%` : '—'
}

function pct(value) {
  return value != null ? `${(value * 100).toFixed(1)}%` : '0%'
}
</script>

<style scoped>
.block-spacing {
  margin-bottom: 24px;
}

.domain-banner-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.domain-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  flex-shrink: 0;
}

.domain-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.domain-copy {
  color: var(--color-text-secondary);
  max-width: 72ch;
}

.warning-bar {
  margin-bottom: 16px;
  background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, white);
  color: color-mix(in srgb, var(--color-warning, #b45309) 80%, black);
  border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 35%, white);
}

.domain-select {
  width: 100%;
  max-width: 460px;
  padding: 10px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.metric-label {
  margin-bottom: 4px;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.domain-details {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.domain-details summary {
  padding: 14px 18px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.domain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  padding: 4px 18px 18px;
}

.domain-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.domain-item span {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.domain-item strong {
  font-size: 1.02rem;
}

.bar-list {
  padding: 4px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 90px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
}

.bar-track {
  flex: 1;
  height: 14px;
  background: var(--color-bg);
  border-radius: 7px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 7px;
}

.bar-fill-map {
  background: var(--color-success);
}

.bar-value {
  width: 56px;
  text-align: right;
  font-size: 0.84rem;
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
}

.power-table {
  margin-top: 12px;
}

.loading-bar {
  padding: 10px 16px;
  margin-bottom: 16px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
}

.error-bar {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
</style>
