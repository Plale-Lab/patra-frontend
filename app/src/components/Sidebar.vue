<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="/img/logo.png" alt="Patra" class="sidebar-logo-img" />
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Overview</div>
      <RouterLink to="/" class="sidebar-link" :class="{ active: $route.path === '/' }">
        <IconLayoutDashboard :size="20" stroke-width="1.8" />
        <span>Dashboard</span>
      </RouterLink>

      <div class="sidebar-section-label">Explore</div>
      <RouterLink to="/modelcards" class="sidebar-link" :class="{ active: $route.path.startsWith('/modelcard') }">
        <IconSearch :size="20" stroke-width="1.8" />
        <span>Browse Model Cards</span>
      </RouterLink>
      <RouterLink to="/datasheets" class="sidebar-link" :class="{ active: $route.path.startsWith('/datasheet') }">
        <IconSearch :size="20" stroke-width="1.8" />
        <span>Browse Datasheets</span>
      </RouterLink>
      <RouterLink v-if="SUPPORTS_MCP_EXPLORER" to="/mcp-explorer" class="sidebar-link" :class="{ active: $route.path === '/mcp-explorer' }">
        <IconTerminal2 :size="20" stroke-width="1.8" />
        <span>MCP Explorer</span>
      </RouterLink>
      <RouterLink v-if="SUPPORTS_ASK_PATRA && (auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS)" to="/ask-patra" class="sidebar-link" :class="{ active: $route.path === '/ask-patra' }">
        <IconSparkles :size="20" stroke-width="1.8" />
        <span>Ask Patra</span>
      </RouterLink>

      <template v-if="SUPPORTS_DOMAIN_EXPERIMENTS">
        <div class="sidebar-section-label">Experiments</div>
        <RouterLink to="/animal-ecology" class="sidebar-link" :class="{ active: $route.path === '/animal-ecology' }">
          <IconPaw :size="20" stroke-width="1.8" />
          <span>Animal Ecology</span>
        </RouterLink>
        <RouterLink to="/digital-agriculture" class="sidebar-link" :class="{ active: $route.path === '/digital-agriculture' }">
          <IconPlant :size="20" stroke-width="1.8" />
          <span>Digital Agriculture</span>
        </RouterLink>
      </template>

      <template v-if="auth.isTapisUser || SUPPORTS_DEV_OPEN_ACCESS">
        <div class="sidebar-section-label">Contribute</div>
        <RouterLink v-if="SUPPORTS_AGENT_TOOLS" to="/agent-tools" class="sidebar-link" :class="{ active: $route.path === '/agent-tools' }">
          <IconSparkles :size="20" stroke-width="1.8" />
          <span>Agent Toolkit</span>
        </RouterLink>
        <RouterLink v-if="SUPPORTS_EDIT_RECORDS" to="/edit-records" class="sidebar-link" :class="{ active: $route.path === '/edit-records' }">
          <IconEdit :size="20" stroke-width="1.8" />
          <span>Edit Records</span>
        </RouterLink>
        <RouterLink to="/submit" class="sidebar-link" :class="{ active: $route.path === '/submit' }">
          <IconUpload :size="20" stroke-width="1.8" />
          <span>Submit Records</span>
        </RouterLink>
      </template>
    </nav>

    <div class="sidebar-footer" v-if="auth.isLoggedIn || auth.portalAuthUnavailable">
      <div class="sidebar-user" v-if="auth.isLoggedIn">
        <div class="sidebar-avatar">{{ auth.initials }}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ auth.displayName }}</div>
          <div class="sidebar-user-role">{{ auth.isPortalUser ? 'ICICLE/Tapis session' : (auth.isTapisUser ? 'Tapis User' : 'User') }}</div>
        </div>
        <span v-if="auth.isPortalUser" class="sidebar-portal-managed" title="Sign out from the parent ICICLE/Tapis portal">
          <IconShieldCheck :size="18" stroke-width="1.8" />
        </span>
        <button v-else class="sidebar-logout" @click="handleLogout" title="Sign out">
          <IconLogout :size="18" stroke-width="1.8" />
        </button>
      </div>

      <div v-else class="sidebar-portal-error" role="status">
        <IconAlertTriangle :size="18" stroke-width="1.8" />
        <div>
          <strong>Portal session unavailable</strong>
          <span>Refresh or sign in through the parent ICICLE/Tapis portal.</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  SUPPORTS_DOMAIN_EXPERIMENTS,
  SUPPORTS_ASK_PATRA,
  SUPPORTS_AGENT_TOOLS,
  SUPPORTS_EDIT_RECORDS,
  SUPPORTS_MCP_EXPLORER,
  SUPPORTS_DEV_OPEN_ACCESS,
} from '../config/api'
import {
  IconLayoutDashboard, IconSearch,
  IconUpload,
  IconLogout, IconEdit,
  IconAlertTriangle, IconSparkles,
  IconTerminal2, IconPaw, IconPlant, IconShieldCheck,
} from '@tabler/icons-vue'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: rgba(255, 253, 249, 0.94);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 24px 20px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-logo-img {
  width: 100%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.sidebar-section-label {
  font-size: 0.67rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 18px 12px 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 0.92rem;
  transition: all var(--transition);
  text-decoration: none;
  border: 1px solid transparent;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text);
  border-color: var(--color-border);
}

.sidebar-link.active {
  background: linear-gradient(180deg, #f4f7ff 0%, var(--color-primary-bg) 100%);
  color: var(--color-primary);
  font-weight: 600;
  border-color: rgba(var(--color-primary-rgb), 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.sidebar-footer {
  padding: 18px;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.4);
}

.sidebar-portal-error {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px;
  border: 1px solid rgba(180, 83, 9, 0.22);
  border-radius: 10px;
  color: #92400e;
  background: #fff7ed;
  font-size: 0.78rem;
  line-height: 1.35;
}

.sidebar-portal-error strong,
.sidebar-portal-error span {
  display: block;
}

.sidebar-portal-error span {
  margin-top: 2px;
  color: #9a5b22;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-user-info {
  flex: 1;
  min-width: 0;
}

.sidebar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(180deg, #f4f7ff 0%, var(--color-primary-bg) 100%);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(47, 78, 162, 0.12);
}

.sidebar-user-name {
  font-weight: 600;
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-role {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sidebar-logout {
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
}

.sidebar-portal-managed {
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  flex-shrink: 0;
}

.sidebar-logout:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

</style>
