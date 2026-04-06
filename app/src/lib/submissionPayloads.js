function normalizeInput(value) {
  return String(value ?? '').trim() || null
}

export function getEndpointPath(type, bulk = false) {
  if (type === 'model_card') {
    return bulk ? '/v1/assets/model-cards/bulk' : '/v1/assets/model-cards'
  }

  if (type === 'datasheet') {
    return bulk ? '/v1/assets/datasheets/bulk' : '/v1/assets/datasheets'
  }

  throw new Error(`Unsupported submission type: ${type}`)
}

export function mapFormToPayload(type, data, submittedBy) {
  if (type === 'model_card') {
    return mapModelCardPayload(data, submittedBy)
  }

  if (type === 'datasheet') {
    return mapDatasheetPayload(data, submittedBy)
  }

  throw new Error(`Unsupported submission type: ${type}`)
}

export function getDisplayName(type, payload) {
  if (type === 'model_card') {
    return payload.name || 'Untitled model card'
  }

  return payload.titles?.[0]?.title || 'Untitled datasheet'
}

function mapModelCardPayload(data, submittedBy) {
  const name = normalizeInput(data.name)
  const shortDescription = normalizeInput(data.short_description)
  const fullDescription = normalizeInput(data.full_description)
  const author = normalizeInput(data.author || submittedBy)

  return compactObject({
    name,
    version: normalizeInput(data.version),
    short_description: shortDescription,
    full_description: fullDescription,
    keywords: normalizeInput(data.keywords),
    author,
    input_data: normalizeInput(data.input_data),
    input_type: normalizeInput(data.input_type),
    output_data: normalizeInput(data.output_data),
    category: normalizeInput(data.category),
    is_private: Boolean(data.is_private),
    ai_model: compactObject({
      name,
      version: normalizeInput(data.version),
      owner: author,
      description: fullDescription || shortDescription,
      license: normalizeInput(data.license),
      framework: normalizeInput(data.framework),
      model_type: normalizeInput(data.category),
      test_accuracy: toNullableNumber(data.test_accuracy),
    }),
  })
}

function mapDatasheetPayload(data, submittedBy) {
  const relatedIdentifiers = []
  const downloadUrl = normalizeInput(data.download_url)
  if (downloadUrl) {
    relatedIdentifiers.push({
      related_identifier: downloadUrl,
      related_identifier_type: downloadUrl.startsWith('10.') ? 'DOI' : 'URL',
      relation_type: 'IsReferencedBy',
    })
  }

  return compactObject({
    version: normalizeInput(data.version),
    publication_year: toNullableInteger(data.publication_year),
    resource_type: normalizeInput(data.source) || 'Dataset',
    resource_type_general: 'Dataset',
    format: inferFileFormat(downloadUrl),
    is_private: Boolean(data.is_private),
    publisher: data.publisher ? { name: normalizeInput(data.publisher) } : undefined,
    creators: toNamedList(data.creator, 'creator_name'),
    titles: [{ title: normalizeInput(data.name) }],
    subjects: toNamedList(data.features, 'subject'),
    descriptions: [{
      description: downloadUrl
        ? `${normalizeInput(data.description)}\n\nSource: ${downloadUrl}`
        : normalizeInput(data.description),
      description_type: 'Abstract',
    }],
    related_identifiers: relatedIdentifiers,
  })
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
    return value.map((item) => normalizeInput(item)).filter(Boolean)
  }

  return String(value || '')
    .split(',')
    .map((item) => normalizeInput(item))
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
