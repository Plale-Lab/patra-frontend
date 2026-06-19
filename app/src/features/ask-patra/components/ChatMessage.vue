<template>
  <div class="message-row" :class="message.role">
    <div class="message-avatar" :class="{ 'assistant-avatar': isAssistant }">
      <img v-if="isAssistant" class="message-avatar-logo" src="/img/patra-logo.png" alt="" />
      <span v-else aria-hidden="true">Y</span>
    </div>
    <div class="message-stack">
      <div class="message-meta">
        <span class="message-role">{{ roleLabel }}</span>
        <time class="message-time" :datetime="message.created_at">{{ formattedTime }}</time>
      </div>
      <div class="message-bubble" v-if="!isAssistant">{{ message.content }}</div>
      <AssistantContent v-else :content="message.content" />
      <CitationList v-if="isAssistant" :citations="message.citations || []" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AssistantContent from './AssistantContent.vue'
import CitationList from './CitationList.vue'

const props = defineProps({
  message: { type: Object, required: true },
})

const isAssistant = computed(() => props.message.role === 'assistant')

const roleLabel = computed(() => {
  if (props.message.role === 'assistant') return 'Patra'
  if (props.message.role === 'system') return 'System'
  return 'You'
})

const formattedTime = computed(() => {
  try {
    return new Date(props.message.created_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return props.message.created_at
  }
})
</script>

<style scoped>
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
  background: rgba(var(--color-primary-rgb), 0.14);
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
  color: #fff;
  border-color: var(--color-primary);
}

@media (max-width: 720px) {
  .message-row,
  .message-row.user {
    grid-template-columns: 1fr;
  }

  .message-row.user .message-avatar,
  .message-row.user .message-stack {
    order: initial;
  }
}
</style>
