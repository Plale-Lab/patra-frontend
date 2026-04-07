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
      const response = await apiFetch(`/experiments/${domain}/users`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      users.value = await response.json()
    } catch (err) {
      error.value = err.message
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
    experimentPower.value = null
    userSummary.value = []
    experimentList.value = []

    if (!userId) return

    loading.value = true
    error.value = null
    try {
      const [summaryResponse, listResponse] = await Promise.all([
        apiFetch(`/experiments/${domain}/users/${userId}/summary`),
        apiFetch(`/experiments/${domain}/users/${userId}/list`),
      ])
      if (!summaryResponse.ok) throw new Error(`HTTP ${summaryResponse.status}`)
      if (!listResponse.ok) throw new Error(`HTTP ${listResponse.status}`)
      userSummary.value = await summaryResponse.json()
      experimentList.value = await listResponse.json()
    } catch (err) {
      error.value = err.message
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
      const [detailResponse, imagesResponse, powerResponse] = await Promise.all([
        apiFetch(`/experiments/${domain}/${experimentId}`),
        apiFetch(`/experiments/${domain}/${experimentId}/images?skip=0&limit=100`),
        apiFetch(`/experiments/${domain}/${experimentId}/power`),
      ])
      if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`)
      if (!imagesResponse.ok) throw new Error(`HTTP ${imagesResponse.status}`)
      experimentDetail.value = await detailResponse.json()
      experimentImages.value = await imagesResponse.json()
      experimentPower.value = powerResponse.ok ? await powerResponse.json() : null
    } catch (err) {
      error.value = err.message
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
    users,
    selectedUserId,
    userSummary,
    experimentList,
    selectedExperimentId,
    experimentDetail,
    experimentImages,
    experimentPower,
    loading,
    error,
    fetchUsers,
    selectUser,
    selectExperiment,
    reset,
  }
})
