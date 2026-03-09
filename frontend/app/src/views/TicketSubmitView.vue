<template>
  <div>
    <div class="page-header">
      <h1>Support Tickets</h1>
      <p>Submit a service request or report an issue</p>
    </div>

    <div class="ticket-layout">
      <!-- Submit Form -->
      <div class="card ticket-form">
        <div class="card-header">
          <span class="flex items-center gap-8"><IconMessagePlus :size="18" stroke-width="1.8" /> New Ticket</span>
        </div>
        <div class="card-body">
          <!-- Success -->
          <div class="success-banner" v-if="submitted">
            <IconCircleCheck :size="18" stroke-width="1.8" />
            <span><strong>Ticket submitted!</strong> ID: {{ lastTicketId }}</span>
            <button class="btn btn-outline btn-sm" @click="resetForm">New Ticket</button>
          </div>
          <template v-else>
            <div class="form-group">
              <label class="form-label">Your Name <span class="required">*</span></label>
              <input class="form-input" v-model="form.submittedBy" placeholder="e.g. Alice Chen" />
            </div>
            <div class="form-group">
              <label class="form-label">Subject <span class="required">*</span></label>
              <input class="form-input" v-model="form.subject" placeholder="Brief summary of your issue" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-input" v-model="form.category">
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Access Request</option>
                  <option>Data Issue</option>
                  <option>General</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-input" v-model="form.priority">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description <span class="required">*</span></label>
              <textarea class="form-input form-textarea" v-model="form.description" rows="4" placeholder="Describe your issue or request in detail…"></textarea>
            </div>
            <button class="btn btn-primary" :disabled="!canSubmit || store.loading" @click="handleSubmit" style="width: 100%; justify-content: center;">
              <IconSend :size="16" stroke-width="1.8" />
              {{ store.loading ? 'Submitting…' : 'Submit Ticket' }}
            </button>
          </template>
        </div>
      </div>

      <!-- Ticket List -->
      <div class="ticket-list">
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconList :size="18" stroke-width="1.8" /> Recent Tickets</span>
            <div class="filter-chips">
              <button class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
              <button class="chip" :class="{ active: filter === 'open' }" @click="filter = 'open'">Open</button>
              <button class="chip" :class="{ active: filter === 'resolved' }" @click="filter = 'resolved'">Resolved</button>
            </div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="ticket-empty" v-if="displayedTickets.length === 0">
              <IconMoodSmile :size="32" stroke-width="1.2" />
              <span>No tickets to show</span>
            </div>
            <div class="ticket-item" v-for="tkt in displayedTickets" :key="tkt.id" @click="selectedTicket = tkt">
              <div class="ticket-item-header">
                <span class="ticket-id">{{ tkt.id }}</span>
                <span class="badge" :class="statusClass(tkt.status)">{{ formatStatus(tkt.status) }}</span>
              </div>
              <div class="ticket-item-subject">{{ tkt.subject }}</div>
              <div class="ticket-item-meta">
                <span><IconUser :size="12" stroke-width="1.8" /> {{ tkt.submitted_by }}</span>
                <span><IconClock :size="12" stroke-width="1.8" /> {{ formatDate(tkt.submitted_at) }}</span>
                <span class="priority-dot" :class="'priority-' + tkt.priority.toLowerCase()">{{ tkt.priority }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="selectedTicket" @click.self="selectedTicket = null">
        <div class="modal-content" style="max-width: 560px;">
          <div class="modal-header">
            <span>{{ selectedTicket.id }} — {{ selectedTicket.subject }}</span>
            <button class="btn-icon" @click="selectedTicket = null"><IconX :size="18" /></button>
          </div>
          <div class="modal-body">
            <div class="flex items-center gap-8" style="margin-bottom: 12px;">
              <span class="badge" :class="statusClass(selectedTicket.status)">{{ formatStatus(selectedTicket.status) }}</span>
              <span class="badge badge-accent">{{ selectedTicket.priority }}</span>
              <span class="badge badge-info">{{ selectedTicket.category }}</span>
            </div>
            <div class="detail-section">
              <div class="detail-label">Submitted by</div>
              <div>{{ selectedTicket.submitted_by }} — {{ formatDate(selectedTicket.submitted_at) }}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Description</div>
              <div class="detail-text">{{ selectedTicket.description }}</div>
            </div>
            <div class="detail-section" v-if="selectedTicket.admin_response">
              <div class="detail-label">Admin Response</div>
              <div class="detail-text admin-response">{{ selectedTicket.admin_response }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="selectedTicket = null">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTicketsStore } from '../stores/tickets'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconMessagePlus, IconCircleCheck, IconSend, IconList,
  IconMoodSmile, IconUser, IconClock, IconX,
} from '@tabler/icons-vue'

