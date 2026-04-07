import { apiFetch, apiUrl } from '../../lib/api'

export async function startAutomatedIngestion(url) {
  const response = await apiFetch('/api/ingestion/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function fetchIngestionJobs(limit = 20) {
  const response = await apiFetch(`/api/ingestion/jobs?limit=${limit}`)
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function fetchIngestionJob(jobId) {
  const response = await apiFetch(`/api/ingestion/jobs/${jobId}`)
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function fetchIngestionArtifacts(status = '', limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) })
  if (status) {
    qs.set('status', status)
  }
  const response = await apiFetch(`/api/ingestion/artifacts?${qs.toString()}`)
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function fetchIngestionArtifact(artifactId) {
  const response = await apiFetch(`/api/ingestion/artifacts/${artifactId}`)
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function reviewIngestionArtifact(artifactId, status, reviewNotes = '') {
  const response = await apiFetch(`/api/ingestion/artifacts/${artifactId}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, review_notes: reviewNotes || null }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export function artifactDownloadUrl(artifactId, kind = 'csv') {
  return apiUrl(kind === 'schema'
    ? `/api/ingestion/artifacts/${artifactId}/download-schema`
    : `/api/ingestion/artifacts/${artifactId}/download.csv`)
}

async function parseError(response, fallback) {
  try {
    const payload = await response.json()
    return payload.detail || payload.message || fallback
  } catch {
    return fallback
  }
}
