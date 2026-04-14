import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ADMIN_USERNAMES, SUPPORTS_DEV_OPEN_ACCESS } from '../config/api'

// Tapis base URL for JWT authentication
const TAPIS_BASE_URL = 'https://tacc.tapis.io'
const TAPIS_TOKEN_URL = `${TAPIS_BASE_URL}/v3/oauth2/tokens`
const LOCAL_USER_KEY = 'patra_user'
const LOCAL_TOKEN_KEY = 'patra_token'
const LOCAL_EXPIRY_KEY = 'patra_auth_expires_at'
const SESSION_USER_KEY = 'patra_session_user'
const SESSION_TOKEN_KEY = 'patra_session_token'
const AUTH_SCHEMA_VERSION_KEY = 'patra_auth_schema_version'
const AUTH_SCHEMA_VERSION = '2'
const REMEMBER_ME_MS = 7 * 24 * 60 * 60 * 1000

function loadPersistedAuth() {
    migratePersistedAuth()
    const expiresAt = Number(localStorage.getItem(LOCAL_EXPIRY_KEY) || 0)
    if (expiresAt && Date.now() < expiresAt) {
        const localToken = localStorage.getItem(LOCAL_TOKEN_KEY) || ''
        if (isJwtExpired(localToken)) {
            clearLocalAuth()
        } else {
            return {
                user: normalizePersistedUser(parseJson(localStorage.getItem(LOCAL_USER_KEY))),
                token: localToken,
            }
        }
    }

    if (expiresAt) {
        clearLocalAuth()
    }

    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || ''
    if (isJwtExpired(sessionToken)) {
        clearSessionAuth()
        return {
            user: null,
            token: '',
        }
    }

    return {
        user: normalizePersistedUser(parseJson(sessionStorage.getItem(SESSION_USER_KEY))),
        token: sessionToken,
    }
}

function parseJson(value) {
    try {
        return JSON.parse(value || 'null')
    } catch {
        return null
    }
}

function clearLocalAuth() {
    localStorage.removeItem(LOCAL_USER_KEY)
    localStorage.removeItem(LOCAL_TOKEN_KEY)
    localStorage.removeItem(LOCAL_EXPIRY_KEY)
}

function clearSessionAuth() {
    sessionStorage.removeItem(SESSION_USER_KEY)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
}

function migratePersistedAuth() {
    const currentVersion = localStorage.getItem(AUTH_SCHEMA_VERSION_KEY) || sessionStorage.getItem(AUTH_SCHEMA_VERSION_KEY)
    if (currentVersion === AUTH_SCHEMA_VERSION) return

    clearLocalAuth()
    clearSessionAuth()
    localStorage.setItem(AUTH_SCHEMA_VERSION_KEY, AUTH_SCHEMA_VERSION)
    sessionStorage.setItem(AUTH_SCHEMA_VERSION_KEY, AUTH_SCHEMA_VERSION)
}

function normalizePersistedUser(user) {
    if (!user || typeof user !== 'object') return user
    if (user.auth_type !== 'tapis') return user

    const normalizedUsername = String(user.username || '').trim().toLowerCase()
    const isAdmin = normalizedUsername && ADMIN_USERNAMES.includes(normalizedUsername)

    return {
        ...user,
        role: isAdmin ? 'admin' : (user.role || 'user'),
    }
}

function isJwtExpired(token) {
    const exp = getJwtExp(token)
    if (!exp) return false
    return Date.now() >= (exp * 1000) - 30_000
}

function getJwtExp(token) {
    try {
        const payload = String(token || '').split('.')[1]
        if (!payload) return null
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
        const decoded = JSON.parse(atob(padded))
        return typeof decoded.exp === 'number' ? decoded.exp : null
    } catch {
        return null
    }
}

export const useAuthStore = defineStore('auth', () => {
    const persisted = loadPersistedAuth()
    const user = ref(persisted.user)
    const token = ref(persisted.token)
    const loading = ref(false)
    const error = ref(null)

    const effectiveUser = computed(() => user.value)
    const effectiveToken = computed(() => {
        if (token.value) return token.value
        return SUPPORTS_DEV_OPEN_ACCESS ? '__patra_dev_open_access__' : ''
    })

    const isLoggedIn = computed(() => !!effectiveUser.value && !!effectiveToken.value)
    const normalizedUsername = computed(() => String(effectiveUser.value?.username || '').trim().toLowerCase())
    const isTapisUser = computed(() => effectiveUser.value?.auth_type === 'tapis')
    const isAdmin = computed(() => {
        if (SUPPORTS_DEV_OPEN_ACCESS) return true
        if (!effectiveUser.value) return false
        if (!isTapisUser.value) return false
        return normalizedUsername.value ? ADMIN_USERNAMES.includes(normalizedUsername.value) : false
    })
    const displayName = computed(() => effectiveUser.value?.name || effectiveUser.value?.username || 'Guest')
    const initials = computed(() => {
        const name = effectiveUser.value?.name || effectiveUser.value?.username || ''
        if (!name) return '??'
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    })

    function persist(rememberMe = true) {
        if (rememberMe) {
            clearSessionAuth()
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user.value))
            localStorage.setItem(LOCAL_TOKEN_KEY, token.value)
            localStorage.setItem(LOCAL_EXPIRY_KEY, String(Date.now() + REMEMBER_ME_MS))
            return
        }

        clearLocalAuth()
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user.value))
        sessionStorage.setItem(SESSION_TOKEN_KEY, token.value)
    }

    async function loginTapis(username, password, options = {}) {
        loading.value = true
        error.value = null
        try {
            const body = new URLSearchParams({
                grant_type: 'password',
                username,
                password,
            })

            const res = await fetch(TAPIS_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Tapis authentication failed')
            }

            const issuedToken =
                data?.result?.access_token?.access_token ||
                data?.result?.access_token ||
                data?.access_token ||
                data?.token

            if (!issuedToken) {
                throw new Error('Tapis authentication succeeded but no access token was returned')
            }

            user.value = {
                username,
                name: username,
                role: ADMIN_USERNAMES.includes(String(username).trim().toLowerCase()) ? 'admin' : 'user',
                auth_type: 'tapis',
            }
            token.value = issuedToken
            persist(options.rememberMe !== false)
            return true
        } catch (e) {
            error.value = e.message
            return false
        } finally {
            loading.value = false
        }
    }

    function logout() {
        user.value = null
        token.value = ''
        clearLocalAuth()
        clearSessionAuth()
    }

    function clearError() {
        error.value = null
    }

    return {
        user, token, loading, error,
        effectiveUser, effectiveToken,
        isLoggedIn, isAdmin, isTapisUser, displayName, initials,
        loginTapis, logout, clearError,
    }
})
