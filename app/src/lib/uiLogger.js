const PREFIX = '[Patra UI]'

// Keep interaction logging structured and intentionally free of auth details,
// free-form user content, and record payloads.
export function logUiEvent(event, details = {}) {
  const entry = {
    event,
    at: new Date().toISOString(),
    ...details,
  }

  console.info(PREFIX, entry)
  return entry
}
