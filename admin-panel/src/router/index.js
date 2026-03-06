import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import DashboardView from '../views/DashboardView.vue'
import ModelsView from '../views/ModelsView.vue'
// import GroupsView from '../views/GroupsView.vue'            // Commented out — future feature
import AuditLogView from '../views/AuditLogView.vue'
import SettingsView from '../views/SettingsView.vue'
import ExploreView from '../views/ExploreView.vue'
import ModelDetailView from '../views/ModelDetailView.vue'
import SubmitView from '../views/SubmitView.vue'
import TicketSubmitView from '../views/TicketSubmitView.vue'
import SubmissionsReviewView from '../views/SubmissionsReviewView.vue'
import TicketManagementView from '../views/TicketManagementView.vue'
// import UserManagementView from '../views/UserManagementView.vue'  // Commented out — future feature

const routes = [
    // Open-access routes (anyone)
    { path: '/', name: 'Dashboard', component: DashboardView },
    { path: '/explore', name: 'Explore', component: ExploreView },
    { path: '/explore/:id', name: 'ModelDetail', component: ModelDetailView },
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
