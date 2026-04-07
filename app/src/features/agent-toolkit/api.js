import { apiFetch, apiUrl } from '../../lib/api'

export async function fetchSchemaPool() {
  const res = await apiFetch('/agent-tools/schema-pool')
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}

export async function runPaperSchemaSearch(payload) {
  const res = await apiFetch('/agent-tools/paper-schema-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}

export async function runPaperSchemaSearchUpload(formData) {
  const res = await apiFetch('/agent-tools/paper-schema-search-upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}

export async function runMissingColumnAnalysis(payload) {
  const res = await apiFetch('/agent-tools/missing-column-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}

export async function generateSynthesizedDataset(payload) {
  const res = await apiFetch('/agent-tools/generate-synthesized-dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}

export async function submitGeneratedArtifactForReview(artifactKey, payload) {
  const res = await apiFetch(`/agent-tools/generated-artifacts/${artifactKey}/submit-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}

export function generatedArtifactDownloadUrl(artifactKey, kind) {
  const path = kind === 'schema'
    ? `/agent-tools/generated-artifacts/${artifactKey}/download-schema`
    : `/agent-tools/generated-artifacts/${artifactKey}/download.csv`
  return apiUrl(path)
}

async function parseErrorMessage(res, fallback) {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => null)
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) return data.detail.map((item) => item.msg || item.message || String(item)).join('; ')
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.error === 'string') return data.error
  }

  const text = await res.text().catch(() => '')
  return text || fallback
}
