<template>
  <div>
    <div class="page-header">
      <h1>MVP Demo Report</h1>
      <p>
        Run the current deterministic PATRA demo pipeline on the crop-yield example and present the result as a single executive summary.
      </p>
    </div>

    <div class="loading-bar warning-bar">
      This page is tuned to the currently indexed sugarcane crop-yield sample so the demo can produce a positive end-to-end preview.
    </div>
    <div v-if="error" class="loading-bar error-bar">{{ error }}</div>

    <section class="card section-gap">
      <div class="card-header"><span>Demo Input</span></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Intent</label>
          <textarea
            v-model="intentText"
            class="form-input intent-textarea"
            placeholder="Example: I want to build a model for predicting crop yield by plot and harvest season."
          />
        </div>
        <div class="form-group">
          <label class="form-label">Optional Context</label>
          <textarea
            v-model="contextText"
            class="form-input context-textarea"
            placeholder="Add crop, geography, label assumptions, or harvest timing constraints."
          />
        </div>
        <div class="toolbar">
          <div class="toolbar-left">
            <label class="form-label inline-label">
              Max Fields
              <input v-model.number="maxFields" type="number" min="3" max="20" class="field-count-input" />
            </label>
            <label class="llm-toggle">
              <input v-model="useLlmAssist" type="checkbox" />
              <span>
                Have LLM involved
                <small>Boosts natural-language semantic understanding but may cause hallucination. PATRA applies strong schema checks, normalization, and fallback guards.</small>
              </span>
            </label>
          </div>
          <button class="btn btn-primary" :disabled="loading || !intentText.trim()" @click="runDemo">
            {{ loading ? 'Generating Report...' : 'Generate MVP Demo Report' }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="showProgress" class="card section-gap">
      <div class="card-body">
        <div class="metric-label">{{ progressTitle }}</div>
        <div class="progress-track">
          <div class="progress-fill" :class="{ 'progress-fill-error': progressState === 'error' }" :style="{ width: `${progressValue}%` }"></div>
        </div>
        <p class="progress-copy">{{ progressMessage }}</p>
      </div>
    </div>

    <section v-if="report" class="card section-gap">
      <div class="card-header">
        <span>Executive Summary</span>
        <button class="btn btn-outline" @click="copyJson">Copy JSON</button>
      </div>
      <div class="card-body">
        <div class="summary-grid">
          <div v-for="item in report.executive_summary" :key="item.label" class="summary-item">
            <span class="metric-label">{{ item.label }}</span>
            <strong :class="summaryToneClass(item.tone)">{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section v-if="report" class="card section-gap">
      <div class="card-header"><span>Recommended Baseline</span></div>
      <div class="card-body">
        <div class="field-grid">
          <article class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ report.training_stub.recommendation.model_family }}</div>
                <div class="field-role">{{ report.training_stub.recommendation.training_scope }}</div>
              </div>
              <span class="badge" :class="report.training_stub.summary.execution_status === 'simulated_report' ? 'badge-public' : 'badge-accent'">
                {{ report.training_stub.summary.execution_status }}
              </span>
            </div>
            <p class="field-description">{{ report.training_stub.recommendation.reason }}</p>
          </article>
        </div>
      </div>
    </section>

    <section v-if="report?.training_stub?.metrics?.length" class="card section-gap">
      <div class="card-header"><span>Stub Metrics</span></div>
      <div class="card-body">
        <div class="field-grid">
          <article v-for="metric in report.training_stub.metrics" :key="metric.name" class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ metric.name }}</div>
                <div class="field-role">{{ metric.simulated ? 'Simulated' : 'Measured' }}</div>
              </div>
              <span class="badge" :class="metric.simulated ? 'badge-accent' : 'badge-public'">{{ metric.value }}</span>
            </div>
            <p class="field-description">{{ metric.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section v-if="report?.training_stub?.eval_report?.length" class="card section-gap">
      <div class="card-header"><span>Eval Report</span></div>
      <div class="card-body">
        <div class="field-grid">
          <article v-for="section in report.training_stub.eval_report" :key="section.title" class="field-card">
            <div class="field-name">{{ section.title }}</div>
            <ul class="flat-list">
              <li v-for="bullet in section.bullets" :key="`${section.title}-${bullet}`">{{ bullet }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section v-if="report" class="card section-gap">
      <div class="card-header"><span>Pipeline Snapshot</span></div>
      <div class="card-body">
        <div class="summary-grid section-gap">
          <div class="summary-item">
            <span class="metric-label">Schema Mode</span>
            <strong>{{ report.schema_result.mode }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Discovery Pool</span>
            <strong>{{ report.metadata_discovery.pool_mode }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Selected Datasets</span>
            <strong>{{ report.assembly_plan.summary?.selected_dataset_count ?? 0 }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Preview Rows</span>
            <strong>{{ report.composition_preview.preview_rows?.length ?? 0 }}</strong>
          </div>
        </div>
        <pre class="result-block">{{ JSON.stringify(report, null, 2) }}</pre>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { generateMvpDemoReport } from './api'

const intentText = ref('I want to build a model for predicting crop yield by plot and harvest season.')
const contextText = ref('Use the currently indexed sugarcane-style plot and harvest records as the deterministic demo case.')
const maxFields = ref(8)
const useLlmAssist = ref(false)
const loading = ref(false)
const error = ref('')
const progressValue = ref(0)
const progressMessage = ref('')
const progressState = ref('idle')
const report = ref(null)
const route = useRoute()

const showProgress = computed(() => loading.value || progressState.value === 'error' || progressState.value === 'success')
const progressTitle = computed(() => {
  if (progressState.value === 'error') return 'Demo pipeline failed'
  if (progressState.value === 'success') return 'Demo pipeline completed'
  return 'Running full demo pipeline'
})

function syncRoutePrefill() {
  if (typeof route.query.intent === 'string' && route.query.intent.trim()) {
    intentText.value = route.query.intent
  }
  if (typeof route.query.context === 'string') {
    contextText.value = route.query.context
  }
  if (typeof route.query.max_fields === 'string') {
    const parsed = Number(route.query.max_fields)
    if (Number.isFinite(parsed) && parsed >= 3 && parsed <= 20) {
      maxFields.value = parsed
    }
  }
}

onMounted(syncRoutePrefill)
watch(() => route.query, syncRoutePrefill, { deep: true })

async function runDemo() {
  loading.value = true
  error.value = ''
  report.value = null
  progressState.value = 'loading'
  progressValue.value = 18
  progressMessage.value = useLlmAssist.value
    ? 'Generating intent schema with LLM assistance and retrieving candidate datasets.'
    : 'Generating intent schema and retrieving candidate datasets.'
  try {
    const interval = setInterval(() => {
      progressValue.value = Math.min(progressValue.value + 8, 92)
      if (progressValue.value < 40) {
        progressMessage.value = useLlmAssist.value
          ? 'Building schema with LLM assistance and running metadata discovery.'
          : 'Building schema and running metadata discovery.'
      }
      else if (progressValue.value < 68) progressMessage.value = 'Resolving dataset assembly and preview composition.'
      else progressMessage.value = 'Producing baseline stub and executive summary.'
    }, 600)
    try {
      report.value = await generateMvpDemoReport({
        intent_text: intentText.value,
        context: contextText.value || null,
        max_fields: Number(maxFields.value) || 8,
        top_k: 5,
        disable_llm: !useLlmAssist.value,
        preview_row_limit: 5,
      })
    } finally {
      clearInterval(interval)
    }
    progressState.value = 'success'
    progressValue.value = 100
    progressMessage.value = 'MVP demo report ready.'
  } catch (err) {
    error.value = err.message || 'Failed to generate MVP demo report.'
    progressState.value = 'error'
    progressValue.value = Math.max(progressValue.value, 100)
    progressMessage.value = 'The request failed before the demo report could be generated.'
  } finally {
    loading.value = false
  }
}

async function copyJson() {
  if (!report.value) return
  await navigator.clipboard.writeText(JSON.stringify(report.value, null, 2))
}

function summaryToneClass(tone) {
  if (tone === 'good') return 'tone-good'
  if (tone === 'bad') return 'tone-bad'
  if (tone === 'warn') return 'tone-warn'
  return ''
}
</script>

<style scoped>
.section-gap { margin-bottom: 24px; }
.toolbar,.field-card-top { display:flex; gap:12px; flex-wrap:wrap; }
.toolbar { justify-content:space-between; align-items:center; }
.toolbar-left { display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start; }
.summary-grid,.field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
.field-grid { grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); }
.intent-textarea { min-height:130px; }
.context-textarea { min-height:96px; }
.field-count-input { width:84px; padding:8px 10px; border-radius:8px; border:1.5px solid var(--color-border); }
.llm-toggle {
  display:flex;
  align-items:flex-start;
  gap:10px;
  max-width:540px;
  font-size:0.92rem;
  color:var(--color-text);
}
.llm-toggle input {
  margin-top:4px;
}
.llm-toggle small {
  display:block;
  margin-top:4px;
  color:var(--color-text-secondary);
  line-height:1.45;
}
.progress-track { width:100%; height:12px; border-radius:999px; background:rgba(47,78,162,0.08); overflow:hidden; }
.progress-fill { height:100%; background:linear-gradient(90deg,var(--color-primary-light),var(--color-primary)); transition:width 0.35s ease; }
.progress-fill-error { background:linear-gradient(90deg,#f59e0b,#dc2626); }
.field-card,.card { border-radius:14px; }
.field-card { padding:14px; border:1px solid var(--color-border); background:rgba(255,255,255,0.78); }
.field-description,.field-role,.progress-copy { color:var(--color-text-secondary); }
.field-name,.metric-label { font-weight:700; }
.metric-label,.field-role { font-size:0.82rem; }
.summary-item { display:flex; flex-direction:column; gap:6px; }
.flat-list { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px; }
.tone-good { color:#0f766e; }
.tone-warn { color:#b45309; }
.tone-bad { color:var(--color-danger); }
.result-block {
  margin:0;
  padding:14px;
  background:var(--color-bg-elevated);
  border:1px solid var(--color-border);
  border-radius:var(--radius-sm);
  font-size:0.82rem;
  line-height:1.5;
  overflow:auto;
  max-height:520px;
  white-space:pre-wrap;
  word-break:break-word;
}
@media (max-width: 820px) {
  .toolbar { flex-direction:column; align-items:stretch; }
  .toolbar-left { flex-direction:column; }
}
</style>
