<template>
  <header class="header-bar">
    <RouterLink to="/" class="catalog-identity" aria-label="AI Resource Catalog home">
      <span class="identity-mark"><IconBooks :size="22" stroke-width="1.7" /></span>
      <span><strong>AI Resource Catalog</strong><small>ICICLE ecosystem</small></span>
    </RouterLink>

    <form class="header-search" role="search" @submit.prevent="submitSearch">
      <IconSearch :size="18" aria-hidden="true" />
      <label class="sr-only" for="header-catalog-search">Search the public catalog</label>
      <input id="header-catalog-search" v-model="searchQuery" type="search" placeholder="Search public resources" />
    </form>

    <div ref="profileRoot" class="profile-wrap">
      <button
        v-if="auth.isLoggedIn"
        class="identity-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="identity-avatar">{{ auth.initials }}</span>
        <span class="identity-name">{{ auth.displayName }}</span>
        <IconChevronDown :size="16" aria-hidden="true" />
      </button>

      <button
        v-else-if="auth.portalAuthUnavailable"
        class="identity-button portal-unavailable"
        type="button"
        title="Refresh or sign in through the parent ICICLE/Tapis portal"
      >
        <IconAlertTriangle :size="18" aria-hidden="true" />
        <span>Portal session unavailable</span>
      </button>

      <button v-else class="signin-button" type="button" @click="showLogin = true">
        <IconLogin :size="18" aria-hidden="true" />
        <span>Sign in</span>
      </button>

      <transition name="menu">
        <div v-if="auth.isLoggedIn && menuOpen" class="profile-menu" role="menu">
          <div class="profile-summary">
            <strong>{{ auth.displayName }}</strong>
            <span>{{ auth.isPortalUser ? 'Portal-managed Tapis session' : 'Tapis account' }}</span>
          </div>
          <RouterLink to="/my-collections" role="menuitem" @click="menuOpen = false">
            <IconFolders :size="18" aria-hidden="true" /> My Collections
          </RouterLink>
          <RouterLink to="/my-submissions" role="menuitem" @click="menuOpen = false">
            <IconSend :size="18" aria-hidden="true" /> My Submissions
          </RouterLink>
          <RouterLink to="/drafts" role="menuitem" @click="menuOpen = false">
            <IconFilePencil :size="18" aria-hidden="true" /> Drafts
          </RouterLink>
          <RouterLink to="/notifications" role="menuitem" @click="menuOpen = false">
            <IconBell :size="18" aria-hidden="true" /> Notifications
          </RouterLink>
          <RouterLink to="/account" role="menuitem" @click="menuOpen = false">
            <IconUserCircle :size="18" aria-hidden="true" /> Account / Profile
          </RouterLink>
          <template v-if="hasContributorTools">
            <div class="menu-divider"></div>
            <div class="menu-label">Contributor tools</div>
            <RouterLink to="/submit" role="menuitem" @click="menuOpen = false">
              <IconUpload :size="18" aria-hidden="true" /> Submit Records
            </RouterLink>
            <RouterLink v-if="SUPPORTS_EDIT_RECORDS" to="/edit-records" role="menuitem" @click="menuOpen = false">
              <IconEdit :size="18" aria-hidden="true" /> Edit Records
            </RouterLink>
            <RouterLink v-if="SUPPORTS_AGENT_TOOLS" to="/agent-tools" role="menuitem" @click="menuOpen = false">
              <IconSparkles :size="18" aria-hidden="true" /> Agent Toolkit
            </RouterLink>
          </template>
          <div class="menu-divider"></div>
          <div v-if="auth.isPortalUser" class="portal-session-note">
            <IconShieldCheck :size="18" aria-hidden="true" />
            <span>Sign out from the parent ICICLE portal.</span>
          </div>
          <button v-else type="button" role="menuitem" class="logout-button" @click="handleLogout">
            <IconLogout :size="18" aria-hidden="true" /> Log out
          </button>
        </div>
      </transition>
    </div>

    <Teleport to="body">
      <div v-if="showLogin" class="modal-overlay" @click.self="closeLogin">
        <div class="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <div class="login-modal-header">
            <div class="login-modal-brand">
              <IconKey :size="20" stroke-width="2" />
              <span id="login-title">Tapis Login</span>
            </div>
            <button class="btn-icon" type="button" aria-label="Close" @click="closeLogin"><IconX :size="18" /></button>
          </div>

          <div class="login-modal-body">
            <p class="login-desc">Sign in to reach private resources and personal tools. Public catalog browsing does not require an account.</p>
            <div v-if="auth.error" class="login-error">
              <IconAlertTriangle :size="14" aria-hidden="true" />
              {{ auth.error }}
            </div>
            <label class="form-label" for="login-username">Username</label>
            <div class="login-input-wrap">
              <IconUser :size="16" aria-hidden="true" />
              <input id="login-username" v-model="loginForm.username" class="login-input" autocomplete="username" @keydown.enter="handleLogin" />
            </div>
            <label class="form-label password-label" for="login-password">Password</label>
            <div class="login-input-wrap">
              <IconLock :size="16" aria-hidden="true" />
              <input id="login-password" v-model="loginForm.password" class="login-input" type="password" autocomplete="current-password" @keydown.enter="handleLogin" />
            </div>
            <label class="remember-row">
              <input v-model="loginForm.rememberMe" type="checkbox" />
              <span>Remember me for 7 days</span>
            </label>
            <button class="btn-login" type="button" :disabled="!loginForm.username || !loginForm.password || auth.loading" @click="handleLogin">
              {{ auth.loading ? 'Authenticating…' : 'Sign in' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  IconAlertTriangle,
  IconBell,
  IconBooks,
  IconChevronDown,
  IconEdit,
  IconFilePencil,
  IconFolders,
  IconKey,
  IconLock,
  IconLogin,
  IconLogout,
  IconSearch,
  IconSend,
  IconShieldCheck,
  IconSparkles,
  IconUpload,
  IconUser,
  IconUserCircle,
  IconX,
} from '@tabler/icons-vue'
import { SUPPORTS_AGENT_TOOLS, SUPPORTS_EDIT_RECORDS } from '../config/api'

const auth = useAuthStore()
const router = useRouter()
const profileRoot = ref(null)
const menuOpen = ref(false)
const showLogin = ref(false)
const searchQuery = ref('')
const loginForm = reactive({ username: '', password: '', rememberMe: true })
const hasContributorTools = computed(() => {
  const user = auth.effectiveUser
  const role = String(user?.role || '').toLowerCase()
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map((item) => String(item).toLowerCase()) : []
  return auth.isTapisUser && (
    ['admin', 'contributor', 'editor'].includes(role) ||
    permissions.some((permission) => ['catalog:submit', 'catalog:edit', 'catalog:admin'].includes(permission))
  )
})

function submitSearch() {
  const query = searchQuery.value.trim()
  router.push({ name: 'CatalogSearch', query: query ? { q: query } : {} })
}

function closeLogin() {
  showLogin.value = false
  loginForm.username = ''
  loginForm.password = ''
  loginForm.rememberMe = true
  auth.clearError()
}

async function handleLogin() {
  const ok = await auth.loginTapis(loginForm.username, loginForm.password, { rememberMe: loginForm.rememberMe })
  if (ok) closeLogin()
}

function handleLogout() {
  menuOpen.value = false
  auth.logout()
  router.push('/')
}

function handleDocumentClick(event) {
  if (profileRoot.value && !profileRoot.value.contains(event.target)) menuOpen.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    menuOpen.value = false
    if (showLogin.value) closeLogin()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.header-bar { min-height: var(--header-height); display: grid; grid-template-columns: minmax(210px, auto) minmax(240px, 620px) minmax(170px, auto); align-items: center; justify-content: space-between; gap: 24px; padding: 12px 32px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid var(--color-border); background: rgba(255, 253, 249, .9); backdrop-filter: blur(16px); }
.catalog-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.identity-mark { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; background: var(--color-primary-bg); color: var(--color-primary); }
.catalog-identity strong, .catalog-identity small { display: block; }
.catalog-identity strong { font-size: .9rem; }
.catalog-identity small { color: var(--color-text-muted); font-size: .7rem; }
.header-search { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 13px; border: 1px solid var(--color-border); border-radius: 11px; background: rgba(255, 255, 255, .72); color: var(--color-text-muted); }
.header-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), .08); }
.header-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-text); }
.profile-wrap { position: relative; justify-self: end; }
.identity-button, .signin-button { display: flex; align-items: center; gap: 9px; border: 1px solid transparent; border-radius: 12px; padding: 7px 9px; background: transparent; color: var(--color-text-secondary); font-weight: 600; }
.identity-button:hover, .signin-button:hover { border-color: var(--color-border); background: #fff; color: var(--color-primary); }
.identity-avatar { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: .75rem; }
.portal-unavailable { color: #92400e; font-size: .78rem; }
.profile-menu { position: absolute; top: calc(100% + 10px); right: 0; width: 250px; padding: 8px; border: 1px solid var(--color-border); border-radius: 14px; background: #fff; box-shadow: var(--shadow-md); }
.profile-summary { padding: 10px 11px 12px; }
.profile-summary strong, .profile-summary span { display: block; }
.profile-summary span { margin-top: 2px; color: var(--color-text-muted); font-size: .72rem; }
.profile-menu a, .profile-menu button, .portal-session-note { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 11px; border: 0; border-radius: 9px; background: transparent; color: var(--color-text-secondary); text-align: left; font-size: .84rem; }
.profile-menu a:hover, .profile-menu button:hover { background: var(--color-primary-bg); color: var(--color-primary); }
.menu-divider { height: 1px; margin: 7px 4px; background: var(--color-border); }
.menu-label { padding: 7px 11px 4px; color: var(--color-text-muted); font-size: .66rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.portal-session-note { align-items: flex-start; color: var(--color-text-muted); font-size: .75rem; line-height: 1.4; }
.logout-button { color: var(--color-danger) !important; }
.menu-enter-active, .menu-leave-active { transition: opacity var(--transition), transform var(--transition); transform-origin: top right; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-6px) scale(.98); }
.login-modal { width: min(400px, calc(100vw - 32px)); overflow: hidden; border-radius: 18px; background: #fff; box-shadow: 0 24px 70px rgba(23, 31, 48, .2); }
.login-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--color-border); }
.login-modal-brand { display: flex; align-items: center; gap: 8px; color: var(--color-primary); font-weight: 700; }
.login-modal-body { padding: 22px; }
.login-desc { margin-bottom: 18px; color: var(--color-text-muted); font-size: .82rem; line-height: 1.55; }
.login-error { display: flex; gap: 7px; margin-bottom: 14px; padding: 9px 11px; border-radius: 8px; background: var(--color-danger-bg); color: var(--color-danger); font-size: .8rem; }
.password-label { margin-top: 14px; }
.login-input-wrap { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1.5px solid var(--color-border); border-radius: 9px; color: var(--color-text-muted); }
.login-input-wrap:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), .08); }
.login-input { width: 100%; border: 0; outline: 0; padding: 10px 0; background: transparent; }
.remember-row { display: flex; align-items: center; gap: 9px; margin-top: 13px; color: var(--color-text-secondary); font-size: .82rem; }
.btn-login { width: 100%; margin-top: 16px; padding: 11px; border: 0; border-radius: 10px; background: var(--color-primary); color: #fff; font-weight: 700; }
.btn-login:disabled { opacity: .5; cursor: not-allowed; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 980px) {
  .header-bar { grid-template-columns: 1fr auto; }
  .header-search { grid-column: 1 / -1; grid-row: 2; }
}
@media (max-width: 640px) {
  .header-bar { padding: 10px 16px; gap: 10px; }
  .identity-name, .catalog-identity small { display: none; }
}
</style>
