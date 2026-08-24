import { apiFetch } from '../../lib/api'
import { parseErrorMessage } from '../../lib/errorParsing'
import { buildModelCardPatch, buildDatasheetPatch } from '../../lib/assetPayloads'

export async function searchEditableRecords(query, limitPerType = 8) {
  const normalized = String(query || '').trim()
  const qs = new URLSearchParams({ limit: String(limitPerType * 2) })
  if (normalized) {
    qs.set('q', normalized)
  }
  const response = await apiFetch(`/v1/assets/records?${qs.toString()}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const records = await response.json()
  return records.map(normalizeUnifiedRecordResult)
    .sort((left, right) => compareRecords(left, right, normalized))
}

export async function fetchSuggestedEditableRecords(query = '', limitPerType = 4) {
  return searchEditableRecords(query, limitPerType)
}

export async function fetchExistingRecordDetail(record) {
  const path = record.assetType === 'model_card'
    ? `/modelcard/${record.assetUuid}`
    : `/datasheet/${record.assetUuid}`
  const response = await apiFetch(path)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export function mapRecordDetailToEditForm(record, detail) {
  return record.assetType === 'model_card'
    ? mapModelCardDetailToForm(detail)
    : mapDatasheetDetailToForm(detail)
}

export function getRecordDisplayName(record, detail) {
  return record.assetType === 'model_card'
    ? detail.name || 'Untitled model card'
    : detail.titles?.[0]?.title || 'Untitled datasheet'
}

export async function saveEditedRecord(record, form, detail) {
  const endpoint = record.assetType === 'model_card'
    ? `/v1/assets/model-cards/${record.assetId}`
    : `/v1/assets/datasheets/${record.assetId}`
  const payload = record.assetType === 'model_card'
    ? buildModelCardPatch(form, detail)
    : buildDatasheetPatch(form, detail)

  const response = await apiFetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `HTTP ${response.status}`))
  }

  return response.json()
}

function normalizeUnifiedRecordResult(result) {
  return {
    assetType: result.asset_type,
    assetId: result.asset_id,
    assetUuid: result.asset_uuid,
    title: result.title || 'Untitled card',
    subtitle: result.subtitle || 'Published card',
    kindLabel: result.kind_label || (result.asset_type === 'model_card' ? 'Model Card' : 'Datasheet'),
    description: result.description || '',
    metadataText: compactText(result.subtitle, result.description, result.kind_label),
    raw: result,
  }
}

function compareRecords(left, right, query) {
  const scoreDiff = scoreRecord(right, query) - scoreRecord(left, query)
  if (scoreDiff !== 0) return scoreDiff
  return left.title.localeCompare(right.title)
}

function scoreRecord(record, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) {
    return record.assetType === 'model_card' ? 2 : 1
  }

  const title = String(record.title || '').toLowerCase()
  const subtitle = String(record.subtitle || '').toLowerCase()
  const metadata = String(record.metadataText || '').toLowerCase()

  let score = 0
  if (title === normalizedQuery) score += 120
  if (title.startsWith(normalizedQuery)) score += 80
  if (title.includes(normalizedQuery)) score += 45
  if (subtitle.includes(normalizedQuery)) score += 30
  if (metadata.includes(normalizedQuery)) score += 15
  return score
}

function compactText(...values) {
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' • ')
}

function mapModelCardDetailToForm(detail) {
  return {
    name: detail.name || '',
    version: detail.version || '',
    license: detail.ai_model?.license || '',
    short_description: detail.short_description || '',
    full_description: detail.full_description || '',
    category: detail.categories || '',
    input_type: detail.input_type || '',
    framework: detail.ai_model?.framework || '',
    model_type: detail.ai_model?.model_type || '',
    test_accuracy: detail.ai_model?.test_accuracy ?? '',
    input_data: detail.input_data || '',
    location: detail.ai_model?.location || '',
    keywords: detail.keywords || '',
    is_private: Boolean(detail.is_private),
    is_gated: Boolean(detail.is_gated),
    author: detail.author || '',
    citation: detail.citation || '',
    documentation: detail.documentation || '',
    foundational_model: detail.foundational_model || '',
    training_datasheet_uuid: detail.training_datasheet_uuid || '',
  }
}

function mapDatasheetDetailToForm(detail) {
  return {
    title: detail.titles?.[0]?.title || '',
    version: detail.version || '',
    description: detail.descriptions?.[0]?.description || '',
    resource_type: detail.resource_type || '',
    publisher: detail.publisher?.name || '',
    publication_year: detail.publication_year || '',
    creator: (detail.creators || []).map((item) => item.creator_name).join(', '),
    subjects: (detail.subjects || []).map((item) => item.subject).join(', '),
    download_url: pickDownloadUrl(detail.related_identifiers || []),
    license: detail.rights_list?.[0]?.rights || '',
    license_uri: detail.rights_list?.[0]?.rights_uri || '',
    is_private: Boolean(detail.is_private),
  }
}

function pickDownloadUrl(relatedIdentifiers) {
  const httpLink = relatedIdentifiers.find((item) => String(item.related_identifier || '').startsWith('http'))
  return httpLink?.related_identifier || ''
}
