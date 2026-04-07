<template>
  <div>
    <div class="page-header">
      <h1>Agent Toolkit</h1>
      <p>Run code-first schema extraction, public dataset-schema search, and strict missing-attribute feasibility analysis for PATRA substitution workflows across domains.</p>
    </div>

    <div class="connection-banner error" v-if="errorMessage">
      <IconAlertTriangle :size="18" stroke-width="1.8" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">
        <IconFileSearch :size="16" stroke-width="1.8" /> Paper -> Schema Search
      </button>
      <button class="tab" :class="{ active: activeTab === 'missing' }" @click="activeTab = 'missing'">
        <IconRouteSquare2 :size="16" stroke-width="1.8" /> Missing-Column Feasibility
      </button>
    </div>

    <div class="agent-layout">
      <div class="agent-main">
        <template v-if="activeTab === 'search'">
          <div class="card">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconFileSearch :size="18" stroke-width="1.8" /> Paper-to-schema search</span>
            </div>
            <div class="card-body">
              <div class="form-helper block-helper">
                Provide exactly one source: a public document URL, an uploaded file, or pasted schema text. Supported text inputs include <strong>JSON</strong>, a <strong>Markdown table</strong> (<code>| column | type |</code> rows), or a <strong>comma-separated list of field names</strong> (for example <code>job_id,submit_time,wait_time</code>). Uploaded files are parsed temporarily for this request only and are not stored by the server.
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Document URL</label>
                  <input class="form-input" v-model="searchForm.documentUrl" placeholder="https://zenodo.org/.../schema.docx" />
                </div>
                <div class="form-group">
                  <label class="form-label">Upload Document</label>
                  <div
                    class="upload-dropzone"
                    :class="{ active: uploadDragActive }"
                    @dragenter.prevent="uploadDragActive = true"
                    @dragover.prevent="uploadDragActive = true"
                    @dragleave.prevent="uploadDragActive = false"
                    @drop.prevent="handleFileDrop"
                  >
                    <input
                      ref="fileInputRef"
                      class="hidden-file-input"
                      type="file"
                      accept=".docx,.md,.markdown,.txt,.json,.html,.htm"
                      @change="handleFileSelect"
                    />
                    <div class="upload-dropzone-copy">
                      <strong>{{ uploadedFileName || 'Drop a document here' }}</strong>
                      <span>{{ uploadedFileName ? 'The file will be parsed for this request only.' : 'DOCX, Markdown, text, JSON schema, or HTML.' }}</span>
                    </div>
                    <div class="upload-dropzone-actions">
                      <button class="btn btn-outline btn-sm" type="button" @click="openFilePicker">
                        <IconUpload :size="14" stroke-width="1.8" />
                        {{ uploadedFileName ? 'Replace file' : 'Choose file' }}
                      </button>
                      <button
                        v-if="uploadedFileName"
                        class="btn btn-outline btn-sm"
                        type="button"
                        @click="clearUploadedFile"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Schema Text</label>
                <textarea
                  class="form-input form-textarea code-textarea"
                  v-model="searchForm.documentText"
                  rows="10"
                  placeholder="JSON schema, markdown table, or comma-separated fields (for example job_id,submit_time,wait_time,run_time)"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Document Format Override</label>
                  <select class="form-input" v-model="searchForm.documentFormat">
                    <option value="">Auto-detect</option>
                    <option value="docx">DOCX</option>
                    <option value="md">Markdown</option>
                    <option value="txt">Text</option>
                    <option value="json">JSON schema</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Top-K</label>
                  <input class="form-input" type="number" min="1" max="20" v-model.number="searchForm.topK" />
                </div>
              </div>

              <label class="checkbox-row">
                <input type="checkbox" v-model="searchForm.disableLlm" />
                <span>Use deterministic hybrid scoring only</span>
              </label>

              <div class="action-row">
                <button class="btn btn-primary" :disabled="searchLoading" @click="handleSearch">
                  <IconPlayerPlay :size="16" stroke-width="1.8" />
                  {{ searchLoading ? 'Running search...' : 'Run schema search' }}
                </button>
              </div>
            </div>
          </div>

          <div class="card" v-if="searchResult">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconListSearch :size="18" stroke-width="1.8" /> Search result</span>
            </div>
            <div class="card-body">
              <div class="result-summary">
                <div class="summary-chip">
                  <span>Status</span>
                  <strong>{{ searchResult.status }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Confidence</span>
                  <strong>{{ searchResult.extraction.confidence }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Winner</span>
                  <strong>{{ searchResult.winner_dataset_id || 'n/a' }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Candidates</span>
                  <strong>{{ searchResult.candidate_count }}</strong>
                </div>
              </div>

              <p class="result-message">{{ searchResult.message }}</p>

              <div class="mini-section">
                <div class="mini-section-title">Extracted field groups</div>
                <div class="field-pill-list">
                  <span class="field-pill" v-for="field in searchResult.extraction.grouped_fields" :key="field.canonical_name">
                    {{ field.canonical_name }}
                  </span>
                </div>
              </div>

              <div class="mini-section" v-if="searchResult.extraction.unresolved_fields?.length">
                <div class="mini-section-title">Unresolved rows</div>
                <ul class="simple-list">
                  <li v-for="issue in searchResult.extraction.unresolved_fields" :key="`${issue.row_label}-${issue.reason}`">
                    <strong>{{ issue.row_label || 'Unnamed row' }}</strong>: {{ issue.reason }}
                  </li>
                </ul>
              </div>

              <div class="mini-section">
                <div class="mini-section-title">Shortlist</div>
                <div class="table-wrap">
                  <table class="results-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Dataset</th>
                        <th>Score</th>
                        <th>Matched</th>
                        <th>Derivable</th>
                        <th>Missing</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in searchResult.ranking" :key="row.dataset_id">
                        <td>{{ row.rank }}</td>
                        <td>
                          <div class="table-title">{{ row.title }}</div>
                          <div class="table-subtitle">{{ row.source_family }} | {{ row.dataset_id }}</div>
                        </td>
                        <td><strong>{{ formatScore(row.score) }}</strong></td>
                        <td>{{ row.matched_field_groups.length }}</td>
                        <td>{{ row.derivable_field_groups.length }}</td>
                        <td>{{ row.missing_field_groups.length }}</td>
                        <td>
                          <button class="btn btn-outline btn-sm" @click="inspectCandidate(row)">
                            Analyze
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="mini-section">
                <div class="mini-section-title">Query schema JSON</div>
                <pre class="code-block">{{ prettyJson(searchResult.query_schema) }}</pre>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="card">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconRouteSquare2 :size="18" stroke-width="1.8" /> Missing-column feasibility</span>
            </div>
            <div class="card-body">
              <div class="form-helper block-helper">
                This tool does not hallucinate values. It classifies each target attribute as directly available, derivable with provenance, or not safely derivable under the current deterministic rules (see PATRA V1 derivation boundary).
              </div>

              <div class="form-group">
                <label class="form-label">Candidate Dataset</label>
                <select class="form-input" v-model="missingForm.candidateDatasetId">
                  <option value="">Select candidate dataset</option>
                  <option v-for="item in schemaPool" :key="item.dataset_id" :value="item.dataset_id">
                    {{ item.title }} ({{ item.dataset_id }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Query Schema JSON</label>
                <textarea
                  class="form-input form-textarea code-textarea"
                  v-model="missingForm.querySchemaText"
                  rows="16"
                  placeholder='{"type":"object","properties":{...}}'
                ></textarea>
              </div>

              <div class="action-row">
                <button class="btn btn-primary" :disabled="missingLoading" @click="handleMissingAnalysis">
                  <IconPlayerPlay :size="16" stroke-width="1.8" />
                  {{ missingLoading ? 'Evaluating...' : 'Run feasibility analysis' }}
                </button>
              </div>
            </div>
          </div>

          <div class="card" v-if="missingResult">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconBinaryTree2 :size="18" stroke-width="1.8" /> Feasibility result</span>
            </div>
            <div class="card-body">
              <div class="result-summary">
                <div class="summary-chip">
                  <span>Dataset</span>
                  <strong>{{ missingResult.dataset_id }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Direct</span>
                  <strong>{{ missingResult.summary.direct_count }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Derivable</span>
                  <strong>{{ missingResult.summary.derivable_count }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Rejected</span>
                  <strong>{{ missingResult.summary.rejected_count }}</strong>
                </div>
              </div>

              <p class="result-message">{{ missingResult.message }}</p>

              <div class="mini-section" v-if="canGenerate">
                <div class="mini-section-title">Stage B: Generate derivable fields</div>
                <p class="result-message compact-message">
                  Only fields marked <strong>derivable with provenance</strong> can be synthesized. The LLM option is limited to transformation planning; code executes the plan and validation gates acceptance.
                </p>

                <div class="selection-grid">
                  <label class="checkbox-row derivable-option" v-for="row in derivableRows" :key="`derive-${row.target_field}`">
                    <input
                      type="checkbox"
                      :value="row.target_field"
                      v-model="synthesisForm.selectedDerivableFields"
                    />
                    <span>
                      <strong>{{ row.target_field }}</strong>
                      <span class="table-subtitle">{{ row.source_fields.join(', ') || 'no source fields listed' }}</span>
                    </span>
                  </label>
                </div>

                <label class="checkbox-row">
                  <input type="checkbox" v-model="synthesisForm.useLlmPlan" />
                  <span>Use LLM-assisted planning when available, then execute and validate with code</span>
                </label>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Submitted By</label>
                    <input class="form-input" v-model="synthesisForm.submittedBy" placeholder="William Qiu" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Admin Review Notes</label>
                    <input class="form-input" v-model="synthesisForm.reviewNotes" placeholder="Optional note for PATRA reviewers" />
                  </div>
                </div>

                <div class="action-row">
                  <button class="btn btn-primary" :disabled="generateLoading" @click="handleGenerateDataset">
                    <IconPlayerPlay :size="16" stroke-width="1.8" />
                    {{ generateLoading ? 'Generating...' : 'Generate synthesized dataset' }}
                  </button>
                </div>
              </div>

              <div class="table-wrap">
                <table class="results-table">
                  <thead>
                    <tr>
                      <th>Target Field</th>
                      <th>Status</th>
                      <th>Source Fields</th>
                      <th>Checks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in missingResult.rows" :key="row.target_field">
                      <td><strong>{{ row.target_field }}</strong></td>
                      <td>
                        <span class="status-badge" :class="statusClass(row.status)">{{ row.status }}</span>
                        <div class="table-subtitle">{{ row.rationale }}</div>
                      </td>
                      <td>{{ row.source_fields.join(', ') || 'none' }}</td>
                      <td>{{ row.checks.join(', ') || 'none' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card" v-if="generatedResult">
            <div class="card-header">
              <span class="flex items-center gap-8"><IconBinaryTree2 :size="18" stroke-width="1.8" /> Synthesized dataset</span>
            </div>
            <div class="card-body">
              <div class="result-summary">
                <div class="summary-chip">
                  <span>Artifact</span>
                  <strong>{{ generatedResult.artifact.artifact_key }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Planner</span>
                  <strong>{{ generatedResult.artifact.planner_mode }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Rows</span>
                  <strong>{{ generatedResult.artifact.row_count }}</strong>
                </div>
                <div class="summary-chip">
                  <span>Review</span>
                  <strong>{{ generatedResult.artifact.review_submission_id || 'not submitted' }}</strong>
                </div>
              </div>

              <p class="result-message">{{ generatedResult.message }}</p>

              <div class="action-row stacked-actions">
                <a class="btn btn-outline" :href="artifactDownloadUrl('csv')" target="_blank" rel="noreferrer">Download CSV</a>
                <a class="btn btn-outline" :href="artifactDownloadUrl('schema')" target="_blank" rel="noreferrer">Download schema</a>
                <button class="btn btn-primary" :disabled="submitLoading" @click="handleSubmitForReview">
                  {{ submitLoading ? 'Submitting...' : 'Submit to PATRA review' }}
                </button>
              </div>

              <p class="table-subtitle" v-if="reviewResult">
                Pending submission {{ reviewResult.submission_id }} created for PATRA admin review.
              </p>

              <div class="mini-section">
                <div class="mini-section-title">Planner notes</div>
                <ul class="simple-list">
                  <li v-for="note in generatedResult.plan.planner_notes" :key="note">{{ note }}</li>
                </ul>
              </div>

              <div class="mini-section" v-if="generatedResult.validation_issues?.length">
                <div class="mini-section-title">Validation issues</div>
                <ul class="simple-list">
                  <li v-for="issue in generatedResult.validation_issues" :key="`${issue.field}-${issue.message}`">
                    <strong>{{ issue.severity }}</strong> - {{ issue.field }}: {{ issue.message }}
                  </li>
                </ul>
              </div>

              <div class="mini-section">
                <div class="mini-section-title">Preview rows</div>
                <pre class="code-block">{{ prettyJson(generatedResult.preview_rows) }}</pre>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="agent-side">
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconDatabaseSearch :size="18" stroke-width="1.8" /> Public schema pool</span>
          </div>
          <div class="card-body">
            <div class="pool-empty" v-if="schemaPoolLoading">Loading pool...</div>
            <div class="pool-empty" v-else-if="schemaPool.length === 0">No public datasets are available from the current backend.</div>
            <div v-else class="pool-list">
              <div class="pool-item" v-for="item in schemaPool" :key="item.dataset_id">
                <div class="pool-title">{{ item.title }}</div>
                <div class="pool-meta">{{ item.source_family }} | {{ item.public_access }}</div>
                <a class="pool-link" :href="item.source_url" target="_blank" rel="noreferrer">Open source</a>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconShieldCheck :size="18" stroke-width="1.8" /> Workflow boundaries</span>
          </div>
          <div class="card-body">
            <ul class="simple-list">
              <li>Schema search ranks dataset-backed schemas for any domain: the pool lists both public defaults and optional traces (e.g. parallel workloads) when the backend is configured with those datasets.</li>
              <li>Feasibility analysis only allows directly supported or auditable deterministic derivations; other attributes stay rejected until rules exist.</li>
              <li>Generation is limited to derivable fields, and PATRA requires admin review before a synthesized dataset-schema is admitted into the shared pool.</li>
              <li>Fields with no safe rule stay rejected instead of being hallucinated.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  IconAlertTriangle,
  IconBinaryTree2,
  IconDatabaseSearch,
  IconFileSearch,
  IconListSearch,
  IconPlayerPlay,
  IconRouteSquare2,
  IconShieldCheck,
  IconUpload,
} from '@tabler/icons-vue'
import {
  fetchSchemaPool,
  generateSynthesizedDataset,
  generatedArtifactDownloadUrl,
  runMissingColumnAnalysis,
  runPaperSchemaSearch,
  runPaperSchemaSearchUpload,
  submitGeneratedArtifactForReview,
} from './api'

const activeTab = ref('search')
const errorMessage = ref('')

const schemaPool = ref([])
const schemaPoolLoading = ref(false)
const fileInputRef = ref(null)
const uploadedFile = ref(null)
const uploadDragActive = ref(false)

const searchLoading = ref(false)
const searchResult = ref(null)
const missingLoading = ref(false)
const missingResult = ref(null)
const generateLoading = ref(false)
const generatedResult = ref(null)
const submitLoading = ref(false)
const reviewResult = ref(null)

const searchForm = reactive({
  documentUrl: '',
  documentText: '',
  documentFormat: '',
  topK: 5,
  disableLlm: true,
})

const missingForm = reactive({
  candidateDatasetId: '',
  querySchemaText: '',
})

const synthesisForm = reactive({
  useLlmPlan: true,
  selectedDerivableFields: [],
  submittedBy: '',
  reviewNotes: '',
})

const uploadedFileName = computed(() => uploadedFile.value?.name || '')

onMounted(async () => {
  await loadSchemaPool()
})

async function loadSchemaPool() {
  schemaPoolLoading.value = true
  errorMessage.value = ''
  try {
    schemaPool.value = await fetchSchemaPool()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    schemaPoolLoading.value = false
  }
}

async function handleSearch() {
  errorMessage.value = ''
  missingResult.value = null
  generatedResult.value = null
  reviewResult.value = null

  const provided = [
    Boolean(searchForm.documentUrl.trim()),
    Boolean(uploadedFile.value),
    Boolean(searchForm.documentText.trim()),
  ].filter(Boolean).length

  if (provided !== 1) {
    errorMessage.value = 'Provide exactly one search source: document URL, uploaded file, or pasted schema text.'
    return
  }

  searchLoading.value = true
  try {
    if (uploadedFile.value) {
      const formData = new FormData()
      formData.append('file', uploadedFile.value)
      if (searchForm.documentFormat) formData.append('document_format', searchForm.documentFormat)
      formData.append('top_k', String(searchForm.topK || 5))
      formData.append('disable_llm', String(searchForm.disableLlm))
      searchResult.value = await runPaperSchemaSearchUpload(formData)
    } else {
      const payload = {
        document_url: searchForm.documentUrl.trim() || null,
        document_text: searchForm.documentText.trim() || null,
        document_format: searchForm.documentFormat || null,
        top_k: searchForm.topK || 5,
        disable_llm: searchForm.disableLlm,
      }
      searchResult.value = await runPaperSchemaSearch(payload)
    }
    missingForm.querySchemaText = prettyJson(searchResult.value.query_schema)
    if (searchResult.value.ranking?.length) {
      missingForm.candidateDatasetId = searchResult.value.ranking[0].dataset_id
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    searchLoading.value = false
  }
}

async function handleMissingAnalysis() {
  errorMessage.value = ''
  let parsedQuery = null

  try {
    parsedQuery = JSON.parse(missingForm.querySchemaText || '{}')
  } catch {
    errorMessage.value = 'Query schema JSON is not valid.'
    return
  }

  if (!missingForm.candidateDatasetId) {
    errorMessage.value = 'Select a candidate dataset first.'
    return
  }

  missingLoading.value = true
  try {
    missingResult.value = await runMissingColumnAnalysis({
      query_schema: parsedQuery,
      candidate_dataset_id: missingForm.candidateDatasetId,
    })
    generatedResult.value = null
    reviewResult.value = null
    synthesisForm.selectedDerivableFields = derivableRows.value.map((row) => row.target_field)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    missingLoading.value = false
  }
}

function inspectCandidate(row) {
  activeTab.value = 'missing'
  missingForm.candidateDatasetId = row.dataset_id
  if (searchResult.value?.query_schema) {
    missingForm.querySchemaText = prettyJson(searchResult.value.query_schema)
  }
  handleMissingAnalysis()
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function clearUploadedFile() {
  uploadedFile.value = null
  uploadDragActive.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function setUploadedFile(file) {
  uploadedFile.value = file || null
  uploadDragActive.value = false
  if (file) {
    searchForm.documentUrl = ''
    searchForm.documentText = ''
  }
}

function handleFileSelect(event) {
  const [file] = event.target.files || []
  setUploadedFile(file || null)
}

function handleFileDrop(event) {
  const [file] = event.dataTransfer?.files || []
  setUploadedFile(file || null)
}

const derivableRows = computed(() => {
  return missingResult.value?.rows?.filter((row) => row.status === 'derivable with provenance') || []
})

const canGenerate = computed(() => derivableRows.value.length > 0)

async function handleGenerateDataset() {
  errorMessage.value = ''
  let parsedQuery = null

  try {
    parsedQuery = JSON.parse(missingForm.querySchemaText || '{}')
  } catch {
    errorMessage.value = 'Query schema JSON is not valid.'
    return
  }

  if (!missingForm.candidateDatasetId) {
    errorMessage.value = 'Select a candidate dataset first.'
    return
  }
  if (!synthesisForm.selectedDerivableFields.length) {
    errorMessage.value = 'Select at least one derivable field to generate.'
    return
  }

  generateLoading.value = true
  try {
    generatedResult.value = await generateSynthesizedDataset({
      query_schema: parsedQuery,
      candidate_dataset_id: missingForm.candidateDatasetId,
      selected_fields: synthesisForm.selectedDerivableFields,
      use_llm_plan: synthesisForm.useLlmPlan,
      submitted_by: synthesisForm.submittedBy.trim() || null,
    })
    reviewResult.value = null
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    generateLoading.value = false
  }
}

async function handleSubmitForReview() {
  errorMessage.value = ''
  if (!generatedResult.value?.artifact?.artifact_key) {
    errorMessage.value = 'Generate a synthesized dataset first.'
    return
  }
  if (!synthesisForm.submittedBy.trim()) {
    errorMessage.value = 'Enter your name before submitting for PATRA admin review.'
    return
  }

  submitLoading.value = true
  try {
    reviewResult.value = await submitGeneratedArtifactForReview(
      generatedResult.value.artifact.artifact_key,
      {
        submitted_by: synthesisForm.submittedBy.trim(),
        title: generatedResult.value.artifact.title,
        notes: synthesisForm.reviewNotes.trim() || null,
      },
    )
    generatedResult.value.artifact.review_submission_id = reviewResult.value.submission_id
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    submitLoading.value = false
  }
}

function artifactDownloadUrl(kind) {
  if (!generatedResult.value?.artifact?.artifact_key) return '#'
  return generatedArtifactDownloadUrl(generatedResult.value.artifact.artifact_key, kind)
}

function prettyJson(value) {
  return JSON.stringify(value || {}, null, 2)
}

function formatScore(value) {
  return Number(value || 0).toFixed(4)
}

function statusClass(status) {
  if (status === 'directly available') return 'status-direct'
  if (status === 'derivable with provenance') return 'status-derivable'
  return 'status-rejected'
}
</script>

<style scoped>
.agent-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.agent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.agent-side {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: calc(var(--header-height) + 28px);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-textarea {
  resize: vertical;
}

.hidden-file-input {
  display: none;
}

.upload-dropzone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 16px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  transition: border-color var(--transition), background-color var(--transition);
}

.upload-dropzone.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.upload-dropzone-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.upload-dropzone-copy strong {
  color: var(--color-text);
  word-break: break-word;
}

.upload-dropzone-copy span {
  color: var(--color-text-muted);
  font-size: .82rem;
  line-height: 1.5;
}

.upload-dropzone-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.code-textarea,
.code-block {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.code-block {
  margin: 0;
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: .8rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.block-helper {
  margin-bottom: 18px;
}

.selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: .88rem;
  color: var(--color-text-secondary);
}

.derivable-option {
  align-items: flex-start;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.action-row {
  margin-top: 18px;
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.stacked-actions {
  align-items: center;
}

.compact-message {
  margin-bottom: 14px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-chip {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.summary-chip span {
  display: block;
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.summary-chip strong {
  font-size: .95rem;
  color: var(--color-text);
}

.result-message {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 18px;
}

.mini-section + .mini-section {
  margin-top: 20px;
}

.mini-section-title {
  font-size: .82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.field-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: .8rem;
  font-weight: 600;
}

.simple-list {
  margin: 0;
  padding-left: 18px;
  color: var(--color-text-secondary);
}

.simple-list li + li {
  margin-top: 8px;
}

.table-wrap {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
  font-size: .86rem;
}

.results-table th {
  color: var(--color-text-muted);
  font-size: .76rem;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.table-title {
  font-weight: 600;
  color: var(--color-text);
}

.table-subtitle {
  margin-top: 4px;
  font-size: .76rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: .74rem;
  font-weight: 700;
}

.status-direct {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-derivable {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.status-rejected {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.pool-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pool-item {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}

.pool-title {
  font-weight: 600;
  color: var(--color-text);
}

.pool-meta {
  margin-top: 4px;
  font-size: .78rem;
  color: var(--color-text-muted);
}

.pool-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--color-primary);
  font-size: .82rem;
  text-decoration: none;
}

.pool-empty {
  color: var(--color-text-muted);
  font-size: .88rem;
}

@media (max-width: 1180px) {
  .agent-layout {
    flex-direction: column;
  }

  .agent-side {
    width: 100%;
    position: static;
  }
}

@media (max-width: 768px) {
  .form-row,
  .result-summary,
  .selection-grid {
    grid-template-columns: 1fr;
  }

  .upload-dropzone {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-dropzone-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
