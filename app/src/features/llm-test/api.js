import { apiFetch } from '../../lib/api'

export async function sendLlmTestMessage({ message, history = [] }) {
  const response = await apiFetch('/api/llm-test/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `LLM test request failed with ${response.status}`)
  }
  return response.json()
}
