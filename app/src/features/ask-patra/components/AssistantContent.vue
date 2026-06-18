<template>
  <div class="assistant-render">
    <template v-for="(block, blockIndex) in blocks" :key="`${block.type}-${blockIndex}`">
      <div v-if="block.type === 'text'" class="assistant-text-block">
        <template v-for="(section, sectionIndex) in block.sections" :key="`section-${sectionIndex}`">
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
          :key="`source-${sourceIndex}`"
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
</template>

<script setup>
import { computed } from 'vue'
import { parseAssistantContent } from '../../../lib/parseAssistantContent'

const props = defineProps({
  content: { type: String, default: '' },
})

const blocks = computed(() => parseAssistantContent(props.content))
</script>

<style scoped>
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
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  font-size: .84em;
}

.assistant-code-block {
  border-radius: 16px;
  background: #111827;
  color: #e5e7eb;
  border: 1px solid #1f2937;
  overflow: hidden;
}

.assistant-code-label {
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
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.assistant-sources-label {
  padding: 10px 14px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: .74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
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
</style>
