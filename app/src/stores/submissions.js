import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../lib/api'
import { buildAssetIntakeData, normalizeAssetInput } from '../lib/assetIntake'
import {
    getAssetEndpointPath,
    getSubmissionDisplayName,
    mapSubmissionToAssetPayload,
} from '../lib/submissionPayloads'

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
            const assets = uniqueUrls.map((url, index) => mapSubmissionToAssetPayload(
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
            ))

            const result = await postBulkSubmissions(type, assets)

            const successes = []
            const failures = []
            const created = []

            result.results.forEach((item, index) => {
                if (item.created) {
                    const createdAsset = normalizeCreatedSubmission(
                        type,
                        assets[index],
                        submittedBy,
                        {
                            asset_id: item.asset_id,
                            created: item.created,
                            duplicate: item.duplicate,
                        },
                    )

                    created.push(createdAsset)
                    successes.push({
                        url: uniqueUrls[index],
                        submissionId: createdAsset.id,
                    })
                    submissions.value.unshift(createdAsset)
                    return
                }

                failures.push({
                    url: uniqueUrls[index],
                    error: item.error || 'Submission failed',
                })
            })

            if (failures.length === uniqueUrls.length) {
                error.value = 'Failed to submit all asset links.'
            } else if (failures.length > 0) {
                error.value = 'Some asset links could not be submitted.'
            }

            return { successes, failures, created }
        } catch (e) {
            error.value = e.message
            return null
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
        const payload = mapSubmissionToAssetPayload(type, data, submittedBy)
        const res = await apiFetch(getAssetEndpointPath(type), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))

        return normalizeCreatedSubmission(type, payload, submittedBy, await res.json())
    }

    async function postBulkSubmissions(type, assets) {
        const res = await apiFetch(getAssetEndpointPath(type, true), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assets }),
        })

        if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))

        return res.json()
    }

    function createBatchId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID()
        }

        return `batch-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    }

    function normalizeCreatedSubmission(type, payload, submittedBy, result) {
        return {
            id: result?.asset_id || `${type}-${Date.now()}`,
            type,
            status: result?.duplicate ? 'duplicate' : 'submitted',
            submitted_by: submittedBy,
            data: payload,
            backend_result: result,
            title: getSubmissionDisplayName(type, payload),
        }
    }

    async function parseErrorMessage(res, fallback) {
        const contentType = res.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => null)
            if (typeof data?.detail === 'string') return data.detail
            if (Array.isArray(data?.detail)) return data.detail.map((item) => item.msg || item.message || String(item)).join('; ')
            if (typeof data?.message === 'string') return data.message
            if (typeof data?.error === 'string') return data.error
        }

        const text = await res.text().catch(() => '')
        return text || fallback
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
