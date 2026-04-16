import { apiFetch } from '../../lib/api'
import { parseErrorMessage } from '../../lib/errorParsing'

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
  return fetchExistingAssetDetail(record.assetType, record.assetId)
}

export async function fetchRecordChangeLog(record, limit = 25) {
  const response = await apiFetch(`/v1/assets/changelog/${record.assetType}/${record.assetId}?limit=${limit}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export function mapRecordDetailToEditForm(record, detail) {
  return mapAssetDetailToEditForm(record.assetType, detail)
}

export function getRecordDisplayName(record, detail) {
  return getDisplayName(record.assetType, detail)
}

export async function saveEditedRecord(record, form, detail, editorName = '') {
  const endpoint = record.assetType === 'model_card'
    ? `/v1/assets/model-cards/${record.assetId}`
    : `/v1/assets/datasheets/${record.assetId}`
  const payload = record.assetType === 'model_card'
    ? buildModelCardVersionPayload(form, detail, editorName)
    : buildDatasheetVersionPayload(form, detail)

  delete payload.asset_version
  delete payload.previous_version_id
  delete payload.root_version_id

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

export async function searchExistingAssets(assetType, query, limit = 10) {
  const normalized = String(query || '').trim()
  const endpoint = assetType === 'model_card' ? '/modelcards' : '/datasheets'
  const qs = new URLSearchParams({ limit: String(limit) })
  if (normalized) {
    qs.set('q', normalized)
  }
  const response = await apiFetch(`${endpoint}?${qs.toString()}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export async function fetchSuggestedAssets(assetType, limit = 6) {
  return searchExistingAssets(assetType, '', limit)
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

export async function createEditedAssetVersion(assetType, form, detail, editorName = '') {
  const endpoint = assetType === 'model_card' ? '/v1/assets/model-cards' : '/v1/assets/datasheets'
  const payload = assetType === 'model_card'
    ? buildModelCardVersionPayload(form, detail, editorName)
    : buildDatasheetVersionPayload(form, detail)

  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `HTTP ${response.status}`))
  }

  return response.json()
}

export function getDisplayName(assetType, detail) {
  return assetType === 'model_card'
    ? detail.name || 'Untitled model card'
    : detail.titles?.[0]?.title || 'Untitled datasheet'
}

function normalizeUnifiedRecordResult(result) {
  return {
    assetType: result.asset_type,
    assetId: result.asset_id,
    title: result.title || 'Untitled record',
    subtitle: result.subtitle || 'Published record',
    kindLabel: result.kind_label || (result.asset_type === 'model_card' ? 'Model Card' : 'Datasheet'),
    description: result.description || '',
    metadataText: compactText(result.subtitle, result.description, result.kind_label),
    raw: result,
  }
}

function normalizeModelCardResult(result) {
  return {
    assetType: 'model_card',
    assetId: result.mc_id,
    title: result.name || 'Untitled model card',
    subtitle: result.author || 'Published model card',
    kindLabel: 'Model Card',
    description: result.short_description || result.categories || '',
    metadataText: compactText(result.author, result.categories, result.version, result.short_description),
    raw: result,
  }
}

