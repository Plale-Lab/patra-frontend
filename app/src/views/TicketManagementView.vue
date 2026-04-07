<template>
  <div>
    <div class="page-header">
      <h1>Ticket Management</h1>
      <p>Manage and respond to user service requests</p>
    </div>

    <div class="card" v-if="!apiMode.supportsTickets">
      <div class="card-body">
        <div class="empty-state" style="min-height: 160px;">
          <IconMoodSmile :size="32" stroke-width="1.2" />
          <span>Ticket management is not available in this deployment.</span>
        </div>
      </div>
    </div>

    <template v-else>
    <!-- Summary Cards -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-accent-bg); color: #c68200;">
          <IconAlertCircle :size="22" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ openCount }}</div>
          <div class="stat-label">Open</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-info-bg); color: var(--color-info);">
          <IconLoader :size="22" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ inProgressCount }}</div>
          <div class="stat-label">In Progress</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-success-bg); color: var(--color-success);">
          <IconCircleCheck :size="22" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ resolvedCount }}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-row">
      <div class="filter-chips">
        <button class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
        <button class="chip" :class="{ active: filter === 'open' }" @click="filter = 'open'">Open</button>
        <button class="chip" :class="{ active: filter === 'in_progress' }" @click="filter = 'in_progress'">In Progress</button>
        <button class="chip" :class="{ active: filter === 'resolved' }" @click="filter = 'resolved'">Resolved</button>
      </div>
    </div>

    <!-- Ticket Table -->
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Submitter</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tkt in displayedTickets" :key="tkt.id">
              <td><span class="ticket-id-cell">{{ tkt.id }}</span></td>
              <td><span class="ticket-subject">{{ tkt.subject }}</span></td>
              <td>{{ tkt.submitted_by }}</td>
              <td><span class="badge badge-info">{{ tkt.category }}</span></td>
              <td>
                <span class="priority-pill" :class="'priority-' + tkt.priority.toLowerCase()">{{ tkt.priority }}</span>
              </td>
              <td>
                <span class="badge" :class="statusBadge(tkt.status)">{{ formatStatus(tkt.status) }}</span>
              </td>
              <td class="text-muted text-sm">{{ formatDate(tkt.submitted_at) }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="openTicket(tkt)">Manage</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-if="displayedTickets.length === 0" style="min-height: 160px;">
          <IconMoodSmile :size="32" stroke-width="1.2" />
          <span>No tickets match this filter</span>
        </div>
      </div>
    </div>

    <!-- Manage Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="activeTicket" @click.self="activeTicket = null">
        <div class="modal-content" style="max-width: 580px;">
          <div class="modal-header">
            <span>{{ activeTicket.id }} — Manage Ticket</span>
            <button class="btn-icon" @click="activeTicket = null"><IconX :size="18" /></button>
          </div>
          <div class="modal-body">
            <h3 style="margin-bottom: 6px;">{{ activeTicket.subject }}</h3>
            <div class="flex items-center gap-8" style="margin-bottom: 14px;">
              <span class="badge" :class="statusBadge(activeTicket.status)">{{ formatStatus(activeTicket.status) }}</span>
              <span class="badge badge-accent">{{ activeTicket.priority }}</span>
              <span class="badge badge-info">{{ activeTicket.category }}</span>
            </div>
            <div class="detail-section">
              <div class="detail-label">From</div>
              <div>{{ activeTicket.submitted_by }} — {{ formatDate(activeTicket.submitted_at) }}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Description</div>
              <div class="detail-text">{{ activeTicket.description }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Update Status</label>
              <select class="form-input" v-model="editStatus">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Admin Response</label>
              <textarea class="form-input" v-model="editResponse" rows="3" placeholder="Write a response to the user…" style="resize: vertical;"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="activeTicket = null">Cancel</button>
            <button class="btn btn-primary" @click="saveTicket">
              <IconDeviceFloppy :size="16" stroke-width="1.8" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTicketsStore } from '../stores/tickets'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconAlertCircle, IconLoader, IconCircleCheck, IconX,
  IconMoodSmile, IconDeviceFloppy,
} from '@tabler/icons-vue'

const store = useTicketsStore()
const apiMode = useApiModeStore()
const filter = ref('all')
const activeTicket = ref(null)
const editStatus = ref('open')
const editResponse = ref('')

const openCount = computed(() => store.tickets.filter(t => t.status === 'open').length)
const inProgressCount = computed(() => store.tickets.filter(t => t.status === 'in_progress').length)
const resolvedCount = computed(() => store.tickets.filter(t => t.status === 'resolved').length)

const displayedTickets = computed(() => {
  if (filter.value === 'all') return store.tickets
  return store.tickets.filter(t => t.status === filter.value)
})

function statusBadge(s) {
  if (s === 'open') return 'badge-accent'
  if (s === 'in_progress') return 'badge-info'
  if (s === 'resolved') return 'badge-public'
  return ''
}

function formatStatus(s) {
  return s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openTicket(tkt) {
  activeTicket.value = tkt
  editStatus.value = tkt.status
  editResponse.value = tkt.admin_response || ''
}

async function saveTicket() {
  await store.updateTicket(activeTicket.value.id, {
    status: editStatus.value,
    admin_response: editResponse.value,
  })
  activeTicket.value = null
}

function loadTickets() {
  if (!apiMode.supportsTickets) return
  store.fetchTickets()
}

onMounted(loadTickets)
watch(() => apiMode.mode, loadTickets)
</script>

<style scoped>
.filter-row { margin-bottom: 18px; }
.filter-chips { display: flex; gap: 6px; }

.ticket-id-cell { font-family: monospace; font-size: .78rem; font-weight: 700; color: var(--color-text-muted); }
.ticket-subject { font-weight: 600; }

.priority-pill {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: .75rem; font-weight: 600;
}
.priority-low { background: var(--color-bg); color: var(--color-text-muted); }
.priority-medium { background: var(--color-accent-bg); color: #c68200; }
.priority-high { background: var(--color-danger-bg); color: var(--color-danger); }
.priority-critical { background: var(--color-danger); color: #fff; }

.detail-section { margin-bottom: 12px; }
.detail-label {
  font-size: .72rem; font-weight: 600; text-transform: uppercase;
  color: var(--color-text-muted); letter-spacing: .4px; margin-bottom: 3px;
}
.detail-text { font-size: .9rem; line-height: 1.6; color: var(--color-text-secondary); }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--color-text-muted); gap: 6px;
}
</style>
