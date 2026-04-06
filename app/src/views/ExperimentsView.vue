<template>
  <div>
    <div class="page-header">
      <h1>{{ pageTitle }}</h1>
      <p>Browse edge-deployed {{ domainLabel }} experiments, detection metrics, and raw image data.</p>
    </div>

    <!-- CKN info banner -->
    <div class="ckn-banner card" style="margin-bottom: 24px;">
      <div class="card-body">
        <div class="ckn-banner-inner">
          <img src="/img/ckn-logo.png" alt="CKN" class="ckn-logo" />
          <div class="ckn-banner-text">
            <div class="ckn-banner-title">Powered by the Cyberinfrastructure Knowledge Network (CKN)</div>
            <p class="ckn-banner-desc">
              CKN is a distributed framework for optimizing AI at the edge. It captures real-time inference events
              from edge devices via Kafka, stores performance and provenance data in a knowledge graph, and feeds
              deployment metrics back to Patra for full model lifecycle transparency.
            </p>
            <div class="ckn-banner-links">
              <a href="https://cyberinfrastructure-knowledge-network.readthedocs.io/en/latest/" target="_blank" class="ckn-link">
                <IconExternalLink :size="14" stroke-width="1.8" /> Documentation
              </a>
              <a href="https://github.com/Data-to-Insight-Center/cyberinfrastructure-knowledge-network" target="_blank" class="ckn-link">
                <IconBrandGithub :size="14" stroke-width="1.8" /> GitHub
              </a>
              <a href="https://ieeexplore.ieee.org/document/10254827" target="_blank" class="ckn-link">
                <IconExternalLink :size="14" stroke-width="1.8" /> Paper
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="connection-banner error" v-if="store.error">
      <span>{{ store.error }}</span>
    </div>

    <div class="loading-bar" v-if="store.loading">Loading…</div>

    <!-- User selector -->
    <section class="card" style="margin-bottom: 24px;">
      <div class="card-header"><span>Select User</span></div>
      <div class="card-body">
        <select class="ct-select" v-model="selectedUser" @change="onUserChange">
          <option :value="null">— Choose a user —</option>
          <option v-for="u in store.users" :key="u.user_id" :value="u.user_id">
            {{ u.username || `User ${u.user_id}` }}
          </option>
        </select>
      </div>
    </section>

    <!-- Experiment summary table -->
    <section class="card" v-if="store.userSummary.length" style="margin-bottom: 24px;">
      <div class="card-header"><span>Experiment Summary</span></div>
      <div class="card-body" style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Model</th><th>Device</th><th>Start</th>
              <th>Images</th><th>Saved</th><th>Precision</th><th>Recall</th><th>F1</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in store.userSummary" :key="row.experiment_id">
              <td>{{ row.experiment_id }}</td>
              <td>{{ row.model_id }}</td>
              <td>{{ row.device_id }}</td>
              <td>{{ formatDate(row.start_at) }}</td>
              <td>{{ row.total_images }}</td>
              <td>{{ row.saved_images }}</td>
              <td>{{ fmtPct(row.precision) }}</td>
              <td>{{ fmtPct(row.recall) }}</td>
              <td>{{ fmtPct(row.f1_score) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Experiment selector -->
    <section class="card" v-if="store.experimentList.length" style="margin-bottom: 24px;">
      <div class="card-header"><span>Select Experiment</span></div>
      <div class="card-body">
        <select class="ct-select" v-model="selectedExp" @change="onExpChange">
          <option :value="null">— Choose an experiment —</option>
          <option v-for="e in store.experimentList" :key="e.experiment_id" :value="e.experiment_id">
            {{ e.experiment_id }} — {{ e.model_id }} ({{ e.device_id }}, {{ formatDate(e.start_at) }})
          </option>
        </select>
      </div>
    </section>

    <!-- Experiment detail -->
    <template v-if="d">
      <!-- Metric cards row -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-body">
            <div class="ct-metric-label">Start Time</div>
            <div class="ct-metric-value">{{ formatDate(d.start_at) }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="ct-metric-label">Model</div>
            <div class="ct-metric-value">{{ d.model_id }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="ct-metric-label">Device</div>
            <div class="ct-metric-value">{{ d.device_id || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- Detection Metrics -->
      <details class="ct-details" open>
        <summary>Detection Metrics</summary>
        <div class="ct-detail-grid">
          <div class="ct-detail-item"><span>Total Images</span><strong>{{ d.total_images ?? '—' }}</strong></div>
          <div class="ct-detail-item"><span>Ground Truth Objects</span><strong>{{ d.total_ground_truth_objects ?? '—' }}</strong></div>
          <div class="ct-detail-item"><span>Total Predictions</span><strong>{{ d.total_predictions ?? '—' }}</strong></div>
          <div class="ct-detail-item"><span>True Positives (TP)</span><strong>{{ d.true_positives ?? '—' }}</strong></div>
          <div class="ct-detail-item"><span>False Positives (FP)</span><strong>{{ d.false_positives ?? '—' }}</strong></div>
          <div class="ct-detail-item"><span>False Negatives (FN)</span><strong>{{ d.false_negatives ?? '—' }}</strong></div>
        </div>
      </details>

      <!-- Precision & Recall -->
      <details class="ct-details" open>
        <summary>Precision &amp; Recall</summary>
        <div class="ct-bar-list">
          <div class="ct-bar-row">
            <span class="ct-bar-label">Precision</span>
            <div class="ct-bar-track"><div class="ct-bar-fill" :style="{ width: pct(d.precision) }"></div></div>
            <span class="ct-bar-value">{{ fmtPct(d.precision) }}</span>
          </div>
          <div class="ct-bar-row">
            <span class="ct-bar-label">Recall</span>
            <div class="ct-bar-track"><div class="ct-bar-fill" :style="{ width: pct(d.recall) }"></div></div>
            <span class="ct-bar-value">{{ fmtPct(d.recall) }}</span>
          </div>
          <div class="ct-bar-row">
            <span class="ct-bar-label">F1 Score</span>
            <div class="ct-bar-track"><div class="ct-bar-fill" :style="{ width: pct(d.f1_score) }"></div></div>
            <span class="ct-bar-value">{{ fmtPct(d.f1_score) }}</span>
          </div>
        </div>
      </details>

      <!-- mAP Metrics -->
      <details class="ct-details" open>
        <summary>mAP Metrics</summary>
        <div class="ct-bar-list">
          <div class="ct-bar-row">
            <span class="ct-bar-label">mAP@50</span>
            <div class="ct-bar-track"><div class="ct-bar-fill ct-bar-fill--map" :style="{ width: pct(d.map_50) }"></div></div>
            <span class="ct-bar-value">{{ fmtPct(d.map_50) }}</span>
          </div>
          <div class="ct-bar-row">
            <span class="ct-bar-label">mAP@50:95</span>
            <div class="ct-bar-track"><div class="ct-bar-fill ct-bar-fill--map" :style="{ width: pct(d.map_50_95) }"></div></div>
            <span class="ct-bar-value">{{ fmtPct(d.map_50_95) }}</span>
          </div>
        </div>
      </details>

      <!-- Raw Data table -->
      <section class="card" v-if="store.experimentImages.length" style="margin-bottom: 24px;">
        <div class="card-header"><span>Raw Image Data</span></div>
        <div class="card-body" style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Image</th><th>Ground Truth</th><th>Label</th><th>Probability</th>
                <th>Decision</th><th>Received</th><th>Scored</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(img, i) in store.experimentImages" :key="i">
                <td>{{ img.image_name }}</td>
                <td>{{ img.ground_truth || '—' }}</td>
                <td>{{ img.label }}</td>
                <td>{{ img.probability != null ? img.probability.toFixed(3) : '—' }}</td>
                <td>
                  <span class="ct-badge" :class="img.image_decision === 'Save' ? 'ct-badge--save' : 'ct-badge--discard'">
                    {{ img.image_decision }}
                  </span>
                </td>
                <td>{{ formatDate(img.image_receiving_timestamp) }}</td>
                <td>{{ formatDate(img.image_scoring_timestamp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Power Info -->
      <section class="card" style="margin-bottom: 24px;">
        <div class="card-header"><span>Power Information</span></div>
        <div class="card-body" v-if="store.experimentPower">
          <div class="ct-detail-grid">
            <div class="ct-detail-item"><span>Total CPU (W)</span><strong>{{ store.experimentPower.total_cpu_power_consumption }}</strong></div>
            <div class="ct-detail-item"><span>Total GPU (W)</span><strong>{{ store.experimentPower.total_gpu_power_consumption }}</strong></div>
          </div>
          <table class="data-table" style="margin-top: 12px;">
            <thead>
              <tr><th>Plugin</th><th>CPU (W)</th><th>GPU (W)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Image Generating</td>
                <td>{{ store.experimentPower.image_generating_plugin_cpu_power_consumption }}</td>
                <td>{{ store.experimentPower.image_generating_plugin_gpu_power_consumption }}</td>
              </tr>
              <tr>
                <td>Power Monitor</td>
                <td>{{ store.experimentPower.power_monitor_plugin_cpu_power_consumption }}</td>
                <td>{{ store.experimentPower.power_monitor_plugin_gpu_power_consumption }}</td>
              </tr>
              <tr>
                <td>Image Scoring</td>
                <td>{{ store.experimentPower.image_scoring_plugin_cpu_power_consumption }}</td>
                <td>{{ store.experimentPower.image_scoring_plugin_gpu_power_consumption }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-body" v-else>
          <p class="ct-muted">No power information available for this experiment.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useExperimentsStore } from '../stores/experiments'
import { IconExternalLink, IconBrandGithub } from '@tabler/icons-vue'

const props = defineProps({
  domain: { type: String, required: true },
})

const DOMAIN_LABELS = {
  'animal-ecology': 'Animal Ecology',
  'digital-ag': 'Digital Agriculture',
}

const domainLabel = computed(() => DOMAIN_LABELS[props.domain] || props.domain)
const pageTitle = computed(() => `${domainLabel.value} Experiments`)

const store = useExperimentsStore()
const selectedUser = ref(null)
const selectedExp = ref(null)
const d = computed(() => store.experimentDetail)

onMounted(() => { store.fetchUsers(props.domain) })

watch(() => props.domain, (newDomain) => {
  selectedUser.value = null
  selectedExp.value = null
  store.reset()
  store.fetchUsers(newDomain)
})

function onUserChange() {
  selectedExp.value = null
  store.selectUser(props.domain, selectedUser.value)
}

function onExpChange() {
  store.selectExperiment(props.domain, selectedExp.value)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function fmtPct(v) {
  return v != null ? (v * 100).toFixed(1) + '%' : '—'
}

function pct(v) {
  return v != null ? (v * 100).toFixed(1) + '%' : '0%'
}
</script>

<style scoped>
.ckn-banner-inner {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.ckn-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 12px;
}
.ckn-banner-title {
  font-weight: 700;
  font-size: .95rem;
  margin-bottom: 6px;
}
.ckn-banner-desc {
  font-size: .85rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 10px;
}
.ckn-banner-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.ckn-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .82rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
.ckn-link:hover { text-decoration: underline; }

.ct-select {
  width: 100%; max-width: 400px;
  padding: 10px 12px; border: 1.5px solid var(--color-border);
  border-radius: 8px; font-size: .92rem;
  background: var(--color-surface); color: var(--color-text);
}

.ct-metric-label { font-size: .78rem; color: var(--color-text-muted); margin-bottom: 4px; }
.ct-metric-value { font-size: 1.1rem; font-weight: 700; }

.ct-details {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; margin-bottom: 16px; overflow: hidden;
}
.ct-details summary {
  padding: 14px 18px; font-weight: 700; font-size: .95rem;
  cursor: pointer; user-select: none;
}
.ct-details summary:hover { background: var(--color-bg); }

.ct-detail-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px; padding: 4px 18px 18px;
}
.ct-detail-item { display: flex; flex-direction: column; gap: 2px; }
.ct-detail-item span { font-size: .78rem; color: var(--color-text-muted); }
.ct-detail-item strong { font-size: 1.05rem; }

.ct-bar-list { padding: 4px 18px 18px; display: flex; flex-direction: column; gap: 12px; }
.ct-bar-row { display: flex; align-items: center; gap: 12px; }
.ct-bar-label { width: 90px; font-size: .85rem; color: var(--color-text-secondary); flex-shrink: 0; }
.ct-bar-track { flex: 1; height: 14px; background: var(--color-bg); border-radius: 7px; overflow: hidden; }
.ct-bar-fill { height: 100%; background: var(--color-primary); border-radius: 7px; transition: width .3s; }
.ct-bar-fill--map { background: var(--color-success); }
.ct-bar-value { width: 55px; text-align: right; font-size: .85rem; font-weight: 600; flex-shrink: 0; }

.ct-badge {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  font-size: .78rem; font-weight: 600;
}
.ct-badge--save { background: var(--color-success-bg); color: var(--color-success); }
.ct-badge--discard { background: var(--color-bg); color: var(--color-text-muted); }

.ct-muted { color: var(--color-text-muted); font-size: .88rem; margin: 0; }

.loading-bar {
  padding: 10px 16px; margin-bottom: 16px;
  background: var(--color-primary-bg); color: var(--color-primary);
  border-radius: 8px; font-size: .88rem; font-weight: 600;
}
</style>
