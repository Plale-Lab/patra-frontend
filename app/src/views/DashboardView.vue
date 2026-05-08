<template>
  <div>
    <div class="page-header">
      <h1>{{ isGuest ? 'Patra Knowledge Base' : `Welcome back, ${auth.displayName}` }}</h1>
      <p>
        {{ isGuest
          ? 'Browse the public catalog and inspect the current coverage of model cards and datasheets.'
          : 'Catalog status, record quality, and the work surfaces available in this deployment.' }}
      </p>
    </div>

    <div class="connection-banner error" v-if="dashboardError">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Some dashboard data could not be loaded from {{ apiMode.displayLabel.toLowerCase() }} at <code>{{ apiMode.apiBaseUrl }}</code>.</span>
    </div>

    <section class="summary-grid">
      <RouterLink to="/explore-model-cards" class="summary-tile">
        <div class="summary-icon primary"><IconCube :size="22" stroke-width="1.8" /></div>
        <div>
          <div class="summary-value">{{ totalModels }}</div>
          <div class="summary-label">Model Cards</div>
          <div class="summary-note">{{ publicModelCount }} public, {{ privateModelCount }} private</div>
        </div>
      </RouterLink>
      <RouterLink to="/explore-datasheets" class="summary-tile">
        <div class="summary-icon info"><IconTable :size="22" stroke-width="1.8" /></div>
        <div>
          <div class="summary-value">{{ totalDatasheets }}</div>
          <div class="summary-label">Datasheets</div>
          <div class="summary-note">{{ publicDatasheetCount }} public, {{ privateDatasheetCount }} private</div>
        </div>
      </RouterLink>
      <RouterLink to="/explore-model-cards" class="summary-tile">
        <div class="summary-icon accent"><IconShieldLock :size="22" stroke-width="1.8" /></div>
        <div>
          <div class="summary-value">{{ gatedModelCount }}</div>
          <div class="summary-label">Gated Models</div>
          <div class="summary-note">{{ visibilityReviewItems.length }} visibility items to inspect</div>
        </div>
      </RouterLink>
      <div class="summary-tile">
        <div class="summary-icon success"><IconChecks :size="22" stroke-width="1.8" /></div>
        <div>
          <div class="summary-value">{{ qualityScore }}%</div>
          <div class="summary-label">Completeness</div>
          <div class="summary-note">{{ qualityIssueCount }} quality gaps detected</div>
        </div>
      </div>
    </section>

    <section class="dashboard-layout">
      <div class="dashboard-main">
        <div class="card">
          <div class="card-header">
            <span>Recent Activity</span>
            <span class="panel-meta">{{ recentActivity.length }} records</span>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="recentActivity.length === 0">
              No recent records are available from the current API mode.
            </div>
            <div v-else class="activity-list">
              <RouterLink
                v-for="item in recentActivity"
                :key="`${item.type}-${item.id}`"
                :to="item.route"
                class="activity-row"
              >
                <div class="activity-mark" :class="item.type">
                  <component :is="item.icon" :size="17" stroke-width="1.8" />
                </div>
                <div class="activity-main">
                  <div class="activity-title">{{ item.title }}</div>
                  <div class="activity-subtitle">{{ item.subtitle }}</div>
                </div>
                <div class="activity-meta">
                  <span class="badge" :class="item.private ? 'badge-private' : 'badge-public'">
                    {{ item.private ? 'Private' : 'Public' }}
                  </span>
                  <span>{{ item.timeLabel }}</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span>Data Quality</span>
            <span class="panel-meta">{{ qualityIssueCount }} gaps</span>
          </div>
          <div class="card-body">
            <div class="quality-grid">
              <RouterLink
                v-for="item in qualityChecks"
                :key="item.key"
                :to="item.route"
                class="quality-item"
              >
                <div class="quality-count">{{ item.count }}</div>
                <div>
                  <div class="quality-label">{{ item.label }}</div>
                  <div class="quality-desc">{{ item.description }}</div>
                </div>
                <IconChevronRight :size="17" class="quality-arrow" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <aside class="dashboard-side">
        <div class="card">
          <div class="card-header">
            <span>Quick Actions</span>
          </div>
          <div class="card-body">
            <div class="action-list">
              <RouterLink
                v-for="action in quickActions"
                :key="action.route"
                :to="action.route"
                class="quick-link"
              >
                <div class="quick-link-icon" :class="action.tone">
                  <component :is="action.icon" :size="20" stroke-width="1.8" />
                </div>
                <div>
                  <div class="quick-link-title">{{ action.label }}</div>
                  <div class="quick-link-desc">{{ action.description }}</div>
                </div>
                <IconChevronRight :size="18" class="quick-link-arrow" />
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span>Visibility Review</span>
            <RouterLink to="/explore-model-cards" class="btn btn-sm btn-outline">Open</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="visibilityReviewItems.length === 0">
              No gated or private records are visible in the current catalog snapshot.
            </div>
            <div v-else class="compact-list">
              <RouterLink
                v-for="item in visibilityReviewItems"
                :key="`${item.type}-${item.id}`"
                :to="item.route"
                class="compact-item"
              >
                <div>
                  <div class="compact-title">{{ item.title }}</div>
                  <div class="compact-subtitle">{{ item.subtitle }}</div>
                </div>
                <span class="badge" :class="item.badgeClass">{{ item.badge }}</span>
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="card" v-if="!isGuest">
          <div class="card-header">
            <span>My Records</span>
            <RouterLink to="/explore-model-cards" class="btn btn-sm btn-outline">Explore</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="myRecords.length === 0">
              No records currently match your signed-in identity.
            </div>
            <div v-else class="compact-list">
              <RouterLink
                v-for="item in myRecords"
                :key="`${item.type}-${item.id}`"
                :to="item.route"
                class="compact-item"
              >
                <div>
                  <div class="compact-title">{{ item.title }}</div>
                  <div class="compact-subtitle">{{ item.subtitle }}</div>
                </div>
                <span class="badge" :class="item.private ? 'badge-private' : 'badge-public'">
                  {{ item.private ? 'Private' : 'Public' }}
                </span>
              </RouterLink>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconAlertCircle,
  IconChecks,
  IconChevronRight,
  IconCube,
  IconEdit,
  IconMessageCircle,
  IconSearch,
  IconShieldLock,
  IconSparkles,
  IconTable,
  IconUpload,
} from '@tabler/icons-vue'

