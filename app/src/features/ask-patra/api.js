import { apiFetch } from '../../lib/api'

export async function fetchAskPatraBootstrap() {
  const response = await apiFetch('/api/ask-patra/bootstrap')
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function sendAskPatraMessage(payload) {
  let response = await apiFetch('/api/ask-patra/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (response.status === 404) {
    console.warn('[AskPatra] /api/ask-patra/chat returned 404, retrying legacy /api/ask-patra endpoint')
    response = await apiFetch('/api/ask-patra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function executeAskPatraAction(payload) {
  const response = await apiFetch('/api/ask-patra/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `HTTP ${response.status}`))
  }
  return response.json()
}

async function parseError(response, fallback) {
  try {
    const payload = await response.json()
    return payload.detail || payload.message || fallback
  } catch {
    return fallback
  }
}
