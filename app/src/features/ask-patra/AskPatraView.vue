<template>
  <div class="ask-page">
    <div class="page-header">
      <h1>Ask Patra</h1>
      <p>Ask PATRA to find model cards, datasheets, and platform workflows using structured memory and PATRA AI.</p>
    </div>

    <div class="chatbot-shell card">
      <div class="card-header chatbot-topbar">
        <div>
          <div class="assistant-badge-row">
            <img class="assistant-mark" src="/img/patra-logo.png" alt="Patra" />
            <span class="assistant-badge">AI Assistant</span>
            <span class="provider-chip">{{ providerLabel }}</span>
          </div>
          <div class="chatbot-subtitle">Ask about records, workflows, PATRA capabilities, or metadata lookups.</div>
        </div>
        <button class="btn btn-outline btn-sm" type="button" @click="resetConversation" :disabled="sending || isAnimating">
          Reset chat
        </button>
      </div>

      <div class="card-body chatbot-body">
        <div class="starter-strip" v-if="starterPrompts.length && !messages.length && !sending">
          <button
            v-for="starter in starterPrompts"
            :key="starter.title"
            class="starter-chip"
            type="button"
            @click="applyStarter(starter.prompt)"
          >
            <span class="starter-chip-title">{{ starter.title }}</span>
            <span class="starter-chip-prompt">{{ starter.prompt }}</span>
          </button>
        </div>

        <div class="chat-scroll" ref="chatScrollRef" v-if="visibleMessages.length || sending">
          <div
            v-for="(message, index) in visibleMessages"
            :key="`${message.created_at}-${index}`"
            class="message-row"
            :class="message.role"
          >
            <div class="message-avatar" :class="{ 'assistant-avatar': message.role === 'assistant' }">
              <img v-if="message.role === 'assistant'" class="message-avatar-logo" src="/img/patra-logo.png" alt="Patra" />
              <span v-else>Y</span>
            </div>
            <div class="message-stack">
              <div class="message-meta">
                <span class="message-role">{{ roleLabel(message.role) }}</span>
                <span class="message-time">{{ formatTimestamp(message.created_at) }}</span>
              </div>
              <div class="message-bubble" v-if="message.role !== 'assistant'">{{ message.content }}</div>
              <div class="assistant-render" v-else>
                <template v-for="(block, blockIndex) in parseAssistantBlocks(message.content)" :key="`${message.created_at}-${block.type}-${blockIndex}`">
                  <div v-if="block.type === 'text'" class="assistant-text-block">
                    <template v-for="(section, sectionIndex) in block.sections" :key="`${message.created_at}-section-${sectionIndex}`">
                      <p v-if="section.kind === 'paragraph'" class="assistant-paragraph">
                        <template v-for="(segment, segmentIndex) in section.segments" :key="segmentIndex">
                          <strong v-if="segment.kind === 'bold'">{{ segment.text }}</strong>
                          <code v-else-if="segment.kind === 'code'" class="assistant-inline-code">{{ segment.text }}</code>
                          <span v-else>{{ segment.text }}</span>
                        </template>
                      </p>
                      <ol v-else-if="section.kind === 'ordered-list'" class="assistant-list ordered">
                        <li v-for="(item, itemIndex) in section.items" :key="itemIndex">
                          <template v-for="(segment, segmentIndex) in item" :key="segmentIndex">
                            <strong v-if="segment.kind === 'bold'">{{ segment.text }}</strong>
                            <code v-else-if="segment.kind === 'code'" class="assistant-inline-code">{{ segment.text }}</code>
                            <span v-else>{{ segment.text }}</span>
                          </template>
                        </li>
                      </ol>
                      <ul v-else class="assistant-list">
                        <li v-for="(item, itemIndex) in section.items" :key="itemIndex">
                          <template v-for="(segment, segmentIndex) in item" :key="segmentIndex">
                            <strong v-if="segment.kind === 'bold'">{{ segment.text }}</strong>
                            <code v-else-if="segment.kind === 'code'" class="assistant-inline-code">{{ segment.text }}</code>
                            <span v-else>{{ segment.text }}</span>
                          </template>
                        </li>
                      </ul>
                    </template>
                  </div>
                  <div v-else-if="block.type === 'code'" class="assistant-code-block">
                    <div class="assistant-code-label">{{ block.language || 'code' }}</div>
                    <pre><code>{{ block.content }}</code></pre>
                  </div>
                  <div v-else-if="block.type === 'sources'" class="assistant-sources-block">
                    <div class="assistant-sources-label">Sources</div>
                    <a
                      v-for="(item, sourceIndex) in block.items"
                      :key="`${message.created_at}-source-${sourceIndex}`"
                      class="assistant-source-link"
                      :href="item.href"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ item.label }}
                    </a>
                  </div>
                </template>
              </div>
              <div v-if="message.role === 'assistant' && isLatestAssistantMessage(message) && lastAssistantCitations.length" class="inline-citations-block">
                <div class="inline-citations-title">Relevant records</div>
                <div class="citation-list">
                  <a
                    v-for="citation in lastAssistantCitations"
                    :key="`${citation.resource_type}-${citation.resource_id}`"
                    class="citation-card"
                    :href="citation.route"
                  >
                    <div class="citation-kind">{{ citation.resource_type === 'model_card' ? 'Model Card' : 'Datasheet' }}</div>
                    <div class="citation-title">{{ citation.title }}</div>
                    <div class="citation-subtitle">{{ citation.subtitle || 'Published record' }}</div>
                    <div class="citation-description" v-if="citation.description">{{ citation.description }}</div>
                    <div class="citation-match" v-if="citation.matched_on?.length">Matched on: {{ citation.matched_on.join(', ') }}</div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div v-if="sending" class="message-row assistant typing-row">
            <div class="message-avatar assistant-avatar">
              <img class="message-avatar-logo" src="/img/patra-logo.png" alt="Patra" />
            </div>
            <div class="message-stack">
              <div class="message-meta">
                <span class="message-role">Patra</span>
                <span class="message-time">Thinking...</span>
              </div>
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-state chatbot-empty" v-else>
          <img class="empty-state-logo" src="/img/patra-logo.png" alt="Patra" />
          <p>Start with a question like "What can you help me do?" or "Find datasheets related to geospatial datasets."</p>
        </div>

        <div class="form-error" v-if="errorMessage">{{ errorMessage }}</div>

        <div class="composer-shell">
          <textarea
            class="composer-input"
            rows="3"
            v-model="draftMessage"
            placeholder="Ask about model cards, datasheets, Agent Toolkit, Automated Ingestion, or metadata lookups"
            @keydown.enter.exact.prevent="handleSend"
          ></textarea>
          <div class="composer-footer">
            <div class="composer-helper">Enter sends. Shift+Enter for a new line.</div>
            <button class="btn btn-primary" type="button" @click="handleSend" :disabled="sending || isAnimating || !draftMessage.trim()">
              <IconSend :size="16" stroke-width="1.8" />
              {{ sending ? 'Thinking...' : (isAnimating ? 'Rendering...' : 'Send') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IconSend } from '@tabler/icons-vue'
import { fetchAskPatraBootstrap, sendAskPatraMessage } from './api'

const draftMessage = ref('')
const errorMessage = ref('')
const sending = ref(false)
const conversationId = ref('')
const provider = ref('PATRA AI')
const starterPrompts = ref([])
const messages = ref([])
const visibleMessages = ref([])
const lastAssistantCitations = ref([])
const isAnimating = ref(false)
const chatScrollRef = ref(null)
const animationTimer = ref(null)

const providerLabel = computed(() => provider.value || 'PATRA AI')
const latestAssistantTimestamp = computed(() => {
  const assistants = visibleMessages.value.filter((message) => message.role === 'assistant')
  return assistants.length ? assistants[assistants.length - 1].created_at : ''
})

onMounted(async () => {
  try {
    const bootstrap = await fetchAskPatraBootstrap()
    provider.value = bootstrap.provider
    starterPrompts.value = bootstrap.starter_prompts || []
  } catch (error) {
    errorMessage.value = error.message || 'Could not load Ask Patra bootstrap state.'
  }
})

onBeforeUnmount(() => {
  stopAnimation()
})

watch(visibleMessages, async () => {
  await nextTick()
  scrollChatToBottom()
}, { deep: true })

function applyStarter(prompt) {
  draftMessage.value = prompt
}

function roleLabel(role) {
  if (role === 'assistant') return 'Patra'
  if (role === 'system') return 'System'
  return 'You'
}

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function isLatestAssistantMessage(message) {
  return message.role === 'assistant' && message.created_at === latestAssistantTimestamp.value
}

function parseAssistantBlocks(content) {
  const blocks = []
  const sourceItems = []
  const raw = String(content || '')
  const codeRegex = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g
  let cursor = 0
  let match

  while ((match = codeRegex.exec(raw)) !== null) {
    if (match.index > cursor) {
      parseTextIntoBlocks(raw.slice(cursor, match.index), blocks, sourceItems)
    }
    blocks.push({
      type: 'code',
      language: (match[1] || '').trim(),
      content: match[2].trim(),
    })
    cursor = codeRegex.lastIndex
  }

  if (cursor < raw.length) {
    parseTextIntoBlocks(raw.slice(cursor), blocks, sourceItems)
  }

  if (sourceItems.length) {
    blocks.push({
      type: 'sources',
      items: sourceItems,
    })
  }

  return blocks.filter((block) => {
    if (block.type === 'text') return Array.isArray(block.sections) && block.sections.length > 0
    if (block.type === 'code') return Boolean(block.content)
    if (block.type === 'sources') return block.items.length > 0
    return false
  })
}

function parseTextIntoBlocks(text, blocks, sourceItems) {
  const normalized = String(text || '').trim()
  if (!normalized) return

  const sections = []
  for (const chunk of normalized.split(/\n\s*\n/)) {
    const cleaned = chunk.trim()
    if (!cleaned) continue
    const extracted = extractSourceItems(cleaned)
    if (extracted.length && cleaned.replace(urlRegex(), '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '').trim().length < 12) {
      sourceItems.push(...extracted)
      continue
    }
    sections.push(...parseTextSection(cleaned))
  }

  if (sections.length) {
    blocks.push({ type: 'text', sections })
  }
}

function parseTextSection(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return []

  const orderedList = []
  const bulletList = []
  let ordered = true
  let bulleted = true

  for (const line of lines) {
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
    const bulletMatch = line.match(/^[-*]\s+(.*)$/)
    if (orderedMatch) {
      orderedList.push(parseInlineSegments(orderedMatch[1]))
    } else {
      ordered = false
    }
    if (bulletMatch) {
      bulletList.push(parseInlineSegments(bulletMatch[1]))
    } else {
      bulleted = false
    }
  }

  if (ordered && orderedList.length) {
    return [{ kind: 'ordered-list', items: orderedList }]
  }

  if (bulleted && bulletList.length) {
    return [{ kind: 'list', items: bulletList }]
  }

  return [{ kind: 'paragraph', segments: parseInlineSegments(lines.join(' ')) }]
}

function parseInlineSegments(text) {
  const segments = []
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', text: text.slice(lastIndex, match.index) })
    }
    if (match[2]) {
      segments.push({ kind: 'bold', text: match[2] })
    } else if (match[3]) {
      segments.push({ kind: 'code', text: match[3] })
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', text: text.slice(lastIndex) })
  }

  return segments.filter((segment) => segment.text)
}

function extractSourceItems(text) {
  const items = []
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  let markdownMatch
  while ((markdownMatch = markdownRegex.exec(text)) !== null) {
    items.push({ label: markdownMatch[1], href: markdownMatch[2] })
  }

  const rawUrlRegex = urlRegex()
  let urlMatch
  while ((urlMatch = rawUrlRegex.exec(text)) !== null) {
    const href = urlMatch[0]
    if (!items.some((item) => item.href === href)) {
      items.push({ label: href, href })
    }
  }

  return items
}

function urlRegex() {
  return /https?:\/\/[^\s)]+/g
}

