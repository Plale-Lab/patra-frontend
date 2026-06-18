// Asset payload builders, co-located so the create-vs-patch split is explicit.
//
//   CREATE (SubmitView): build a FULL object from an empty form + auth defaults.
//   PATCH  (EditRecordsView): build a SPARSE diff against the fetched detail.
//
// The CREATE builders are moved verbatim from SubmitView (the only change is
// parameterizing the author/creator default instead of reaching into the auth
// store). The PATCH builders + diff/merge helpers are moved verbatim from
// features/edit-records/api.js. The datasheet PATCH reads the canonical keys
// title/resource_type/subjects (was name/source/features) — see lib/assetFields.js.

/* ===================== CREATE (Submit) ===================== */

export function buildModelCardPayload(form, { authorName = '' } = {}) {
  const author = form.author.trim() || authorName
  const payload = {
    name: form.name.trim(),
    version: form.version.trim() || null,
    short_description: form.short_description.trim() || null,
    full_description: form.full_description.trim() || null,
    category: form.category.trim() || null,
    input_type: form.input_type.trim() || null,
    author,
    keywords: form.keywords.trim() || null,
    foundational_model: form.foundational_model.trim() || null,
    input_data: form.input_data.trim() || null,
    output_data: form.output_data.trim() || null,
    citation: form.citation.trim() || null,
    documentation: form.documentation.trim() || null,
    is_private: form.is_private,
    is_gated: form.is_gated,
  }
  const hasAiModel = form.framework.trim() || form.license.trim() || form.test_accuracy || form.location.trim()
  if (hasAiModel) {
    payload.ai_model = {
      name: form.name.trim(),
      framework: form.framework.trim() || null,
      license: form.license.trim() || null,
      test_accuracy: form.test_accuracy ? parseFloat(form.test_accuracy) : null,
      location: form.location.trim() || null,
      owner: author,
    }
  }
  return payload
}

export function buildDatasheetPayload(form, { creatorName = '' } = {}) {
  const creator = form.creator.trim() || creatorName
  const subjects = form.subjects.split(',').map((s) => s.trim()).filter(Boolean)
  const payload = {
    version: form.version.trim() || null,
    resource_type: form.resource_type.trim() || null,
    publication_year: form.publication_year ? parseInt(form.publication_year) : null,
    is_private: form.is_private,
    titles: [{ title: form.title.trim() }],
    creators: [{ creator_name: creator }],
    subjects: subjects.map((s) => ({ subject: s })),
    descriptions: form.description.trim()
      ? [{ description: form.description.trim(), description_type: 'Abstract' }]
      : [],
  }
  if (form.publisher.trim()) {
    payload.publisher = { name: form.publisher.trim() }
  }
  if (form.download_url.trim()) {
    payload.related_identifiers = [{
      related_identifier: form.download_url.trim(),
      related_identifier_type: 'URL',
      relation_type: 'IsDescribedBy',
    }]
  }
  return payload
}

/* ===================== PATCH (Edit) ===================== */

export function buildModelCardPatch(form, detail) {
  const patch = {}

  diffText(patch, 'name', form.name, detail.name)
  diffText(patch, 'version', form.version, detail.version)
  diffText(patch, 'short_description', form.short_description, detail.short_description)
  diffText(patch, 'full_description', form.full_description, detail.full_description)
  diffText(patch, 'keywords', form.keywords, detail.keywords)
  diffText(patch, 'author', form.author, detail.author)
  diffText(patch, 'citation', form.citation, detail.citation)
  diffText(patch, 'input_data', form.input_data, detail.input_data)
  diffText(patch, 'input_type', form.input_type, detail.input_type)
  diffText(patch, 'output_data', form.output_data, detail.output_data)
  diffText(patch, 'foundational_model', form.foundational_model, detail.foundational_model)
  diffText(patch, 'category', form.category, detail.categories)
  diffText(patch, 'documentation', form.documentation, detail.documentation)
  diffBool(patch, 'is_private', form.is_private, detail.is_private)
  diffBool(patch, 'is_gated', form.is_gated, detail.is_gated)

  const aiPatch = buildAiModelPatch(form, detail.ai_model || {})
  if (Object.keys(aiPatch).length > 0) {
    patch.ai_model = aiPatch
  }

  return patch
}

function buildAiModelPatch(form, aiDetail) {
  const patch = {}
  diffText(patch, 'license', form.license, aiDetail.license)
  diffText(patch, 'framework', form.framework, aiDetail.framework)
  diffText(patch, 'location', form.location, aiDetail.location)
  diffNumber(patch, 'test_accuracy', form.test_accuracy, aiDetail.test_accuracy)
  return patch
}