const exploreStore = useExploreStore()
const auth = useAuthStore()
const apiMode = useApiModeStore()

const isGuest = computed(() => !auth.isLoggedIn)
const dashboardError = computed(() => exploreStore.error || '')

const totalModels = computed(() => exploreStore.models.length)
const totalDatasheets = computed(() => exploreStore.datasheets.length)
const publicModelCount = computed(() => exploreStore.models.filter((model) => !model.is_private).length)
const privateModelCount = computed(() => exploreStore.models.filter((model) => model.is_private).length)
const publicDatasheetCount = computed(() => exploreStore.datasheets.filter((ds) => !ds.is_private).length)
const privateDatasheetCount = computed(() => exploreStore.datasheets.filter((ds) => ds.is_private).length)
const gatedModelCount = computed(() => exploreStore.models.filter((model) => model.is_gated).length)

const modelRecords = computed(() => exploreStore.models.map((model) => ({
  id: model.id,
  type: 'model',
  icon: IconCube,
  title: model.name || 'Untitled model card',
  subtitle: [model.author || 'Unknown author', model.framework || model.category || 'Model card'].filter(Boolean).join(' | '),
  private: Boolean(model.is_private),
  gated: Boolean(model.is_gated),
  route: `/explore-model-cards/${model.id}`,
  date: recordDate(model),
  raw: model,
})))

const datasheetRecords = computed(() => exploreStore.datasheets.map((ds) => ({
  id: ds.id,
  type: 'datasheet',
  icon: IconTable,
  title: getDatasheetTitle(ds),
  subtitle: [getDatasheetCreator(ds) || getDatasheetPublisher(ds) || 'Unknown creator', getResourceType(ds)].filter(Boolean).join(' | '),
  private: Boolean(ds.is_private),
  gated: false,
  route: `/explore-datasheets/${ds.id}`,
  date: recordDate(ds),
  raw: ds,
})))

const allRecords = computed(() => [...modelRecords.value, ...datasheetRecords.value])

const recentActivity = computed(() => allRecords.value
  .slice()
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 8)
  .map((item) => ({
    ...item,
    timeLabel: formatTime(item.date),
  })))

const visibilityReviewItems = computed(() => allRecords.value
  .filter((item) => item.private || item.gated)
  .slice(0, 6)
  .map((item) => ({
    ...item,
    badge: item.gated ? 'Gated' : 'Private',
    badgeClass: item.gated ? 'badge-accent' : 'badge-private',
  })))

