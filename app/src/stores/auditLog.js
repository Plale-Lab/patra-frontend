import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuditLogStore = defineStore('auditLog', () => {
    const events = ref([
        { id: 1, timestamp: '2026-03-05T10:45:00', user: 'Sachith Withana', action: 'create', target: 'Model Card', detail: 'Created "UCI Adult Data Analysis v0.2"' },
        { id: 2, timestamp: '2026-03-05T10:30:00', user: 'Alice Chen', action: 'update', target: 'Model Card', detail: 'Updated visibility of "ResNet-152" to Private' },
        { id: 3, timestamp: '2026-03-05T09:15:00', user: 'Carol Davis', action: 'create', target: 'Datasheet', detail: 'Uploaded "Census Income 2020" datasheet' },
        { id: 4, timestamp: '2026-03-04T16:42:00', user: 'Sachith Withana', action: 'delete', target: 'User Group', detail: 'Deleted group "Temp Reviewers"' },
        { id: 5, timestamp: '2026-03-04T15:20:00', user: 'Bob Martinez', action: 'update', target: 'Model Card', detail: 'Toggled XAI Analysis field on "Titanic Survival Predictor"' },
        { id: 6, timestamp: '2026-03-04T14:00:00', user: 'David Kim', action: 'create', target: 'User Group', detail: 'Created group "External Reviewers"' },
        { id: 7, timestamp: '2026-03-04T11:30:00', user: 'Eva Rossi', action: 'update', target: 'Settings', detail: 'Changed default visibility to Private' },
        { id: 8, timestamp: '2026-03-03T17:15:00', user: 'Admin', action: 'system', target: 'System', detail: 'System backup completed successfully' },
        { id: 9, timestamp: '2026-03-03T09:00:00', user: 'Sachith Withana', action: 'create', target: 'Model Card', detail: 'Created "Foundational UCI Model v2.1"' },
        { id: 10, timestamp: '2026-03-02T13:45:00', user: 'Frank Zhou', action: 'update', target: 'Datasheet', detail: 'Updated "UCI Adult Dataset" metadata' },
        { id: 11, timestamp: '2026-03-02T10:00:00', user: 'Admin', action: 'system', target: 'System', detail: 'Knowledge Graph re-indexed (1,204 nodes)' },
        { id: 12, timestamp: '2026-03-01T08:30:00', user: 'Grace Lee', action: 'update', target: 'Model Card', detail: 'Added deployment info to "Adult Neural Network"' },
    ])

    const actionTypes = computed(() => {
        return [...new Set(events.value.map(e => e.action))]
    })

    function filteredEvents(filter) {
        if (!filter || filter === 'all') return events.value
        return events.value.filter(e => e.action === filter)
    }

    return { events, actionTypes, filteredEvents }
})
