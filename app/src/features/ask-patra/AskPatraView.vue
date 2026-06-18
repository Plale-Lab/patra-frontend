<template>
  <div class="ask-page">
    <div class="page-header">
      <h1>Ask Patra</h1>
      <p>Ask about model cards, datasheets, and platform workflows in plain language. Answers cite the records they reference.</p>
    </div>

    <div class="chatbot-shell card">
      <div class="card-header chatbot-topbar">
        <div>
          <div class="assistant-badge-row">
            <img class="assistant-mark" src="/img/patra-logo.png" alt="" />
            <span class="assistant-badge">AI Assistant</span>
            <span class="provider-chip">{{ providerLabel }}</span>
          </div>
          <div class="chatbot-subtitle">Ask about records, workflows, Patra capabilities, or metadata lookups.</div>
        </div>
        <button class="btn btn-outline btn-sm" type="button" @click="resetConversation" :disabled="sending || isAnimating">
          Reset chat
        </button>
      </div>

      <div class="card-body chatbot-body">
        <StarterPrompts
          v-if="!messages.length && !sending"
          :prompts="starterPrompts"
          @pick="applyStarter"
        />

        <MessageList :messages="messages" :sending="sending" :animating="isAnimating" />

        <InlineFeedback v-if="errorMessage" type="error" :message="errorMessage" />

        <Composer
          v-model="draftMessage"
          :placeholder="composerPlaceholder"
          :disabled="sending || isAnimating || !draftMessage.trim()"
          :button-label="sending ? 'Processing…' : (isAnimating ? 'Rendering…' : 'Send')"
          @send="handleSend"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchAskPatraBootstrap, sendAskPatraMessage } from './api'
import StarterPrompts from './components/StarterPrompts.vue'
import MessageList from './components/MessageList.vue'
import Composer from './components/Composer.vue'
import InlineFeedback from '../../components/InlineFeedback.vue'

const composerPlaceholder = 'Ask about model cards, datasheets, Agent Toolkit, or metadata lookups'

const draftMessage = ref('')
const errorMessage = ref('')
const sending = ref(false)
const conversationId = ref('')
const provider = ref('Patra AI')
const starterPrompts = ref([])
const messages = ref([])
const isAnimating = ref(false)

// Single owner of the typewriter interval; cleared on unmount, reset, and
// before every new animation.
let animationTimer = null

const providerLabel = computed(() => provider.value || 'Patra AI')

onMounted(loadBootstrap)
onBeforeUnmount(stopAnimation)

async function loadBootstrap() {
  try {
    const bootstrap = await fetchAskPatraBootstrap()
    provider.value = bootstrap.provider
    starterPrompts.value = bootstrap.starter_prompts || []
  } catch (error) {
    errorMessage.value = error.message || 'Could not load Ask Patra bootstrap state.'
  }
}

function applyStarter(prompt) {
  draftMessage.value = prompt
}

function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
  isAnimating.value = false
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function findLastAssistantIndex(list) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].role === 'assistant') return i
  }
  return -1
}

// Filter out system messages and attach citations per assistant turn. The
// backend returns the full message history every send but `citations` only for
// the latest turn (messages carry none), so older turns' citations are
// preserved client-side by matching the stable created_at key.
function prepareMessages(rawMessages, citations) {
  const prior = new Map(
    messages.value
      .filter((message) => message.role === 'assistant' && message.citations && message.citations.length)
      .map((message) => [message.created_at, message.citations]),
  )
  const filtered = rawMessages.filter((message) => message.role !== 'system')
  const lastAssistant = findLastAssistantIndex(filtered)
  const withCitations = filtered.map((message, index) => {
    if (message.role !== 'assistant') return message
    if (index === lastAssistant) return { ...message, citations: citations || [] }
    const preserved = prior.get(message.created_at)
    return preserved ? { ...message, citations: preserved } : message
  })
  return { filtered: withCitations, lastAssistant }
}

function animateLatestAssistant(rawMessages, citations) {
  stopAnimation()
  const { filtered, lastAssistant } = prepareMessages(rawMessages, citations)
  const lastIndex = filtered.length - 1

  if (lastIndex < 0 || lastAssistant !== lastIndex) {
    messages.value = filtered
    return
  }

  const fullText = String(filtered[lastIndex].content || '')
  if (!fullText || prefersReducedMotion()) {
    messages.value = filtered
    return
  }

  messages.value = filtered.map((message, index) => (
    index === lastIndex ? { ...message, content: '' } : message
  ))
  isAnimating.value = true
  let cursor = 0
  const step = Math.max(1, Math.ceil(fullText.length / 140))

  animationTimer = setInterval(() => {
    cursor = Math.min(fullText.length, cursor + step)
    const next = messages.value.slice()
    next[lastIndex] = { ...next[lastIndex], content: fullText.slice(0, cursor) }
    messages.value = next
    if (cursor >= fullText.length) {
      stopAnimation()
      messages.value = filtered
    }
  }, 18)
}

async function handleSend() {
  const message = draftMessage.value.trim()
  if (!message || sending.value || isAnimating.value) return
  sending.value = true
  errorMessage.value = ''
  try {
    const response = await sendAskPatraMessage({
      message,
      conversation_id: conversationId.value || null,
      reset: false,
    })
    conversationId.value = response.conversation_id
    provider.value = response.provider
    starterPrompts.value = response.starter_prompts || starterPrompts.value
    draftMessage.value = ''
    animateLatestAssistant(response.messages || [], response.citations || [])
  } catch (error) {
    errorMessage.value = error.message || 'Ask Patra failed.'
  } finally {
    sending.value = false
  }
}

async function resetConversation() {
  stopAnimation()
  conversationId.value = ''
  messages.value = []
  errorMessage.value = ''
  draftMessage.value = ''
  await loadBootstrap()
}
</script>

<style scoped>
.ask-page {
  min-width: 0;
}

.chatbot-shell {
  max-width: 1040px;
}

.chatbot-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.assistant-badge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.assistant-mark {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.assistant-badge,
.provider-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: .74rem;
  font-weight: 700;
}

.assistant-badge {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.provider-chip {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.chatbot-subtitle {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: .84rem;
}

.chatbot-body {
  display: grid;
  gap: 18px;
}

@media (max-width: 720px) {
  .chatbot-topbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