function normalizeDatasheetResult(result) {
  return {
    assetType: 'datasheet',
    assetId: result.identifier,
    title: result.title || 'Untitled datasheet',
    subtitle: result.creator || 'Published datasheet',
    kindLabel: 'Datasheet',
    description: result.category || '',
    metadataText: compactText(result.creator, result.category, result.title),
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
    test_accuracy: detail.ai_model?.test_accuracy ?? '',
    input_data: detail.input_data || '',
    output_data: detail.output_data || detail.ai_model?.location || '',
    keywords: detail.keywords || '',
    is_private: Boolean(detail.is_private),
    is_gated: Boolean(detail.is_gated),
    author: detail.author || '',
    citation: detail.citation || '',
    documentation: detail.documentation || '',
    foundational_model: detail.foundational_model || '',
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

function buildModelCardVersionPayload(form, detail, editorName = '') {
  const aiModel = detail.ai_model || null
  return {
    name: normalizeText(form.name) || detail.name,
    version: normalizeText(form.version) || detail.version || null,
    short_description: normalizeText(form.short_description),
    full_description: normalizeText(form.full_description),
    keywords: normalizeText(form.keywords),
    author: normalizeText(form.author) || normalizeText(editorName) || null,
    citation: normalizeText(form.citation),
    input_data: normalizeText(form.input_data),
    input_type: normalizeText(form.input_type),
    output_data: normalizeText(form.output_data),
    foundational_model: normalizeText(form.foundational_model),
    category: normalizeText(form.category),
    documentation: normalizeText(form.documentation),
    is_private: Boolean(form.is_private),
    is_gated: Boolean(form.is_gated),
    asset_version: Number(detail.asset_version || 1) + 1,
    previous_version_id: detail.external_id,
    root_version_id: detail.root_version_id || detail.external_id,
    ai_model: shouldIncludeAiModel(aiModel, form)
      ? {
          name: normalizeText(aiModel?.name) || normalizeText(form.name) || detail.name,
          version: normalizeText(aiModel?.version) || normalizeText(form.version) || detail.version || null,
          description: normalizeText(aiModel?.description) || normalizeText(form.short_description) || null,
          owner: normalizeText(aiModel?.owner) || normalizeText(form.author) || normalizeText(editorName) || null,
          location: normalizeText(form.output_data) || normalizeText(aiModel?.location) || null,
          license: normalizeText(form.license) || normalizeText(aiModel?.license) || null,
          framework: normalizeText(form.framework) || normalizeText(aiModel?.framework) || null,
          model_type: normalizeText(aiModel?.model_type) || null,
          test_accuracy: parseNumber(form.test_accuracy),
        }
      : null,
  }
}

function buildDatasheetVersionPayload(form, detail) {
  const title = normalizeText(form.name)
  const description = normalizeText(form.description)
  const publisherName = normalizeText(form.publisher)

  return {
    publication_year: parseInteger(form.publication_year),
    resource_type: normalizeText(form.source) || normalizeText(detail.resource_type),
    resource_type_general: normalizeText(detail.resource_type_general),
    size: normalizeText(detail.size),
    format: normalizeText(detail.format),
    version: normalizeText(form.version) || normalizeText(detail.version),
    is_private: Boolean(form.is_private),
    dataset_schema_id: detail.dataset_schema_id || null,
    asset_version: Number(detail.asset_version || 1) + 1,
    previous_version_id: detail.identifier,
    root_version_id: detail.root_version_id || detail.identifier,
    publisher: publisherName ? {
      name: publisherName,
      publisher_identifier: normalizeText(detail.publisher?.publisher_identifier),
      publisher_identifier_scheme: normalizeText(detail.publisher?.publisher_identifier_scheme),
      scheme_uri: normalizeText(detail.publisher?.scheme_uri),
      lang: normalizeText(detail.publisher?.lang),
    } : null,
    creators: buildCreators(form, detail),
    titles: buildTitles(detail.titles, title),
    subjects: buildSubjects(form, detail),
    contributors: (detail.contributors || []).map((item) => ({ ...item })),
    dates: (detail.dates || []).map((item) => ({ ...item })),
    alternate_identifiers: (detail.alternate_identifiers || []).map((item) => ({ ...item })),
    related_identifiers: buildRelatedIdentifiers(form, detail),
    rights_list: (detail.rights_list || []).map((item) => ({ ...item })),
    descriptions: buildDescriptions(detail.descriptions, description),
    geo_locations: (detail.geo_locations || []).map((item) => ({ ...item })),
    funding_references: (detail.funding_references || []).map((item) => ({ ...item })),
  }
}

function buildCreators(form, detail) {
  const creatorNames = String(form.creator || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!creatorNames.length) {
    return (detail.creators || []).map((item) => ({ ...item }))
  }

  return creatorNames.map((creatorName, index) => {
    const base = detail.creators?.[index] || detail.creators?.[0] || {}
    return {
      creator_name: creatorName,
      name_type: normalizeText(base.name_type),
      lang: normalizeText(base.lang),
      given_name: normalizeText(base.given_name),
      family_name: normalizeText(base.family_name),
      name_identifier: normalizeText(base.name_identifier),
      name_identifier_scheme: normalizeText(base.name_identifier_scheme),
      name_id_scheme_uri: normalizeText(base.name_id_scheme_uri),
      affiliation: normalizeText(base.affiliation),
      affiliation_identifier: normalizeText(base.affiliation_identifier),
      affiliation_identifier_scheme: normalizeText(base.affiliation_identifier_scheme),
      affiliation_scheme_uri: normalizeText(base.affiliation_scheme_uri),
    }
  })
}

function buildTitles(existingTitles, editedTitle) {
  const base = existingTitles?.length ? existingTitles.map((item) => ({ ...item })) : [{ title: '', title_type: null, lang: null }]
  base[0] = {
    ...base[0],
    title: editedTitle || base[0].title || 'Untitled datasheet',
  }
  return base
}

function buildSubjects(form, detail) {
  const subjectNames = String(form.features || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!subjectNames.length) {
    return (detail.subjects || []).map((item) => ({ ...item }))
  }

  return subjectNames.map((subject, index) => {
    const base = detail.subjects?.[index] || detail.subjects?.[0] || {}
    return {
      subject,
      subject_scheme: normalizeText(base.subject_scheme),
      scheme_uri: normalizeText(base.scheme_uri),
      value_uri: normalizeText(base.value_uri),
      classification_code: normalizeText(base.classification_code),
      lang: normalizeText(base.lang),
    }
  })
}

function buildDescriptions(existingDescriptions, editedDescription) {
  const base = existingDescriptions?.length
    ? existingDescriptions.map((item) => ({ ...item }))
    : [{ description: '', description_type: 'Abstract', lang: null }]

  base[0] = {
    ...base[0],
    description: editedDescription || base[0].description || '',
    description_type: base[0].description_type || 'Abstract',
  }
  return base
}

function buildRelatedIdentifiers(form, detail) {
  const existing = (detail.related_identifiers || []).map((item) => ({ ...item }))
  const url = normalizeText(form.download_url)
  if (!url) {
    return existing
  }

  const index = existing.findIndex((item) => String(item.related_identifier || '').startsWith('http'))
  const nextItem = {
    related_identifier: url,
    related_identifier_type: existing[index]?.related_identifier_type || 'URL',
    relation_type: existing[index]?.relation_type || 'IsReferencedBy',
    related_metadata_scheme: existing[index]?.related_metadata_scheme || null,
    scheme_uri: existing[index]?.scheme_uri || null,
    scheme_type: existing[index]?.scheme_type || null,
    resource_type_general: existing[index]?.resource_type_general || null,
  }

  if (index >= 0) {
    existing[index] = nextItem
    return existing
  }

  existing.push(nextItem)
  return existing
}

function pickDownloadUrl(relatedIdentifiers) {
  const httpLink = relatedIdentifiers.find((item) => String(item.related_identifier || '').startsWith('http'))
  return httpLink?.related_identifier || ''
}

function shouldIncludeAiModel(aiModel, form) {
  return Boolean(
    aiModel ||
    normalizeText(form.framework) ||
    normalizeText(form.license) ||
    normalizeText(form.output_data) ||
    form.test_accuracy !== '' && form.test_accuracy !== null && form.test_accuracy !== undefined
  )
}

function normalizeText(value) {
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

function parseInteger(value) {
  if (value === '' || value == null) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNumber(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
