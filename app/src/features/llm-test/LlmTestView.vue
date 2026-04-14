<template>
  <div class="llm-test-page">
    <div class="page-header">
      <h1>LLM Test</h1>
      <p>Vanilla chat surface for testing PATRA's LiteLLM/JWT connection. No tool routing, templates, citations, or workflow access are used here.</p>
    </div>

    <section class="card llm-test-shell">
      <div class="card-header llm-test-header">
        <div>
          <div class="test-title">Raw Chat Completion</div>
          <div class="test-subtitle">Messages are sent directly to the configured OpenAI-compatible backend.</div>
        </div>
        <button class="btn btn-outline btn-sm" type="button" @click="resetChat" :disabled="sending">Reset</button>
      </div>

      <div class="card-body">
        <div class="status-strip" :class="statusClass">
          <div>
            <span class="status-label">Status</span>
            <strong>{{ statusLabel }}</strong>
          </div>
          <div>
            <span class="status-label">Provider</span>
            <strong>{{ lastResponse?.provider || 'Not tested yet' }}</strong>
          </div>
          <div>
            <span class="status-label">Requested Model</span>
            <strong>{{ lastResponse?.requested_model || 'Not tested yet' }}</strong>
          </div>
          <div>
            <span class="status-label">Returned Model</span>
            <strong>{{ lastResponse?.model_used || 'Not tested yet' }}</strong>
          </div>
        </div>

        <div v-if="lastResponse?.api_base" class="api-base-line">
          API base: <code>{{ lastResponse.api_base }}</code>
          <span class="api-base-note">Model self-identification in chat text can be hallucinated; use the requested/returned API model fields above for routing checks.</span>
        </div>

        <div class="chat-window">
          <div v-if="!messages.length" class="empty-state">
            Send a plain prompt to verify whether the backend can call LiteLLM with the active Tapis JWT/service token.
          </div>
          <div v-for="(message, index) in messages" :key="index" class="message-row" :class="message.role">
            <div class="message-role">{{ message.role === 'user' ? 'You' : 'LLM' }}</div>
            <div class="message-bubble">
              <pre v-if="message.role === 'assistant'">{{ message.content }}</pre>
              <span v-else>{{ message.content }}</span>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-panel">
          <strong>Raw error</strong>
          <pre>{{ error }}</pre>
        </div>

        <form class="composer" @submit.prevent="sendMessage">
          <textarea
            v-model="draft"
            placeholder="Type a direct LLM test prompt..."
            rows="4"
            :disabled="sending"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button class="btn btn-primary" type="submit" :disabled="sending || !draft.trim()">
            {{ sending ? 'Testing...' : 'Send Test' }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { sendLlmTestMessage } from './api'

const draft = ref('Say hello in one short sentence. Do not identify your model unless API metadata is provided.')
const sending = ref(false)
const messages = ref([])
const lastResponse = ref(null)
const error = ref('')

const statusLabel = computed(() => {
  if (sending.value) return 'Running'
  if (lastResponse.value?.mode === 'llm') return 'LLM connected'
  if (lastResponse.value?.mode === 'error') return 'LLM failed'
  return 'Idle'
})

const statusClass = computed(() => ({
  'status-running': sending.value,
  'status-ok': lastResponse.value?.mode === 'llm',
  'status-error': lastResponse.value?.mode === 'error',
}))

function resetChat() {
  messages.value = []
  lastResponse.value = null
  error.value = ''
}

async function sendMessage() {
  const message = draft.value.trim()
  if (!message || sending.value) return
  sending.value = true
  error.value = ''
  messages.value.push({ role: 'user', content: message })
  draft.value = ''

  try {
    const response = await sendLlmTestMessage({
      message,
      history: messages.value.slice(0, -1).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    })
    lastResponse.value = response
    if (response.mode === 'llm') {
      messages.value.push({ role: 'assistant', content: response.answer || '(empty response)' })
    } else {
      error.value = response.error || 'Unknown LLM error.'
      messages.value.push({ role: 'assistant', content: `LLM request failed: ${error.value}` })
    }
  } catch (err) {
    error.value = err?.message || String(err)
    lastResponse.value = { mode: 'error', provider: 'Unknown', error: error.value }
    messages.value.push({ role: 'assistant', content: `LLM test request failed: ${error.value}` })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.llm-test-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.llm-test-shell {
  max-width: 980px;
}

.llm-test-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.test-title {
  font-weight: 800;
  color: var(--color-text);
}

.test-subtitle,
.api-base-line,
.empty-state {
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.api-base-note {
  display: block;
  margin-top: 4px;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.68);
}

.status-strip > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-ok {
  border-color: rgba(47, 133, 90, 0.32);
  background: rgba(231, 248, 238, 0.78);
}

.status-error {
  border-color: rgba(190, 49, 68, 0.32);
  background: rgba(255, 238, 241, 0.78);
}

.status-running {
  border-color: rgba(64, 96, 202, 0.3);
  background: rgba(239, 243, 255, 0.78);
}

.api-base-line {
  margin-top: 12px;
}

.chat-window {
  min-height: 320px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 18px;
  margin-top: 18px;
  background: rgba(255, 253, 248, 0.82);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.message-role {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.message-bubble {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 13px 14px;
  background: #fff;
  white-space: pre-wrap;
}

.message-row.user .message-bubble {
  background: #304fad;
  border-color: #304fad;
  color: #fff;
}

.message-bubble pre,
.error-panel pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.error-panel {
  margin-top: 16px;
  border: 1px solid rgba(190, 49, 68, 0.32);
  background: rgba(255, 238, 241, 0.82);
  border-radius: 16px;
  padding: 14px;
  color: #8a1f32;
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
  margin-top: 18px;
}

.composer textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 14px;
  font: inherit;
  background: #fff;
}

@media (max-width: 760px) {
  .status-strip,
  .composer {
    grid-template-columns: 1fr;
  }

  .message-row {
    grid-template-columns: 1fr;
  }
}
</style>
