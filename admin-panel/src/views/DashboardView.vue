<template>
  <div>
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Overview of your Patra Knowledge Base</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
          <IconCube :size="24" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ modelsStore.models.length }}</div>
          <div class="stat-label">Total Models</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-success-bg); color: var(--color-success);">
          <IconEye :size="24" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ modelsStore.publicModels.length }}</div>
          <div class="stat-label">Public Models</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-info-bg); color: var(--color-info);">
          <IconTable :size="24" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ modelsStore.datasheets.length }}</div>
          <div class="stat-label">Datasheets</div>
        </div>
      </div>

      <div class="stat-card" v-if="auth.isLoggedIn">
        <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
          <IconLock :size="24" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ privateCount }}</div>
          <div class="stat-label">Private Models</div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <span>Recent Activity</span>
          <RouterLink v-if="auth.isAdmin" to="/audit-log" class="btn btn-sm btn-outline">View All</RouterLink>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="activity-list">
            <div class="activity-item" v-for="event in recentEvents" :key="event.id">
              <div class="activity-dot" :class="'dot-' + event.action"></div>
              <div class="activity-content">
                <div class="activity-text">
                  <strong>{{ event.user }}</strong> {{ event.detail }}
                </div>
                <div class="activity-time">{{ formatTime(event.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Browse -->
      <div class="card">
        <div class="card-header">
          <span>Quick Browse</span>
        </div>
        <div class="card-body">
          <div class="quick-links">
            <RouterLink to="/explore" class="quick-link">
              <div class="quick-link-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
                <IconSearch :size="22" stroke-width="1.8" />
              </div>
              <div>
<<<<<<< Updated upstream
                <div class="quick-link-title">Explore Models</div>
=======
                <div class="quick-link-title">Explore Model Cards</div>
>>>>>>> Stashed changes
                <div class="quick-link-desc">Browse & search all models</div>
              </div>
              <IconChevronRight :size="18" class="quick-link-arrow" />
            </RouterLink>
            <RouterLink to="/submit" class="quick-link">
              <div class="quick-link-icon" style="background: var(--color-success-bg); color: var(--color-success);">
                <IconUpload :size="22" stroke-width="1.8" />
              </div>
              <div>
                <div class="quick-link-title">Submit Content</div>
                <div class="quick-link-desc">Add a model card or datasheet</div>
              </div>
              <IconChevronRight :size="18" class="quick-link-arrow" />
            </RouterLink>
            <RouterLink to="/tickets" class="quick-link">
              <div class="quick-link-icon" style="background: var(--color-info-bg); color: var(--color-info);">
                <IconMessageCircle :size="22" stroke-width="1.8" />
              </div>
              <div>
                <div class="quick-link-title">Support Tickets</div>
                <div class="quick-link-desc">Request help or report issues</div>
              </div>
              <IconChevronRight :size="18" class="quick-link-arrow" />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useModelsStore } from '../stores/models'
import { useAuditLogStore } from '../stores/auditLog'
import { useAuthStore } from '../stores/auth'
import {
  IconCube, IconEye, IconTable, IconLock,
  IconSearch, IconUpload, IconMessageCircle, IconChevronRight,
} from '@tabler/icons-vue'

const modelsStore = useModelsStore()
const auditStore = useAuditLogStore()
const auth = useAuthStore()

const recentEvents = computed(() => auditStore.events.slice(0, 6))
const privateCount = computed(() => modelsStore.models.filter(m => m.is_private).length)

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.quick-links { display: flex; flex-direction: column; gap: 4px; }
.quick-link {
  display: flex; align-items: center; gap: 14px;
  padding: 12px; border-radius: var(--radius-sm);
  transition: background var(--transition); text-decoration: none;
}
.quick-link:hover { background: var(--color-bg); }
.quick-link-icon {
  width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.quick-link-title { font-weight: 600; font-size: .92rem; }
.quick-link-desc { font-size: .78rem; color: var(--color-text-muted); margin-top: 1px; }
.quick-link-arrow { margin-left: auto; color: var(--color-text-muted); }

.activity-list { display: flex; flex-direction: column; }
.activity-item {
  display: flex; gap: 12px; padding: 14px 22px;
  border-bottom: 1px solid var(--color-border); align-items: flex-start;
}
.activity-item:last-child { border-bottom: none; }
.activity-dot {
  width: 8px; height: 8px; border-radius: 50%;
  margin-top: 6px; flex-shrink: 0;
}
.dot-create { background: var(--color-success); }
.dot-update { background: var(--color-info); }
.dot-delete { background: var(--color-danger); }
.dot-system { background: var(--color-accent); }
.activity-text { font-size: .88rem; line-height: 1.4; }
.activity-text strong { font-weight: 600; }
.activity-time { font-size: .75rem; color: var(--color-text-muted); margin-top: 3px; }
</style>
