import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGroupsStore = defineStore('groups', () => {
    let nextGroupId = 4
    let nextMemberId = 20

    const groups = ref([
        {
            id: 1,
            name: 'ML Researchers',
            description: 'Core machine learning research team',
            members: [
                { id: 1, name: 'Sachith Withana', email: 'swithana@iu.edu', role: 'Admin' },
                { id: 2, name: 'Alice Chen', email: 'achen@iu.edu', role: 'Member' },
                { id: 3, name: 'Bob Martinez', email: 'bmartz@iu.edu', role: 'Member' },
            ],
        },
        {
            id: 2,
            name: 'Data Engineers',
            description: 'Data pipeline and infrastructure team',
            members: [
                { id: 4, name: 'Carol Davis', email: 'cdavis@iu.edu', role: 'Admin' },
                { id: 5, name: 'David Kim', email: 'dkim@iu.edu', role: 'Member' },
            ],
        },
        {
            id: 3,
            name: 'External Reviewers',
            description: 'External collaborators with read-only access',
            members: [
                { id: 6, name: 'Eva Rossi', email: 'erossi@external.org', role: 'Reviewer' },
                { id: 7, name: 'Frank Zhou', email: 'fzhou@partner.edu', role: 'Reviewer' },
                { id: 8, name: 'Grace Lee', email: 'glee@partner.edu', role: 'Reviewer' },
                { id: 9, name: 'Hiro Tanaka', email: 'htanaka@external.org', role: 'Reviewer' },
            ],
        },
    ])

    const totalMembers = computed(() => {
        const seen = new Set()
        groups.value.forEach(g => g.members.forEach(m => seen.add(m.id)))
        return seen.size
    })

    function createGroup(name, description = '') {
        groups.value.push({
            id: nextGroupId++,
            name,
            description,
            members: [],
        })
    }

    function deleteGroup(id) {
        const idx = groups.value.findIndex(g => g.id === id)
        if (idx !== -1) groups.value.splice(idx, 1)
    }

    function addMember(groupId, member) {
        const group = groups.value.find(g => g.id === groupId)
        if (group) {
            group.members.push({
                id: nextMemberId++,
                name: member.name,
                email: member.email,
                role: member.role || 'Member',
            })
        }
    }

    function removeMember(groupId, memberId) {
        const group = groups.value.find(g => g.id === groupId)
        if (group) {
            const idx = group.members.findIndex(m => m.id === memberId)
            if (idx !== -1) group.members.splice(idx, 1)
        }
    }

    return { groups, totalMembers, createGroup, deleteGroup, addMember, removeMember }
})
