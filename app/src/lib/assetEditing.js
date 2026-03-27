import { apiFetch } from './api'

export async function searchExistingAssets(assetType, query, limit = 10) {
  const normalized = String(query || '').trim()
  if (!normalized) {
    return []
  }

  const endpoint = assetType === 'model_card' ? '/modelcards' : '/datasheets'
  const response = await apiFetch(`${endpoint}?q=${encodeURIComponent(normalized)}&limit=${limit}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export async function fetchExistingAssetDetail(assetType, assetId) {
  const endpoint = assetType === 'model_card' ? `/modelcard/${assetId}` : `/datasheet/${assetId}`
  const response = await apiFetch(endpoint)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export function mapAssetDetailToEditForm(assetType, detail) {
  if (assetType === 'model_card') {
    return mapModelCardDetailToForm(detail)
  }
  return mapDatasheetDetailToForm(detail)
}

export function buildEditSubmissionData(assetType, form, detail, editNotes = '') {
  return {
    ...form,
    intake_method: 'edit_existing_asset',
    submission_origin: 'edit_existing_asset',
    existing_asset_id: getAssetId(assetType, detail),
    previous_version_id: getAssetId(assetType, detail),
    root_asset_id: detail.root_version_id || getAssetId(assetType, detail),
    current_asset_version: detail.asset_version || 1,
    next_asset_version: (detail.asset_version || 1) + 1,
    edit_target_name: getDisplayName(assetType, detail),
    edit_notes: String(editNotes || '').trim(),
  }
}

export function getAssetId(assetType, detail) {
  return assetType === 'model_card' ? detail.external_id : detail.identifier
}

export function getDisplayName(assetType, detail) {
  return assetType === 'model_card'
    ? detail.name || 'Untitled model card'
    : detail.titles?.[0]?.title || 'Untitled datasheet'
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
    test_accuracy: detail.ai_model?.test_accuracy ?? '',
    input_data: detail.input_data || '',
    output_data: detail.output_data || detail.ai_model?.location || '',
    keywords: detail.keywords || '',
    is_private: Boolean(detail.is_private),
  }
}

function mapDatasheetDetailToForm(detail) {
  return {
    name: detail.titles?.[0]?.title || '',
    version: detail.version || '',
    description: detail.descriptions?.[0]?.description || '',
    source: detail.resource_type || '',
    datapoints: '',
    publisher: detail.publisher?.name || '',
    publication_year: detail.publication_year || '',
    creator: (detail.creators || []).map((item) => item.creator_name).join(', '),
    features: (detail.subjects || []).map((item) => item.subject).join(', '),
    download_url: pickDownloadUrl(detail.related_identifiers || []),
    is_private: Boolean(detail.is_private),
  }
}

function pickDownloadUrl(relatedIdentifiers) {
  const match = relatedIdentifiers.find((item) => String(item.related_identifier || '').startsWith('http'))
  return match?.related_identifier || ''
}
