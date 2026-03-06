<template>
  <div>
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Submission Review</h1>
        <p>Review and approve pending model card and datasheet submissions</p>
      </div>
      <div class="flex items-center gap-8" v-if="store.pendingCount > 0">
        <span class="pending-badge">{{ store.pendingCount }} pending</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <div class="filter-chips">
        <button class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">All ({{ store.submissions.length }})</button>
        <button class="chip" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">
          <IconClock :size="14" stroke-width="1.8" /> Pending
        </button>
        <button class="chip" :class="{ active: filter === 'approved' }" @click="filter = 'approved'">
          <IconCheck :size="14" stroke-width="1.8" /> Approved
        </button>
        <button class="chip" :class="{ active: filter === 'rejected' }" @click="filter = 'rejected'">
          <IconX :size="14" stroke-width="1.8" /> Rejected
        </button>
      </div>
    </div>

    <!-- Submissions List -->
    <div class="submissions-list">
      <div class="card sub-card" v-for="sub in filteredSubmissions" :key="sub.id">
        <div class="sub-top">
          <div class="sub-info">
            <div class="flex items-center gap-8">
              <span class="badge" :class="sub.type === 'model_card' ? 'badge-info' : 'badge-accent'">
                {{ sub.type === 'model_card' ? 'Model Card' : 'Datasheet' }}
              </span>
              <span class="badge" :class="subStatusClass(sub.status)">{{ sub.status }}</span>
              <span class="sub-id">{{ sub.id }}</span>
            </div>
            <h3 class="sub-name">{{ sub.data.name || 'Untitled' }}</h3>
            <p class="sub-desc">{{ sub.data.short_description || sub.data.description || '—' }}</p>
            <div class="sub-meta">
              <span><IconUser :size="13" stroke-width="1.8" /> {{ sub.submitted_by }}</span>
              <span><IconClock :size="13" stroke-width="1.8" /> {{ formatDate(sub.submitted_at) }}</span>
              <span v-if="sub.data.category"><IconTag :size="13" stroke-width="1.8" /> {{ sub.data.category }}</span>
              <span v-if="sub.data.framework"><IconCode :size="13" stroke-width="1.8" /> {{ sub.data.framework }}</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" @click="expandedId = expandedId === sub.id ? null : sub.id">
            {{ expandedId === sub.id ? 'Hide Details' : 'View Details' }}
          </button>
        </div>

        <!-- Expanded -->
        <transition name="expand">
          <div class="sub-details" v-if="expandedId === sub.id">
            <div class="detail-grid">
              <div class="detail-item" v-for="(val, key) in sub.data" :key="key">
                <span class="detail-key">{{ formatKey(key) }}</span>
                <span class="detail-val">{{ Array.isArray(val) ? val.join(', ') : val }}</span>
              </div>
            </div>

            <div class="review-row" v-if="sub.reviewed_by">
              <div class="review-info">
                <IconUserCheck :size="14" stroke-width="1.8" />
                Reviewed by <strong>{{ sub.reviewed_by }}</strong> on {{ formatDate(sub.reviewed_at) }}
              </div>
              <div class="review-notes" v-if="sub.admin_notes">{{ sub.admin_notes }}</div>
            </div>

            <!-- Admin Actions (for pending) -->
            <div class="action-section" v-if="sub.status === 'pending'">
              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label">Admin Notes</label>
                <textarea class="form-input" v-model="reviewNotes[sub.id]" rows="2" placeholder="Optional notes for the submitter…" style="resize: vertical;"></textarea>
              </div>
              <div class="flex gap-12">
                <button class="btn btn-approve" @click="handleReview(sub.id, 'approved')">
                  <IconCheck :size="16" stroke-width="2" /> Approve
                </button>
                <button class="btn btn-danger" @click="handleReview(sub.id, 'rejected')">
                  <IconX :size="16" stroke-width="2" /> Reject
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="filteredSubmissions.length === 0">
        <IconInbox :size="48" stroke-width="1.2" />
        <h3>No submissions</h3>
        <p>No {{ filter === 'all' ? '' : filter }} submissions to display.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useSubmissionsStore } from '../stores/submissions'
import {
  IconClock, IconCheck, IconX, IconUser, IconTag, IconCode,
  IconUserCheck, IconInbox,
} from '@tabler/icons-vue'

const store = useSubmissionsStore()
const filter = ref('all')
const expandedId = ref(null)
const reviewNotes = reactive({})

const filteredSubmissions = computed(() => {
  if (filter.value === 'all') return store.submissions
  return store.submissions.filter(s => s.status === filter.value)
})

function subStatusClass(status) {
  if (status === 'pending') return 'badge-accent'
  if (status === 'approved') return 'badge-public'
  if (status === 'rejected') return 'badge-private'
  return ''
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatKey(key) {
  return String(key).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

async function handleReview(id, status) {
  await store.reviewSubmission(id, status, reviewNotes[id] || '')
}

onMounted(() => { if (store.submissions.length === 0) store.fetchSubmissions() })
</script>

<style scoped>
.filter-row { margin-bottom: 20px; }
.filter-chips { display: flex; gap: 6px; }
.pending-badge {
  background: var(--color-accent-bg); color: #c68200;
  font-weight: 700; font-size: .82rem;
  padding: 5px 14px; border-radius: 20px;
}

.sub-card { margin-bottom: 14px; overflow: hidden; }
.sub-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 22px;
}
.sub-info { flex: 1; }
.sub-id { font-size: .72rem; font-family: monospace; color: var(--color-text-muted); }
.sub-name { font-size: 1.05rem; font-weight: 700; margin: 8px 0 4px; }
.sub-desc { font-size: .85rem; color: var(--color-text-secondary); margin-bottom: 8px; }
.sub-meta {
  display: flex; gap: 14px; font-size: .75rem; color: var(--color-text-muted);
}
.sub-meta span { display: flex; align-items: center; gap: 4px; }

.sub-details {
  padding: 0 22px 22px;
  border-top: 1px solid var(--color-border);
  padding-top: 18px;
}

.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-bottom: 16px;
}
.detail-item { display: flex; flex-direction: column; gap: 1px; }
.detail-key { font-size: .7rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); letter-spacing: .4px; }
.detail-val { font-size: .88rem; }

.review-row {
  background: var(--color-bg); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px;
}
.review-info { font-size: .82rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; }
.review-notes { font-size: .85rem; color: var(--color-text); margin-top: 6px; font-style: italic; }

.action-section { border-top: 1px solid var(--color-border); padding-top: 14px; }
.btn-approve {
  background: var(--color-success-bg); color: var(--color-success); border: none;
  padding: 8px 20px; border-radius: var(--radius-sm); font-weight: 600; font-size: .88rem;
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  transition: all var(--transition);
}
.btn-approve:hover { background: var(--color-success); color: #fff; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 200px; color: var(--color-text-muted); gap: 8px;
}
.empty-state h3 { font-size: 1.05rem; color: var(--color-text-secondary); }
.empty-state p { font-size: .85rem; }

.expand-enter-active, .expand-leave-active { transition: all .2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
</style>