function stopAnimation() {
  if (animationTimer.value) {
    clearInterval(animationTimer.value)
    animationTimer.value = null
  }
  isAnimating.value = false
}

function scrollChatToBottom() {
  const container = chatScrollRef.value
  if (!container) return
  container.scrollTop = container.scrollHeight
}

function syncVisibleMessages(rawMessages) {
  visibleMessages.value = rawMessages.filter((message) => message.role !== 'system')
}

function animateLatestAssistant(rawMessages) {
  stopAnimation()
  const filtered = rawMessages.filter((message) => message.role !== 'system')
  const lastIndex = filtered.length - 1
  if (lastIndex < 0 || filtered[lastIndex].role !== 'assistant') {
    visibleMessages.value = filtered
    return
  }

  const target = filtered[lastIndex]
  const prefix = filtered.slice(0, lastIndex)
  visibleMessages.value = [...prefix, { ...target, content: '' }]
  isAnimating.value = true
  let cursor = 0
  const fullText = String(target.content || '')
  const step = Math.max(1, Math.ceil(fullText.length / 140))

  animationTimer.value = setInterval(() => {
    cursor = Math.min(fullText.length, cursor + step)
    visibleMessages.value = [...prefix, { ...target, content: fullText.slice(0, cursor) }]
    if (cursor >= fullText.length) {
      stopAnimation()
      visibleMessages.value = filtered
    }
  }, 18)
}

