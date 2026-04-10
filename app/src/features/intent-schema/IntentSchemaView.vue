<template>
  <div>
    <div class="page-header">
      <h1>Intent Schema</h1>
      <p>
        Convert a natural-language modeling goal into a schema draft, candidate dataset matches,
        a deterministic assembly plan, and a composition preview.
      </p>
    </div>

    <div class="loading-bar warning-bar">
      This is a dev-only planning module. It produces a governed demo preview, not a production
      training pipeline.
    </div>
    <div v-if="error" class="loading-bar error-bar">{{ error }}</div>

    <section class="card section-gap">
      <div class="card-header"><span>Modeling Intent</span></div>
      <div class="card-body">
        <div v-if="starterPrompts.length" class="starter-grid">
          <button
            v-for="starter in starterPrompts"
            :key="starter.title"
            type="button"
            class="starter-btn"
            @click="intentText = starter.prompt"
          >
            <strong>{{ starter.title }}</strong>
            <span>{{ starter.prompt }}</span>
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Intent</label>
          <textarea
            v-model="intentText"
            class="form-input intent-textarea"
            placeholder="Example: I want to build a model for predicting customer churn."
          />
        </div>
        <div class="form-group">
          <label class="form-label">Optional Context</label>
          <textarea
            v-model="contextText"
            class="form-input context-textarea"
            placeholder="Add label, horizon, business rules, or entity grain."
          />
        </div>
        <div class="toolbar">
          <label class="form-label inline-label">
            Max Fields
            <input v-model.number="maxFields" type="number" min="3" max="20" class="field-count-input" />
          </label>
          <div class="toolbar-actions">
            <button class="btn btn-primary" :disabled="loading || !intentText.trim()" @click="submitIntent">
              {{ loading ? 'Generating...' : 'Generate Schema' }}
            </button>
            <button class="btn btn-outline" :disabled="!result || discoveryLoading" @click="runMetadataDiscovery">
              {{ discoveryLoading ? 'Discovering...' : 'Run Metadata Discovery' }}
            </button>
            <button class="btn btn-outline" :disabled="!result || assemblyLoading" @click="runDatasetAssemblyPlan">
              {{ assemblyLoading ? 'Planning...' : 'Build Dataset Assembly Plan' }}
            </button>
            <button class="btn btn-outline" :disabled="!result || previewLoading" @click="runCompositionPreview">
              {{ previewLoading ? 'Previewing...' : 'Compose Preview Dataset' }}
            </button>
            <button class="btn btn-outline" :disabled="!result || trainingStubLoading" @click="runTrainingStub">
              {{ trainingStubLoading ? 'Evaluating...' : 'Run Baseline Training Stub' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="loading || discoveryLoading || assemblyLoading || previewLoading || trainingStubLoading" class="card section-gap">
      <div class="card-body">
        <div class="metric-label">{{ progressHeadline }}</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressValue}%` }"></div>
        </div>
        <p class="progress-copy">{{ progressMessage }}</p>
      </div>
    </div>

    <section v-if="result" class="card section-gap">
      <div class="card-header">
        <span>Schema Draft</span>
        <div class="toolbar-actions">
          <span class="badge">{{ result.mode === 'llm' ? 'LLM' : 'Fallback' }}</span>
          <button class="btn btn-outline" @click="copyJson">Copy JSON</button>
        </div>
      </div>
      <div class="card-body">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="metric-label">Intent Summary</span>
            <strong>{{ result.intent_summary }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Task Type</span>
            <strong>{{ result.task_type }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Entity Grain</span>
            <strong>{{ result.entity_grain }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Target Column</span>
            <strong>{{ result.target_column }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Prediction Horizon</span>
            <strong>{{ result.prediction_horizon || 'Not specified' }}</strong>
          </div>
        </div>
        <div class="field-grid">
          <article v-for="field in result.schema_fields" :key="field.name" class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ field.name }}</div>
                <div class="field-role">{{ field.semantic_role }} | {{ field.data_type }}</div>
              </div>
              <span class="badge" :class="field.required ? 'badge-public' : 'badge-accent'">
                {{ field.required ? 'Required' : 'Optional' }}
              </span>
            </div>
            <p class="field-description">{{ field.description }}</p>
            <div v-if="field.expected_range" class="field-meta">
              <span class="metric-label">Expected Range</span>
              <strong>{{ field.expected_range }}</strong>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="discoveryView" class="card section-gap">
      <div class="card-header"><span>Metadata Discovery</span></div>
      <div class="card-body">
        <div v-if="discoveryCoverageEmpty" class="loading-bar warning-bar section-gap">
          No current candidate provides direct or derivable coverage. Internal PATRA column-aware assets are still sparse.
        </div>
        <div class="summary-grid section-gap">
          <div class="summary-item">
            <span class="metric-label">Pool Mode</span>
            <strong>{{ discoveryView.pool_mode }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Candidate Count</span>
            <strong>{{ discoveryView.candidate_count }}</strong>
          </div>
          <div v-if="discoveryView.winner_coverage" class="summary-item">
            <span class="metric-label">Direct</span>
            <strong>{{ discoveryView.winner_coverage.direct_count }}/{{ discoveryView.winner_coverage.total_fields }}</strong>
          </div>
          <div v-if="discoveryView.winner_coverage" class="summary-item">
            <span class="metric-label">Derivable</span>
            <strong>{{ discoveryView.winner_coverage.derivable_count }}/{{ discoveryView.winner_coverage.total_fields }}</strong>
          </div>
        </div>
        <div class="field-grid">
          <article v-for="candidate in discoveryView.ranking" :key="candidate.dataset_id" class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ candidate.title }}</div>
                <div class="field-role">{{ candidate.dataset_id }} | {{ formatSourceFamily(candidate.source_family) }}</div>
              </div>
              <span class="badge badge-public">Score {{ candidate.score.toFixed(3) }}</span>
            </div>
            <div class="token-list">
              <span class="token-chip token-chip-good">Matched {{ candidate.matched_field_groups.length }}</span>
              <span class="token-chip token-chip-warn">Derivable {{ candidate.derivable_field_groups.length }}</span>
              <span class="token-chip token-chip-muted">Missing {{ candidate.missing_field_groups.length }}</span>
            </div>
            <details class="candidate-debug">
              <summary>Debug scoring details</summary>
              <p class="field-description">{{ candidate.summary }}</p>
            </details>
          </article>
        </div>
      </div>
    </section>

    <section v-if="assemblyPlan" class="card section-gap">
      <div class="card-header"><span>Dataset Assembly Plan</span></div>
      <div class="card-body">
        <div class="summary-grid section-gap">
          <div class="summary-item">
            <span class="metric-label">Direct</span>
            <strong>{{ assemblyPlan.summary.direct_count }}/{{ assemblyPlan.summary.total_fields }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Derivable</span>
            <strong>{{ assemblyPlan.summary.derivable_count }}/{{ assemblyPlan.summary.total_fields }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Missing</span>
            <strong>{{ assemblyPlan.summary.missing_count }}/{{ assemblyPlan.summary.total_fields }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Selected Datasets</span>
            <strong>{{ assemblyPlan.summary.selected_dataset_count }}</strong>
          </div>
        </div>
        <div v-if="assemblyPlan.join_requirements?.length" class="section-gap">
          <div class="metric-label">Join And Execution Warnings</div>
          <ul class="flat-list">
            <li v-for="warning in assemblyPlan.join_requirements" :key="warning.message">{{ warning.message }}</li>
          </ul>
        </div>
        <div v-if="assemblyPlan.fallback_recommendations?.length" class="section-gap">
          <div class="metric-label">Fallback Recommendations</div>
          <ul class="flat-list">
            <li v-for="item in assemblyPlan.fallback_recommendations" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div v-if="assemblyPlan.selected_datasets?.length" class="field-grid section-gap">
          <article v-for="dataset in assemblyPlan.selected_datasets" :key="dataset.dataset_id" class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ dataset.title }}</div>
                <div class="field-role">{{ dataset.dataset_id }} | {{ formatSourceFamily(dataset.source_family) }}</div>
              </div>
              <span class="badge badge-public">{{ formatSourceTier(dataset.source_tier) }}</span>
            </div>
            <div class="token-list">
              <span
                v-for="fieldName in dataset.direct_fields"
                :key="`${dataset.dataset_id}-direct-${fieldName}`"
                class="token-chip token-chip-good"
              >{{ fieldName }}</span>
              <span
                v-for="fieldName in dataset.derivable_fields"
                :key="`${dataset.dataset_id}-derivable-${fieldName}`"
                class="token-chip token-chip-warn"
              >{{ fieldName }}</span>
            </div>
          </article>
        </div>
        <div class="field-grid">
          <article v-for="row in assemblyPlan.field_resolutions" :key="row.target_field" class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ row.target_field }}</div>
                <div class="field-role">{{ row.semantic_role }} | {{ formatResolutionStatus(row.resolution_status) }}</div>
              </div>
              <span class="badge" :class="resolutionBadgeClass(row.resolution_status)">{{ formatResolutionStatus(row.resolution_status) }}</span>
            </div>
            <div v-if="row.source_dataset_title" class="field-meta">
              <span class="metric-label">Chosen Source</span>
              <strong>{{ row.source_dataset_title }}</strong>
            </div>
            <div v-if="row.source_tier" class="field-meta">
              <span class="metric-label">Source Tier</span>
              <strong>{{ formatSourceTier(row.source_tier) }}</strong>
            </div>
            <div v-if="row.source_columns?.length" class="token-list">
              <span
                v-for="columnName in row.source_columns"
                :key="`${row.target_field}-${columnName}`"
                class="token-chip token-chip-muted"
              >{{ columnName }}</span>
            </div>
            <p class="field-description">{{ row.rationale }}</p>
          </article>
        </div>
      </div>
    </section>

    <section v-if="compositionPreview" class="card section-gap">
      <div class="card-header"><span>Dataset Composition Preview</span></div>
      <div class="card-body">
        <div v-if="compositionPreview.manifest?.blocked" class="loading-bar warning-bar section-gap">
          <strong>Preview blocked.</strong>
          <ul class="flat-list">
            <li v-for="reason in compositionPreview.manifest.block_reasons" :key="reason">{{ reason }}</li>
          </ul>
        </div>
        <div class="summary-grid section-gap">
          <div class="summary-item">
            <span class="metric-label">Preview Mode</span>
            <strong>{{ compositionPreview.manifest.preview_mode }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Selected Datasets</span>
            <strong>{{ compositionPreview.manifest.selected_dataset_count }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Manifest Fields</span>
            <strong>{{ compositionPreview.manifest.fields.length }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Preview Rows</span>
            <strong>{{ compositionPreview.preview_rows.length }}</strong>
          </div>
        </div>
        <div class="field-grid section-gap">
          <article
            v-for="field in compositionPreview.manifest.fields"
            :key="`manifest-${field.target_field}`"
            class="field-card"
          >
            <div class="field-card-top">
              <div>
                <div class="field-name">{{ field.target_field }}</div>
                <div class="field-role">{{ formatResolutionStatus(field.resolution_status) }}</div>
              </div>
              <span class="badge" :class="field.included_in_preview ? 'badge-public' : 'badge-private'">
                {{ field.included_in_preview ? 'Included In Preview' : 'Not Previewed' }}
              </span>
            </div>
            <div v-if="field.source_tier" class="field-meta">
              <span class="metric-label">Source Tier</span>
              <strong>{{ formatSourceTier(field.source_tier) }}</strong>
            </div>
            <div v-if="field.source_dataset_id" class="field-meta">
              <span class="metric-label">Source Dataset</span>
              <strong>{{ field.source_dataset_id }}</strong>
            </div>
            <div v-if="field.source_columns?.length" class="token-list">
              <span
                v-for="columnName in field.source_columns"
                :key="`manifest-${field.target_field}-${columnName}`"
                class="token-chip token-chip-muted"
              >{{ columnName }}</span>
            </div>
            <ul v-if="field.notes?.length" class="flat-list">
              <li v-for="note in field.notes" :key="`${field.target_field}-${note}`">{{ note }}</li>
            </ul>
          </article>
        </div>
        <div v-if="compositionPreview.preview_rows.length" class="section-gap">
          <div class="metric-label">Preview Rows</div>
          <pre class="result-block">{{ JSON.stringify(compositionPreview.preview_rows, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <section v-if="trainingStub" class="card section-gap">
      <div class="card-header"><span>Baseline Training Stub + Eval Report</span></div>
      <div class="card-body">
        <div class="summary-grid section-gap">
          <div class="summary-item">
            <span class="metric-label">Execution Status</span>
            <strong>{{ trainingStub.summary.execution_status }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Gate Status</span>
            <strong>{{ trainingStub.summary.gate_status }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Task Type</span>
            <strong>{{ trainingStub.summary.task_type }}</strong>
          </div>
          <div class="summary-item">
            <span class="metric-label">Preview Rows</span>
            <strong>{{ trainingStub.summary.preview_row_count }}</strong>
          </div>
        </div>

        <div class="field-grid section-gap">
          <article class="field-card">
            <div class="field-card-top">
              <div>
                <div class="field-name">Recommended Baseline</div>
                <div class="field-role">{{ trainingStub.recommendation.training_scope }}</div>
              </div>
              <span class="badge badge-public">{{ trainingStub.recommendation.model_family }}</span>
            </div>
            <p class="field-description">{{ trainingStub.recommendation.reason }}</p>
          </article>
        </div>

        <div v-if="trainingStub.metrics?.length" class="field-grid section-gap">
          <article v-for="metric in trainingStub.metrics" :key="metric.name" class="field-card">
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

        <div v-if="trainingStub.eval_report?.length" class="field-grid section-gap">
          <article v-for="section in trainingStub.eval_report" :key="section.title" class="field-card">
            <div class="field-name">{{ section.title }}</div>
            <ul class="flat-list">
              <li v-for="bullet in section.bullets" :key="`${section.title}-${bullet}`">{{ bullet }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  buildDatasetAssemblyPlan,
  buildDatasetCompositionPreview,
  discoverMetadata,
  fetchIntentSchemaBootstrap,
  generateIntentSchema,
  runBaselineTrainingStub,
} from './api'

const intentText = ref('')
const contextText = ref('')
const maxFields = ref(8)
const starterPrompts = ref([])
const result = ref(null)
const discoveryResult = ref(null)
const assemblyPlan = ref(null)
const compositionPreview = ref(null)
const trainingStub = ref(null)
const error = ref('')
const loading = ref(false)
const discoveryLoading = ref(false)
const assemblyLoading = ref(false)
const previewLoading = ref(false)
const trainingStubLoading = ref(false)
const progressValue = ref(0)
const progressMessage = ref('')

const discoveryView = computed(() => discoveryResult.value)
const discoveryCoverageEmpty = computed(() => {
  const coverage = discoveryView.value?.winner_coverage
  return Boolean(coverage && coverage.direct_count === 0 && coverage.derivable_count === 0)
})
const progressHeadline = computed(() => {
  if (loading.value) return 'Generating schema draft'
  if (discoveryLoading.value) return 'Discovering candidate datasets'
  if (assemblyLoading.value) return 'Building dataset assembly plan'
  if (previewLoading.value) return 'Composing deterministic preview dataset'
  if (trainingStubLoading.value) return 'Evaluating baseline training stub'
  return ''
})
const route = useRoute()

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

onMounted(async () => {
  syncRoutePrefill()
  try {
    const payload = await fetchIntentSchemaBootstrap()
    starterPrompts.value = payload.starter_prompts || []
  } catch (err) {
    error.value = err.message || 'Failed to load module bootstrap.'
  }
})

watch(() => route.query, syncRoutePrefill, { deep: true })

async function submitIntent() {
  loading.value = true
  progressValue.value = 28
  progressMessage.value = 'Interpreting intent and drafting task boundaries.'
  error.value = ''
  discoveryResult.value = null
  assemblyPlan.value = null
  compositionPreview.value = null
  trainingStub.value = null
  try {
    result.value = await generateIntentSchema({
      intent_text: intentText.value,
      context: contextText.value || null,
      max_fields: Number(maxFields.value) || 8,
    })
    progressValue.value = 100
    progressMessage.value = 'Schema draft ready.'
  } catch (err) {
    error.value = err.message || 'Schema generation failed.'
  } finally {
    loading.value = false
  }
}

async function runMetadataDiscovery() {
  if (!result.value) return
  discoveryLoading.value = true
  progressValue.value = 52
  progressMessage.value = 'Ranking candidate datasets with the shared matcher.'
  error.value = ''
  try {
    discoveryResult.value = await discoverMetadata({ intent_schema: result.value, top_k: 5, disable_llm: true })
    assemblyPlan.value = null
    compositionPreview.value = null
    trainingStub.value = null
    progressValue.value = 100
    progressMessage.value = 'Metadata discovery ready.'
  } catch (err) {
    error.value = err.message || 'Metadata discovery failed.'
  } finally {
    discoveryLoading.value = false
  }
}

async function runDatasetAssemblyPlan() {
  if (!result.value) return
  assemblyLoading.value = true
  progressValue.value = 72
  progressMessage.value = 'Resolving field-level sources and join requirements.'
  error.value = ''
  try {
    assemblyPlan.value = await buildDatasetAssemblyPlan({ intent_schema: result.value, top_k: 5, disable_llm: true })
    compositionPreview.value = null
    trainingStub.value = null
    progressValue.value = 100
    progressMessage.value = 'Dataset assembly plan ready.'
  } catch (err) {
    error.value = err.message || 'Dataset assembly planning failed.'
  } finally {
    assemblyLoading.value = false
  }
}

async function runCompositionPreview() {
  if (!result.value) return
  previewLoading.value = true
  progressValue.value = 84
  progressMessage.value = 'Building a deterministic manifest and sample preview rows.'
  error.value = ''
  try {
    compositionPreview.value = await buildDatasetCompositionPreview({
      intent_schema: result.value,
      top_k: 5,
      disable_llm: true,
      preview_row_limit: 5,
    })
    if (!assemblyPlan.value && compositionPreview.value?.assembly_plan) {
      assemblyPlan.value = compositionPreview.value.assembly_plan
    }
    trainingStub.value = null
    progressValue.value = 100
    progressMessage.value = 'Dataset composition preview ready.'
  } catch (err) {
    error.value = err.message || 'Dataset composition preview failed.'
  } finally {
    previewLoading.value = false
  }
}

async function runTrainingStub() {
  if (!result.value) return
  trainingStubLoading.value = true
  progressValue.value = 92
  progressMessage.value = 'Evaluating deterministic readiness and generating a simulated baseline report.'
  error.value = ''
  try {
    trainingStub.value = await runBaselineTrainingStub({
      intent_schema: result.value,
      top_k: 5,
      disable_llm: true,
      preview_row_limit: 5,
    })
    if (!compositionPreview.value && trainingStub.value?.composition_preview) {
      compositionPreview.value = trainingStub.value.composition_preview
    }
    if (!assemblyPlan.value && trainingStub.value?.training_readiness?.assembly_plan) {
      assemblyPlan.value = trainingStub.value.training_readiness.assembly_plan
    }
    progressValue.value = 100
    progressMessage.value = 'Baseline training stub report ready.'
  } catch (err) {
    error.value = err.message || 'Baseline training stub failed.'
  } finally {
    trainingStubLoading.value = false
  }
}

async function copyJson() {
  if (!result.value) return
  await navigator.clipboard.writeText(JSON.stringify(result.value, null, 2))
}

function formatSourceFamily(sourceFamily) {
  return String(sourceFamily || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatSourceTier(sourceTier) {
  return {
    tier1_real: 'Tier 1 Real',
    tier2_approved_derived: 'Tier 2 Approved Derived',
    tier2_approved_synthetic: 'Tier 2 Approved Synthetic',
    tier3_generated: 'Tier 3 Generated',
    external_fallback: 'External Fallback',
  }[sourceTier] || sourceTier || 'Unknown'
}

function formatResolutionStatus(status) {
  return { direct: 'Direct', derivable: 'Derivable', missing: 'Missing' }[status] || status
}

function resolutionBadgeClass(status) {
  if (status === 'direct') return 'badge-public'
  if (status === 'derivable') return 'badge-accent'
  return 'badge-private'
}
</script>

<style scoped>
.section-gap { margin-bottom: 24px; }
.toolbar,.toolbar-actions,.field-card-top,.token-list,.starter-grid { display:flex; gap:12px; flex-wrap:wrap; }
.toolbar { justify-content:space-between; align-items:center; }
.toolbar-actions { align-items:center; }
.summary-grid,.field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
.field-grid { grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); }
.starter-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }
.starter-btn,.field-card,.card { border-radius:14px; }
.starter-btn,.field-card { padding:14px; border:1px solid var(--color-border); background:rgba(255,255,255,0.78); text-align:left; }
.intent-textarea { min-height:130px; }
.context-textarea { min-height:96px; }
.field-count-input { width:84px; padding:8px 10px; border-radius:8px; border:1.5px solid var(--color-border); }
.progress-track { width:100%; height:12px; border-radius:999px; background:rgba(47,78,162,0.08); overflow:hidden; }
.progress-fill { height:100%; background:linear-gradient(90deg,var(--color-primary-light),var(--color-primary)); transition:width 0.35s ease; }
.progress-copy,.field-description,.field-role { color:var(--color-text-secondary); }
.field-name,.top-match-title { font-weight:700; }
.field-role,.metric-label { font-size:0.82rem; }
.field-meta,.summary-item { display:flex; flex-direction:column; gap:6px; }
.token-chip,.badge { display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px; font-size:0.8rem; }
.token-chip-good { background:rgba(16,185,129,0.12); color:#0f766e; }
.token-chip-warn { background:rgba(245,158,11,0.12); color:#b45309; }
.token-chip-muted { background:rgba(148,163,184,0.12); color:var(--color-text-secondary); }
.flat-list { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px; }
.candidate-debug { margin-top:10px; }
.candidate-debug summary { cursor:pointer; color:var(--color-text-secondary); font-size:0.82rem; }
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
}
</style>
