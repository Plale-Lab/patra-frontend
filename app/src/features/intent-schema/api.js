import { apiFetch } from '../../lib/api'

export async function fetchIntentSchemaBootstrap() {
  const response = await apiFetch('/api/intent-schema/bootstrap')
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function generateIntentSchema(payload) {
  const response = await apiFetch('/api/intent-schema/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function discoverMetadata(payload) {
  const response = await apiFetch('/api/metadata-discovery/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function buildDatasetAssemblyPlan(payload) {
  const response = await apiFetch('/api/dataset-assembly/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function buildDatasetCompositionPreview(payload) {
  const response = await apiFetch('/api/dataset-assembly/compose-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function runBaselineTrainingStub(payload) {
  const response = await apiFetch('/api/baseline-training/run-stub', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function generateMvpDemoReport(payload) {
  const response = await apiFetch('/api/mvp-demo-report/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

async function parseError(response, fallback) {
  try {
    const payload = await response.json()
    return payload.detail || payload.message || fallback
  } catch {
    return fallback
  }
}
