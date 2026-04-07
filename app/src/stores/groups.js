import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGroupsStore = defineStore('groups', () => {
    let nextGroupId = 4
    let nextMemberId = 20

    const groups = ref([])

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
