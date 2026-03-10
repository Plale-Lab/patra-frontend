export const ASSET_INTAKE_PROMPT =
  'Create ICICLE model card or datasheet for the existing model or dataset you want to include in the ICICLE ecosystem.'

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/i

export function normalizeAssetInput(value) {
  return String(value || '').trim()
}

export function parseAssetInput(value) {
  const normalized = normalizeAssetInput(value)

  if (!normalized) {
    return null
  }

  if (DOI_PATTERN.test(normalized)) {
    return {
      normalized,
      host: 'doi.org',
      provider: 'doi',
      protocol: 'doi',
    }
  }

  try {
    const url = new URL(normalized)

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }

    const host = url.hostname.toLowerCase()

    return {
      normalized: url.toString(),
      host,
      provider: inferAssetProvider(host),
      protocol: url.protocol.replace(':', ''),
    }
  } catch {
    return null
  }
}

export function isValidAssetInput(value) {
  return parseAssetInput(value) !== null
}

export function inferAssetProvider(host) {
  if (!host) return 'other'
  if (host.includes('huggingface.co')) return 'huggingface'
  if (host.includes('github.com')) return 'github'
  if (host.includes('kaggle.com')) return 'kaggle'
  if (host.includes('doi.org')) return 'doi'
  return 'other'
}

export function buildAssetIntakeData({
  assetUrl,
  displayName = '',
  notes = '',
  batchId = null,
  batchIndex = null,
  batchTotal = null,
  submissionOrigin = null,
}) {
  const parsed = parseAssetInput(assetUrl)

  if (!parsed) {
    throw new Error(`Invalid asset URL: ${assetUrl}`)
  }

  const data = {
    intake_method: 'asset_link',
    asset_url: parsed.normalized,
    asset_host: parsed.host,
    asset_provider: parsed.provider,
    display_name: normalizeAssetInput(displayName),
    submitter_notes: normalizeAssetInput(notes),
    intake_prompt: ASSET_INTAKE_PROMPT,
  }

  if (batchId) {
    data.batch_id = batchId
  }

  if (Number.isInteger(batchIndex)) {
    data.batch_index = batchIndex
  }

  if (Number.isInteger(batchTotal)) {
    data.batch_total = batchTotal
  }

  if (submissionOrigin) {
    data.submission_origin = submissionOrigin
  }

  return data
}