const identityKeys = computed(() => {
  if (!auth.user) return []
  const baseKeys = [
    auth.displayName,
    auth.user.name,
    auth.user.username,
    auth.user.email,
    auth.user.email?.split('@')[0],
  ]
  if (auth.user.name) baseKeys.push(...auth.user.name.split(' '))
  return [...new Set(baseKeys.map(normalizeIdentity).filter(Boolean))]
})

const myRecords = computed(() => allRecords.value
  .filter((record) => matchesCurrentUser(record.raw.author || getDatasheetCreator(record.raw)))
  .slice(0, 5))

const missingModelAuthorCount = computed(() => exploreStore.models.filter((model) => !model.author).length)
const missingModelLicenseCount = computed(() => exploreStore.models.filter((model) => !model.ai_model?.license && !model.license).length)
const missingModelDocumentationCount = computed(() => exploreStore.models.filter((model) => !model.documentation && !model.citation).length)
const missingDatasheetCreatorCount = computed(() => exploreStore.datasheets.filter((ds) => !getDatasheetCreator(ds)).length)

const qualityChecks = computed(() => [
  {
    key: 'model-author',
    label: 'Model cards without author',
    description: 'Add owner context for attribution and support routing.',
    count: missingModelAuthorCount.value,
    route: '/explore-model-cards',
  },
  {
    key: 'model-license',
    label: 'Model cards without license',
    description: 'Clarify reuse terms for public catalog consumers.',
    count: missingModelLicenseCount.value,
    route: '/explore-model-cards',
  },
  {
    key: 'model-docs',
    label: 'Model cards missing citation/docs',
    description: 'Improve traceability with citation or documentation links.',
    count: missingModelDocumentationCount.value,
    route: '/explore-model-cards',
  },
  {
    key: 'datasheet-creator',
    label: 'Datasheets without creator',
    description: 'Add creator metadata for discovery and provenance.',
    count: missingDatasheetCreatorCount.value,
    route: '/explore-datasheets',
  },
])

const qualityIssueCount = computed(() => qualityChecks.value.reduce((sum, item) => sum + item.count, 0))
const qualityScore = computed(() => {
  const possible = Math.max((totalModels.value * 3) + totalDatasheets.value, 1)
  return Math.max(0, Math.round(((possible - qualityIssueCount.value) / possible) * 100))
})

const quickActions = computed(() => {
  const actions = [
    {
      label: 'Browse model cards',
      description: 'Search public and private model metadata.',
      route: '/explore-model-cards',
      icon: IconSearch,
      tone: 'primary',
    },
    {
      label: 'Browse datasheets',
      description: 'Inspect dataset records and provenance metadata.',
      route: '/explore-datasheets',
      icon: IconTable,
      tone: 'info',
    },
  ]

  if (auth.isTapisUser || auth.isAdmin) {
    actions.push({
      label: 'Submit records',
      description: 'Create a model card or datasheet.',
      route: '/submit',
      icon: IconUpload,
      tone: 'success',
    })
  }
  if (apiMode.supportsEditRecords && (auth.isTapisUser || auth.isAdmin)) {
    actions.push({
      label: 'Edit records',
      description: 'Update metadata, visibility, and gated flags.',
      route: '/edit-records',
      icon: IconEdit,
      tone: 'accent',
    })
  }
  if (apiMode.supportsAskPatra && (auth.isTapisUser || auth.isAdmin)) {
    actions.push({
      label: 'Ask Patra',
      description: 'Route work through the assistant surface.',
      route: '/ask-patra',
      icon: IconSparkles,
      tone: 'primary',
    })
  }
  if (apiMode.supportsTickets && (auth.isTapisUser || auth.isAdmin)) {
    actions.push({
      label: 'Support tickets',
      description: 'Submit or review service requests.',
      route: '/tickets',
      icon: IconMessageCircle,
      tone: 'info',
    })
  }

  return actions
})

function getDatasheetTitle(ds) {
  if (Array.isArray(ds.title) && ds.title.length) {
    const title = ds.title[0]
    return typeof title === 'object' ? title.title || 'Untitled datasheet' : title
  }
  if (Array.isArray(ds.titles) && ds.titles.length) {
    const title = ds.titles[0]
    return typeof title === 'object' ? title.title || 'Untitled datasheet' : title
  }
  return ds.title || ds.name || 'Untitled datasheet'
}

function getDatasheetCreator(ds) {
  const creators = ds.creator || ds.creators
  if (Array.isArray(creators) && creators.length) {
    const creator = creators[0]
    return creator.creatorName?.name || creator.creator_name || creator.name || ''
  }
  return typeof creators === 'string' ? creators : ''
}

