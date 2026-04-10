<template>
  <div>
    <div class="page-header">
      <h1>{{ isGuest ? 'Patra Knowledge Base' : `Welcome back, ${auth.displayName}` }}</h1>
      <p>
        {{ isGuest
          ? 'Discover public model cards, browse datasheets, and understand how to contribute to the ICICLE ecosystem.'
          : 'Your workspace snapshot for submissions, authored records, and support activity.' }}
      </p>
    </div>

    <div class="connection-banner error" v-if="dashboardError">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Some dashboard data could not be loaded from {{ apiMode.displayLabel.toLowerCase() }} at <code>{{ apiMode.apiBaseUrl }}</code>.</span>
    </div>

    <template v-if="isGuest">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="hero-eyebrow">Open discovery for the ICICLE ecosystem</div>
          <h2>Explore curated AI records before you decide what to submit.</h2>
          <p>
            Guests get a clean public landing experience focused on discovery. Browse public model cards,
            inspect datasheets, and review contribution paths before signing in through Tapis.
          </p>
          <div class="hero-actions">
            <RouterLink
              v-if="apiMode.supportsAskPatra && (auth.isTapisUser || auth.isAdmin)"
              :to="{ path: '/ask-patra', query: { prompt: 'Help me find the right PATRA tool for my task.' } }"
              class="btn btn-primary"
            >
              <IconSparkles :size="16" stroke-width="1.8" />
              Start in Ask Patra
            </RouterLink>
            <RouterLink to="/explore-model-cards" class="btn btn-primary">
              <IconSearch :size="16" stroke-width="1.8" />
              Explore Model Cards
            </RouterLink>
            <RouterLink to="/explore-datasheets" class="btn btn-outline">
              <IconTable :size="16" stroke-width="1.8" />
              Browse Datasheets
            </RouterLink>
          </div>
        </div>
      </section>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
            <IconCube :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ totalModels }}</div>
            <div class="stat-label">Catalog Models</div>
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

      <div class="dashboard-grid guest-grid">
        <div class="card">
          <div class="card-header">
            <span>What You Can Do</span>
          </div>
          <div class="card-body">
            <div class="action-list">
              <RouterLink to="/explore-model-cards" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
                  <IconSearch :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Browse model cards</div>
                  <div class="quick-link-desc">Inspect public metadata, metrics, and deployment context.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
              <RouterLink to="/explore-datasheets" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-info-bg); color: var(--color-info);">
                  <IconTable :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Browse datasheets</div>
                  <div class="quick-link-desc">Inspect dataset documentation and public resource metadata.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
              <div class="quick-link quick-link-static">
                <div class="quick-link-icon" style="background: var(--color-accent-bg); color: #a8701f;">
                  <IconLock :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Sign in to contribute</div>
                  <div class="quick-link-desc">Tapis users can submit records, use assistant tools, and access workspace workflows.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            <div class="stat-label">My Catalog Models</div>
          </div>
        </div>
        <div class="stat-card" v-if="apiMode.supportsSubmissionQueue">
          <div class="stat-icon" style="background: var(--color-success-bg); color: var(--color-success);">
            <IconClipboardCheck :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ mySubmissionCount }}</div>
            <div class="stat-label">My Submissions</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-accent-bg); color: #c68200;">
            <IconLock :size="24" stroke-width="1.8" />
          </div>
          <div>
            <div class="stat-value">{{ privateModelCount }}</div>
            <div class="stat-label">Private Catalog Models</div>
          </div>
        </div>
      </div>

      <div class="member-grid">
        <div class="card workspace-card">
          <div class="card-header">
            <span>Workspace Focus</span>
            <span class="badge badge-info">{{ auth.isAdmin ? 'Admin Session' : (auth.isTapisUser ? 'Tapis Session' : 'Signed In') }}</span>
          </div>
          <div class="card-body">
            <div class="workspace-hero">
              <div>
                <div class="workspace-title">Your personalized dashboard is live.</div>
                <div class="workspace-text">
                  This view tracks what you submitted, what you authored, and the current state of your workspace activity.
                </div>
              </div>
              <div class="workspace-chips">
                <span class="chip active" v-if="apiMode.supportsSubmissionQueue">{{ myPendingSubmissionCount }} pending submissions</span>
                <span class="chip active">{{ myAssetIntakeCount }} record-link requests</span>
              </div>
            </div>

            <div class="workspace-actions">
              <RouterLink v-if="apiMode.supportsAskPatra" to="/ask-patra" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
                  <IconSparkles :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Start in Ask Patra</div>
                  <div class="quick-link-desc">Route a task through PATRA before opening a specific tool.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
              <RouterLink to="/submit" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-success-bg); color: var(--color-success);">
                  <IconUpload :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Create a new submission</div>
                  <div class="quick-link-desc">Manual entry, single record link, or bulk record links.</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
              <RouterLink to="/explore-model-cards" class="quick-link">
                <div class="quick-link-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
                  <IconSearch :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">Return to the catalog</div>
                  <div class="quick-link-desc">Review current public and private model coverage.</div>
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
              No catalog models are currently associated with your profile.
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

        <div class="card" v-if="apiMode.supportsSubmissionQueue">
          <div class="card-header">
            <span>My Recent Submissions</span>
            <RouterLink v-if="auth.isAdmin" to="/submissions" class="btn btn-sm btn-outline">Review Queue</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="mySubmissions.length === 0">
              You have not created any tracked submissions in the current API mode yet.
            </div>
            <div v-else class="stack-list">
              <div v-for="submission in mySubmissions" :key="submission.id" class="stack-item stack-item-static">
                <div class="stack-item-main">
                  <div class="stack-item-title">{{ getSubmissionTitle(submission) }}</div>
                  <div class="stack-item-subtitle">
                    {{ formatSubmissionType(submission.type) }} · {{ formatTime(submission.submitted_at) }}
                  </div>
                </div>
                <div
                  v-if="submission.data?.intake_method === 'asset_link'"
                  class="stack-item-meta stack-item-meta-column"
                >
                  <span class="badge badge-accent">Record Link</span>
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
import { useSubmissionsStore } from '../stores/submissions'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconAlertCircle,
  IconClipboardCheck,
  IconCube,
  IconEye,
  IconLock,
  IconSearch,
  IconSparkles,
  IconTable,
  IconUpload,
  IconChevronRight,
} from '@tabler/icons-vue'

