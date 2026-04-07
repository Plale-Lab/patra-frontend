import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuditLogStore = defineStore('auditLog', () => {
    const events = ref([])

    const actionTypes = computed(() => {
        return [...new Set(events.value.map(e => e.action))]
    })

    function filteredEvents(filter) {
        if (!filter || filter === 'all') return events.value
        return events.value.filter(e => e.action === filter)
    }

    return { events, actionTypes, filteredEvents }
})