function getDatasheetPublisher(ds) {
  if (ds.publisher && typeof ds.publisher === 'object') return ds.publisher.name || ''
  return ds.publisher || ''
}

function getResourceType(ds) {
  return ds.resource_type?.resourceType || ds.resource_type?.resource_type || 'Dataset'
}

function recordDate(record) {
  const value = record.updated_at || record.created_at || record.submitted_at || record.created || record.date
  const parsed = value ? new Date(value) : null
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed

  const year = Number(record.publication_year)
  if (year > 1900) return new Date(`${year}-01-01T00:00:00Z`)

  return new Date(0)
}

function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchesCurrentUser(value) {
  if (!auth.isLoggedIn) return false
  const candidate = normalizeIdentity(value)
  if (!candidate) return false
  return identityKeys.value.some((key) => (
    candidate === key ||
    candidate.startsWith(`${key} `) ||
    candidate.endsWith(` ${key}`)
  ))
}

function formatTime(date) {
  if (!date || date.getTime() === 0) return 'No date'
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function loadDashboard() {
  await Promise.allSettled([
    exploreStore.fetchModels(),
    exploreStore.fetchDatasheets(),
  ])
}

onMounted(loadDashboard)
watch(() => apiMode.mode, loadDashboard)
watch(() => auth.isLoggedIn, loadDashboard)
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.summary-tile {
  min-height: 112px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(255,255,255,.92), var(--color-surface));
  text-decoration: none;
  transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition);
  min-width: 0;
}

.summary-tile:hover {
  border-color: rgba(47, 78, 162, .28);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.summary-icon,
.quick-link-icon,
.activity-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
}

.summary-icon.primary,
.quick-link-icon.primary,
.activity-mark.model { background: var(--color-primary-bg); color: var(--color-primary); }
.summary-icon.info,
.quick-link-icon.info,
.activity-mark.datasheet { background: var(--color-info-bg); color: var(--color-info); }
.summary-icon.success,
.quick-link-icon.success { background: var(--color-success-bg); color: var(--color-success); }
.summary-icon.accent,
.quick-link-icon.accent { background: var(--color-accent-bg); color: #a8701f; }

.summary-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
  color: var(--color-text);
}

.summary-label {
  margin-top: 5px;
  font-size: .86rem;
  font-weight: 700;
  color: var(--color-text);
}

.summary-note {
  margin-top: 3px;
  font-size: .76rem;
  color: var(--color-text-muted);
}

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, .8fr);
  gap: 20px;
  align-items: start;
}

.dashboard-main,
.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.panel-meta {
  color: var(--color-text-muted);
  font-size: .78rem;
  font-weight: 600;
}

.activity-list,
.compact-list,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-row,
.compact-item,
.quick-link,
.quality-item {
  text-decoration: none;
}

.activity-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255,255,255,.48);
  transition: border-color var(--transition), transform var(--transition);
}

.activity-row:hover,
.compact-item:hover,
.quality-item:hover,
.quick-link:hover {
  border-color: rgba(47, 78, 162, .32);
  transform: translateY(-1px);
}

.activity-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.activity-main,
.compact-item > div {
  min-width: 0;
}

.activity-title,
.compact-title,
.quick-link-title,
.quality-label {
  font-size: .9rem;
  font-weight: 700;
  color: var(--color-text);
}

.activity-subtitle,
.compact-subtitle,
.quick-link-desc,
.quality-desc {
  margin-top: 2px;
  font-size: .78rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  font-size: .75rem;
  color: var(--color-text-muted);
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quality-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 18px;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255,255,255,.45);
  transition: border-color var(--transition), transform var(--transition);
}

.quality-count {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 800;
}

.quality-arrow,
.quick-link-arrow {
  color: var(--color-text-muted);
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: rgba(255,255,255,.45);
  transition: border-color var(--transition), transform var(--transition);
}

.quick-link-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
}

.quick-link-arrow {
  margin-left: auto;
}

.compact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255,255,255,.45);
  transition: border-color var(--transition), transform var(--transition);
}

.empty-block {
  padding: 22px;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
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
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-header h1,
  .page-header p,
  .summary-note,
  .item-subtitle,
  .quick-link-desc {
    overflow-wrap: anywhere;
  }

  .summary-grid,
  .quality-grid {
    grid-template-columns: 1fr;
  }

  .activity-row {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .activity-meta {
    grid-column: 2;
    align-items: flex-start;
    flex-direction: row;
  }

  .compact-item,
  .quick-link {
    align-items: flex-start;
  }
}
</style>
