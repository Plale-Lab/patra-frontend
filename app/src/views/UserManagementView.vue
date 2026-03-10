<template>
  <div>
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>User Management</h1>
        <p>Manage users, roles, and group assignments</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        <IconUserPlus :size="16" stroke-width="1.8" /> Add User
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
          <IconUsers :size="22" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ usersList.length }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-accent-bg); color: #c68200;">
          <IconShieldCheck :size="22" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ adminCount }}</div>
          <div class="stat-label">Admins</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-success-bg); color: var(--color-success);">
          <IconUsersGroup :size="22" stroke-width="1.8" />
        </div>
        <div>
          <div class="stat-value">{{ groupNames.length }}</div>
          <div class="stat-label">Groups</div>
        </div>
      </div>
    </div>

    <!-- User Table -->
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Group</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usersList" :key="u.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ getInitials(u.name) }}</div>
                  <span>{{ u.name }}</span>
                </div>
              </td>
              <td class="text-muted">{{ u.email }}</td>
              <td>
                <span class="badge" :class="u.role === 'admin' ? 'badge-info' : 'badge-public'">{{ u.role }}</span>
              </td>
              <td>
                <span class="badge badge-accent" v-if="u.group">{{ u.group }}</span>
                <span class="text-muted" v-else>—</span>
              </td>
              <td>
                <span class="status-dot" :class="u.status === 'active' ? 'active' : 'inactive'"></span>
                {{ u.status }}
              </td>
              <td class="text-muted text-sm">{{ formatDate(u.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-outline btn-sm" @click="openEdit(u)">Edit</button>
                  <button class="btn btn-sm btn-danger-outline" @click="confirmDelete(u)" :disabled="u.id === auth.user?.id">
                    <IconTrash :size="14" stroke-width="1.8" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" v-if="usersList.length === 0">
          <IconUsers :size="40" stroke-width="1.2" />
          <span>No users found</span>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <span>Add New User</span>
            <button class="btn-icon" @click="showAddModal = false"><IconX :size="18" /></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" v-model="addForm.name" placeholder="Jane Smith" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" v-model="addForm.email" placeholder="jane@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" v-model="addForm.password" placeholder="Initial password" />
            </div>
            <div class="form-row-half">
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-input" v-model="addForm.role">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Group</label>
                <select class="form-input" v-model="addForm.group">
                  <option value="">No group</option>
                  <option v-for="g in groupNames" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>
            <div class="modal-error" v-if="addError">{{ addError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddModal = false">Cancel</button>
            <button class="btn btn-primary" @click="handleAdd" :disabled="!addForm.name || !addForm.email">
              <IconUserPlus :size="16" stroke-width="1.8" /> Create User
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="editUser" @click.self="editUser = null">
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <span>Edit — {{ editUser.name }}</span>
            <button class="btn-icon" @click="editUser = null"><IconX :size="18" /></button>
          </div>
          <div class="modal-body">
            <div class="form-row-half">
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-input" v-model="editForm.role">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Group</label>
                <select class="form-input" v-model="editForm.group">
                  <option value="">No group</option>
                  <option v-for="g in groupNames" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" v-model="editForm.status">
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="editUser = null">Cancel</button>
            <button class="btn btn-primary" @click="handleEdit">
              <IconDeviceFloppy :size="16" stroke-width="1.8" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header"><span>Confirm Delete</span></div>
          <div class="modal-body">
            <p>Are you sure you want to remove <strong>{{ deleteTarget.name }}</strong> ({{ deleteTarget.email }})?</p>
            <p class="text-muted text-sm">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" @click="handleDelete">
              <IconTrash :size="16" stroke-width="1.8" /> Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../lib/api'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconUserPlus, IconUsers, IconShieldCheck, IconUsersGroup,
  IconTrash, IconX, IconDeviceFloppy,
} from '@tabler/icons-vue'
const auth = useAuthStore()
const apiMode = useApiModeStore()

const usersList = ref([])
const groupNames = ref([])
const showAddModal = ref(false)
const editUser = ref(null)
const deleteTarget = ref(null)
const addError = ref('')

const addForm = reactive({ name: '', email: '', password: '', role: 'user', group: '' })
const editForm = reactive({ role: 'user', group: '', status: 'active' })

const adminCount = computed(() => usersList.value.filter(u => u.role === 'admin').length)

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function fetchUsers() {
  const res = await apiFetch('/users')
  usersList.value = await res.json()
}
async function fetchGroups() {
  const res = await apiFetch('/groups')
  groupNames.value = await res.json()
}

async function handleAdd() {
  addError.value = ''
  const res = await apiFetch('/users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addForm),
  })
  if (!res.ok) { const d = await res.json(); addError.value = d.error; return }
  const u = await res.json()
  usersList.value.push(u)
  showAddModal.value = false
  Object.assign(addForm, { name: '', email: '', password: '', role: 'user', group: '' })
}

function openEdit(u) {
  editUser.value = u
  Object.assign(editForm, { role: u.role, group: u.group, status: u.status })
}

async function handleEdit() {
  const res = await apiFetch(`/users/${editUser.value.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editForm),
  })
  const updated = await res.json()
  const idx = usersList.value.findIndex(u => u.id === updated.id)
  if (idx !== -1) usersList.value[idx] = updated
  editUser.value = null
}

function confirmDelete(u) { deleteTarget.value = u }

async function handleDelete() {
  await apiFetch(`/users/${deleteTarget.value.id}`, { method: 'DELETE' })
  usersList.value = usersList.value.filter(u => u.id !== deleteTarget.value.id)
  deleteTarget.value = null
}

function loadUsersAndGroups() {
  fetchUsers()
  fetchGroups()
}

onMounted(loadUsersAndGroups)
watch(() => apiMode.mode, loadUsersAndGroups)
</script>

<style scoped>
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--color-primary-bg); color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 700;
}

.status-dot {
  display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; margin-right: 4px;
}
.status-dot.active { background: var(--color-success); }
.status-dot.inactive { background: var(--color-danger); }

.action-btns { display: flex; gap: 6px; }
.btn-danger-outline {
  border: 1px solid var(--color-danger); color: var(--color-danger);
  background: transparent; border-radius: var(--radius-sm);
  padding: 4px 8px; cursor: pointer; display: inline-flex; align-items: center;
  transition: all var(--transition);
}
.btn-danger-outline:hover:not(:disabled) { background: var(--color-danger-bg); }
.btn-danger-outline:disabled { opacity: .3; cursor: not-allowed; }

.form-row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.modal-error {
  padding: 10px; border-radius: var(--radius-sm);
  background: var(--color-danger-bg); color: var(--color-danger);
  font-size: .82rem; margin-top: 8px;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 160px; color: var(--color-text-muted); gap: 8px;
}
</style>
