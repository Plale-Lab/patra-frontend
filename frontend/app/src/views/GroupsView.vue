<template>
  <div>
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>User Groups</h1>
        <p>Create and manage user groups and their members</p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <IconPlus :size="16" stroke-width="2" /> New Group
      </button>
    </div>

    <div class="groups-layout">
      <!-- Group List -->
      <div class="card groups-list">
        <div class="card-header">Groups ({{ store.groups.length }})</div>
        <div class="card-body" style="padding: 0;">
          <div
            v-for="group in store.groups"
            :key="group.id"
            class="group-item"
            :class="{ active: selectedGroup?.id === group.id }"
            @click="selectedGroup = group"
          >
            <div class="group-item-info">
              <div class="group-item-icon">
                <IconUsersGroup :size="18" stroke-width="1.8" />
              </div>
              <div>
                <div class="group-item-name">{{ group.name }}</div>
                <div class="group-item-count">{{ group.members.length }} member{{ group.members.length !== 1 ? 's' : '' }}</div>
              </div>
            </div>
            <button
              class="btn btn-sm btn-danger"
              @click.stop="confirmDelete(group)"
              title="Delete group"
            >
              <IconTrash :size="14" stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- Group Detail -->
      <div class="card groups-detail">
        <template v-if="selectedGroup">
          <div class="card-header">
            <div>
              <span>{{ selectedGroup.name }}</span>
              <div class="text-sm text-muted" style="font-weight: 400; margin-top: 2px;">{{ selectedGroup.description }}</div>
            </div>
            <button class="btn btn-sm btn-primary" @click="showAddMember = true">
              <IconUserPlus :size="14" stroke-width="2" /> Add Member
            </button>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in selectedGroup.members" :key="member.id">
                  <td>
                    <div class="flex items-center gap-8">
                      <div class="member-avatar">{{ member.name.split(' ').map(n => n[0]).join('') }}</div>
                      <span style="font-weight: 500;">{{ member.name }}</span>
                    </div>
                  </td>
                  <td class="text-muted">{{ member.email }}</td>
                  <td>
                    <span class="badge" :class="member.role === 'Admin' ? 'badge-accent' : member.role === 'Reviewer' ? 'badge-info' : 'badge-public'">
                      {{ member.role }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-icon" @click="store.removeMember(selectedGroup.id, member.id)" title="Remove member">
                      <IconX :size="14" stroke-width="2" />
                    </button>
                  </td>
                </tr>
                <tr v-if="selectedGroup.members.length === 0">
                  <td colspan="4" style="text-align: center; padding: 32px; color: var(--color-text-muted);">
                    No members in this group yet. Click "Add Member" to get started.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <template v-else>
          <div class="card-body" style="display: flex; align-items: center; justify-content: center; min-height: 300px; color: var(--color-text-muted);">
            <div style="text-align: center;">
              <IconUsersGroup :size="48" stroke-width="1.2" style="margin-bottom: 12px; opacity: .4;" />
              <div>Select a group to view its members</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Create Group Modal -->
    <ModalDialog v-if="showCreateModal" title="Create New Group" @close="showCreateModal = false">
      <div class="form-group">
        <label class="form-label">Group Name</label>
        <input class="form-input" v-model="newGroupName" placeholder="e.g. Data Scientists" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-input" v-model="newGroupDesc" placeholder="Brief description..." />
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showCreateModal = false">Cancel</button>
        <button class="btn btn-primary" @click="createGroup" :disabled="!newGroupName.trim()">Create Group</button>
      </template>
    </ModalDialog>

    <!-- Add Member Modal -->
    <ModalDialog v-if="showAddMember" title="Add Member" @close="showAddMember = false">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input class="form-input" v-model="newMember.name" placeholder="e.g. Jane Smith" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" v-model="newMember.email" placeholder="e.g. jsmith@iu.edu" />
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-input" v-model="newMember.role">
          <option value="Member">Member</option>
          <option value="Admin">Admin</option>
          <option value="Reviewer">Reviewer</option>
        </select>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showAddMember = false">Cancel</button>
        <button class="btn btn-primary" @click="addMember" :disabled="!newMember.name.trim() || !newMember.email.trim()">Add Member</button>
      </template>
    </ModalDialog>

    <!-- Delete Confirmation Modal -->
    <ModalDialog v-if="showDeleteModal" title="Delete Group" @close="showDeleteModal = false">
      <p>Are you sure you want to delete <strong>{{ groupToDelete?.name }}</strong>? This action cannot be undone.</p>
      <template #footer>
        <button class="btn btn-outline" @click="showDeleteModal = false">Cancel</button>
        <button class="btn btn-danger" @click="deleteGroup">Delete Group</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useGroupsStore } from '../stores/groups'
import ModalDialog from '../components/ModalDialog.vue'
import {
  IconPlus, IconUsersGroup, IconTrash, IconX, IconUserPlus,
} from '@tabler/icons-vue'

const store = useGroupsStore()

const selectedGroup = ref(store.groups[0] || null)
const showCreateModal = ref(false)
const showAddMember = ref(false)
const showDeleteModal = ref(false)
const groupToDelete = ref(null)

const newGroupName = ref('')
const newGroupDesc = ref('')
const newMember = reactive({ name: '', email: '', role: 'Member' })

function createGroup() {
  if (newGroupName.value.trim()) {
    store.createGroup(newGroupName.value.trim(), newGroupDesc.value.trim())
    newGroupName.value = ''
    newGroupDesc.value = ''
    showCreateModal.value = false
  }
}

function addMember() {
  if (selectedGroup.value && newMember.name.trim() && newMember.email.trim()) {
    store.addMember(selectedGroup.value.id, { ...newMember })
    newMember.name = ''
    newMember.email = ''
    newMember.role = 'Member'
    showAddMember.value = false
  }
}

function confirmDelete(group) {
  groupToDelete.value = group
  showDeleteModal.value = true
}

function deleteGroup() {
  if (groupToDelete.value) {
    const id = groupToDelete.value.id
    if (selectedGroup.value?.id === id) {
      selectedGroup.value = store.groups.find(g => g.id !== id) || null
    }
    store.deleteGroup(id)
    showDeleteModal.value = false
    groupToDelete.value = null
  }
}
</script>

<style scoped>
.groups-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition);
}
.group-item:last-child { border-bottom: none; }
.group-item:hover { background: var(--color-bg); }
.group-item.active { background: var(--color-primary-bg); }

.group-item-info { display: flex; align-items: center; gap: 12px; }
.group-item-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary);
}
.group-item.active .group-item-icon {
  background: var(--color-primary);
  color: #fff;
}
.group-item-name { font-weight: 600; font-size: .92rem; }
.group-item-count { font-size: .78rem; color: var(--color-text-muted); }

.member-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 700;
  font-size: .72rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
</style>
