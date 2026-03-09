<template>
  <div>
    <div class="page-header">
      <h1>Audit Log</h1>
      <p>Chronological record of all administrative actions</p>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-8 mb-16">
      <button class="chip" :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">All</button>
      <button
        class="chip"
        v-for="type in store.actionTypes"
        :key="type"
        :class="{ active: activeFilter === type }"
        @click="activeFilter = type"
      >
        <component :is="actionIcon(type)" :size="14" stroke-width="2" />
        {{ capitalize(type) }}
      </button>
    </div>

    <!-- Log Table -->
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in filteredEvents" :key="event.id">
              <td class="text-muted text-sm" style="white-space: nowrap;">{{ formatDate(event.timestamp) }}</td>
              <td style="font-weight: 500;">{{ event.user }}</td>
              <td>
                <span class="badge" :class="actionBadge(event.action)">
                  {{ capitalize(event.action) }}
                </span>
              </td>
              <td>{{ event.target }}</td>
              <td class="text-sm">{{ event.detail }}</td>
            </tr>
            <tr v-if="filteredEvents.length === 0">
              <td colspan="5" style="text-align: center; padding: 32px; color: var(--color-text-muted);">
                No events found for this filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuditLogStore } from '../stores/auditLog'
import {
  IconPlus, IconPencil, IconTrash, IconSettings2,
} from '@tabler/icons-vue'

const store = useAuditLogStore()
const activeFilter = ref('all')

const filteredEvents = computed(() => store.filteredEvents(activeFilter.value))

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function actionBadge(action) {
  const map = { create: 'badge-public', update: 'badge-info', delete: 'badge-private', system: 'badge-accent' }
  return map[action] || 'badge-info'
}

function actionIcon(type) {
  const map = { create: IconPlus, update: IconPencil, delete: IconTrash, system: IconSettings2 }
  return map[type] || IconSettings2
}
</script>