async function handleSend() {
  const message = draftMessage.value.trim()
  if (!message) return
  sending.value = true
  errorMessage.value = ''
  lastAssistantCitations.value = []
  try {
    const response = await sendAskPatraMessage({
      message,
      conversation_id: conversationId.value || null,
      reset: false,
    })
    conversationId.value = response.conversation_id
    provider.value = response.provider
    starterPrompts.value = response.starter_prompts || starterPrompts.value
    messages.value = response.messages || []
    lastAssistantCitations.value = response.citations || []
    draftMessage.value = ''
    animateLatestAssistant(messages.value)
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
  visibleMessages.value = []
  lastAssistantCitations.value = []
  errorMessage.value = ''
  try {
    const bootstrap = await fetchAskPatraBootstrap()
    provider.value = bootstrap.provider
    starterPrompts.value = bootstrap.starter_prompts || []
  } catch {
    // ignore reset bootstrap failures
  }
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
.provider-chip,
.citation-kind {
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

.starter-strip {
  display: grid;
  gap: 10px;
}

.starter-chip {
  width: 100%;
  text-align: left;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg);
  padding: 12px 14px;
}

.starter-chip:hover {
  border-color: rgba(88, 108, 255, 0.4);
}

.starter-chip-title {
  display: block;
  font-weight: 700;
  color: var(--color-text);
}

.starter-chip-prompt {
  display: block;
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: .85rem;
  line-height: 1.45;
}

.chat-scroll {
  display: grid;
  gap: 14px;
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
}

.message-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.message-row.user {
  grid-template-columns: minmax(0, 1fr) 36px;
}

.message-row.user .message-avatar {
  order: 2;
  background: rgba(88, 108, 255, 0.14);
  color: var(--color-primary);
}

.message-row.user .message-stack {
  order: 1;
  align-items: flex-end;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-weight: 700;
  color: var(--color-text-secondary);
  overflow: hidden;
}

.assistant-avatar {
  background: white;
}

.message-avatar-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.message-stack {
  display: grid;
  gap: 6px;
}

.message-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.message-role {
  font-size: .78rem;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.message-time {
  font-size: .76rem;
  color: var(--color-text-muted);
}

.message-bubble {
  max-width: min(820px, 100%);
  border-radius: 18px;
  padding: 14px 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.message-row.user .message-bubble {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.assistant-render {
  max-width: min(820px, 100%);
  display: grid;
  gap: 10px;
}

.assistant-text-block {
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  line-height: 1.65;
}

.assistant-text-block p + p {
  margin-top: 10px;
}

.assistant-paragraph + .assistant-paragraph,
.assistant-paragraph + .assistant-list,
.assistant-list + .assistant-paragraph,
.assistant-list + .assistant-list {
  margin-top: 10px;
}

.assistant-list {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
}

.assistant-list.ordered {
  list-style: decimal;
}

.assistant-inline-code {
  display: inline-block;
  margin: 0 2px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(88, 108, 255, 0.1);
  color: var(--color-primary);
  font-size: .84em;
}

.assistant-code-block,
.assistant-sources-block {
  border-radius: 16px;
  background: #111827;
  color: #e5e7eb;
  border: 1px solid #1f2937;
  overflow: hidden;
}

.assistant-code-label,
.assistant-sources-label {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #9ca3af;
  font-size: .74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.assistant-code-block pre {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
}

.assistant-code-block code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .84rem;
  line-height: 1.6;
}

.assistant-sources-block {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.assistant-sources-block .assistant-sources-label {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.assistant-source-link {
  display: block;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-word;
  font-size: .88rem;
}

.assistant-source-link:hover {
  background: var(--color-primary-bg);
}

.inline-citations-block {
  margin-left: 48px;
  display: grid;
  gap: 10px;
}

.inline-citations-title {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-text-muted);
}

.citation-list {
  display: grid;
  gap: 12px;
}

.citation-card {
  display: block;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
}

.citation-card:hover {
  border-color: rgba(88, 108, 255, 0.4);
}

.citation-kind {
  margin-bottom: 10px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.citation-title {
  font-weight: 700;
  color: var(--color-text);
}

.citation-subtitle {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: .82rem;
}

.citation-description,
.citation-match {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: .84rem;
  line-height: 1.5;
}

.typing-row .message-stack {
  gap: 10px;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-text-muted);
  opacity: .55;
  animation: blink 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: .18s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: .36s;
}

@keyframes blink {
  0%, 80%, 100% {
    transform: scale(.8);
    opacity: .35;
  }
  40% {
    transform: scale(1);
    opacity: .95;
  }
}

.chatbot-empty {
  min-height: 220px;
}

.empty-state-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.composer-shell {
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 12px;
  background: var(--color-surface);
}

.composer-input {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  line-height: 1.5;
  min-height: 84px;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.composer-helper {
  font-size: .78rem;
  color: var(--color-text-muted);
}

@media (max-width: 720px) {
  .chatbot-topbar,
  .composer-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .message-row,
  .message-row.user {
    grid-template-columns: 1fr;
  }

  .message-row.user .message-avatar,
  .message-row.user .message-stack {
    order: initial;
  }

  .inline-citations-block {
    margin-left: 0;
  }
}
</style>
