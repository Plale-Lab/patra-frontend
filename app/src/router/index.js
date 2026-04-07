import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'

import DashboardView from '../views/DashboardView.vue'
import ModelsView from '../views/ModelsView.vue'
import AuditLogView from '../views/AuditLogView.vue'
import SettingsView from '../views/SettingsView.vue'
import ExploreView from '../views/ExploreView.vue'
import ExploreDatasheetView from '../views/ExploreDatasheetView.vue'
import ModelDetailView from '../views/ModelDetailView.vue'
import DatasheetDetailView from '../views/DatasheetDetailView.vue'
import AgentToolkitView from '../features/agent-toolkit/AgentToolkitView.vue'
import AskPatraView from '../features/ask-patra/AskPatraView.vue'
import AutomatedIngestionView from '../features/automated-ingestion/AutomatedIngestionView.vue'
import ExperimentsView from '../features/experiment-domains/ExperimentsView.vue'
import EditRecordsView from '../features/edit-records/EditRecordsView.vue'
import McpExplorerView from '../features/mcp-explorer/McpExplorerView.vue'
import SubmitView from '../views/SubmitView.vue'
import ExperimentsView from '../views/ExperimentsView.vue'
import TicketSubmitView from '../views/TicketSubmitView.vue'
import TicketManagementView from '../views/TicketManagementView.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/explore-model-cards', name: 'ExploreModelCards', component: ExploreView },
  { path: '/explore-model-cards/:id', name: 'ModelDetail', component: ModelDetailView },
  { path: '/explore-datasheets', name: 'ExploreDatasheets', component: ExploreDatasheetView },
  { path: '/explore-datasheets/:id', name: 'DatasheetDetail', component: DatasheetDetailView },
  { path: '/ask-patra', name: 'AskPatra', component: AskPatraView, meta: { feature: 'askPatra', tapis: true } },
  { path: '/agent-tools', name: 'AgentTools', component: AgentToolkitView, meta: { feature: 'agentTools', tapis: true } },
  { path: '/mcp-explorer', name: 'McpExplorer', component: McpExplorerView, meta: { feature: 'mcpExplorer' } },
  { path: '/animal-ecology', name: 'AnimalEcology', component: ExperimentsView, props: { domain: 'animal-ecology' }, meta: { feature: 'domainExperiments' } },
  { path: '/digital-agriculture', name: 'DigitalAgriculture', component: ExperimentsView, props: { domain: 'digital-ag' }, meta: { feature: 'domainExperiments' } },
  { path: '/record-scrape', name: 'RecordScrape', component: AutomatedIngestionView, meta: { feature: 'automatedIngestion', admin: true } },
  { path: '/automated-ingestion', redirect: { name: 'RecordScrape' } },
  { path: '/edit-records', name: 'EditRecords', component: EditRecordsView, meta: { feature: 'editRecords', privileged: true } },
  { path: '/edit-assets', redirect: { name: 'EditRecords' } },
  { path: '/explore', redirect: { name: 'ExploreModelCards' } },
  { path: '/explore/:id', redirect: (to) => ({ name: 'ModelDetail', params: { id: to.params.id } }) },
  { path: '/submit', name: 'Submit', component: SubmitView, meta: { tapis: true } },
  { path: '/tickets', name: 'Tickets', component: TicketSubmitView, meta: { tapis: true } },
  { path: '/models', name: 'Models', component: ModelsView, meta: { admin: true } },
  { path: '/submissions', name: 'SubmissionsReview', component: SubmissionsReviewView, meta: { admin: true } },
  { path: '/ticket-management', name: 'TicketManagement', component: TicketManagementView, meta: { admin: true } },
  { path: '/audit-log', name: 'AuditLog', component: AuditLogView, meta: { admin: true } },
  { path: '/settings', name: 'Settings', component: SettingsView, meta: { admin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const apiMode = useApiModeStore()
  if (apiMode.supportsDevOpenAccess) return true
  if (to.meta.admin && !auth.isAdmin) return { name: 'Dashboard' }
  if (to.meta.tapis && !auth.isTapisUser) return { name: 'Dashboard' }
  if (to.meta.feature === 'askPatra' && !apiMode.supportsAskPatra) return { name: 'Dashboard' }
  if (to.meta.feature === 'agentTools' && !apiMode.supportsAgentTools) return { name: 'Dashboard' }
  if (to.meta.feature === 'automatedIngestion' && !apiMode.supportsAutomatedIngestion) return { name: 'Dashboard' }
  if (to.meta.feature === 'editRecords' && !apiMode.supportsEditRecords) return { name: 'Dashboard' }
  if (to.meta.privileged && !(auth.isTapisUser || auth.isAdmin)) return { name: 'Dashboard' }
  return true
})

export default router
