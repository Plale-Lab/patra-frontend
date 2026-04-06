<template>
  <div>
    <div class="page-header" v-if="isGuest">
      <h1>Patra Knowledge Base</h1>
      <p>
        AI model cards and datasheets for the NSF ICICLE AI Institute — supporting transparent,
        accountable AI deployment at the edge.
      </p>
    </div>
    <div class="page-header" v-else>
      <h1>Welcome back, {{ auth.displayName }}</h1>
      <p>Your workspace snapshot for authored models and support activity.</p>
    </div>

    <div class="connection-banner error" v-if="dashboardError">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Some dashboard data could not be loaded from the API server.</span>
    </div>

    <template v-if="isGuest">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
            <IconCube :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ totalModels }}</div>
            <div class="stat-label">Model Cards</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-success-bg); color: var(--color-success);">
            <IconEye :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ publicModelCount }}</div>
            <div class="stat-label">Public Model Cards</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-info-bg); color: var(--color-info);">
            <IconTable :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ totalDatasheets }}</div>
            <div class="stat-label">Datasheets</div>
          </div>
        </div>
      </div>

      <div class="action-bar">
        <RouterLink to="/explore-model-cards" class="card action-card">
          <div class="quick-link-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
            <IconSearch :size="20" stroke-width="1.8" />
          </div>
          <div>
            <div class="quick-link-title">Explore Model Cards</div>
            <div class="quick-link-desc">Browse public metadata, metrics, and deployment context.</div>
          </div>
          <IconChevronRight :size="18" class="quick-link-arrow" />
        </RouterLink>
        <RouterLink to="/submit" class="card action-card">
          <div class="quick-link-icon" style="background: var(--color-success-bg); color: var(--color-success);">
            <IconUpload :size="20" stroke-width="1.8" />
          </div>
          <div>
            <div class="quick-link-title">Upload to Patra</div>
            <div class="quick-link-desc">Create model cards and datasheets for Patra.</div>
          </div>
          <IconChevronRight :size="18" class="quick-link-arrow" />
        </RouterLink>
        <RouterLink to="/tickets" class="card action-card">
          <div class="quick-link-icon" style="background: var(--color-info-bg); color: var(--color-info);">
            <IconMessageCircle :size="20" stroke-width="1.8" />
          </div>
          <div>
            <div class="quick-link-title">Support Tickets</div>
            <div class="quick-link-desc">Open a ticket for bugs, access, or workflow questions.</div>
          </div>
          <IconChevronRight :size="18" class="quick-link-arrow" />
        </RouterLink>
      </div>

      <div class="guest-grid">
        <div class="card">
          <div class="card-header">
            <span>Featured Public Models</span>
            <RouterLink to="/explore-model-cards" class="btn btn-sm btn-outline">View All</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="featuredModels.length === 0">
              No public models are available from the current API mode.
            </div>
            <div v-else class="stack-list">
              <RouterLink
                v-for="model in featuredModels"
                :key="model.id"
                :to="`/explore-model-cards/${model.id}`"
                class="stack-item"
              >
                <div class="stack-item-main">
                  <div class="stack-item-title">{{ model.name }}</div>
                  <div class="stack-item-subtitle">{{ model.author || 'Unknown author' }}</div>
                </div>
                <div class="stack-item-meta">
                  <span class="badge badge-info">{{ model.framework || 'n/a' }}</span>
                  <span class="stack-item-arrow">View</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>

      </div>
    </template>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
            <IconCube :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ myModelCount }}</div>
            <div class="stat-label">My Model Cards</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-info-bg); color: var(--color-info);">
            <IconMessageCircle :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ myOpenTicketCount }}</div>
            <div class="stat-label">Open Tickets</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-accent-bg); color: #c68200;">
            <IconLock :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ privateModelCount }}</div>
            <div class="stat-label">Private Model Cards</div>
          </div>
        </div>
      </div>

      <div class="member-grid">
        <div class="card workspace-card">
          <div class="card-header">
            <span>Session Info</span>
            <span class="badge badge-info">{{ auth.isAdmin ? 'Admin Session' : (auth.isTapisUser ? 'Tapis Session' : 'Signed In') }}</span>
          </div>
          <div class="card-body">
            <div class="workspace-hero">
              <div>
                <div class="workspace-title">Your personalized dashboard is live.</div>
                <div class="workspace-text">
                  This view tracks what you authored and the current state of your workspace activity.
                </div>
              </div>
            </div>

            <div class="workspace-actions">
              <RouterLink to="/submit" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-success-bg); color: var(--color-success);">
                  <IconUpload :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Submit New Record</div>
                  <div class="quick-link-desc">Add a model card or datasheet to Patra.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
              <RouterLink to="/tickets" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-info-bg); color: var(--color-info);">
                  <IconMessageCircle :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Open or review tickets</div>
                  <div class="quick-link-desc">Follow your issue queue and check admin responses.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
              <RouterLink to="/explore-model-cards" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
                  <IconSearch :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Browse Patra</div>
                  <div class="quick-link-desc">Review public and private model cards.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span>My Models</span>
            <RouterLink to="/explore-model-cards" class="btn btn-sm btn-outline">Explore</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="myModels.length === 0">
              No model cards are currently associated with your profile.
            </div>
            <div v-else class="stack-list">
              <RouterLink
                v-for="model in myModels"
                :key="model.id"
                :to="`/explore-model-cards/${model.id}`"
                class="stack-item"
              >
                <div class="stack-item-main">
                  <div class="stack-item-title">{{ model.name }}</div>
                  <div class="stack-item-subtitle">{{ model.category || 'Uncategorized' }}</div>
                </div>
                <div class="stack-item-meta">
                  <span class="badge" :class="model.is_private ? 'badge-private' : 'badge-public'">
                    {{ model.is_private ? 'Private' : 'Public' }}
                  </span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span>My Tickets</span>
            <RouterLink to="/tickets" class="btn btn-sm btn-outline">Open Tickets</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="myTickets.length === 0">
              No tickets are currently associated with your profile.
            </div>
            <div v-else class="stack-list">
              <div v-for="ticket in myTickets" :key="ticket.id" class="stack-item stack-item-static">
                <div class="stack-item-main">
                  <div class="stack-item-title">{{ ticket.subject }}</div>
                  <div class="stack-item-subtitle">{{ ticket.id }} · {{ formatTime(ticket.submitted_at) }}</div>
                </div>
                <div class="stack-item-meta stack-item-meta-column">
                  <span class="badge" :class="statusBadge(ticket.status)">{{ formatStatus(ticket.status) }}</span>
                  <span class="badge badge-info">{{ ticket.priority }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useTicketsStore } from '../stores/tickets'
