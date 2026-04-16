/**
 * Parse an error message from a fetch Response.
 *
 * Handles FastAPI-style JSON errors ({detail}, {message}, {error})
 * and falls back to the raw response text or a provided fallback string.
 */
export async function parseErrorMessage(res, fallback) {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => null)
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail))
      return data.detail.map((item) => item.msg || item.message || String(item)).join('; ')
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.error === 'string') return data.error
  }

  const text = await res.text().catch(() => '')
  return text || fallback
}
