// Real "Import from Hugging Face": fetches a public HF model/dataset repo
// via the backend's /v1/hf-import/preview endpoint and returns flat fields
// matching the Submit form's reactive state (mcForm/dsForm keys). Only
// realistically-derivable fields are present in the response — the backend
// never fabricates values, so callers should expect a sparse object.

import { apiFetch } from './api'
import { parseErrorMessage } from './errorParsing'

const HF_HOSTS = new Set(['huggingface.co', 'www.huggingface.co', 'hf.co'])

export function isLikelyHuggingFaceUrl(url) {
  try {
    const parsed = new URL(String(url).trim())
    return HF_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export async function importFromHuggingFace(url, assetType) {
  const response = await apiFetch('/v1/hf-import/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: String(url).trim(), asset_type: assetType }),
  })
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `HTTP ${response.status}`))
  }
  return response.json()
}
