import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
    ADMIN_USERNAMES,
    EMBEDDED_AUTH_ENABLED,
    PORTAL_AUTH_ORIGINS,
    PORTAL_AUTH_TIMEOUT_MS,
    SUPPORTS_DEV_OPEN_ACCESS,
} from '../config/api'
import { requestPortalAuth } from '../lib/portalAuth'
import { clearRuntimeAuth, setRuntimeAuth } from '../lib/runtimeAuth'

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
const PORTAL_REFRESH_LEAD_MS = 2 * 60 * 1000

function loadPersistedAuth() {
    migratePersistedAuth()
    const expiresAt = Number(localStorage.getItem(LOCAL_EXPIRY_KEY) || 0)
    if (expiresAt && Date.now() < expiresAt) {
        const session = createStoredSession(
            localStorage.getItem(LOCAL_USER_KEY),
            localStorage.getItem(LOCAL_TOKEN_KEY),
        )
        if (session) return session
        clearLocalAuth()
    } else if (expiresAt) {
        clearLocalAuth()
    }

    const session = createStoredSession(
        sessionStorage.getItem(SESSION_USER_KEY),
        sessionStorage.getItem(SESSION_TOKEN_KEY),
    )
    if (session) return session
    clearSessionAuth()
    return null
}

function createStoredSession(rawUser, rawToken) {
    const user = normalizePersistedUser(parseJson(rawUser))
    const token = String(rawToken || '')
    if (!user || !token || isJwtExpired(token)) return null
    return { user, token }
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
    if (!user || typeof user !== 'object') return null
    if (user.auth_type !== 'tapis') return null

    const username = String(user.username || '').trim()
    if (!username) return null
    const normalizedUsername = username.toLowerCase()

    return {
        ...user,
        username,
        name: user.name || username,
        role: ADMIN_USERNAMES.includes(normalizedUsername) ? 'admin' : 'user',
        auth_type: 'tapis',
    }
}

function isJwtExpired(token) {
    try {
        const payload = String(token || '').split('.')[1]
        if (!payload) return false
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
        const decoded = JSON.parse(atob(padded))
        return typeof decoded.exp === 'number' && Date.now() >= (decoded.exp * 1000) - 30_000
    } catch {
        return false
    }
}

function makeTapisUser(username, authSource) {
    const normalizedUsername = String(username || '').trim()
    return {
        username: normalizedUsername,
        name: normalizedUsername,
        role: ADMIN_USERNAMES.includes(normalizedUsername.toLowerCase()) ? 'admin' : 'user',
        auth_type: 'tapis',
        auth_source: authSource,
    }
}

