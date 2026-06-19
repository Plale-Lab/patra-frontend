export const PORTAL_AUTH_PROTOCOL_VERSION = 1
export const PORTAL_AUTH_REQUEST_TYPE = 'patra:portal-auth:request'
export const PORTAL_AUTH_RESPONSE_TYPE = 'patra:portal-auth:response'
export const MIN_PORTAL_TOKEN_REMAINING_MS = 60_000

export class PortalAuthError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'PortalAuthError'
    this.code = code
  }
}

export function createPortalAuthRequestId(cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.getRandomValues) {
    throw new PortalAuthError('crypto_unavailable', 'Secure random generation is unavailable')
  }

  const bytes = new Uint8Array(24)
  cryptoApi.getRandomValues(bytes)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

export function parseTapisAccessToken(
  accessToken,
  {
    now = Date.now(),
    minRemainingMs = MIN_PORTAL_TOKEN_REMAINING_MS,
  } = {},
) {
  const token = String(accessToken || '').trim()
  if (!token) {
    throw new PortalAuthError('missing_token', 'Portal response did not include an access token')
  }

  const claims = decodeJwtPayload(token)
  const expiresAt = Number(claims.exp) * 1000
  if (!Number.isFinite(expiresAt)) {
    throw new PortalAuthError('missing_expiry', 'Portal access token does not include a valid expiry')
  }
  if (expiresAt <= now) {
    throw new PortalAuthError('expired_token', 'Portal access token has expired')
  }
  if (expiresAt - now < minRemainingMs) {
    throw new PortalAuthError('near_expiry_token', 'Portal access token expires too soon')
  }

  const tapisUsername = typeof claims['tapis/username'] === 'string'
    ? claims['tapis/username'].trim()
    : ''
  const subject = typeof claims.sub === 'string' ? claims.sub.trim() : ''
  const subjectUsername = subject.includes('@') ? subject.slice(0, subject.indexOf('@')).trim() : subject
  const username = tapisUsername || subjectUsername

  if (!username) {
    throw new PortalAuthError('missing_identity', 'Portal access token does not identify a Tapis user')
  }

  return {
    token,
    username,
    expiresAt,
  }
}

export function validatePortalAuthMessage(
  event,
  {
    parentWindow,
    allowedOrigins,
    requestId,
    now = Date.now(),
  },
) {
  if (event.source !== parentWindow) {
    throw new PortalAuthError('invalid_source', 'Portal response came from an unexpected window')
  }
  if (!allowedOrigins.includes(event.origin)) {
    throw new PortalAuthError('invalid_origin', 'Portal response came from an origin that is not allowed')
  }

  const data = event.data
  if (!data || typeof data !== 'object') {
    throw new PortalAuthError('malformed_response', 'Portal response is malformed')
  }
  if (data.type !== PORTAL_AUTH_RESPONSE_TYPE || data.version !== PORTAL_AUTH_PROTOCOL_VERSION) {
    throw new PortalAuthError('invalid_protocol', 'Portal response uses an unsupported protocol')
  }
  if (data.requestId !== requestId) {
    throw new PortalAuthError('invalid_request_id', 'Portal response does not match the active request')
  }
  if (String(data.tokenType || '').toLowerCase() !== 'bearer') {
    throw new PortalAuthError('invalid_token_type', 'Portal response must contain a Bearer token')
  }

  return parseTapisAccessToken(data.accessToken, { now })
}

export function requestPortalAuth({
  allowedOrigins,
  timeoutMs,
  hostWindow = window,
  parentWindow = window.parent,
  now = () => Date.now(),
  requestIdFactory = createPortalAuthRequestId,
} = {}) {
  const origins = Array.from(new Set(allowedOrigins || []))
  if (!origins.length) {
    return Promise.reject(new PortalAuthError('missing_origins', 'No portal origins are configured'))
  }
  if (!parentWindow || parentWindow === hostWindow) {
    return Promise.reject(new PortalAuthError('not_embedded', 'Patra is not running inside a parent portal'))
  }

  const requestId = requestIdFactory()
  const request = {
    type: PORTAL_AUTH_REQUEST_TYPE,
    version: PORTAL_AUTH_PROTOCOL_VERSION,
    requestId,
  }

  return new Promise((resolve, reject) => {
    let settled = false
    let requestUnused = true
    let timeoutHandle = null

    const cleanup = () => {
      hostWindow.removeEventListener('message', handleMessage)
      if (timeoutHandle !== null) hostWindow.clearTimeout(timeoutHandle)
    }

    const finish = (callback, value) => {
      if (settled) return
      settled = true
      cleanup()
      callback(value)
    }

    const handleMessage = (event) => {
      if (settled || !requestUnused) return
      if (event.source !== parentWindow) return
      if (!origins.includes(event.origin)) return
      if (!event.data || typeof event.data !== 'object') return
      if (event.data.type !== PORTAL_AUTH_RESPONSE_TYPE) return
      if (event.data.version !== PORTAL_AUTH_PROTOCOL_VERSION) return
      if (event.data.requestId !== requestId) return

      requestUnused = false
      try {
        finish(resolve, validatePortalAuthMessage(event, {
          parentWindow,
          allowedOrigins: origins,
          requestId,
          now: now(),
        }))
      } catch (error) {
        finish(reject, error)
      }
    }

    hostWindow.addEventListener('message', handleMessage)
    timeoutHandle = hostWindow.setTimeout(() => {
      requestUnused = false
      finish(reject, new PortalAuthError('timeout', 'Portal authentication timed out'))
    }, timeoutMs)

    let sent = false
    for (const origin of origins) {
      try {
        parentWindow.postMessage(request, origin)
        sent = true
      } catch {
        // Continue trying the other exact configured origins.
      }
    }

    if (!sent) {
      requestUnused = false
      finish(reject, new PortalAuthError('post_message_failed', 'Unable to contact the parent portal'))
    }
  })
}

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new PortalAuthError('malformed_token', 'Portal access token is not a JWT')
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes))
    if (!claims || typeof claims !== 'object' || Array.isArray(claims)) {
      throw new Error('JWT payload is not an object')
    }
    return claims
  } catch {
    throw new PortalAuthError('malformed_token', 'Portal access token payload is invalid')
  }
}
