<template>
  <header class="header-bar">
    <RouterLink to="/" class="catalog-identity" aria-label="AI Resource Catalog home">
      <span class="identity-mark"><IconBooks :size="21" stroke-width="1.7" /></span>
      <span><strong>AI Resource Catalog</strong><small>ICICLE ecosystem</small></span>
    </RouterLink>

    <form class="header-search" role="search" @submit.prevent="submitSearch">
      <IconSearch :size="17" aria-hidden="true" />
      <label class="sr-only" for="header-catalog-search">Search the public catalog</label>
      <input id="header-catalog-search" v-model="searchQuery" type="search" placeholder="Search public resources" />
    </form>

    <div ref="profileRoot" class="profile-wrap">
      <button v-if="auth.isLoggedIn" class="identity-button" type="button" :aria-expanded="menuOpen" aria-haspopup="menu" @click="menuOpen = !menuOpen">
        <span class="identity-avatar">{{ auth.initials }}</span>
        <span class="identity-name">{{ auth.displayName }}</span>
        <IconChevronDown :size="15" aria-hidden="true" />
      </button>
      <button v-else-if="auth.portalAuthUnavailable" class="identity-button portal-unavailable" type="button" title="Refresh or sign in through the parent ICICLE/Tapis portal">
        <IconAlertTriangle :size="17" /> <span>Portal unavailable</span>
      </button>
      <button v-else class="signin-button" type="button" @click="openLogin"><IconLogin :size="17" /> <span>Sign in</span></button>

      <transition name="menu">
        <div v-if="auth.isLoggedIn && menuOpen" class="profile-menu" role="menu">
          <div class="profile-summary"><strong>{{ auth.displayName }}</strong><span>{{ auth.isPortalUser ? 'Portal-managed Tapis session' : 'Tapis account' }}</span></div>
          <RouterLink to="/my-collections" role="menuitem" @click="menuOpen = false"><IconFolders :size="17" /> My Collections</RouterLink>
          <RouterLink to="/my-submissions" role="menuitem" @click="menuOpen = false"><IconSend :size="17" /> My Submissions</RouterLink>
          <RouterLink to="/notifications" role="menuitem" @click="menuOpen = false"><IconBell :size="17" /> Notifications</RouterLink>
          <RouterLink to="/account" role="menuitem" @click="menuOpen = false"><IconUserCircle :size="17" /> Account / Profile</RouterLink>
          <template v-if="hasContributorTools">
            <div class="menu-divider"></div>
            <span class="menu-label">Contributor tools</span>
            <RouterLink to="/submit" role="menuitem" @click="menuOpen = false"><IconUpload :size="17" /> Submit Records</RouterLink>
            <RouterLink v-if="SUPPORTS_EDIT_RECORDS" to="/edit-records" role="menuitem" @click="menuOpen = false"><IconEdit :size="17" /> Edit Records</RouterLink>
            <RouterLink v-if="SUPPORTS_AGENT_TOOLS" to="/agent-tools" role="menuitem" @click="menuOpen = false"><IconSparkles :size="17" /> Agent Toolkit</RouterLink>
          </template>
          <div class="menu-divider"></div>
          <div v-if="auth.isPortalUser" class="portal-session-note"><IconShieldCheck :size="17" /><span>Sign out from the parent ICICLE portal.</span></div>
          <button v-else type="button" role="menuitem" class="logout-button" @click="handleLogout"><IconLogout :size="17" /> Log out</button>
        </div>
      </transition>
    </div>

    <Teleport to="body">
      <div v-if="showLogin" class="modal-overlay" @click.self="closeLogin">
        <div class="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <div class="login-modal-header">
            <div class="login-modal-brand"><IconKey :size="20" /><span id="login-title">Tapis Login</span></div>
            <button class="btn-icon" type="button" aria-label="Close" @click="closeLogin"><IconX :size="18" /></button>
          </div>
          <div class="login-modal-body">
            <p class="login-desc">Sign in to reach private resources and personal tools. Public catalog browsing does not require an account.</p>
            <div v-if="auth.error" class="login-error"><IconAlertTriangle :size="14" />{{ auth.error }}</div>
            <label class="form-label" for="login-username">Username</label>
            <div class="login-input-wrap"><IconUser :size="16" /><input id="login-username" v-model="loginForm.username" class="login-input" autocomplete="username" @keydown.enter="handleLogin" /></div>
            <label class="form-label password-label" for="login-password">Password</label>
            <div class="login-input-wrap"><IconLock :size="16" /><input id="login-password" v-model="loginForm.password" class="login-input" type="password" autocomplete="current-password" @keydown.enter="handleLogin" /></div>
            <label class="remember-row"><input v-model="loginForm.rememberMe" type="checkbox" /><span>Remember me for 7 days</span></label>
            <button class="btn-login" type="button" :disabled="!loginForm.username || !loginForm.password || auth.loading" @click="handleLogin">{{ auth.loading ? 'Authenticating…' : 'Sign in' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  IconAlertTriangle, IconBell, IconBooks, IconChevronDown, IconEdit, IconFolders,
  IconKey, IconLock, IconLogin, IconLogout, IconSearch, IconSend, IconShieldCheck,
  IconSparkles, IconUpload, IconUser, IconUserCircle, IconX,
} from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'
import { SUPPORTS_AGENT_TOOLS, SUPPORTS_EDIT_RECORDS } from '../config/api'
import { logUiEvent } from '../lib/uiLogger'

const auth = useAuthStore()
const router = useRouter()
const profileRoot = ref(null)
const menuOpen = ref(false)
const showLogin = ref(false)
const searchQuery = ref('')
const loginForm = reactive({ username: '', password: '', rememberMe: true })
const hasContributorTools = computed(() => auth.isTapisUser)

function submitSearch() {
  const query = searchQuery.value.trim()
  logUiEvent('catalog-search-submit', { source: 'header', queryLength: query.length })
  router.push({ name: 'CatalogSearch', query: query ? { q: query } : {} })
}
function openLogin() { showLogin.value = true; logUiEvent('login-dialog-open', { source: 'header' }) }
function closeLogin() { showLogin.value = false; loginForm.username = ''; loginForm.password = ''; loginForm.rememberMe = true; auth.clearError() }
async function handleLogin() { const ok = await auth.loginTapis(loginForm.username, loginForm.password, { rememberMe: loginForm.rememberMe }); if (ok) closeLogin() }
function handleLogout() { menuOpen.value = false; auth.logout(); router.push('/') }
function handleDocumentClick(event) { if (profileRoot.value && !profileRoot.value.contains(event.target)) menuOpen.value = false }
function handleKeydown(event) { if (event.key === 'Escape') { menuOpen.value = false; if (showLogin.value) closeLogin() } }
onMounted(() => { document.addEventListener('click', handleDocumentClick); document.addEventListener('keydown', handleKeydown) })
onBeforeUnmount(() => { document.removeEventListener('click', handleDocumentClick); document.removeEventListener('keydown', handleKeydown) })
</script>

<style scoped>
.header-bar { min-height: var(--header-height); display: grid; grid-template-columns: minmax(210px,auto) minmax(240px,620px) minmax(150px,auto); align-items: center; justify-content: space-between; gap: 24px; padding: 10px 32px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid var(--color-border); background: rgba(255,253,249,.92); backdrop-filter: blur(16px); }
.catalog-identity { min-width: 0; display: flex; align-items: center; gap: 10px; }
.identity-mark { width: 37px; height: 37px; display: grid; place-items: center; border-radius: 10px; color: var(--color-primary); background: var(--color-primary-bg); }
.catalog-identity strong,.catalog-identity small { display: block; }
.catalog-identity strong { font-size: .88rem; }
.catalog-identity small { color: var(--color-text-muted); font-size: .68rem; }
.header-search { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 13px; border: 1px solid var(--color-border); border-radius: 10px; color: var(--color-text-muted); background: rgba(255,255,255,.72); }
.header-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),.08); }
.header-search input { width: 100%; min-width: 0; border: 0; outline: 0; color: var(--color-text); background: transparent; }
.profile-wrap { position: relative; justify-self: end; }
.identity-button,.signin-button { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border: 1px solid transparent; border-radius: 10px; color: var(--color-text-secondary); background: transparent; font-weight: 600; }
.identity-button:hover,.signin-button:hover { border-color: var(--color-border); color: var(--color-primary); background: #fff; }
.identity-avatar { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: var(--color-primary); font-size: .72rem; }
.portal-unavailable { color: #92400e; font-size: .76rem; }
.profile-menu { position: absolute; top: calc(100% + 10px); right: 0; width: 248px; padding: 8px; border: 1px solid var(--color-border); border-radius: 13px; background: #fff; box-shadow: var(--shadow-md); }
.profile-summary { padding: 10px 11px 12px; }
.profile-summary strong,.profile-summary span { display: block; }
.profile-summary span { margin-top: 2px; color: var(--color-text-muted); font-size: .7rem; }
.profile-menu a,.profile-menu button,.portal-session-note { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 10px; border: 0; border-radius: 8px; color: var(--color-text-secondary); background: transparent; text-align: left; font-size: .82rem; }
.profile-menu a:hover,.profile-menu button:hover { color: var(--color-primary); background: var(--color-primary-bg); }
.menu-divider { height: 1px; margin: 7px 4px; background: var(--color-border); }
.menu-label { display: block; padding: 6px 10px 4px; color: var(--color-text-muted); font-size: .63rem; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.portal-session-note { align-items: flex-start; color: var(--color-text-muted); font-size: .72rem; line-height: 1.4; }
.logout-button { color: var(--color-danger)!important; }
.menu-enter-active,.menu-leave-active { transition: opacity var(--transition),transform var(--transition); transform-origin: top right; }
.menu-enter-from,.menu-leave-to { opacity: 0; transform: translateY(-5px) scale(.98); }
.login-modal { width: min(400px,calc(100vw - 32px)); overflow: hidden; border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(23,31,48,.2); }
.login-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--color-border); }
.login-modal-brand { display: flex; align-items: center; gap: 8px; color: var(--color-primary); font-weight: 700; }
.login-modal-body { padding: 22px; }
.login-desc { margin-bottom: 18px; color: var(--color-text-muted); font-size: .8rem; line-height: 1.55; }
.login-error { display: flex; gap: 7px; margin-bottom: 14px; padding: 9px 11px; border-radius: 8px; color: var(--color-danger); background: var(--color-danger-bg); font-size: .78rem; }
.password-label { margin-top: 14px; }
.login-input-wrap { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text-muted); }
.login-input-wrap:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),.08); }
.login-input { width: 100%; padding: 10px 0; border: 0; outline: 0; background: transparent; }
.remember-row { display: flex; align-items: center; gap: 9px; margin-top: 13px; color: var(--color-text-secondary); font-size: .8rem; }
.btn-login { width: 100%; margin-top: 16px; padding: 11px; border: 0; border-radius: 9px; color: #fff; background: var(--color-primary); font-weight: 700; }
.btn-login:disabled { opacity: .5; cursor: not-allowed; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 980px) { .header-bar { grid-template-columns: 1fr auto; } .header-search { grid-column: 1/-1; grid-row: 2; } }
@media (max-width: 640px) { .header-bar { padding: 9px 14px; gap: 9px; } .identity-name,.catalog-identity small { display: none; } }
</style>
