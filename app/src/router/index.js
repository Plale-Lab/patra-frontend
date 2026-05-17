import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useApiModeStore } from '../stores/apiMode'

import DashboardView from '../views/DashboardView.vue'
import ExploreView from '../views/ExploreView.vue'
import ExploreDatasheetView from '../views/ExploreDatasheetView.vue'
import ModelDetailView from '../views/ModelDetailView.vue'
import DatasheetDetailView from '../views/DatasheetDetailView.vue'
import AgentToolkitView from '../features/agent-toolkit/AgentToolkitView.vue'
import AskPatraView from '../features/ask-patra/AskPatraView.vue'
import ExperimentsView from '../features/experiment-domains/ExperimentsView.vue'
import EditRecordsView from '../features/edit-records/EditRecordsView.vue'
import McpExplorerView from '../features/mcp-explorer/McpExplorerView.vue'
import SubmitView from '../views/SubmitView.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/modelcards', name: 'ExploreModelCards', component: ExploreView },
  { path: '/modelcard/:uuid', name: 'ModelDetail', component: ModelDetailView },
  { path: '/datasheets', name: 'ExploreDatasheets', component: ExploreDatasheetView },
  { path: '/datasheet/:uuid', name: 'DatasheetDetail', component: DatasheetDetailView },
  { path: '/ask-patra', name: 'AskPatra', component: AskPatraView, meta: { feature: 'askPatra', tapis: true } },
  { path: '/agent-tools', name: 'AgentTools', component: AgentToolkitView, meta: { feature: 'agentTools', tapis: true } },
  { path: '/mcp-explorer', name: 'McpExplorer', component: McpExplorerView, meta: { feature: 'mcpExplorer' } },
  { path: '/animal-ecology', name: 'AnimalEcology', component: ExperimentsView, props: { domain: 'animal-ecology' }, meta: { feature: 'domainExperiments' } },
  { path: '/digital-agriculture', name: 'DigitalAgriculture', component: ExperimentsView, props: { domain: 'digital-ag' }, meta: { feature: 'domainExperiments' } },
  { path: '/edit-records', name: 'EditRecords', component: EditRecordsView, meta: { feature: 'editRecords', privileged: true } },
  { path: '/edit-assets', redirect: { name: 'EditRecords' } },
  { path: '/explore', redirect: { name: 'ExploreModelCards' } },
  { path: '/submit', name: 'Submit', component: SubmitView, meta: { tapis: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const apiMode = useApiModeStore()
  if (apiMode.supportsDevOpenAccess) return true
  if (to.meta.tapis && !auth.isTapisUser) return { name: 'Dashboard' }
  if (to.meta.feature === 'askPatra' && !apiMode.supportsAskPatra) return { name: 'Dashboard' }
  if (to.meta.feature === 'agentTools' && !apiMode.supportsAgentTools) return { name: 'Dashboard' }
  if (to.meta.feature === 'editRecords' && !apiMode.supportsEditRecords) return { name: 'Dashboard' }
  if (to.meta.feature === 'domainExperiments' && !apiMode.supportsDomainExperiments) return { name: 'Dashboard' }
  if (to.meta.privileged && !(auth.isTapisUser || auth.isAdmin)) return { name: 'Dashboard' }
  return true
})

export default router
