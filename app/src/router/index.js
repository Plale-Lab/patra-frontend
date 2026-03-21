import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import DashboardView from '../views/DashboardView.vue'
import ModelsView from '../views/ModelsView.vue'
// import GroupsView from '../views/GroupsView.vue'            // Commented out — future feature
import AuditLogView from '../views/AuditLogView.vue'
import SettingsView from '../views/SettingsView.vue'
import ExploreView from '../views/ExploreView.vue'
import ExploreDatasheetView from '../views/ExploreDatasheetView.vue'
import ModelDetailView from '../views/ModelDetailView.vue'
import DatasheetDetailView from '../views/DatasheetDetailView.vue'
import AgentToolsView from '../views/AgentToolsView.vue'
import SubmitView from '../views/SubmitView.vue'
import TicketSubmitView from '../views/TicketSubmitView.vue'
import SubmissionsReviewView from '../views/SubmissionsReviewView.vue'
import TicketManagementView from '../views/TicketManagementView.vue'
// import UserManagementView from '../views/UserManagementView.vue'  // Commented out — future feature

const routes = [
    // Open-access routes (anyone)
    { path: '/', name: 'Dashboard', component: DashboardView },
    { path: '/explore-model-cards', name: 'ExploreModelCards', component: ExploreView },
    { path: '/explore-model-cards/:id', name: 'ModelDetail', component: ModelDetailView },
    { path: '/explore-datasheets', name: 'ExploreDatasheets', component: ExploreDatasheetView },
    { path: '/explore-datasheets/:id', name: 'DatasheetDetail', component: DatasheetDetailView },
    { path: '/agent-tools', name: 'AgentTools', component: AgentToolsView },
    { path: '/explore', redirect: { name: 'ExploreModelCards' } },
    { path: '/explore/:id', redirect: (to) => ({ name: 'ModelDetail', params: { id: to.params.id } }) },
    { path: '/submit', name: 'Submit', component: SubmitView },
    { path: '/tickets', name: 'Tickets', component: TicketSubmitView },

    // Admin routes (require login as admin)
    { path: '/models', name: 'Models', component: ModelsView, meta: { admin: true } },
    { path: '/submissions', name: 'SubmissionsReview', component: SubmissionsReviewView, meta: { admin: true } },
    { path: '/ticket-management', name: 'TicketManagement', component: TicketManagementView, meta: { admin: true } },
    // { path: '/users', name: 'UserManagement', component: UserManagementView, meta: { admin: true } },  // Future
    // { path: '/groups', name: 'Groups', component: GroupsView, meta: { admin: true } },                  // Future
    { path: '/audit-log', name: 'AuditLog', component: AuditLogView, meta: { admin: true } },
    { path: '/settings', name: 'Settings', component: SettingsView, meta: { admin: true } },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// No login required for open routes
// Admin routes redirect to dashboard if not admin
router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.admin && !auth.isAdmin) return { name: 'Dashboard' }
    return true
})

export default router
