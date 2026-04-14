<template>
  <div class="ask-page">
    <div class="page-header">
      <h1>Ask Patra</h1>
      <p>Start here for most PATRA tasks. Patra can find records, route into the right tool, or run safe read-only previews before you open a full workflow surface.</p>
    </div>

    <div class="chatbot-shell card">
      <div class="card-header chatbot-topbar">
        <div>
          <div class="assistant-badge-row">
            <img class="assistant-mark" src="/img/patra-logo.png" alt="Patra" />
            <span class="assistant-badge">Patra</span>
            <span class="provider-chip">{{ providerLabel }}</span>
          </div>
          <div class="chatbot-subtitle">Default entry point for user tools, guided routing, and safe inline previews.</div>
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
        <div class="available-tools-strip" v-if="toolCapabilities.length && !messages.length && !sending">
          <span class="available-tools-label">Available tools</span>
          <div class="available-tool-chips">
            <span
              v-for="capability in visibleBootstrapCapabilities"
              :key="capability.tool_id"
              class="available-tool-chip"
            >
              {{ capability.title }}
            </span>
          </div>
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
              <div v-if="message.role === 'assistant' && toolCardsForMessage(message).length" class="tool-handoff-block">
                <div class="inline-citations-title">Suggested tools</div>
                <div class="tool-card-list">
                  <article
                    v-for="entry in toolCardsForMessage(message)"
                    :key="`${message.created_at}-${entry.card.tool_id}`"
                    class="tool-card"
                    :class="`tool-card-${entry.availability}`"
                  >
                    <div class="tool-card-top">
                      <div>
                        <div class="tool-card-title">{{ entry.card.title }}</div>
                        <div class="tool-card-domain">{{ formatToolDomain(entry.card.domain) }}</div>
                      </div>
                      <span class="tool-card-status" :class="`tool-card-status-${entry.availability}`">
                        {{ formatAvailability(entry.availability) }}
                      </span>
                    </div>
                    <p class="tool-card-summary">{{ entry.card.summary }}</p>
                    <p class="tool-card-reason">{{ entry.card.reason }}</p>
                    <div class="tool-card-footer">
                      <div class="tool-card-actions">
                        <button
                          class="btn btn-outline btn-sm"
                          type="button"
                          :disabled="entry.availability !== 'available' || !entry.action?.route"
                          @click="openSuggestedAction(entry.action)"
                        >
                          {{ entry.action?.label || entry.card.cta_label || 'Open tool' }}
                        </button>
                        <button
                          v-if="canRunInline(entry)"
                          class="btn btn-primary btn-sm"
                          type="button"
                          :disabled="executingActionId === inlineActionIdFor(message, entry)"
                          @click="runInlineTool(message, entry, index)"
                        >
                          {{ executingActionId === inlineActionIdFor(message, entry) ? 'Running...' : 'Run here' }}
                        </button>
                      </div>
                      <span v-if="entry.availabilityReason" class="tool-card-note">{{ entry.availabilityReason }}</span>
                    </div>
                  </article>
                </div>
                <div v-if="message.handoff?.tool_target" class="handoff-note">
                  <strong>Handoff:</strong>
                  {{ formatHandoffMessage(message.handoff) }}
                </div>
              </div>
              <div v-if="shouldShowExecution(message)" class="execution-block">
                <div class="execution-top">
                  <div class="inline-citations-title">Inline execution</div>
                  <span class="execution-status" :class="`execution-status-${message.execution.state}`">
                    {{ formatExecutionState(message.execution.state) }}
                  </span>
                </div>
                <p v-if="message.execution.message" class="execution-message">{{ message.execution.message }}</p>
                <div v-if="executionSummaryItems(message).length" class="execution-summary-grid">
                  <div v-for="(item, itemIndex) in executionSummaryItems(message)" :key="`${message.created_at}-execution-${itemIndex}`" class="execution-summary-item">
                    <div class="execution-summary-label">{{ item.label }}</div>
                    <div class="execution-summary-value">{{ item.value }}</div>
                  </div>
                </div>
                <div v-if="executionPreviewRows(message).length" class="execution-table-wrap">
                  <table class="execution-table">
                    <thead>
                      <tr>
                        <th v-for="column in executionPreviewColumns(message)" :key="column">{{ column }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, rowIndex) in executionPreviewRows(message)" :key="`${message.created_at}-row-${rowIndex}`">
                        <td v-for="column in executionPreviewColumns(message)" :key="`${rowIndex}-${column}`">{{ row[column] }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ul v-else-if="executionListItems(message).length" class="execution-list">
                  <li v-for="(item, itemIndex) in executionListItems(message)" :key="`${message.created_at}-list-${itemIndex}`">
                    {{ item }}
                  </li>
                </ul>
                <div v-if="message.execution.next_step_route" class="handoff-note">
                  <strong>Next step:</strong>
                  Open the full surface for more detail or the full workflow.
                </div>
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
            placeholder="Start here: ask about records, experiments, MCP, editing, ingestion, tickets, or planning tools"
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
import { useRoute, useRouter } from 'vue-router'
import { IconSend } from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { useApiModeStore } from '../../stores/apiMode'
import { executeAskPatraAction, fetchAskPatraBootstrap, sendAskPatraMessage } from './api'

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
const toolCapabilities = ref([])
const executingActionId = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const apiMode = useApiModeStore()
const INLINE_EXECUTABLE_TOOL_IDS = new Set(['intent_schema', 'mvp_demo_report', 'mcp_explorer', 'animal_ecology', 'digital_agriculture'])

const providerLabel = computed(() => provider.value || 'PATRA AI')
const visibleBootstrapCapabilities = computed(() => {
  return toolCapabilities.value
    .map((capability) => withFrontendAvailability(capability))
    .filter((capability) => capability.availability === 'available')
    .slice(0, 6)
})
const latestAssistantTimestamp = computed(() => {
  const assistants = visibleMessages.value.filter((message) => message.role === 'assistant')
  return assistants.length ? assistants[assistants.length - 1].created_at : ''
})

onMounted(async () => {
  try {
    await refreshBootstrap()
    applyRoutePrompt()
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

watch(() => route.query.prompt, () => {
  applyRoutePrompt()
})

function applyStarter(prompt) {
  draftMessage.value = prompt
}

async function refreshBootstrap() {
  const bootstrap = await fetchAskPatraBootstrap()
  provider.value = bootstrap.provider
  starterPrompts.value = bootstrap.starter_prompts || []
  toolCapabilities.value = bootstrap.tool_capabilities || []
}

function applyRoutePrompt() {
  const prompt = typeof route.query.prompt === 'string' ? route.query.prompt.trim() : ''
  if (!prompt) return
  if (draftMessage.value.trim()) return
  if (messages.value.length) return
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

function formatToolDomain(domain) {
  return String(domain || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatAvailability(availability) {
  return {
    available: 'Available',
    requires_login: 'Sign in required',
    admin_only: 'Admin only',
    disabled: 'Unavailable',
  }[availability] || 'Unavailable'
}

function isLatestAssistantMessage(message) {
  return message.role === 'assistant' && message.created_at === latestAssistantTimestamp.value
}

function frontendAvailabilityForTool(toolId) {
  if (apiMode.supportsDevOpenAccess) return { availability: 'available', reason: null }
  switch (toolId) {
    case 'browse_model_cards':
    case 'browse_datasheets':
      return { availability: 'available', reason: null }
    case 'intent_schema':
    case 'mvp_demo_report':
      if (!apiMode.supportsIntentSchema) return { availability: 'disabled', reason: 'This planning surface is disabled in the current frontend deployment.' }
      if (!auth.isTapisUser) return { availability: 'requires_login', reason: 'This planning surface requires a signed-in PATRA session.' }
      return { availability: 'available', reason: null }
    case 'agent_tools':
      if (!apiMode.supportsAgentTools) return { availability: 'disabled', reason: 'Agent Toolkit is disabled in the current frontend deployment.' }
      if (!auth.isTapisUser && !auth.isAdmin) return { availability: 'requires_login', reason: 'Agent Toolkit requires a signed-in PATRA session.' }
      return { availability: 'available', reason: null }
    case 'automated_ingestion':
      if (!apiMode.supportsAutomatedIngestion) return { availability: 'disabled', reason: 'Automated Ingestion is disabled in the current frontend deployment.' }
      if (!auth.isAdmin) return { availability: 'admin_only', reason: 'Automated Ingestion is limited to admin sessions in the current frontend.' }
      return { availability: 'available', reason: null }
    case 'edit_records':
      if (!apiMode.supportsEditRecords) return { availability: 'disabled', reason: 'Edit Records is disabled in the current frontend deployment.' }
      if (!auth.isTapisUser && !auth.isAdmin) return { availability: 'requires_login', reason: 'Edit Records requires a signed-in PATRA session.' }
      return { availability: 'available', reason: null }
    case 'submit_records':
      if (!auth.isTapisUser) return { availability: 'requires_login', reason: 'Submitting records requires a signed-in PATRA session.' }
      return { availability: 'available', reason: null }
    case 'tickets':
      if (!apiMode.supportsTickets) return { availability: 'disabled', reason: 'Tickets are disabled in the current frontend deployment.' }
      if (!auth.isTapisUser) return { availability: 'requires_login', reason: 'Tickets require a signed-in PATRA session.' }
      return { availability: 'available', reason: null }
    case 'mcp_explorer':
      return apiMode.supportsMcpExplorer
        ? { availability: 'available', reason: null }
        : { availability: 'disabled', reason: 'MCP Explorer is disabled in the current frontend deployment.' }
    case 'animal_ecology':
    case 'digital_agriculture':
      return apiMode.supportsDomainExperiments
        ? { availability: 'available', reason: null }
        : { availability: 'disabled', reason: 'Experiments are disabled in the current frontend deployment.' }
    default:
      return { availability: 'available', reason: null }
  }
}

function withFrontendAvailability(capability) {
  const frontend = frontendAvailabilityForTool(capability.tool_id)
  if (capability.availability === 'disabled' || capability.availability === 'admin_only' || capability.availability === 'requires_login') {
    return capability
  }
  return {
    ...capability,
    availability: frontend.availability,
    availability_reason: frontend.reason,
  }
}

function toolCardsForMessage(message) {
  const cards = Array.isArray(message.tool_cards) ? message.tool_cards : []
  const actions = Array.isArray(message.suggested_actions) ? message.suggested_actions : []
  return cards.map((card) => {
    const capability = withFrontendAvailability(card)
    const action = actions.find((item) => String(item.action_id || '').startsWith(`${card.tool_id}:`)) || null
    const frontend = frontendAvailabilityForTool(card.tool_id)
    return {
      card: capability,
      action,
      availability: capability.availability ?? frontend.availability,
      availabilityReason: capability.availability_reason || frontend.reason,
    }
  })
}

function formatHandoffMessage(handoff) {
  if (!handoff) return ''
  if (handoff.kind === 'prefill') {
    return `A draft handoff is prepared for ${handoff.tool_target || 'the target tool'}.`
  }
  if (handoff.kind === 'navigate') {
    return `Continue in ${handoff.tool_target || 'the target tool'} to complete this task.`
  }
  if (handoff.kind === 'inline') {
    return `This action can continue inside the chat.`
  }
  return `This response is routing-oriented rather than execution-oriented.`
}

async function openSuggestedAction(action) {
  if (!action || !action.route) return
  const query = action.query && Object.keys(action.query).length ? action.query : undefined
  await router.push({ path: action.route, query })
}

function canRunInline(entry) {
  return (
    entry.availability === 'available' &&
    entry.card.supports_inline &&
    INLINE_EXECUTABLE_TOOL_IDS.has(entry.card.tool_id)
  )
}

function inlineActionIdFor(message, entry) {
  return `inline:${message.created_at}:${entry.card.tool_id}`
}

function previousUserMessage(index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = visibleMessages.value[cursor]
    if (candidate?.role === 'user' && candidate.content?.trim()) {
      return candidate.content.trim()
    }
  }
  return draftMessage.value.trim()
}

async function runInlineTool(message, entry, index) {
  if (!canRunInline(entry)) return
  const actionId = inlineActionIdFor(message, entry)
  executingActionId.value = actionId
  errorMessage.value = ''
  try {
    const response = await executeAskPatraAction({
      conversation_id: conversationId.value || null,
      tool_id: entry.card.tool_id,
      message: previousUserMessage(index),
      query: entry.action?.query || {},
      prefilled_payload: entry.action?.prefilled_payload || {},
      disable_llm: true,
    })
    conversationId.value = response.conversation_id
    messages.value = response.messages || []
    animateLatestAssistant(messages.value)
  } catch (error) {
    errorMessage.value = error.message || 'Inline execution failed.'
  } finally {
    executingActionId.value = ''
  }
}

function shouldShowExecution(message) {
  return message.role === 'assistant' && message.execution && message.execution.state && message.execution.state !== 'idle'
}

function executionSummaryItems(message) {
  const result = message.execution?.result || {}
  if (Array.isArray(result.executive_summary)) {
    return result.executive_summary
  }
  if (result.kind === 'intent_schema') {
    return [
      { label: 'Task Type', value: result.task_type || 'unknown', tone: 'neutral' },
      { label: 'Target Column', value: result.target_column || 'n/a', tone: 'neutral' },
      { label: 'Fields Drafted', value: String(result.field_count ?? 0), tone: 'neutral' },
      { label: 'Ambiguity Warnings', value: String(result.ambiguity_count ?? 0), tone: result.ambiguity_count ? 'warn' : 'good' },
    ]
  }
  if (result.kind === 'mcp_explorer') {
    return [
      { label: 'Connection', value: result.connected ? 'Connected' : 'Failed', tone: result.connected ? 'good' : 'bad' },
      { label: 'Tool Count', value: String(result.tool_count ?? 0), tone: 'neutral' },
      { label: 'Server', value: result.server_name || 'unknown', tone: 'neutral' },
    ]
  }
  if (result.kind === 'animal_ecology' || result.kind === 'digital_agriculture') {
    return [
      { label: 'Users Indexed', value: String(result.user_count ?? 0), tone: 'neutral' },
      { label: 'Event Rows', value: String(result.total_rows ?? 0), tone: 'neutral' },
      { label: 'Experiments Previewed', value: String((result.experiments || []).length), tone: 'neutral' },
    ]
  }
  return []
}

function executionPreviewColumns(message) {
  const rows = message.execution?.result?.preview_rows
  if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== 'object' || rows[0] === null) {
    return []
  }
  return Object.keys(rows[0]).slice(0, 6)
}

function executionPreviewRows(message) {
  const rows = message.execution?.result?.preview_rows
  return Array.isArray(rows) ? rows.slice(0, 3) : []
}

function executionListItems(message) {
  const result = message.execution?.result || {}
  if (result.kind === 'mcp_explorer') {
    return Array.isArray(result.tools) ? result.tools.slice(0, 6) : []
  }
  if (result.kind === 'animal_ecology' || result.kind === 'digital_agriculture') {
    return Array.isArray(result.experiments)
      ? result.experiments.slice(0, 4).map((item) => `${item.experiment_id} · ${item.model_id} · ${item.total_images ?? 0} images`)
      : []
  }
  return []
}

function formatExecutionState(state) {
  return {
    running: 'Running',
    blocked: 'Blocked',
    succeeded: 'Succeeded',
    failed: 'Failed',
  }[state] || 'Idle'
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
  const normalized = normalizeAssistantMarkdown(text)
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

function normalizeAssistantMarkdown(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/([^\n])\s+\*\s+(?=\S)/g, '$1\n- ')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
    await refreshBootstrap()
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

.available-tools-strip {
  display: grid;
  gap: 10px;
}

.available-tools-label {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-text-muted);
}

.available-tool-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.available-tool-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: .78rem;
  font-weight: 700;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
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

.tool-handoff-block {
  margin-left: 48px;
  display: grid;
  gap: 10px;
}

.tool-card-list {
  display: grid;
  gap: 12px;
}

.tool-card {
  display: grid;
  gap: 10px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--color-surface);
}

.tool-card-available {
  border-color: rgba(88, 108, 255, 0.25);
}

.tool-card-disabled,
.tool-card-admin_only,
.tool-card-requires_login {
  opacity: 0.88;
}

.tool-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tool-card-title {
  font-weight: 700;
  color: var(--color-text);
}

.tool-card-domain {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: .78rem;
}

.tool-card-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: .74rem;
  font-weight: 700;
}

.tool-card-status-available {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.tool-card-status-disabled,
.tool-card-status-admin_only,
.tool-card-status-requires_login {
  background: rgba(148, 163, 184, 0.12);
  color: var(--color-text-secondary);
}

.tool-card-summary,
.tool-card-reason,
.tool-card-note,
.handoff-note {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: .86rem;
  line-height: 1.55;
}

.tool-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tool-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.execution-block {
  margin-left: 48px;
  display: grid;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.72);
}

.execution-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.execution-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: .74rem;
  font-weight: 700;
}

.execution-status-succeeded {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.execution-status-blocked,
.execution-status-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.execution-status-running {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.execution-message {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: .88rem;
}

.execution-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.execution-summary-item {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--color-surface);
}

.execution-summary-label {
  font-size: .76rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.execution-summary-value {
  margin-top: 6px;
  color: var(--color-text);
  font-weight: 700;
}

.execution-table-wrap {
  overflow-x: auto;
}

.execution-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .84rem;
}

.execution-table th,
.execution-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

.execution-table th {
  font-size: .76rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.execution-list {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: .86rem;
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

  .tool-handoff-block {
    margin-left: 0;
  }

  .execution-block {
    margin-left: 0;
  }
}
</style>
