import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../lib/api'

export const useExperimentsStore = defineStore('experiments', () => {
    const users = ref([])
    const selectedUserId = ref(null)
    const userSummary = ref([])
    const experimentList = ref([])
    const selectedExperimentId = ref(null)
    const experimentDetail = ref(null)
    const experimentImages = ref([])
    const experimentPower = ref(null)
    const loading = ref(false)
    const error = ref(null)

    async function fetchUsers(domain) {
        loading.value = true
        error.value = null
        try {
            const res = await apiFetch(`/experiments/${domain}/users`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            users.value = await res.json()
        } catch (e) {
            error.value = e.message
            users.value = []
        } finally {
            loading.value = false
        }
    }

    async function selectUser(domain, userId) {
        selectedUserId.value = userId
        selectedExperimentId.value = null
        experimentDetail.value = null
        experimentImages.value = []
        userSummary.value = []
        experimentList.value = []

        if (!userId) return

        loading.value = true
        error.value = null
        try {
            const [summaryRes, listRes] = await Promise.all([
                apiFetch(`/experiments/${domain}/users/${userId}/summary`),
                apiFetch(`/experiments/${domain}/users/${userId}/list`),
            ])
            if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}`)
            if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`)
            userSummary.value = await summaryRes.json()
            experimentList.value = await listRes.json()
        } catch (e) {
            error.value = e.message
            userSummary.value = []
            experimentList.value = []
        } finally {
            loading.value = false
        }
    }

    async function selectExperiment(domain, experimentId) {
        selectedExperimentId.value = experimentId
        experimentDetail.value = null
        experimentImages.value = []
        experimentPower.value = null

        if (!experimentId) return

        loading.value = true
        error.value = null
        try {
            const [detailRes, imagesRes, powerRes] = await Promise.all([
                apiFetch(`/experiments/${domain}/${experimentId}`),
                apiFetch(`/experiments/${domain}/${experimentId}/images?skip=0&limit=100`),
                apiFetch(`/experiments/${domain}/${experimentId}/power`),
            ])
            if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`)
            if (!imagesRes.ok) throw new Error(`HTTP ${imagesRes.status}`)
            experimentDetail.value = await detailRes.json()
            experimentImages.value = await imagesRes.json()
            if (powerRes.ok) {
                experimentPower.value = await powerRes.json()
            }
        } catch (e) {
            error.value = e.message
            experimentDetail.value = null
            experimentImages.value = []
            experimentPower.value = null
        } finally {
            loading.value = false
        }
    }

    function reset() {
        users.value = []
        selectedUserId.value = null
        userSummary.value = []
        experimentList.value = []
        selectedExperimentId.value = null
        experimentDetail.value = null
        experimentImages.value = []
        experimentPower.value = null
        loading.value = false
        error.value = null
    }

    return {
        users, selectedUserId, userSummary, experimentList,
        selectedExperimentId, experimentDetail, experimentImages, experimentPower,
        loading, error,
        fetchUsers, selectUser, selectExperiment, reset,
    }
})