const store = useTicketsStore()
const apiMode = useApiModeStore()
const submitted = ref(false)
const lastTicketId = ref('')
const filter = ref('all')
const selectedTicket = ref(null)

const form = reactive({
  submittedBy: '', subject: '', category: 'Bug Report',
  priority: 'Medium', description: '',
})

const canSubmit = computed(() => form.submittedBy && form.subject && form.description)

const displayedTickets = computed(() => {
  if (filter.value === 'all') return store.tickets
  return store.tickets.filter(t => t.status === filter.value)
})

function statusClass(status) {
  if (status === 'open') return 'badge-accent'
  if (status === 'in_progress') return 'badge-info'
  if (status === 'resolved') return 'badge-public'
  return ''
}

function formatStatus(s) {
  return s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function handleSubmit() {
  const result = await store.createTicket({
    submitted_by: form.submittedBy, subject: form.subject,
    category: form.category, priority: form.priority,
    description: form.description,
  })
  if (result) {
    lastTicketId.value = result.id
    submitted.value = true
  }
}

function resetForm() {
  submitted.value = false
  Object.assign(form, { submittedBy: '', subject: '', category: 'Bug Report', priority: 'Medium', description: '' })
}

function loadTickets() {
  store.fetchTickets()
}

onMounted(loadTickets)
watch(() => apiMode.mode, loadTickets)
</script>

<style scoped>
.ticket-layout { display: flex; gap: 24px; align-items: flex-start; }
.ticket-form { flex: 0 0 420px; }
.ticket-list { flex: 1; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-textarea { resize: vertical; min-height: 80px; }
.required { color: var(--color-danger); }

.success-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 14px; background: var(--color-success-bg);
  color: var(--color-success); border-radius: var(--radius-sm);
  font-size: .88rem;
}
.success-banner strong { margin-right: 4px; }

.filter-chips { display: flex; gap: 6px; }

.ticket-item {
  padding: 14px 22px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition);
}
.ticket-item:last-child { border-bottom: none; }
.ticket-item:hover { background: var(--color-bg); }
.ticket-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.ticket-id { font-size: .75rem; font-weight: 700; color: var(--color-text-muted); font-family: monospace; }
.ticket-item-subject { font-weight: 600; font-size: .92rem; margin-bottom: 6px; }
.ticket-item-meta {
  display: flex; align-items: center; gap: 14px;
  font-size: .75rem; color: var(--color-text-muted);
}
.ticket-item-meta span { display: flex; align-items: center; gap: 4px; }
.priority-dot {
  padding: 1px 8px; border-radius: 10px; font-weight: 600;
}
.priority-low { background: var(--color-bg); color: var(--color-text-muted); }
.priority-medium { background: var(--color-accent-bg); color: #c68200; }
.priority-high { background: var(--color-danger-bg); color: var(--color-danger); }
.priority-critical { background: var(--color-danger); color: #fff; }
.ticket-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px; color: var(--color-text-muted); gap: 8px;
}

.detail-section { margin-bottom: 14px; }
.detail-label { font-size: .75rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); letter-spacing: .5px; margin-bottom: 4px; }
.detail-text { font-size: .92rem; line-height: 1.6; color: var(--color-text-secondary); }
.admin-response {
  background: var(--color-primary-bg); padding: 12px; border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}
</style>
