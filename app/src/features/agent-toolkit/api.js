import { apiFetch, apiUrl } from '../../lib/api'
import { parseErrorMessage } from '../../lib/errorParsing'

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

export function generatedArtifactDownloadUrl(artifactKey, kind) {
  const path = kind === 'schema'
    ? `/agent-tools/generated-artifacts/${artifactKey}/download-schema`
    : `/agent-tools/generated-artifacts/${artifactKey}/download.csv`
  return apiUrl(path)
}

export async function createDatasheetFromArtifact(artifact, submittedBy, notes) {
  const title = artifact.title || artifact.source_dataset_id
  const description =
    `Synthesized dataset derived from ${artifact.source_dataset_id}. ` +
    'Generated through the PATRA Agent Toolkit workflow.'
  const fullDescription = notes ? `${description}\n\nNotes: ${notes}` : description

  const payload = {
    resource_type: 'Dataset',
    resource_type_general: 'Dataset',
    format: 'text/csv',
    version: 'patra-synth-v1',
    is_private: false,
    dataset_schema_blob: artifact.generated_schema || {},
    publisher: { name: 'PATRA Agent Toolkit' },
    titles: [{ title }],
    creators: [{ creator_name: submittedBy }],
    subjects: [
      { subject: 'synthesized-dataset' },
      ...(artifact.generated_fields || []).map((f) => ({ subject: f })),
    ],
    descriptions: [
      { description: fullDescription, description_type: 'Abstract' },
    ],
    related_identifiers: [
      {
        related_identifier: artifact.source_dataset_id,
        related_identifier_type: 'Text',
        relation_type: 'IsDerivedFrom',
        resource_type_general: 'Dataset',
      },
    ],
  }

  const res = await apiFetch('/v1/assets/datasheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))
  return res.json()
}
