<template>
  <div>
    <div class="page-header">
      <h1>Automated Ingestion</h1>
      <p>Discover external CSV resources, validate them with controlled AI checks, and keep the resulting artifacts in an admin-only ingestion pool.</p>
    </div>

    <div v-if="apiMode.supportsAskPatra && (auth.isTapisUser || auth.isAdmin)" class="ask-patra-callout">
      <div>
        <div class="ask-patra-callout-title">Start in Ask Patra</div>
        <div class="ask-patra-callout-text">
          Use Ask Patra first when you want help deciding whether this source belongs in automated ingestion, preparing the source URL, or routing to a safer workflow.
        </div>
      </div>
      <RouterLink
        :to="{ path: '/ask-patra', query: { prompt: 'Help me evaluate whether this CSV source should go through automated ingestion.' } }"
        class="btn btn-outline"
      >
        Open Ask Patra
      </RouterLink>
    </div>

    <div v-if="!(auth.isAdmin || apiMode.supportsDevOpenAccess)" class="card">
      <div class="card-body">
        <div class="empty-state compact">
          <IconLock :size="34" stroke-width="1.5" />
          <p>This page is available only to admins.</p>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="card">
        <div class="card-header">
            <span class="flex items-center gap-8">
              <IconWorldDownload :size="18" stroke-width="1.8" />
            Start automated CSV ingestion
            </span>
        </div>
        <div class="card-body">
          <div class="form-helper block-helper">
            Submit a public page or direct CSV URL. PATRA will discover CSV links, run code-level filters, validate candidates with the LLM, and write passing artifacts into the isolated ingestion pool.
          </div>

          <div class="search-row">
            <input
              class="form-input"
              v-model="sourceUrl"
              placeholder="https://example.org/page-with-csv-links"
            />
            <button class="btn btn-primary" :disabled="submittingJob" @click="handleStartJob">
              <IconPlayerPlay :size="16" stroke-width="1.8" />
              {{ submittingJob ? 'Starting...' : 'Start ingestion' }}
            </button>
          </div>

          <div class="form-error" v-if="jobError">{{ jobError }}</div>
        </div>
      </div>

      <div class="two-column-grid">
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8">
              <IconProgressCheck :size="18" stroke-width="1.8" />
              Recent jobs
            </span>
          </div>
          <div class="card-body">
            <div class="job-list" v-if="jobs.length">
              <button
                v-for="job in jobs"
                :key="job.id"
                class="job-card"
                :class="{ active: selectedJob && selectedJob.id === job.id }"
                @click="selectJob(job)"
              >
                <div class="job-card-header">
                  <strong>#{{ job.id }}</strong>
                  <span class="status-pill" :class="statusClass(job.status)">{{ job.status }}</span>
                </div>
                <div class="job-card-url">{{ job.source_url }}</div>
                <div class="job-card-meta">
                  <span>{{ job.created_artifact_count }} artifacts</span>
                  <span>{{ job.processed_csv_count }}/{{ job.discovered_csv_count }} processed</span>
                </div>
              </button>
            </div>
            <div class="empty-state compact" v-else>
              <IconDatabaseSearch :size="28" stroke-width="1.5" />
              <p>No ingestion jobs yet.</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8">
              <IconReportAnalytics :size="18" stroke-width="1.8" />
              Job detail
            </span>
          </div>
          <div class="card-body" v-if="selectedJob">
            <div class="detail-grid">
              <div><span class="detail-key">Status</span><strong>{{ selectedJob.status }}</strong></div>
              <div><span class="detail-key">Discovered CSVs</span><strong>{{ selectedJob.discovered_csv_count }}</strong></div>
              <div><span class="detail-key">Passed</span><strong>{{ selectedJob.passed_csv_count }}</strong></div>
              <div><span class="detail-key">Artifacts</span><strong>{{ selectedJob.created_artifact_count }}</strong></div>
            </div>
            <div class="mini-section" v-if="selectedJob.page_title">
              <div class="mini-section-title">Source page title</div>
              <div>{{ selectedJob.page_title }}</div>
            </div>
            <div class="mini-section" v-if="selectedJob.discovered_csv_urls?.length">
              <div class="mini-section-title">Discovered CSV URLs</div>
              <ul class="simple-list">
                <li v-for="csvUrl in selectedJob.discovered_csv_urls" :key="csvUrl">
                  <a :href="csvUrl" target="_blank" rel="noreferrer">{{ csvUrl }}</a>
                </li>
              </ul>
            </div>
            <div class="mini-section" v-if="selectedJob.recent_failures?.length">
              <div class="mini-section-title">Recent failures</div>
              <ul class="simple-list">
                <li v-for="failure in selectedJob.recent_failures" :key="failure">{{ failure }}</li>
              </ul>
            </div>
            <div class="form-error" v-if="selectedJob.error_message">{{ selectedJob.error_message }}</div>
          </div>
          <div class="card-body" v-else>
            <div class="empty-state compact">
              <IconProgressCheck :size="28" stroke-width="1.5" />
              <p>Select a job to inspect progress.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="flex items-center gap-8">
            <IconDatabaseSearch :size="18" stroke-width="1.8" />
            Automated ingestion pool
          </span>
        </div>
        <div class="card-body">
          <div class="toolbar-row">
            <div class="filter-chips">
              <button class="chip" :class="{ active: artifactStatusFilter === '' }" @click="setArtifactFilter('')">All</button>
              <button class="chip" :class="{ active: artifactStatusFilter === 'pending_review' }" @click="setArtifactFilter('pending_review')">Pending review</button>
              <button class="chip" :class="{ active: artifactStatusFilter === 'approved' }" @click="setArtifactFilter('approved')">Approved</button>
              <button class="chip" :class="{ active: artifactStatusFilter === 'rejected' }" @click="setArtifactFilter('rejected')">Rejected</button>
            </div>
            <button class="btn btn-outline btn-sm" @click="loadArtifacts">Refresh</button>
          </div>

          <div class="record-grid" v-if="artifacts.length">
            <button
              v-for="artifact in artifacts"
              :key="artifact.id"
              class="record-card"
              :class="{ active: selectedArtifact && selectedArtifact.id === artifact.id }"
              @click="selectArtifact(artifact)"
            >
              <div class="record-card-header">
                <span class="record-kind">CSV Resource</span>
                <span class="status-pill" :class="statusClass(artifact.status)">{{ artifact.status }}</span>
              </div>
              <div class="record-card-title">{{ artifact.title }}</div>
              <div class="record-card-subtitle">{{ artifact.page_title || artifact.csv_url }}</div>
              <div class="record-card-description">{{ artifact.csv_url }}</div>
            </button>
          </div>
          <div class="empty-state compact" v-else>
            <IconDatabaseSearch :size="28" stroke-width="1.5" />
            <p>No ingestion artifacts found for the current filter.</p>
          </div>
        </div>
      </div>

      <div class="card" v-if="selectedArtifact">
        <div class="card-header">
          <span class="flex items-center gap-8">
            <IconFileSearch :size="18" stroke-width="1.8" />
            Artifact detail
          </span>
        </div>
        <div class="card-body">
          <div class="detail-grid">
            <div><span class="detail-key">Artifact</span><strong>#{{ selectedArtifact.id }}</strong></div>
            <div><span class="detail-key">Job</span><strong>#{{ selectedArtifact.job_id }}</strong></div>
            <div><span class="detail-key">Status</span><strong>{{ selectedArtifact.status }}</strong></div>
            <div><span class="detail-key">Created by</span><strong>{{ selectedArtifact.created_by || 'unknown' }}</strong></div>
          </div>

          <div class="action-row">
            <a class="btn btn-outline btn-sm" :href="artifactDownloadUrl(selectedArtifact.id, 'csv')" target="_blank" rel="noreferrer">Download CSV</a>
            <a class="btn btn-outline btn-sm" :href="artifactDownloadUrl(selectedArtifact.id, 'schema')" target="_blank" rel="noreferrer">Download schema</a>
          </div>

          <div class="detail-grid detail-grid-compact">
            <div class="link-card">
              <span class="detail-key">Source page</span>
              <a :href="selectedArtifact.source_url" target="_blank" rel="noreferrer">{{ selectedArtifact.page_title || selectedArtifact.source_url }}</a>
            </div>
            <div class="link-card">
              <span class="detail-key">CSV source</span>
              <a :href="selectedArtifact.csv_url" target="_blank" rel="noreferrer">{{ selectedArtifact.csv_url }}</a>
            </div>
          </div>

          <div class="mini-section">
            <div class="mini-section-title">Headers sample</div>
            <div class="field-pill-list">
              <span class="field-pill" v-for="header in selectedArtifact.headers_sample" :key="header">{{ header }}</span>
            </div>
          </div>

          <div class="mini-section">
            <div class="mini-section-title">Preview rows</div>
            <div class="sample-table-wrap" v-if="sampleTableHeaders.length">
              <table class="sample-table">
                <thead>
                  <tr>
                    <th v-for="header in sampleTableHeaders" :key="header">{{ header }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in selectedArtifact.rows_sample" :key="index">
                    <td v-for="header in sampleTableHeaders" :key="`${index}-${header}`">{{ formatCell(row?.[header]) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-state compact" v-else>
              <p>No row preview is available.</p>
            </div>
          </div>

          <div class="mini-section">
            <div class="mini-section-title">AI validation</div>
            <div class="detail-grid detail-grid-compact">
              <div><span class="detail-key">Result</span><strong>{{ selectedArtifact.validation_result.pass ? 'Pass' : 'Reject' }}</strong></div>
              <div><span class="detail-key">Confidence</span><strong>{{ formatConfidence(selectedArtifact.validation_result.confidence) }}</strong></div>
              <div><span class="detail-key">Resource type</span><strong>{{ selectedArtifact.validation_result.resource_type || 'unknown' }}</strong></div>
              <div><span class="detail-key">Recommended title</span><strong>{{ selectedArtifact.validation_result.recommended_title || 'n/a' }}</strong></div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Validation summary</div>
              <div class="summary-card-body">{{ selectedArtifact.validation_result.summary }}</div>
            </div>
            <div class="summary-card" v-if="selectedArtifact.validation_result.license_guess">
              <div class="summary-card-title">License guess</div>
              <div class="summary-card-body">{{ selectedArtifact.validation_result.license_guess }}</div>
            </div>
            <div class="summary-card" v-if="selectedArtifact.validation_result.field_mappings?.length">
              <div class="summary-card-title">Field mappings</div>
              <div class="mapping-list">
                <div class="mapping-item" v-for="mapping in selectedArtifact.validation_result.field_mappings" :key="`${mapping.source_header}-${mapping.target_field}`">
                  <div class="mapping-head">
                    <span class="field-pill">{{ mapping.source_header }}</span>
                    <span class="mapping-arrow">-&gt;</span>
                    <span class="field-pill field-pill-target">{{ mapping.target_field }}</span>
                  </div>
                  <div class="mapping-rationale">{{ mapping.rationale }}</div>
                </div>
              </div>
            </div>
            <div class="summary-card summary-card-danger" v-if="selectedArtifact.validation_result.reject_reasons?.length">
              <div class="summary-card-title">Reject reasons</div>
              <ul class="simple-list">
                <li v-for="reason in selectedArtifact.validation_result.reject_reasons" :key="reason">{{ reason }}</li>
              </ul>
            </div>
          </div>

          <div class="mini-section">
            <div class="mini-section-title">Datasheet draft</div>
            <div class="summary-card">
              <div class="summary-card-title">Title</div>
              <div class="summary-card-body">{{ selectedArtifact.datasheet_draft.title }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-title">Description</div>
              <div class="summary-card-body">{{ selectedArtifact.datasheet_draft.description }}</div>
            </div>
            <div class="detail-grid detail-grid-compact">
              <div><span class="detail-key">Resource type</span><strong>{{ selectedArtifact.datasheet_draft.resource_type }}</strong></div>
              <div><span class="detail-key">Publisher</span><strong>{{ selectedArtifact.datasheet_draft.publisher || 'unknown' }}</strong></div>
              <div><span class="detail-key">License guess</span><strong>{{ selectedArtifact.datasheet_draft.license_guess || 'unknown' }}</strong></div>
              <div><span class="detail-key">Related download</span><strong>{{ selectedArtifact.datasheet_draft.related_download_url ? 'present' : 'n/a' }}</strong></div>
            </div>
            <div class="summary-card" v-if="selectedArtifact.datasheet_draft.subjects?.length">
              <div class="summary-card-title">Subjects</div>
              <div class="field-pill-list">
                <span class="field-pill" v-for="subject in selectedArtifact.datasheet_draft.subjects" :key="subject">{{ subject }}</span>
              </div>
            </div>
            <div class="summary-card" v-if="selectedArtifact.datasheet_draft.potential_uses?.length">
              <div class="summary-card-title">Potential uses</div>
              <ul class="simple-list">
                <li v-for="use in selectedArtifact.datasheet_draft.potential_uses" :key="use">{{ use }}</li>
              </ul>
            </div>
            <div class="summary-card" v-if="selectedArtifact.datasheet_draft.sample_notes?.length">
              <div class="summary-card-title">Generation notes</div>
              <ul class="simple-list">
                <li v-for="note in selectedArtifact.datasheet_draft.sample_notes" :key="note">{{ note }}</li>
              </ul>
            </div>
          </div>

          <div class="mini-section review-box">
            <div class="mini-section-title">Admin review</div>
            <textarea
              class="form-input form-textarea"
              rows="3"
              v-model="reviewNotes"
              placeholder="Optional review notes"
            ></textarea>
            <div class="action-row">
              <button class="btn btn-primary" :disabled="reviewLoading || selectedArtifact.status === 'approved'" @click="submitReview('approved')">
                {{ reviewLoading ? 'Saving...' : 'Approve' }}
              </button>
              <button class="btn btn-outline" :disabled="reviewLoading || selectedArtifact.status === 'rejected'" @click="submitReview('rejected')">
                Reject
              </button>
            </div>
            <div class="form-error" v-if="reviewError">{{ reviewError }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  IconDatabaseSearch,
  IconFileSearch,
  IconLock,
  IconPlayerPlay,
  IconProgressCheck,
  IconReportAnalytics,
  IconWorldDownload,
} from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { useApiModeStore } from '../../stores/apiMode'
import {
  artifactDownloadUrl,
  fetchIngestionArtifact,
  fetchIngestionArtifacts,
  fetchIngestionJob,
  fetchIngestionJobs,
  reviewIngestionArtifact,
  startAutomatedIngestion,
} from './api'

const auth = useAuthStore()
const apiMode = useApiModeStore()
const route = useRoute()

const sourceUrl = ref('')
const submittingJob = ref(false)
const jobError = ref('')
const jobs = ref([])
const selectedJob = ref(null)
const pollTimer = ref(null)

const artifactStatusFilter = ref('')
const artifacts = ref([])
const selectedArtifact = ref(null)
const reviewNotes = ref('')
const reviewError = ref('')
const reviewLoading = ref(false)
const sampleTableHeaders = computed(() => {
  if (!selectedArtifact.value?.headers_sample?.length) return []
  return selectedArtifact.value.headers_sample.slice(0, 8)
})

onMounted(async () => {
  if (typeof route.query.source_url === 'string' && route.query.source_url.trim()) {
    sourceUrl.value = route.query.source_url
  }
  if (!(auth.isAdmin || apiMode.supportsDevOpenAccess)) return
  await Promise.all([loadJobs(), loadArtifacts()])
})

watch(() => route.query.source_url, (nextValue) => {
  if (typeof nextValue === 'string' && nextValue !== sourceUrl.value) {
    sourceUrl.value = nextValue
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

async function handleStartJob() {
  jobError.value = ''
  const normalized = String(sourceUrl.value || '').trim()
  if (!normalized) {
    jobError.value = 'A source URL is required.'
    return
  }
  submittingJob.value = true
  try {
    const created = await startAutomatedIngestion(normalized)
    sourceUrl.value = ''
    await loadJobs()
    await selectJob(created)
  } catch (error) {
    jobError.value = error.message || 'Unable to start ingestion.'
  } finally {
    submittingJob.value = false
  }
}

async function loadJobs() {
  jobs.value = await fetchIngestionJobs()
}

async function selectJob(job) {
  const detail = await fetchIngestionJob(job.id)
  selectedJob.value = detail
  if (isActiveJob(detail.status)) {
    startPolling(detail.id)
  } else {
    stopPolling()
  }
}

async function loadArtifacts() {
  artifacts.value = await fetchIngestionArtifacts(artifactStatusFilter.value)
  if (selectedArtifact.value) {
    const match = artifacts.value.find((item) => item.id === selectedArtifact.value.id)
    if (!match) {
      selectedArtifact.value = null
    }
  }
}

async function selectArtifact(artifact) {
  selectedArtifact.value = await fetchIngestionArtifact(artifact.id)
  reviewNotes.value = selectedArtifact.value.review_notes || ''
  reviewError.value = ''
}

async function submitReview(status) {
  if (!selectedArtifact.value) return
  reviewLoading.value = true
  reviewError.value = ''
  try {
    selectedArtifact.value = await reviewIngestionArtifact(selectedArtifact.value.id, status, reviewNotes.value)
    await loadArtifacts()
  } catch (error) {
    reviewError.value = error.message || 'Unable to save review.'
  } finally {
    reviewLoading.value = false
  }
}

function setArtifactFilter(status) {
  artifactStatusFilter.value = status
  loadArtifacts()
}

function startPolling(jobId) {
  stopPolling()
  pollTimer.value = setInterval(async () => {
    const detail = await fetchIngestionJob(jobId)
    selectedJob.value = detail
    await loadJobs()
    if (!isActiveJob(detail.status)) {
      stopPolling()
      await loadArtifacts()
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

function isActiveJob(status) {
  return status === 'Pending' || status === 'Crawling' || status === 'AI_Validating'
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('approved') || normalized.includes('completed')) return 'status-success'
  if (normalized.includes('failed') || normalized.includes('rejected')) return 'status-danger'
  return 'status-pending'
}

function formatConfidence(value) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 'n/a'
  return `${Math.round(numeric * 100)}%`
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '--'
  const text = String(value)
  return text.length > 40 ? `${text.slice(0, 37)}...` : text
}
</script>

<style scoped>
.two-column-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.job-list {
  display: grid;
  gap: 12px;
}

.job-card {
  width: 100%;
  text-align: left;
  border: 1px solid var(--border-color, #e7e8f2);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.job-card.active,
.record-card.active {
  border-color: #5b5bd6;
  box-shadow: 0 0 0 2px rgba(91, 91, 214, 0.12);
}

.job-card-header,
.record-card-header,
.toolbar-row,
.search-row,
.action-row,
.detail-grid {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.job-card-url,
.record-card-description {
  margin-top: 8px;
  word-break: break-word;
  color: #667085;
}

.job-card-meta,
.detail-key {
  color: #8a8fa3;
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
}

.detail-grid > div {
  min-width: 0;
  background: #fbfbfe;
  border: 1px solid #ececf6;
  border-radius: 12px;
  padding: 12px 14px;
}

.detail-grid-compact {
  margin-top: 12px;
}

.link-card a {
  color: #3743b3;
  text-decoration: none;
  font-weight: 600;
  word-break: break-word;
}

.link-card a:hover {
  text-decoration: underline;
}

.detail-key {
  display: block;
  margin-bottom: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.status-success { background: #e8f7ee; color: #18794e; }
.status-danger { background: #fdecec; color: #c63f3f; }
.status-pending { background: #eef2ff; color: #4f46e5; }

.summary-card {
  margin-top: 12px;
  border: 1px solid #ececf6;
  border-radius: 12px;
  background: #fbfbfe;
  padding: 14px;
}

.summary-card-danger {
  border-color: #f1d0d0;
  background: #fff8f8;
}

.summary-card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #5a5f80;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.summary-card-body {
  color: #1f2440;
  line-height: 1.5;
}

.mapping-list {
  display: grid;
  gap: 10px;
}

.mapping-item {
  border: 1px solid #ececf6;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

.mapping-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.mapping-arrow {
  color: #7a7da0;
  font-weight: 700;
}

.mapping-rationale {
  color: #4b5170;
  font-size: 0.92rem;
}

.field-pill-target {
  background: #eef2ff;
  color: #4d5bd1;
}

.sample-table-wrap {
  overflow-x: auto;
  border: 1px solid #ececf6;
  border-radius: 12px;
  background: #fff;
}

.sample-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.sample-table th,
.sample-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f1f8;
  text-align: left;
  font-size: 0.9rem;
  vertical-align: top;
}

.sample-table th {
  background: #f7f8fd;
  color: #4c5375;
  font-weight: 700;
}

.sample-table tbody tr:last-child td {
  border-bottom: none;
}

.review-box {
  margin-top: 16px;
}

.ask-patra-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: rgba(255, 253, 249, 0.88);
  margin-bottom: 18px;
}

.ask-patra-callout-title {
  font-weight: 700;
  color: var(--color-text);
}

.ask-patra-callout-text {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: .88rem;
}

@media (max-width: 960px) {
  .ask-patra-callout {
    flex-direction: column;
    align-items: stretch;
  }

  .two-column-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row,
  .search-row,
  .action-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
