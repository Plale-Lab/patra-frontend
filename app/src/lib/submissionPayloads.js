import { normalizeAssetInput, parseAssetInput } from './assetIntake'

export function getAssetEndpointPath(type, bulk = false) {
  if (type === 'model_card') {
    return bulk ? '/v1/assets/model-cards/bulk' : '/v1/assets/model-cards'
  }

  if (type === 'datasheet') {
    return bulk ? '/v1/assets/datasheets/bulk' : '/v1/assets/datasheets'
  }

  throw new Error(`Unsupported submission type: ${type}`)
}

export function mapSubmissionToAssetPayload(type, data, submittedBy) {
  if (type === 'model_card') {
    return mapModelCardPayload(data, submittedBy)
  }

  if (type === 'datasheet') {
    return mapDatasheetPayload(data, submittedBy)
  }

  throw new Error(`Unsupported submission type: ${type}`)
}

export function getSubmissionDisplayName(type, payload) {
  if (type === 'model_card') {
    return payload.name || 'Untitled model card'
  }

  return payload.titles?.[0]?.title || 'Untitled datasheet'
}

function mapModelCardPayload(data, submittedBy) {
  if (data?.intake_method === 'asset_link') {
    const derivedName = deriveNameFromAssetUrl(data.asset_url, 'Imported model card')
    const name = normalizeAssetInput(data.display_name) || derivedName
    const summary = normalizeAssetInput(data.submitter_notes) || `Imported from ${data.asset_provider || 'external source'}`

    return {
      name,
      version: 'asset-link',
      short_description: summary,
      full_description: buildModelCardDescription(summary, data.asset_url),
      author: submittedBy || 'Unknown submitter',
      documentation: data.asset_url,
      category: data.asset_provider || 'external',
      ai_model: {
        name,
        version: 'asset-link',
        owner: submittedBy || null,
        description: summary,
      },
    }
  }

  const name = normalizeAssetInput(data.name)
  const shortDescription = normalizeAssetInput(data.short_description)
  const fullDescription = normalizeAssetInput(data.full_description)
  const author = normalizeAssetInput(data.author || submittedBy)

  return compactObject({
    name,
    version: normalizeAssetInput(data.version),
    short_description: shortDescription,
    full_description: fullDescription,
    keywords: normalizeAssetInput(data.keywords),
    author,
    input_data: normalizeAssetInput(data.input_data),
    input_type: normalizeAssetInput(data.input_type),
    output_data: normalizeAssetInput(data.output_data),
    category: normalizeAssetInput(data.category),
    is_private: Boolean(data.is_private),
    ai_model: compactObject({
      name,
      version: normalizeAssetInput(data.version),
      owner: author,
      description: fullDescription || shortDescription,
      license: normalizeAssetInput(data.license),
      framework: normalizeAssetInput(data.framework),
      model_type: normalizeAssetInput(data.category),
      test_accuracy: toNullableNumber(data.test_accuracy),
    }),
  })
}

function mapDatasheetPayload(data, submittedBy) {
  if (data?.intake_method === 'asset_link') {
    const title = normalizeAssetInput(data.display_name) || deriveNameFromAssetUrl(data.asset_url, 'Imported datasheet')
    const description = normalizeAssetInput(data.submitter_notes) || `Imported from ${data.asset_provider || 'external source'}`

    return compactObject({
      version: 'asset-link',
      resource_type: 'Dataset',
      resource_type_general: 'Dataset',
      titles: [{ title }],
      creators: submittedBy ? [{ creator_name: submittedBy }] : [],
      subjects: data.asset_provider ? [{ subject: data.asset_provider }] : [],
      descriptions: [{ description: buildDatasheetDescription(description, data.asset_url), description_type: 'Other' }],
      related_identifiers: [{
        related_identifier: data.asset_url,
        related_identifier_type: inferIdentifierType(data.asset_url),
        relation_type: 'IsReferencedBy',
      }],
    })
  }

  const relatedIdentifiers = []
  const downloadUrl = normalizeAssetInput(data.download_url)
  if (downloadUrl) {
    relatedIdentifiers.push({
      related_identifier: downloadUrl,
      related_identifier_type: inferIdentifierType(downloadUrl),
      relation_type: 'IsReferencedBy',
    })
  }

  return compactObject({
    version: normalizeAssetInput(data.version),
    publication_year: toNullableInteger(data.publication_year),
    resource_type: normalizeAssetInput(data.source) || 'Dataset',
    resource_type_general: 'Dataset',
    format: inferFileFormat(downloadUrl),
    is_private: Boolean(data.is_private),
    publisher: data.publisher ? { name: normalizeAssetInput(data.publisher) } : undefined,
    creators: toNamedList(data.creator, 'creator_name'),
    titles: [{ title: normalizeAssetInput(data.name) }],
    subjects: toNamedList(data.features, 'subject'),
    descriptions: [{
      description: buildDatasheetDescription(normalizeAssetInput(data.description), downloadUrl),
      description_type: 'Abstract',
    }],
    related_identifiers: relatedIdentifiers,
  })
}

function deriveNameFromAssetUrl(value, fallback) {
  const parsed = parseAssetInput(value)
  if (!parsed) return fallback

  if (parsed.provider === 'doi') {
    return `DOI ${parsed.normalized}`
  }

  try {
    const url = new URL(parsed.normalized)
    const lastSegment = url.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .pop()

    return decodeURIComponent(lastSegment || url.hostname || fallback)
  } catch {
    return fallback
  }
}

function buildModelCardDescription(summary, assetUrl) {
  return assetUrl ? `${summary}\n\nSource record: ${assetUrl}` : summary
}

function buildDatasheetDescription(summary, assetUrl) {
  return assetUrl ? `${summary}\n\nSource record: ${assetUrl}` : summary
}

function inferIdentifierType(value) {
  return String(value || '').startsWith('10.') ? 'DOI' : 'URL'
}

function inferFileFormat(value) {
  if (!value) return undefined

  try {
    const { pathname } = new URL(value)
    const extension = pathname.split('.').pop()
    return extension && extension !== pathname ? extension.toLowerCase() : undefined
  } catch {
    return undefined
  }
}

function toNamedList(value, key) {
  return splitValues(value).map((item) => ({ [key]: item }))
}

function splitValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeAssetInput(item)).filter(Boolean)
  }

  return String(value || '')
    .split(',')
    .map((item) => normalizeAssetInput(item))
    .filter(Boolean)
}

function toNullableInteger(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : undefined
}

function toNullableNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry == null) return false
      if (typeof entry === 'string') return entry.length > 0
      if (Array.isArray(entry)) return entry.length > 0
      if (typeof entry === 'object') return Object.keys(entry).length > 0
      return true
    }),
  )
}
