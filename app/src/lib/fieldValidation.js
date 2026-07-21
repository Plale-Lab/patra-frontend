// Lightweight, named field validators driven by FieldDef.validate / .required
// (see lib/assetFields.js). Pure functions returning '' when valid or a short
// message when not. Submit enforces required + format; Edit enforces format only
// (a record may legitimately clear a field), via enforceRequired = false.

export const validators = {
  required(value) {
    const empty = value == null || (typeof value === 'string' && value.trim() === '')
    return empty ? 'Required' : ''
  },
  url(value) {
    if (value == null || String(value).trim() === '') return ''
    return /^https?:\/\/\S+$/i.test(String(value).trim()) ? '' : 'Enter a valid http(s) URL'
  },
  accuracy(value) {
    if (value === '' || value == null) return ''
    const n = Number(value)
    return Number.isFinite(n) && n >= 0 && n <= 1 ? '' : 'Must be between 0 and 1'
  },
  uuid(value) {
    if (value == null || String(value).trim() === '') return ''
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value).trim())
      ? ''
      : 'Enter a valid UUID'
  },
}

export function validateField(field, value, enforceRequired = true) {
  if (enforceRequired && field.required) {
    const msg = validators.required(value)
    if (msg) return msg
  }
  for (const rule of field.validate || []) {
    const fn = validators[rule]
    if (fn) {
      const msg = fn(value)
      if (msg) return msg
    }
  }
  return ''
}

export function validateForm(fields, form, enforceRequired = true) {
  const errors = {}
  for (const field of fields) {
    const msg = validateField(field, form[field.key], enforceRequired)
    if (msg) errors[field.key] = msg
  }
  return errors
}
