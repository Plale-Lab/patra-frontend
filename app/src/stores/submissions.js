import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../lib/api'
import { buildAssetIntakeData, normalizeAssetInput } from '../lib/assetIntake'
import { getApiModeMeta, getStoredApiMode } from '../config/api'
import {
    getSubmissionDisplayName,
    mapSubmissionToAssetPayload,
} from '../lib/submissionPayloads'

export const useSubmissionsStore = defineStore('submissions', () => {
    const submissions = ref([])
    const loading = ref(false)
    const error = ref(null)
    const supported = ref(true)

    const pendingCount = computed(() => submissions.value.filter(s => s.status === 'pending').length)

    async function fetchSubmissions(status) {
        loading.value = true
        error.value = null
        supported.value = supportsSubmissionQueueApi()

        if (!supported.value) {
            submissions.value = []
            loading.value = false
            return []
        }

        try {
            const res = await apiFetch(status ? `/submissions?status=${status}` : '/submissions')
            if (res.status === 404) {
                supported.value = false
                submissions.value = []
                return []
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            submissions.value = await res.json()
            supported.value = true
            return submissions.value
        } catch (e) {
            error.value = e.message
            return []
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
            const items = uniqueUrls.map((url, index) => {
                const queueData = buildAssetIntakeData({
                    assetUrl: url,
                    notes: batchNote,
                    batchId,
                    batchIndex: index + 1,
                    batchTotal: uniqueUrls.length,
                    submissionOrigin: 'bulk_asset_links',
                })

                return {
                    data: queueData,
                    assetPayload: mapSubmissionToAssetPayload(type, queueData, submittedBy),
                }
            })

            const result = await postBulkSubmissions(type, items, submittedBy)

            const successes = []
            const failures = []
            const created = []

            result.results.forEach((item, index) => {
                if (item.created) {
                    const createdAsset = item.submission

                    created.push(createdAsset)
                    successes.push({
                        url: uniqueUrls[index],
                        submissionId: createdAsset?.id,
                    })
                    if (createdAsset) {
                        submissions.value.unshift(createdAsset)
                    }
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
        supported.value = supportsSubmissionQueueApi()
        if (!supported.value) {
            error.value = 'Submission review is not available in this deployment.'
            return null
        }
        try {
            const res = await apiFetch(`/submissions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, admin_notes: adminNotes }),
            })
            if (res.status === 404) {
                supported.value = false
                error.value = 'Submission review is not available in this deployment.'
                return null
            }
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
        const assetPayload = mapSubmissionToAssetPayload(type, data, submittedBy)
        const res = await apiFetch('/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                submitted_by: submittedBy,
                title: getSubmissionDisplayName(type, assetPayload),
                data: payloadForQueue(data),
                asset_payload: assetPayload,
                intake_method: data?.intake_method || 'manual',
                submission_origin: data?.submission_origin || (data?.intake_method === 'asset_link' ? 'asset_link' : 'manual_entry'),
            }),
        })

        if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))

        supported.value = true
        return res.json()
    }

    async function postBulkSubmissions(type, items, submittedBy) {
        const res = await apiFetch('/submissions/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                submitted_by: submittedBy,
                items: items.map((item) => ({
                    title: getSubmissionDisplayName(type, item.assetPayload),
                    data: payloadForQueue(item.data),
                    asset_payload: item.assetPayload,
                    intake_method: item.data?.intake_method || 'asset_link',
                    submission_origin: item.data?.submission_origin || 'bulk_asset_links',
                })),
            }),
        })

        if (!res.ok) throw new Error(await parseErrorMessage(res, `HTTP ${res.status}`))

        supported.value = true
        return res.json()
    }

    function createBatchId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID()
        }

        return `batch-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
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

    function payloadForQueue(data) {
        if (data?.intake_method === 'asset_link') {
            return {
                intake_method: 'asset_link',
                submission_origin: data.submission_origin || 'asset_link',
                asset_url: data.asset_url,
                asset_provider: data.asset_provider,
                asset_host: data.asset_host,
                display_name: data.display_name,
                submitter_notes: data.submitter_notes,
                intake_prompt: data.intake_prompt,
                batch_id: data.batch_id,
                batch_index: data.batch_index,
                batch_total: data.batch_total,
            }
        }

        return { ...data, intake_method: data?.intake_method || 'manual' }
    }

    function supportsSubmissionQueueApi() {
        return Boolean(getApiModeMeta(getStoredApiMode()).supportsSubmissionQueue)
    }

    return {
        submissions,
        loading,
        error,
        supported,
        pendingCount,
        fetchSubmissions,
        createSubmission,
        createBulkSubmissions,
        reviewSubmission,
    }
})