import { useAuthStore } from '../stores/auth'
import {
  IconAlertCircle,
  IconCube,
  IconEye,
  IconLock,
  IconMessageCircle,
  IconSearch,
  IconTable,
  IconUpload,
  IconChevronRight,
} from '@tabler/icons-vue'

const exploreStore = useExploreStore()
const ticketsStore = useTicketsStore()
const auth = useAuthStore()

const isGuest = computed(() => !auth.isLoggedIn)

const dashboardError = computed(() => (
  exploreStore.error || ticketsStore.error || ''
))

const totalModels = computed(() => exploreStore.models.length)
const publicModelCount = computed(() => exploreStore.models.filter(model => !model.is_private).length)
const privateModelCount = computed(() => exploreStore.models.filter(model => model.is_private).length)
const totalDatasheets = computed(() => exploreStore.datasheets.length)
const featuredModels = computed(() => exploreStore.models.filter(model => !model.is_private).slice(0, 4))

const identityKeys = computed(() => {
  if (!auth.user) return []

  const baseKeys = [
    auth.displayName,
    auth.user.name,
    auth.user.username,
    auth.user.email,
    auth.user.email?.split('@')[0],
  ]

  if (auth.user.name) {
    baseKeys.push(...auth.user.name.split(' '))
  }

  return [...new Set(baseKeys.map(normalizeIdentity).filter(Boolean))]
})

const myModelsAll = computed(() => exploreStore.models.filter(model => matchesCurrentUser(model.author)))
const myTicketsAll = computed(() => ticketsStore.tickets.filter(ticket => matchesCurrentUser(ticket.submitted_by)))

const myModels = computed(() => myModelsAll.value.slice(0, 5))
const myTickets = computed(() => (
  [...myTicketsAll.value]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5)
))

const myModelCount = computed(() => myModelsAll.value.length)
const myOpenTicketCount = computed(() => myTicketsAll.value.filter(item => item.status !== 'resolved').length)

function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchesCurrentUser(value) {
  if (!auth.isLoggedIn) return false

  const candidate = normalizeIdentity(value)
  if (!candidate) return false

  return identityKeys.value.some(key => (
    candidate === key ||
    candidate.startsWith(`${key} `) ||
    candidate.endsWith(` ${key}`)
  ))
}

async function loadDashboard() {
  await Promise.allSettled([
    exploreStore.fetchModels(),
    exploreStore.fetchDatasheets(),
    ticketsStore.fetchTickets(),
  ])
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatStatus(status) {
  if (status === 'in_progress') return 'In Progress'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusBadge(status) {
  if (status === 'approved' || status === 'resolved') return 'badge-public'
  if (status === 'rejected') return 'badge-private'
  if (status === 'in_progress') return 'badge-info'
  return 'badge-accent'
}

onMounted(loadDashboard)
watch(() => auth.isLoggedIn, loadDashboard)
</script>

<style scoped>
.action-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  text-decoration: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.action-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.guest-grid {
  display: grid;
  gap: 20px;
}

.getting-started-text {
  margin: 0;
  font-size: .9rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.workspace-card {
  grid-column: 1 / -1;
}

.workspace-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 18px;
}

.workspace-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.workspace-text {
  font-size: .9rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-width: 66ch;
}

.workspace-actions,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
  text-decoration: none;
}

.quick-link:hover {
  background: var(--color-bg);
}

.quick-link-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-link-title {
  font-weight: 600;
  font-size: .92rem;
}

.quick-link-desc {
  font-size: .78rem;
  color: var(--color-text-muted);
  margin-top: 1px;
}

.quick-link-arrow {
  margin-left: auto;
  color: var(--color-text-muted);
}

.stack-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stack-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition);
}

.stack-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.stack-item-static:hover {
  border-color: var(--color-border);
  box-shadow: none;
  transform: none;
}

.stack-item-main {
  min-width: 0;
}

.stack-item-title {
  font-weight: 600;
  color: var(--color-text);
}

.stack-item-subtitle {
  margin-top: 3px;
  font-size: .78rem;
  color: var(--color-text-muted);
}

.stack-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stack-item-meta-column {
  flex-direction: column;
  align-items: flex-end;
}

.stack-item-arrow {
  font-size: .8rem;
  color: var(--color-text-muted);
}

.empty-block {
  padding: 22px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: .88rem;
  line-height: 1.6;
}

.connection-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  font-size: .88rem;
}

.connection-banner.error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.connection-banner code {
  background: rgba(0, 0, 0, .08);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: .82rem;
}

@media (max-width: 1180px) {
  .action-bar {
    grid-template-columns: 1fr;
  }

  .member-grid {
    grid-template-columns: 1fr;
  }

  .workspace-hero {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .stack-item,
  .quick-link {
    align-items: flex-start;
  }

  .stack-item-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
