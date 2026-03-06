import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'http://localhost:5002'

// Tapis base URL for JWT authentication
const TAPIS_BASE_URL = 'https://tacc.tapis.io'

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

    /**
     * Login via Tapis JWT (Tapipy pattern)
     * Sends credentials to our mock backend which simulates the Tapis flow:
     *   t = Tapis(base_url=TAPIS_BASE_URL, username=..., password=...)
     *   t.get_tokens()
     */
    async function loginTapis(username, password) {
        loading.value = true
        error.value = null
        try {
            // Hardcoded admin bypass — never hits Tapis
            if (username === 'admin' && password === 'admin') {
                user.value = {
                    username: 'admin',
                    name: 'System Admin',
                    email: 'admin@patra.io',
                    role: 'admin',
                    auth_type: 'local',
                }
                token.value = 'mock-admin-jwt-' + Date.now()
                persist()
                return true
            }

            // Tapis authentication via mock backend
            const res = await fetch(`${API_BASE}/auth/tapis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, base_url: TAPIS_BASE_URL }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Tapis authentication failed')
            user.value = data.user
            token.value = data.token
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
