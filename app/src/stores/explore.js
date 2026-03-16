import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../lib/api'

function asArray(value) {
    if (Array.isArray(value)) return value
    if (value == null || value === '') return []
    return [value]
}

function normalizeAffiliations(value) {
    if (Array.isArray(value)) {
        return value.map((item) => (typeof item === 'object' ? item : { name: item }))
    }
    if (typeof value === 'string' && value.trim()) {
        return value.split(',').map((item) => ({ name: item.trim() }))
    }
    return []
}

function normalizeModel(model = {}) {
    const aiModel = model.ai_model && typeof model.ai_model === 'object' ? model.ai_model : null

    return {
        ...model,
        id: model.id ?? model.mc_id ?? model.external_id ?? null,
        external_id: model.external_id ?? model.id ?? model.mc_id ?? null,
        category: model.category ?? model.categories ?? '',
        categories: model.categories ?? model.category ?? '',
        framework: model.framework ?? aiModel?.framework ?? '',
        model_type: model.model_type ?? aiModel?.model_type ?? '',
        test_accuracy: model.test_accuracy ?? aiModel?.test_accuracy ?? null,
        is_private: model.is_private ?? false,
        ai_model: aiModel
            ? {
                ...aiModel,
                test_accuracy: aiModel.test_accuracy ?? model.test_accuracy ?? null,
            }
            : null,
    }
}

function normalizeDatasheetTitle(item) {
    if (typeof item === 'string') return { title: item }
    if (!item || typeof item !== 'object') return null
    return {
        title: item.title ?? '',
        titleType: item.titleType ?? item.title_type ?? null,
        lang: item.lang ?? null,
    }
}

function normalizeDatasheetDescription(item) {
    if (typeof item === 'string') return { description: item, descriptionType: null }
    if (!item || typeof item !== 'object') return null
    return {
        description: item.description ?? '',
        descriptionType: item.descriptionType ?? item.description_type ?? null,
        lang: item.lang ?? null,
    }
}

function normalizeDatasheetCreator(item) {
    if (typeof item === 'string') {
        return {
            creatorName: { name: item, nameType: null },
            givenName: null,
            familyName: null,
            affiliation: [],
        }
    }
    if (!item || typeof item !== 'object') return null

    if (item.creatorName || item.givenName || item.familyName) {
        return {
            ...item,
            affiliation: normalizeAffiliations(item.affiliation),
        }
    }

    return {
        creatorName: {
            name: item.creator_name ?? item.name ?? '',
            nameType: item.name_type ?? null,
        },
        givenName: item.given_name ?? null,
        familyName: item.family_name ?? null,
        nameIdentifier: item.name_identifier ?? null,
        nameIdentifierScheme: item.name_identifier_scheme ?? null,
        nameIdSchemeUri: item.name_id_scheme_uri ?? null,
        affiliation: normalizeAffiliations(item.affiliation),
        affiliationIdentifier: item.affiliation_identifier ?? null,
        affiliationIdentifierScheme: item.affiliation_identifier_scheme ?? null,
        affiliationSchemeUri: item.affiliation_scheme_uri ?? null,
    }
}

function normalizeDatasheetPublisher(item) {
    if (!item) return null
    if (typeof item === 'string') return item
    return {
        name: item.name ?? '',
        publisherIdentifier: item.publisherIdentifier ?? item.publisher_identifier ?? null,
        publisherIdentifierScheme: item.publisherIdentifierScheme ?? item.publisher_identifier_scheme ?? null,
        schemeUri: item.schemeUri ?? item.scheme_uri ?? null,
        lang: item.lang ?? null,
    }
}

function normalizeResourceType(ds) {
    const resourceType = ds.resource_type
    if (resourceType && typeof resourceType === 'object') {
        return {
            resourceType: resourceType.resourceType ?? resourceType.resource_type ?? 'Dataset',
            resourceTypeGeneral: resourceType.resourceTypeGeneral ?? resourceType.resource_type_general ?? 'Dataset',
        }
    }

    if (typeof resourceType === 'string' || ds.resource_type_general || ds.resourceTypeGeneral) {
        return {
            resourceType: typeof resourceType === 'string' ? resourceType : 'Dataset',
            resourceTypeGeneral: ds.resource_type_general ?? ds.resourceTypeGeneral ?? 'Dataset',
        }
    }

    return { resourceType: 'Dataset', resourceTypeGeneral: 'Dataset' }
}

function normalizeDatasheetRelatedIdentifier(item) {
    if (!item || typeof item !== 'object') return null
    return {
        relatedIdentifier: item.relatedIdentifier ?? item.related_identifier ?? '',
        relatedIdentifierType: item.relatedIdentifierType ?? item.related_identifier_type ?? null,
        relationType: item.relationType ?? item.relation_type ?? null,
    }
}

function normalizeDatasheetRights(item) {
    if (!item || typeof item !== 'object') return null
    return {
        rights: item.rights ?? null,
        rightsURI: item.rightsURI ?? item.rights_uri ?? null,
    }
}

function normalizeDatasheetDate(item) {
    if (!item || typeof item !== 'object') return null
    return {
        date: item.date ?? '',
        dateType: item.dateType ?? item.date_type ?? null,
    }
}

