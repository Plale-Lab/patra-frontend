<template>
  <div
    class="chat-scroll"
    ref="scrollRef"
    role="log"
    aria-live="polite"
    :aria-busy="animating ? 'true' : undefined"
    aria-label="Conversation"
    v-if="messages.length || sending"
  >
    <ChatMessage
      v-for="(message, index) in messages"
      :key="`${message.created_at}-${index}`"
      :message="message"
    />

    <div v-if="sending" class="message-row assistant typing-row">
      <div class="message-avatar assistant-avatar">
        <img class="message-avatar-logo" src="/img/patra-logo.png" alt="" />
      </div>
      <div class="message-stack">
        <div class="message-meta">
          <span class="message-role">Patra</span>
          <span class="message-time">Processing…</span>
        </div>
        <div class="typing-indicator" aria-label="Patra is typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>

  <div class="empty-state chatbot-empty" v-else>
    <img class="empty-state-logo" src="/img/patra-logo.png" alt="" />
    <p>Start with a question like “What can you help me do?” or “Find datasheets related to geospatial datasets.”</p>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  sending: { type: Boolean, default: false },
  animating: { type: Boolean, default: false },
})

const scrollRef = ref(null)

function scrollToBottom() {
  const container = scrollRef.value
  if (container) container.scrollTop = container.scrollHeight
}

watch(
  () => [props.messages, props.sending],
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true },
)
</script>

<style scoped>
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

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.assistant-avatar {
  background: #fff;
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

@media (max-width: 720px) {
  .typing-row {
    grid-template-columns: 1fr;
  }
}
</style>