export const useAuthStore = defineStore('auth', () => {
    let standaloneSession = loadPersistedAuth()
    let initializationPromise = null
    let portalRefreshTimer = null
    let portalRequest = requestPortalAuth
    let portalRequestOptions = null

    const user = ref(null)
    const token = ref('')
    const source = ref('guest')
    const initializationState = ref('idle')
    const loading = ref(false)
    const error = ref(null)

    const effectiveUser = computed(() => user.value)
    const effectiveToken = computed(() => {
        if (token.value) return token.value
        return SUPPORTS_DEV_OPEN_ACCESS ? '__patra_dev_open_access__' : ''
    })

    const isInitializing = computed(() => initializationState.value !== 'ready')
    const isLoggedIn = computed(() => !!effectiveUser.value && !!effectiveToken.value)
    const normalizedUsername = computed(() => String(effectiveUser.value?.username || '').trim().toLowerCase())
    const isTapisUser = computed(() => effectiveUser.value?.auth_type === 'tapis')
    const isPortalUser = computed(() => source.value === 'portal' && isTapisUser.value)
    const isAdmin = computed(() => {
        if (SUPPORTS_DEV_OPEN_ACCESS) return true
        if (!effectiveUser.value || !isTapisUser.value) return false
        return normalizedUsername.value ? ADMIN_USERNAMES.includes(normalizedUsername.value) : false
    })
    const displayName = computed(() => {
        if (isInitializing.value) return 'Connecting…'
        return effectiveUser.value?.name || effectiveUser.value?.username || 'Guest'
    })
    const initials = computed(() => {
        const name = effectiveUser.value?.name || effectiveUser.value?.username || ''
        if (!name) return '??'
        return name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2)
    })

    function setActiveSession(session, nextSource) {
        user.value = session?.user || null
        token.value = session?.token || ''
        source.value = session ? nextSource : 'guest'
        setRuntimeAuth({
            source: source.value,
            user: user.value,
            token: token.value,
        })
    }

    function applyStandaloneFallback() {
        if (standaloneSession && !isJwtExpired(standaloneSession.token)) {
            setActiveSession(standaloneSession, 'standalone')
            return
        }
        standaloneSession = null
        setActiveSession(null, 'guest')
    }

    function applyPortalSession(portalSession) {
        setActiveSession({
            user: makeTapisUser(portalSession.username, 'portal'),
            token: portalSession.token,
        }, 'portal')
        schedulePortalRefresh(portalSession.expiresAt)
    }

    async function initialize(options = {}) {
        if (initializationState.value === 'ready') return source.value
        if (initializationPromise) return initializationPromise

        initializationState.value = 'resolving'
        clearRuntimeAuth()

        const embeddedAuthEnabled = options.embeddedAuthEnabled ?? EMBEDDED_AUTH_ENABLED
        const allowedOrigins = options.allowedOrigins ?? PORTAL_AUTH_ORIGINS
        const timeoutMs = options.timeoutMs ?? PORTAL_AUTH_TIMEOUT_MS
        const hostWindow = options.hostWindow ?? window
        const parentWindow = options.parentWindow ?? hostWindow.parent
        const isEmbedded = options.isEmbedded ?? parentWindow !== hostWindow
        portalRequest = options.requestPortalAuth ?? requestPortalAuth
        portalRequestOptions = {
            allowedOrigins,
            timeoutMs,
            hostWindow,
            parentWindow,
        }

        initializationPromise = (async () => {
            if (embeddedAuthEnabled && isEmbedded && allowedOrigins.length) {
                try {
                    const portalSession = await portalRequest(portalRequestOptions)
                    applyPortalSession(portalSession)
                } catch (reason) {
                    logPortalFallback(reason)
                    applyStandaloneFallback()
                }
            } else {
                if (embeddedAuthEnabled && isEmbedded && !allowedOrigins.length) {
                    console.warn('[Patra auth] Embedded authentication is enabled without an allowed portal origin.')
                }
                applyStandaloneFallback()
            }

            initializationState.value = 'ready'
            return source.value
        })().finally(() => {
            initializationPromise = null
        })

        return initializationPromise
    }

    function persistStandalone(session, rememberMe = true) {
        if (rememberMe) {
            clearSessionAuth()
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(session.user))
            localStorage.setItem(LOCAL_TOKEN_KEY, session.token)
            localStorage.setItem(LOCAL_EXPIRY_KEY, String(Date.now() + REMEMBER_ME_MS))
            return
        }

        clearLocalAuth()
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user))
        sessionStorage.setItem(SESSION_TOKEN_KEY, session.token)
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

            const response = await fetch(TAPIS_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            })
            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
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

            standaloneSession = {
                user: makeTapisUser(username, 'standalone'),
                token: issuedToken,
            }
            persistStandalone(standaloneSession, options.rememberMe !== false)
            stopPortalRefresh()
            setActiveSession(standaloneSession, 'standalone')
            initializationState.value = 'ready'
            return true
        } catch (reason) {
            error.value = reason instanceof Error ? reason.message : 'Tapis authentication failed'
            return false
        } finally {
            loading.value = false
        }
    }

    async function refreshPortalAuth() {
        if (source.value !== 'portal' || !portalRequestOptions) return false
        try {
            const portalSession = await portalRequest(portalRequestOptions)
            applyPortalSession(portalSession)
            return true
        } catch (reason) {
            logPortalFallback(reason, 'refresh')
            stopPortalRefresh()
            applyStandaloneFallback()
            return false
        }
    }

    function schedulePortalRefresh(expiresAt) {
        stopPortalRefresh()
        const delay = Math.max(1000, expiresAt - Date.now() - PORTAL_REFRESH_LEAD_MS)
        portalRefreshTimer = window.setTimeout(() => {
            void refreshPortalAuth()
        }, delay)
    }

    function stopPortalRefresh() {
        if (portalRefreshTimer !== null) {
            window.clearTimeout(portalRefreshTimer)
            portalRefreshTimer = null
        }
    }

    function logout() {
        if (source.value === 'portal') return false
        standaloneSession = null
        stopPortalRefresh()
        clearLocalAuth()
        clearSessionAuth()
        setActiveSession(null, 'guest')
        return true
    }

    function clearError() {
        error.value = null
    }

    return {
        user,
        token,
        source,
        initializationState,
        loading,
        error,
        effectiveUser,
        effectiveToken,
        isInitializing,
        isLoggedIn,
        isAdmin,
        isTapisUser,
        isPortalUser,
        displayName,
        initials,
        initialize,
        loginTapis,
        refreshPortalAuth,
        logout,
        clearError,
    }
})

function logPortalFallback(reason, phase = 'initialization') {
    const code = reason && typeof reason === 'object' && 'code' in reason ? reason.code : 'unavailable'
    console.info(`[Patra auth] Portal ${phase} unavailable (${code}); using the safe fallback.`)
}