function normalizeDatasheetGeoLocation(item) {
    if (!item || typeof item !== 'object') return null
    if (item.geoLocationPlace || item.geoLocationPoint) return item

    const hasPoint = item.point_latitude != null || item.point_longitude != null || item.pointLatitude != null || item.pointLongitude != null
    return {
        geoLocationPlace: item.geo_location_place ?? item.geoLocationPlace ?? null,
        geoLocationPoint: hasPoint
            ? {
                pointLatitude: item.pointLatitude ?? item.point_latitude ?? null,
                pointLongitude: item.pointLongitude ?? item.point_longitude ?? null,
            }
            : null,
    }
}

function normalizeDatasheet(ds = {}) {
    const titles = asArray(ds.title ?? ds.titles)
        .map(normalizeDatasheetTitle)
        .filter(Boolean)
    const descriptions = asArray(ds.description ?? ds.descriptions)
        .map(normalizeDatasheetDescription)
        .filter(Boolean)
    const creators = asArray(ds.creator ?? ds.creators)
        .map(normalizeDatasheetCreator)
        .filter(Boolean)
    const relatedIdentifiers = asArray(ds.related_identifier ?? ds.related_identifiers)
        .map(normalizeDatasheetRelatedIdentifier)
        .filter(Boolean)
    const rights = asArray(ds.rights ?? ds.rights_list)
        .map(normalizeDatasheetRights)
        .filter(Boolean)
    const dates = asArray(ds.date ?? ds.dates)
        .map(normalizeDatasheetDate)
        .filter(Boolean)
    const geoLocations = asArray(ds.geo_location ?? ds.geo_locations)
        .map(normalizeDatasheetGeoLocation)
        .filter(Boolean)

    return {
        ...ds,
        id: ds.id ?? ds.identifier ?? null,
        identifier: ds.identifier ?? ds.id ?? null,
        title: titles,
        titles,
        description: descriptions,
        descriptions,
        creator: creators,
        creators,
        publisher: normalizeDatasheetPublisher(ds.publisher),
        resource_type: normalizeResourceType(ds),
        publication_year: ds.publication_year ?? ds.publicationYear ?? null,
        version: ds.version ?? null,
        is_private: ds.is_private ?? false,
        format: asArray(ds.format).filter(Boolean),
        size: asArray(ds.size).filter(Boolean),
        related_identifier: relatedIdentifiers,
        related_identifiers: relatedIdentifiers,
        rights,
        rights_list: rights,
        date: dates,
        dates,
        geo_location: geoLocations,
        geo_locations: geoLocations,
    }
}

export const useExploreStore = defineStore('explore', () => {
    const models = ref([])
    const currentModel = ref(null)
    const datasheets = ref([])
    const currentDatasheet = ref(null)
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
    const allCategories = computed(() => [...new Set(models.value.map(m => m.category).filter(Boolean))])
    const allFrameworks = computed(() => [...new Set(models.value.map(m => m.framework).filter(Boolean))])
    const allAuthors = computed(() => [...new Set(models.value.map(m => m.author).filter(Boolean))])

    const filteredModels = computed(() => {
        let list = models.value

        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase()
            list = list.filter(m =>
                m.name.toLowerCase().includes(q) ||
                (m.short_description || '').toLowerCase().includes(q) ||
                (m.keywords || '').toLowerCase().includes(q) ||
                (m.author || '').toLowerCase().includes(q)
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
            const res = await apiFetch('/modelcards')
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            models.value = Array.isArray(data) ? data.map(normalizeModel) : []
        } catch (e) {
            error.value = e.message
            models.value = []
            console.error('Failed to fetch models:', e)
        } finally {
            loading.value = false
        }
    }

    async function fetchModelById(id) {
        loading.value = true
        error.value = null
        currentModel.value = null
        try {
            const res = await apiFetch(`/modelcard/${id}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            currentModel.value = normalizeModel(await res.json())
        } catch (e) {
            error.value = e.message
            currentModel.value = null
            console.error('Failed to fetch model:', e)
        } finally {
            loading.value = false
        }
    }

    async function fetchDeployments(id) {
        try {
            const res = await apiFetch(`/modelcard/${id}/deployments`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            deployments.value = await res.json()
        } catch (e) {
            deployments.value = []
        }
    }

    async function fetchDatasheets() {
        loading.value = true
        error.value = null
        try {
            const res = await apiFetch('/datasheets')
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            datasheets.value = Array.isArray(data) ? data.map(normalizeDatasheet) : []
        } catch (e) {
            error.value = e.message
            datasheets.value = []
        } finally {
            loading.value = false
        }
    }

    async function fetchDatasheetById(id) {
        loading.value = true
        error.value = null
        currentDatasheet.value = null
        try {
            const res = await apiFetch(`/datasheet/${id}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            currentDatasheet.value = normalizeDatasheet(await res.json())
        } catch (e) {
            error.value = e.message
            currentDatasheet.value = null
            console.error('Failed to fetch datasheet:', e)
        } finally {
            loading.value = false
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
        models, currentModel, datasheets, currentDatasheet, deployments, loading, error,
        searchQuery, selectedCategories, selectedFrameworks, selectedAuthor, visibilityFilter,
        allCategories, allFrameworks, allAuthors, filteredModels,
        fetchModels, fetchModelById, fetchDeployments, fetchDatasheets, fetchDatasheetById, resetFilters,
    }
})
