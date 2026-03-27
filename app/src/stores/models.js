import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useModelsStore = defineStore('models', () => {
    const models = ref([])

    const datasheets = ref([])

    const publicModels = computed(() => models.value.filter(m => !m.isPrivate))
    const privateModels = computed(() => models.value.filter(m => m.isPrivate))
    const publicDatasheets = computed(() => datasheets.value.filter(d => !d.isPrivate))

    function toggleModelVisibility(id) {
        const model = models.value.find(m => m.id === id)
        if (model) model.isPrivate = !model.isPrivate
    }

    function toggleDatasheetVisibility(id) {
        const ds = datasheets.value.find(d => d.id === id)
        if (ds) ds.isPrivate = !ds.isPrivate
    }

    function toggleModelCardField(modelId, fieldKey) {
        const model = models.value.find(m => m.id === modelId)
        if (model && model.fields[fieldKey]) {
            model.fields[fieldKey].visible = !model.fields[fieldKey].visible
        }
    }

    return {
        models, datasheets,
        publicModels, privateModels, publicDatasheets,
        toggleModelVisibility, toggleDatasheetVisibility, toggleModelCardField,
    }
})
