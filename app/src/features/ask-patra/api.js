import { apiFetch } from '../../lib/api'
import { parseErrorMessage } from '../../lib/errorParsing'

export async function fetchAskPatraBootstrap() {
  const response = await apiFetch('/api/ask-patra/bootstrap')
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `HTTP ${response.status}`))
  }
  return response.json()
}

export async function sendAskPatraMessage(payload) {
  const response = await apiFetch('/api/ask-patra/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `HTTP ${response.status}`))
  }
  return response.json()
}
