<template>
  <div>
    <div class="page-header" v-if="!isGuest">
      <h1>Welcome back, {{ auth.displayName }}</h1>
      <p>Your workspace snapshot for authored records and support activity.</p>
    </div>

    <div class="connection-banner error" v-if="dashboardError">
      <IconAlertCircle :size="18" stroke-width="1.8" />
      <span>Some dashboard data could not be loaded from {{ apiMode.displayLabel.toLowerCase() }} at <code>{{ apiMode.apiBaseUrl }}</code>.</span>
    </div>

    <template v-if="isGuest">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="hero-eyebrow">ICICLE Knowledge Base</div>
          <h2>Trustworthy AI starts with documentation.</h2>
          <p>
            Patra is the open knowledge base for AI/ML models in the ICICLE edge-cloud
            ecosystem &mdash; capturing performance, fairness, lineage, and real-world
            deployment behavior so models can be found, evaluated, and reused with full context.
          </p>
          <div class="hero-actions">
            <RouterLink to="/modelcards" class="btn btn-primary">
              <IconCube :size="16" stroke-width="1.8" />
              Browse Model Cards
            </RouterLink>
            <RouterLink to="/datasheets" class="btn btn-outline">
              <IconTable :size="16" stroke-width="1.8" />
              Browse Datasheets
            </RouterLink>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalModels }}</span>
              <span class="hero-stat-label">Model Cards</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalDatasheets }}</span>
              <span class="hero-stat-label">Datasheets</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ authorCount }}</span>
              <span class="hero-stat-label">Contributors</span>
            </div>
          </div>
        </div>
      </section>

      <section class="pillars-grid">
        <article class="pillar">
          <div class="pillar-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
            <IconCube :size="22" stroke-width="1.8" />
          </div>
          <h3>Model Cards</h3>
          <p>
            Performance, fairness, and explainability for each model &mdash; alongside
            the deployment context it was built for.
          </p>
        </article>
        <article class="pillar">
          <div class="pillar-icon" style="background: var(--color-info-bg); color: var(--color-info);">
            <IconTable :size="22" stroke-width="1.8" />
          </div>
          <h3>Datasheets</h3>
          <p>
            DataCite-aligned documentation for every dataset behind a model, so
            data provenance is part of the record, not a footnote.
          </p>
        </article>
        <article class="pillar">
          <div class="pillar-icon" style="background: var(--color-success-bg); color: var(--color-success);">
            <IconGitBranch :size="22" stroke-width="1.8" />
          </div>
          <h3>Provenance &amp; Lineage</h3>
          <p>
            Forward and backward links between models, datasets, and deployments &mdash;
            including versions, alternates, and transformative reuse.
          </p>
        </article>
      </section>

      <section class="how-card card">
        <div class="card-header">
          <span>How it works</span>
        </div>
        <div class="card-body">
          <ol class="how-steps">
            <li>
              <div class="how-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
                <IconUpload :size="20" stroke-width="1.8" />
              </div>
              <div>
                <div class="how-title">1. Document</div>
                <div class="how-desc">Generate model cards with the Patra Toolkit &mdash; metrics and fairness checks captured semi-automatically.</div>
              </div>
            </li>
            <li>
              <div class="how-icon" style="background: var(--color-info-bg); color: var(--color-info);">
                <IconSearch :size="20" stroke-width="1.8" />
              </div>
              <div>
                <div class="how-title">2. Discover</div>
                <div class="how-desc">Browse the catalog UI or query the REST API to find models that match your accuracy, fairness, and deployment needs.</div>
              </div>
            </li>
            <li>
              <div class="how-icon" style="background: var(--color-success-bg); color: var(--color-success);">
                <IconBolt :size="20" stroke-width="1.8" />
              </div>
              <div>
                <div class="how-title">3. Deploy with confidence</div>
                <div class="how-desc">Real-time deployment telemetry from CKN feeds back into the catalog so you can see how a model behaves in the wild.</div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section class="catalog-flavor" v-if="topCategories.length">
        <div class="flavor-label">What&rsquo;s in the catalog</div>
        <div class="flavor-chips">
          <RouterLink
            v-for="cat in topCategories"
            :key="cat.name"
            :to="{ path: '/modelcards', query: { category: cat.name } }"
            class="flavor-chip"
          >
            <span class="flavor-chip-name">{{ cat.name }}</span>
            <span class="flavor-chip-count">{{ cat.count }}</span>
          </RouterLink>
        </div>
      </section>

      <div class="featured-grid">
        <div class="card">
          <div class="card-header">
            <span>Featured Public Models</span>
            <RouterLink to="/modelcards" class="btn btn-sm btn-outline">View All</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="featuredModels.length === 0">
              No public models are available from the current API mode.
            </div>
            <div v-else class="stack-list">
              <RouterLink
                v-for="model in featuredModels"
                :key="model.uuid"
                :to="`/modelcard/${model.uuid}`"
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

        <div class="card">
          <div class="card-header">
            <span>Recently Added</span>
            <RouterLink to="/modelcards" class="btn btn-sm btn-outline">View All</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="recentModels.length === 0">
              No recent records to display.
            </div>
            <div v-else class="stack-list">
              <RouterLink
                v-for="model in recentModels"
                :key="model.uuid"
                :to="`/modelcard/${model.uuid}`"
                class="stack-item"
              >
                <div class="stack-item-main">
                  <div class="stack-item-title">{{ model.name }}</div>
                  <div class="stack-item-subtitle">{{ model.author || 'Unknown author' }}</div>
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

      <div class="card">
          <div class="card-header">
            <span>My Models</span>
            <RouterLink to="/modelcards" class="btn btn-sm btn-outline">Explore</RouterLink>
          </div>
          <div class="card-body">
            <div class="empty-block" v-if="myModels.length === 0">
              No catalog models are currently associated with your profile.
            </div>
            <div v-else class="stack-list">
              <RouterLink
                v-for="model in myModels"
                :key="model.uuid"
                :to="`/modelcard/${model.uuid}`"
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
    </template>
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
  IconBolt,
  IconCube,
  IconGitBranch,
  IconLock,
  IconSearch,
  IconTable,
  IconUpload,
} from '@tabler/icons-vue'