export function buildDatasheetPatch(form, detail) {
  const patch = {}

  diffText(patch, 'version', form.version, detail.version)
  diffText(patch, 'resource_type', form.resource_type, detail.resource_type)
  diffInteger(patch, 'publication_year', form.publication_year, detail.publication_year)
  diffBool(patch, 'is_private', form.is_private, detail.is_private)

  const formPublisherName = normalizeText(form.publisher)
  const detailPublisherName = normalizeText(detail.publisher?.name)
  if (formPublisherName !== detailPublisherName) {
    if (formPublisherName == null) {
      patch.publisher = null
    } else {
      patch.publisher = {
        name: formPublisherName,
        publisher_identifier: detail.publisher?.publisher_identifier ?? null,
        publisher_identifier_scheme: detail.publisher?.publisher_identifier_scheme ?? null,
        scheme_uri: detail.publisher?.scheme_uri ?? null,
        lang: detail.publisher?.lang ?? null,
      }
    }
  }

  const newTitles = mergeTitle(detail.titles || [], form.title)
  if (!arraysEqual(newTitles, detail.titles || [])) {
    patch.titles = newTitles
  }

  const newDescriptions = mergeDescription(detail.descriptions || [], form.description)
  if (!arraysEqual(newDescriptions, detail.descriptions || [])) {
    patch.descriptions = newDescriptions
  }

  const newCreators = mergeCreators(detail.creators || [], form.creator)
  if (!arraysEqual(newCreators, detail.creators || [])) {
    patch.creators = newCreators
  }

  const newSubjects = mergeSubjects(detail.subjects || [], form.subjects)
  if (!arraysEqual(newSubjects, detail.subjects || [])) {
    patch.subjects = newSubjects
  }

  const newRelated = mergeRelatedIdentifiers(detail.related_identifiers || [], form.download_url)
  if (!arraysEqual(newRelated, detail.related_identifiers || [])) {
    patch.related_identifiers = newRelated
  }

  return patch
}

/* ===================== merge / diff helpers ===================== */

function mergeTitle(existingTitles, editedTitle) {
  const trimmed = String(editedTitle || '').trim()
  if (!existingTitles.length) {
    if (!trimmed) return []
    return [{ title: trimmed, title_type: null, lang: null }]
  }
  return existingTitles.map((entry, index) =>
    index === 0
      ? { ...entry, title: trimmed || entry.title }
      : entry,
  )
}

function mergeDescription(existingDescriptions, editedDescription) {
  const trimmed = String(editedDescription || '').trim()
  if (!existingDescriptions.length) {
    if (!trimmed) return []
    return [{ description: trimmed, description_type: 'Abstract', lang: null }]
  }
  return existingDescriptions.map((entry, index) =>
    index === 0
      ? { ...entry, description: trimmed || entry.description }
      : entry,
  )
}

function mergeCreators(existingCreators, formCreatorList) {
  const names = String(formCreatorList || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!names.length) return existingCreators

  return names.map((creator_name, index) => {
    const base = existingCreators[index] || existingCreators[0] || {}
    return { ...base, creator_name }
  })
}

function mergeSubjects(existingSubjects, formFeaturesList) {
  const names = String(formFeaturesList || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!names.length) return existingSubjects

  return names.map((subject, index) => {
    const base = existingSubjects[index] || existingSubjects[0] || {}
    return { ...base, subject }
  })
}

function mergeRelatedIdentifiers(existingRelated, downloadUrl) {
  const url = normalizeText(downloadUrl)
  if (!url) {
    return existingRelated
  }

  const next = existingRelated.map((entry) => ({ ...entry }))
  const idx = next.findIndex((item) => String(item.related_identifier || '').startsWith('http'))
  const merged = {
    related_identifier: url,
    related_identifier_type: next[idx]?.related_identifier_type || 'URL',
    relation_type: next[idx]?.relation_type || 'IsReferencedBy',
    related_metadata_scheme: next[idx]?.related_metadata_scheme || null,
    scheme_uri: next[idx]?.scheme_uri || null,
    scheme_type: next[idx]?.scheme_type || null,
    resource_type_general: next[idx]?.resource_type_general || null,
  }
  if (idx >= 0) {
    next[idx] = merged
  } else {
    next.push(merged)
  }
  return next
}

function diffText(patch, key, formValue, detailValue) {
  const formNorm = normalizeText(formValue)
  const detailNorm = normalizeText(detailValue)
  if (formNorm !== detailNorm) {
    patch[key] = formNorm
  }
}

function diffBool(patch, key, formValue, detailValue) {
  if (Boolean(formValue) !== Boolean(detailValue)) {
    patch[key] = Boolean(formValue)
  }
}

function diffInteger(patch, key, formValue, detailValue) {
  const formNum = parseInteger(formValue)
  const detailNum = detailValue == null ? null : Number(detailValue)
  if (formNum !== detailNum) {
    patch[key] = formNum
  }
}

function diffNumber(patch, key, formValue, detailValue) {
  const formNum = parseNumber(formValue)
  const detailNum = detailValue == null ? null : Number(detailValue)
  if (formNum !== detailNum) {
    patch[key] = formNum
  }
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
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
