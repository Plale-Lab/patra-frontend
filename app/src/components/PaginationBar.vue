<template>
  <nav v-if="total > 0" class="pagination" role="navigation" :aria-label="label">
    <div class="pagination-meta">
      <label class="pagination-rows">
        <span class="pagination-rows-label">Rows</span>
        <select
          class="pagination-select"
          :value="pageSize"
          aria-label="Rows per page"
          @change="onPageSize"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </label>
      <span class="pagination-range" aria-live="polite">{{ rangeLabel }}</span>
    </div>

    <div v-if="totalPages > 1" class="pagination-nav">
      <button
        type="button"
        class="pagination-btn"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="go(page - 1)"
      >
        <IconChevronLeft :size="15" stroke-width="2.2" />
        <span class="pagination-btn-label">Prev</span>
      </button>

      <template v-for="(item, index) in pageItems" :key="`pg-${index}`">
        <span v-if="item === ELLIPSIS" class="pagination-page ellipsis" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pagination-page"
          :class="{ active: item === page }"
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="item === page ? `Page ${item}, current page` : `Go to page ${item}`"
          @click="go(item)"
        >{{ item }}</button>
      </template>

      <button
        type="button"
        class="pagination-btn"
        :disabled="page >= totalPages"
        aria-label="Next page"
        @click="go(page + 1)"
      >
        <span class="pagination-btn-label">Next</span>
        <IconChevronRight :size="15" stroke-width="2.2" />
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

const ELLIPSIS = '…'

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSizeOptions: { type: Array, default: () => [12, 24, 48] },
  itemLabel: { type: String, default: '' },
  label: { type: String, default: 'Pagination' },
})

const emit = defineEmits(['update:page', 'update:pageSize'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const rangeEnd = computed(() => Math.min(props.total, props.page * props.pageSize))

const rangeLabel = computed(() => {
  const noun = props.itemLabel ? ` ${props.itemLabel}` : ''
  return `${rangeStart.value}–${rangeEnd.value} of ${props.total}${noun}`
})

// First and last pages always show; the current page keeps a one-page window
// of neighbours. A gap of exactly one hidden page is filled with that page
// number (never an ellipsis); an ellipsis bridges any larger gap. Below 8
// pages every page is listed.
const pageItems = computed(() => {
  const count = totalPages.value
  if (count <= 7) {
    return Array.from({ length: count }, (_, i) => i + 1)
  }
  const current = props.page
  const wanted = new Set([1, count, current, current - 1, current + 1])
  const visible = [...wanted].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const p of visible) {
    const gap = p - prev
    if (gap === 2) {
      result.push(prev + 1) // a single hidden page — show it instead of an ellipsis
    } else if (gap > 2) {
      result.push(ELLIPSIS)
    }
    result.push(p)
    prev = p
  }
  return result
})

function go(target) {
  const clamped = Math.min(totalPages.value, Math.max(1, target))
  if (clamped !== props.page) emit('update:page', clamped)
}

function onPageSize(event) {
  emit('update:pageSize', Number(event.target.value))
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
}

.pagination-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-rows {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}

.pagination-rows-label {
  font-weight: 600;
}

.pagination-select {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.pagination-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(47, 78, 162, 0.08);
}

.pagination-range {
  font-size: 0.84rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn,
.pagination-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.6);
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  transition: color var(--transition), border-color var(--transition),
    background var(--transition), transform var(--transition), box-shadow var(--transition);
}

.pagination-page {
  padding: 0 8px;
}

.pagination-btn:hover:not(:disabled),
.pagination-page:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.pagination-btn:active:not(:disabled),
.pagination-page:active:not(:disabled) {
  transform: translateY(0) scale(0.96);
}

.pagination-page.active {
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 8px 16px rgba(47, 78, 162, 0.18);
  cursor: default;
  /* Inert to the mouse (current page is a no-op) but still keyboard-focusable
     so the aria-current marker can be reached; also blocks hover restyling. */
  pointer-events: none;
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.pagination-page.ellipsis {
  min-width: 22px;
  padding: 0 2px;
  border-color: transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: default;
  pointer-events: none;
}

@media (max-width: 520px) {
  .pagination {
    justify-content: center;
  }

  .pagination-btn-label {
    display: none;
  }
}
</style>