const exploreStore = useExploreStore()
const auth = useAuthStore()
const apiMode = useApiModeStore()

const isGuest = computed(() => !auth.isLoggedIn)

const dashboardError = computed(() => (
  exploreStore.error || ''
))

const totalModels = computed(() => exploreStore.models.length)
const privateModelCount = computed(() => exploreStore.models.filter(model => model.is_private).length)
const totalDatasheets = computed(() => exploreStore.datasheets.length)
const featuredModels = computed(() => exploreStore.models.filter(model => !model.is_private).slice(0, 4))

const recentModels = computed(() => {
  const numericId = (m) => Number(m.id ?? m.external_id ?? m.mc_id ?? 0) || 0
  return [...exploreStore.models].sort((a, b) => numericId(b) - numericId(a)).slice(0, 4)
})

const topCategories = computed(() => {
  const counts = new Map()
  for (const model of exploreStore.models) {
    const raw = model.category || model.categories
    if (!raw) continue
    const items = String(raw).split(',').map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      counts.set(item, (counts.get(item) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))
})

const authorCount = computed(() => {
  const authors = new Set()
  for (const model of exploreStore.models) {
    const name = normalizeIdentity(model.author)
    if (name) authors.add(name)
  }
  for (const datasheet of exploreStore.datasheets) {
    const name = normalizeIdentity(datasheet.author)
    if (name) authors.add(name)
  }
  return authors.size
})

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

const myModels = computed(() => myModelsAll.value.slice(0, 5))

const myModelCount = computed(() => myModelsAll.value.length)

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

  await Promise.allSettled(tasks)
}

onMounted(loadDashboard)
watch(() => apiMode.mode, loadDashboard)
watch(() => auth.isLoggedIn, loadDashboard)
</script>

<style scoped>
.hero-panel {
  margin-bottom: 24px;
}

.hero-copy {
  padding: 40px 36px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background:
    radial-gradient(circle at top right, rgba(47, 78, 162, 0.12), transparent 35%),
    radial-gradient(circle at bottom left, rgba(168, 112, 31, 0.08), transparent 40%),
    linear-gradient(135deg, #f7f9ff 0%, #fffdf7 58%, #fcf5ea 100%);
  box-shadow: var(--shadow-sm);
}

.hero-eyebrow {
  font-size: .74rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 14px;
}

.hero-copy h2 {
  margin: 0 0 14px;
  font-size: 2.4rem;
  line-height: 1.08;
  max-width: 18ch;
  letter-spacing: -.04em;
}

.hero-copy p {
  margin: 0;
  max-width: 64ch;
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-size: .98rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hero-stats {
  display: flex;
  gap: 28px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid rgba(47, 78, 162, 0.14);
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--color-primary);
  line-height: 1;
}

.hero-stat-label {
  font-size: .72rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.catalog-flavor {
  margin-bottom: 24px;
  padding: 18px 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.45);
}

.flavor-label {
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.flavor-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flavor-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: #fff;
  text-decoration: none;
  color: var(--color-text);
  font-size: .84rem;
  font-weight: 500;
  transition: border-color var(--transition), color var(--transition), transform var(--transition);
}

.flavor-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.flavor-chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 0 6px;
  height: 18px;
  border-radius: 9px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: .72rem;
  font-weight: 700;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pillar {
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.55);
  transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition);
}

.pillar:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.pillar-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.pillar h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -.01em;
}

.pillar p {
  margin: 0;
  font-size: .86rem;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.how-card {
  margin-bottom: 24px;
}

.how-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.how-steps li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.how-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.how-title {
  font-weight: 700;
  font-size: .94rem;
  margin-bottom: 4px;
}

.how-desc {
  font-size: .82rem;
  color: var(--color-text-muted);
  line-height: 1.55;
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
  .pillars-grid,
  .how-steps,
  .featured-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-copy {
    padding: 26px 22px;
  }

  .hero-copy h2 {
    font-size: 1.7rem;
    max-width: none;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-stats {
    gap: 18px;
  }

  .stack-item {
    align-items: flex-start;
  }

  .stack-item-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
