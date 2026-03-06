import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'http://localhost:5002'

export const useExploreStore = defineStore('explore', () => {
    const models = ref([])
    const currentModel = ref(null)
    const datasheets = ref([])
    const deployments = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Filters
    const searchQuery = ref('')
    const selectedCategories = ref([])
    const selectedFrameworks = ref([])
    const selectedAuthor = ref('')
    const visibilityFilter = ref('all') // all | public | private

    // Derived
    const allCategories = computed(() => [...new Set(models.value.map(m => m.category))])
    const allFrameworks = computed(() => [...new Set(models.value.map(m => m.framework))])
    const allAuthors = computed(() => [...new Set(models.value.map(m => m.author))])

    const filteredModels = computed(() => {
        let list = models.value

        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase()
            list = list.filter(m =>
                m.name.toLowerCase().includes(q) ||
                (m.short_description || '').toLowerCase().includes(q) ||
                (m.keywords || '').toLowerCase().includes(q) ||
                m.author.toLowerCase().includes(q)
            )
        }

        if (selectedCategories.value.length > 0) {
            list = list.filter(m => selectedCategories.value.includes(m.category))
        }

        if (selectedFrameworks.value.length > 0) {
            list = list.filter(m => selectedFrameworks.value.includes(m.framework))
        }

        if (selectedAuthor.value) {
            list = list.filter(m => m.author === selectedAuthor.value)
        }

        if (visibilityFilter.value === 'public') {
            list = list.filter(m => !m.is_private)
        } else if (visibilityFilter.value === 'private') {
            list = list.filter(m => m.is_private)
        }

        return list
    })

    async function fetchModels() {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/modelcards`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            models.value = await res.json()
        } catch (e) {
            error.value = e.message
            console.error('Failed to fetch models:', e)
        } finally {
            loading.value = false
        }
    }

    async function fetchModelById(id) {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE}/modelcard/${id}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            currentModel.value = await res.json()
        } catch (e) {
            error.value = e.message
            console.error('Failed to fetch model:', e)
        } finally {
            loading.value = false
        }
    }

    async function fetchDeployments(id) {
        try {
            const res = await fetch(`${API_BASE}/modelcard/${id}/deployments`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            deployments.value = await res.json()
        } catch (e) {
            deployments.value = []
        }
    }

    async function fetchDatasheets() {
        try {
            const res = await fetch(`${API_BASE}/datasheets`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            datasheets.value = await res.json()
        } catch (e) {
            datasheets.value = []
        }
    }

    function resetFilters() {
        searchQuery.value = ''
        selectedCategories.value = []
        selectedFrameworks.value = []
        selectedAuthor.value = ''
        visibilityFilter.value = 'all'
    }

    return {
        models, currentModel, datasheets, deployments, loading, error,
        searchQuery, selectedCategories, selectedFrameworks, selectedAuthor, visibilityFilter,
        allCategories, allFrameworks, allAuthors, filteredModels,
        fetchModels, fetchModelById, fetchDeployments, fetchDatasheets, resetFilters,
    }
})