const exploreStore = useExploreStore()
const submissionsStore = useSubmissionsStore()
const auth = useAuthStore()
const apiMode = useApiModeStore()

const isGuest = computed(() => !auth.isLoggedIn)

const dashboardError = computed(() => (
  exploreStore.error || submissionsStore.error || ''
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
const mySubmissionsAll = computed(() => submissionsStore.submissions.filter(submission => matchesCurrentUser(submission.submitted_by)))

const myModels = computed(() => myModelsAll.value.slice(0, 5))
const mySubmissions = computed(() => (
  [...mySubmissionsAll.value]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5)
))

const myModelCount = computed(() => myModelsAll.value.length)
const mySubmissionCount = computed(() => mySubmissionsAll.value.length)
const myPendingSubmissionCount = computed(() => mySubmissionsAll.value.filter(item => item.status === 'pending').length)
const myAssetIntakeCount = computed(() => mySubmissionsAll.value.filter(item => item.data?.intake_method === 'asset_link').length)

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
  const tasks = [
    exploreStore.fetchModels(),
    exploreStore.fetchDatasheets(),
  ]

  if (auth.isLoggedIn && apiMode.supportsSubmissionQueue) {
    tasks.push(submissionsStore.fetchSubmissions())
  } else {
    submissionsStore.submissions = []
    submissionsStore.error = null
  }

  await Promise.allSettled(tasks)
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

function formatSubmissionType(type) {
  return type === 'model_card' ? 'Model Card' : 'Datasheet'
}

function getSubmissionTitle(submission) {
  if (submission.data?.intake_method === 'asset_link') {
    return submission.data.display_name || submission.data.asset_url || 'Record link intake'
  }

  return submission.data?.name || submission.id
}

onMounted(loadDashboard)
watch(() => apiMode.mode, loadDashboard)
watch(() => auth.isLoggedIn, loadDashboard)
</script>

<style scoped>
.hero-panel {
  margin-bottom: 28px;
}

.hero-copy {
  padding: 32px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background:
    radial-gradient(circle at top right, rgba(47, 78, 162, 0.10), transparent 30%),
    linear-gradient(135deg, #f7f9ff 0%, #fffdf7 58%, #fcf5ea 100%);
  box-shadow: var(--shadow-sm);
}

.hero-eyebrow {
  font-size: .74rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.hero-copy h2 {
  margin: 0 0 10px;
  font-size: 2.15rem;
  line-height: 1.06;
  max-width: 12ch;
  letter-spacing: -.04em;
}

.hero-copy p {
  margin: 0;
  max-width: 62ch;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.dashboard-grid {
  display: grid;
  gap: 20px;
}

.guest-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.workspace-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
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
  padding: 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  transition: background var(--transition), border-color var(--transition), transform var(--transition);
  text-decoration: none;
}

.quick-link:hover {
  background: rgba(255,255,255,.72);
  border-color: var(--color-border);
  transform: translateY(-1px);
}

.quick-link-static:hover {
  transform: none;
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
  border-radius: 14px;
  background: rgba(255,255,255,.55);
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
  border-radius: 14px;
  background: rgba(255,255,255,.35);
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
  border: 1px solid rgba(194, 65, 74, .28);
}

.connection-banner code {
  background: rgba(0, 0, 0, .08);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: .82rem;
}

@media (max-width: 1180px) {
  .guest-grid,
  .member-grid {
    grid-template-columns: 1fr;
  }

  .workspace-hero {
    flex-direction: column;
  }

  .workspace-chips {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .hero-copy {
    padding: 22px;
  }

  .hero-copy h2 {
    font-size: 1.6rem;
    max-width: none;
  }

  .hero-actions {
    flex-direction: column;
  }

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

