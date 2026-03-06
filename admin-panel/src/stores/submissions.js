import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'http://localhost:5002'

export const useSubmissionsStore = defineStore('submissions', () => {
    const submissions = ref([])
    const loading = ref(false)
    const error = ref(null)

    const pendingCount = computed(() => submissions.value.filter(s => s.status === 'pending').length)

    async function fetchSubmissions(status) {
        loading.value = true
        error.value = null
        try {
            const url = status ? `${API_BASE}/submissions?status=${status}` : `${API_BASE}/submissions`
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            submissions.value = await res.json()
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function createSubmission(type, data, submittedBy) {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data, submitted_by: submittedBy }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const newSub = await res.json()
            submissions.value.unshift(newSub)
            return newSub
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    async function reviewSubmission(id, status, adminNotes) {
        try {
            const res = await fetch(`${API_BASE}/submissions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, admin_notes: adminNotes }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const updated = await res.json()
            const idx = submissions.value.findIndex(s => s.id === id)
            if (idx !== -1) submissions.value[idx] = updated
            return updated
        } catch (e) {
            error.value = e.message
            return null
        }
    }

    return { submissions, loading, error, pendingCount, fetchSubmissions, createSubmission, reviewSubmission }
})
