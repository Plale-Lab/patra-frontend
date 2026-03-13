import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../lib/api'
import { getApiModeMeta, getStoredApiMode } from '../config/api'

export const useTicketsStore = defineStore('tickets', () => {
    const tickets = ref([])
    const loading = ref(false)
    const error = ref(null)
    const supported = ref(true)

    const openCount = computed(() => tickets.value.filter(t => t.status === 'open').length)

    async function fetchTickets(status) {
        loading.value = true
        error.value = null
        supported.value = supportsTicketApi()

        if (!supported.value) {
            tickets.value = []
            loading.value = false
            return []
        }

        try {
            const res = await apiFetch(status ? `/tickets?status=${status}` : '/tickets')
            if (res.status === 404) {
                supported.value = false
                tickets.value = []
                return []
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            tickets.value = await res.json()
            supported.value = true
            return tickets.value
        } catch (e) {
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    async function createTicket(data) {
        loading.value = true
        error.value = null
        supported.value = supportsTicketApi()
        if (!supported.value) {
            error.value = 'Ticketing is not available in this deployment.'
            loading.value = false
            return null
        }
        try {
            const res = await apiFetch('/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.status === 404) {
                supported.value = false
                error.value = 'Ticketing is not available in this deployment.'
                return null
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const newTicket = await res.json()
            tickets.value.unshift(newTicket)
            supported.value = true
            return newTicket
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    async function updateTicket(id, updates) {
        supported.value = supportsTicketApi()
        if (!supported.value) {
            error.value = 'Ticketing is not available in this deployment.'
            return null
        }
        try {
            const res = await apiFetch(`/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })
            if (res.status === 404) {
                supported.value = false
                error.value = 'Ticketing is not available in this deployment.'
                return null
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const updated = await res.json()
            const idx = tickets.value.findIndex(t => t.id === id)
            if (idx !== -1) tickets.value[idx] = updated
            return updated
        } catch (e) {
            error.value = e.message
            return null
        }
    }

    function supportsTicketApi() {
        return Boolean(getApiModeMeta(getStoredApiMode()).supportsTickets)
    }

    return { tickets, loading, error, supported, openCount, fetchTickets, createTicket, updateTicket }
})
