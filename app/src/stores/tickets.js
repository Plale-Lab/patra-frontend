import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../lib/api'

export const useTicketsStore = defineStore('tickets', () => {
    const tickets = ref([])
    const loading = ref(false)
    const error = ref(null)

    const openCount = computed(() => tickets.value.filter(t => t.status === 'open').length)

    async function fetchTickets(status) {
        loading.value = true
        error.value = null
        try {
            const res = await apiFetch(status ? `/tickets?status=${status}` : '/tickets')
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            tickets.value = await res.json()
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function createTicket(data) {
        loading.value = true
        error.value = null
        try {
            const res = await apiFetch('/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const newTicket = await res.json()
            tickets.value.unshift(newTicket)
            return newTicket
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    async function updateTicket(id, updates) {
        try {
            const res = await apiFetch(`/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })
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

    return { tickets, loading, error, openCount, fetchTickets, createTicket, updateTicket }
})
