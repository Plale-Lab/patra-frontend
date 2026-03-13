import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ADMIN_USERNAMES } from '../config/api'

// Tapis base URL for JWT authentication
const TAPIS_BASE_URL = 'https://tacc.tapis.io'
const TAPIS_TOKEN_URL = `${TAPIS_BASE_URL}/v3/oauth2/tokens`

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('patra_user') || 'null'))
    const token = ref(localStorage.getItem('patra_token') || '')
    const loading = ref(false)
    const error = ref(null)

    const isLoggedIn = computed(() => !!user.value && !!token.value)
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isTapisUser = computed(() => user.value?.auth_type === 'tapis')
    const displayName = computed(() => user.value?.name || user.value?.username || 'Guest')
    const initials = computed(() => {
        const name = user.value?.name || user.value?.username || ''
        if (!name) return '??'
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    })

    function persist() {
        localStorage.setItem('patra_user', JSON.stringify(user.value))
        localStorage.setItem('patra_token', token.value)
    }

    async function loginTapis(username, password) {
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
            persist()
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
        localStorage.removeItem('patra_user')
        localStorage.removeItem('patra_token')
    }

    function clearError() {
        error.value = null
    }

    return {
        user, token, loading, error,
        isLoggedIn, isAdmin, isTapisUser, displayName, initials,
        loginTapis, logout, clearError,
    }
})
