// Format a version string for display. The stored value is inconsistent across
// records — some are bare numbers ("2.0"), some already carry a "v" prefix
// ("v2.0"), and some are freeform labels ("ViT-L/14 Ensemble"). Only prepend a
// "v" to a bare numeric version; pass anything else through unchanged; return
// '' for empty so callers can hide the badge.
export function formatVersion(value) {
  const v = String(value ?? '').trim()
  if (!v) return ''
  if (/^v/i.test(v)) return v
  if (/^\d/.test(v)) return `v${v}`
  return v
}
