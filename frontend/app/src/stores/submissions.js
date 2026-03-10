import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../lib/api'
import { buildAssetIntakeData, normalizeAssetInput } from '../lib/assetIntake'

export const useSubmissionsStore = defineStore('submissions', () => {
    const submissions = ref([])
    const loading = ref(false)
    const error = ref(null)

    const pendingCount = computed(() => submissions.value.filter(s => s.status === 'pending').length)

    async function fetchSubmissions(status) {
        loading.value = true
        error.value = null
        try {
            const res = await apiFetch(status ? `/submissions?status=${status}` : '/submissions')
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
            const newSub = await postSubmission(type, data, submittedBy)
            submissions.value.unshift(newSub)
            return newSub
        } catch (e) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    async function createBulkSubmissions(type, urls, submittedBy, batchNote) {
        loading.value = true
        error.value = null

        try {
            const uniqueUrls = [...new Set(
                urls
                    .map(normalizeAssetInput)
                    .filter(Boolean),
            )]

            const batchId = createBatchId()

            const results = await Promise.allSettled(
                uniqueUrls.map((url, index) => postSubmission(
                    type,
                    buildAssetIntakeData({
                        assetUrl: url,
                        notes: batchNote,
                        batchId,
                        batchIndex: index + 1,
                        batchTotal: uniqueUrls.length,
                        submissionOrigin: 'bulk_asset_links',
                    }),
                    submittedBy,
                )),
            )

            const successes = []
            const failures = []
            const created = []

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    created.push(result.value)
                    successes.push({
                        url: uniqueUrls[index],
                        submissionId: result.value.id,
                    })
                    submissions.value.unshift(result.value)
                    return
                }

                failures.push({
                    url: uniqueUrls[index],
                    error: result.reason?.message || 'Submission failed',
                })
            })

            if (failures.length === uniqueUrls.length) {
                error.value = 'Failed to submit all asset links.'
            } else if (failures.length > 0) {
                error.value = 'Some asset links could not be submitted.'
            }

            return { successes, failures, created }
        } finally {
            loading.value = false
        }
    }

    async function reviewSubmission(id, status, adminNotes) {
        try {
            const res = await apiFetch(`/submissions/${id}`, {
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

    async function postSubmission(type, data, submittedBy) {
        const res = await apiFetch('/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data, submitted_by: submittedBy }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        return res.json()
    }

    function createBatchId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID()
        }

        return `batch-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    }

    return {
        submissions,
        loading,
        error,
        pendingCount,
        fetchSubmissions,
        createSubmission,
        createBulkSubmissions,
        reviewSubmission,
    }
})
