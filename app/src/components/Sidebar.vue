<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="/img/logo.png" alt="Patra" class="sidebar-logo-img" />
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">OVERVIEW</div>
      <RouterLink to="/" class="sidebar-link" :class="{ active: $route.path === '/' }">
        <IconLayoutDashboard :size="20" stroke-width="1.8" />
        <span>Dashboard</span>
      </RouterLink>

      <div class="sidebar-section-label">EXPLORE</div>
      <RouterLink to="/explore-model-cards" class="sidebar-link" :class="{ active: $route.path.startsWith('/explore-model-cards') }">
        <IconSearch :size="20" stroke-width="1.8" />
        <span>Browse Model Cards</span>
      </RouterLink>
      <RouterLink to="/explore-datasheets" class="sidebar-link" :class="{ active: $route.path.startsWith('/explore-datasheets') }">
        <IconSearch :size="20" stroke-width="1.8" />
        <span>Browse Datasheets</span>
      </RouterLink>

      <div class="sidebar-section-label">CONTRIBUTE</div>
      <RouterLink v-if="apiMode.supportsAgentTools" to="/agent-tools" class="sidebar-link" :class="{ active: $route.path === '/agent-tools' }">
        <IconSparkles :size="20" stroke-width="1.8" />
        <span>Agent Toolkit</span>
      </RouterLink>
      <RouterLink v-if="apiMode.supportsEditRecords" to="/edit-records" class="sidebar-link" :class="{ active: $route.path === '/edit-records' }">
        <IconEdit :size="20" stroke-width="1.8" />
        <span>Edit Records</span>
      </RouterLink>
      <RouterLink to="/submit" class="sidebar-link" :class="{ active: $route.path === '/submit' }">
        <IconUpload :size="20" stroke-width="1.8" />
        <span>Submit Records</span>
      </RouterLink>
      <RouterLink v-if="apiMode.supportsTickets" to="/tickets" class="sidebar-link" :class="{ active: $route.path === '/tickets' }">
        <IconMessageCircle :size="20" stroke-width="1.8" />
        <span>Tickets</span>
      </RouterLink>

      <template v-if="auth.isAdmin">
        <div class="sidebar-section-label">ADMIN</div>
        <RouterLink to="/models" class="sidebar-link" :class="{ active: $route.path === '/models' }">
          <IconCube :size="20" stroke-width="1.8" />
          <span>Models & Data</span>
        </RouterLink>
        <RouterLink v-if="apiMode.supportsSubmissionQueue" to="/submissions" class="sidebar-link" :class="{ active: $route.path === '/submissions' }">
          <IconClipboardCheck :size="20" stroke-width="1.8" />
          <span>Review Submissions</span>
        </RouterLink>
        <RouterLink v-if="apiMode.supportsTickets" to="/ticket-management" class="sidebar-link" :class="{ active: $route.path === '/ticket-management' }">
          <IconListDetails :size="20" stroke-width="1.8" />
          <span>Manage Tickets</span>
        </RouterLink>

        <div class="sidebar-section-label">SYSTEM</div>
        <RouterLink to="/audit-log" class="sidebar-link" :class="{ active: $route.path === '/audit-log' }">
          <IconFileText :size="20" stroke-width="1.8" />
          <span>Audit Log</span>
        </RouterLink>
        <RouterLink to="/settings" class="sidebar-link" :class="{ active: $route.path === '/settings' }">
          <IconSettings :size="20" stroke-width="1.8" />
          <span>Settings</span>
        </RouterLink>
      </template>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user" v-if="auth.isLoggedIn">
        <div class="sidebar-avatar">{{ auth.initials }}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ auth.displayName }}</div>
          <div class="sidebar-user-role">{{ auth.isAdmin ? 'Admin' : (auth.isTapisUser ? 'Tapis User' : 'User') }}</div>
        </div>
        <button class="sidebar-logout" @click="handleLogout" title="Sign out">
          <IconLogout :size="18" stroke-width="1.8" />
        </button>
      </div>

      <button class="sidebar-login-btn" v-else @click="showLogin = true">
        <IconLogin :size="18" stroke-width="1.8" />
        <span>Tapis Login</span>
      </button>
    </div>

    <Teleport to="body">
      <div class="modal-overlay" v-if="showLogin" @click.self="showLogin = false">
        <div class="login-modal">
          <div class="login-modal-header">
            <div class="login-modal-brand">
              <IconKey :size="20" stroke-width="2" />
              <span>Tapis Login</span>
            </div>
            <button class="btn-icon" @click="closeLogin"><IconX :size="18" /></button>
          </div>

          <div class="login-modal-body">
            <p class="login-desc">
              Authenticate via <a href="https://tapis.readthedocs.io" target="_blank">Tapis</a> to
              access private models and workspace features.
            </p>

            <div class="login-error" v-if="auth.error">
              <IconAlertTriangle :size="14" stroke-width="1.8" />
              {{ auth.error }}
            </div>

            <div class="form-group">
              <label class="form-label">Username</label>
              <div class="login-input-wrap">
                <IconUser :size="16" stroke-width="1.8" />
                <input class="login-input" v-model="loginForm.username" placeholder="tapis username" @keydown.enter="handleLogin" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="login-input-wrap">
                <IconLock :size="16" stroke-width="1.8" />
                <input class="login-input" type="password" v-model="loginForm.password" placeholder="••••••••" @keydown.enter="handleLogin" />
              </div>
            </div>

            <button class="btn-login" @click="handleLogin" :disabled="!loginForm.username || !loginForm.password || auth.loading">
              {{ auth.loading ? 'Authenticating…' : 'Get JWT Token' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconLayoutDashboard, IconCube, IconFileText, IconSettings, IconSearch,
  IconUpload, IconMessageCircle, IconClipboardCheck,
  IconListDetails, IconLogout, IconLogin, IconKey, IconSparkles, IconEdit,
  IconUser, IconLock, IconX, IconAlertTriangle,
} from '@tabler/icons-vue'

const auth = useAuthStore()
const apiMode = useApiModeStore()
const router = useRouter()
const showLogin = ref(false)
const loginForm = reactive({ username: '', password: '' })

function closeLogin() {
  showLogin.value = false
  loginForm.username = ''
  loginForm.password = ''
  auth.clearError()
}

async function handleLogin() {
  const ok = await auth.loginTapis(loginForm.username, loginForm.password)
  if (ok) closeLogin()
}

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.sidebar-brand {
  display: flex; align-items: center; justify-content: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-logo-img {
  width: 100%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
}

.sidebar-nav { flex: 1; padding: 12px 12px; overflow-y: auto; }

.sidebar-section-label {
  font-size: .68rem; font-weight: 600;
  color: var(--color-text-muted); text-transform: uppercase;
  letter-spacing: .8px; padding: 16px 12px 6px;
}

.sidebar-link {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  color: var(--color-text-secondary); font-weight: 500; font-size: .92rem;
  transition: all var(--transition); text-decoration: none;
}
.sidebar-link:hover { background: var(--color-bg); color: var(--color-text); }
.sidebar-link.active { background: var(--color-primary-bg); color: var(--color-primary); }

.sidebar-footer { padding: 16px 18px; border-top: 1px solid var(--color-border); }

.sidebar-user { display: flex; align-items: center; gap: 10px; }
.sidebar-user-info { flex: 1; min-width: 0; }
.sidebar-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-primary-bg); color: var(--color-primary);
  font-weight: 700; font-size: .82rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sidebar-user-name { font-weight: 600; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-role { font-size: .75rem; color: var(--color-text-muted); }

.sidebar-logout {
  border: none; background: none; color: var(--color-text-muted);
  cursor: pointer; padding: 6px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition); flex-shrink: 0;
}
.sidebar-logout:hover { color: var(--color-danger); background: var(--color-danger-bg); }

.sidebar-login-btn {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  border: 1.5px dashed var(--color-border); border-radius: 10px;
  background: transparent; color: var(--color-text-secondary);
  font-size: .88rem; font-weight: 500;
  cursor: pointer; transition: all var(--transition);
}
.sidebar-login-btn:hover {
  border-color: var(--color-primary); color: var(--color-primary);
  background: var(--color-primary-bg);
}

.login-modal {
  width: 100%; max-width: 400px;
  background: #fff; border-radius: 16px;
  box-shadow: 0 8px 50px rgba(90, 80, 130, .18);
  overflow: hidden;
}
.login-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid var(--color-border);
}
.login-modal-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: .95rem; color: var(--color-primary); }

.login-modal-body { padding: 22px; }
.login-desc { font-size: .82rem; color: var(--color-text-muted); line-height: 1.5; margin-bottom: 16px; }
.login-desc a { color: var(--color-primary); text-decoration: underline; }

.login-error {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--color-danger-bg); color: var(--color-danger);
  font-size: .8rem; margin-bottom: 14px;
}

.login-input-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px; border: 1.5px solid var(--color-border);
  border-radius: 8px; color: var(--color-text-muted);
  transition: border-color .15s;
}
.login-input-wrap:focus-within { border-color: var(--color-primary); color: var(--color-primary); }
.login-input {
  flex: 1; border: none; outline: none;
  padding: 10px 0; font-size: .88rem;
  background: transparent; color: var(--color-text);
}
.login-input::placeholder { color: #c0bcd0; }

.btn-login {
  width: 100%; padding: 11px; margin-top: 16px;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: 10px;
  font-size: .92rem; font-weight: 700; cursor: pointer;
  transition: all .15s;
}
.btn-login:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
.btn-login:disabled { opacity: .5; cursor: not-allowed; }

</style>
