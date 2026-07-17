import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  SUPPORTS_DEV_OPEN_ACCESS,
  SUPPORTS_ASK_PATRA,
  SUPPORTS_AGENT_TOOLS,
  SUPPORTS_EDIT_RECORDS,
  SUPPORTS_DOMAIN_EXPERIMENTS,
} from '../config/api'

import DashboardView from '../views/DashboardView.vue'
import ModelDetailView from '../views/ModelDetailView.vue'
import DatasheetDetailView from '../views/DatasheetDetailView.vue'
import CatalogSearchView from '../views/CatalogSearchView.vue'
import ProfileAreaView from '../views/ProfileAreaView.vue'
import RecordMapView from '../views/RecordMapView.vue'
import StoryDetailView from '../views/StoryDetailView.vue'
import StoryPortalView from '../views/StoryPortalView.vue'
import StoryAdminView from '../views/StoryAdminView.vue'
import AgentToolkitView from '../features/agent-toolkit/AgentToolkitView.vue'
import AskPatraView from '../features/ask-patra/AskPatraView.vue'
import ExperimentsView from '../features/experiment-domains/ExperimentsView.vue'
import EditRecordsView from '../features/edit-records/EditRecordsView.vue'
import McpExplorerView from '../features/mcp-explorer/McpExplorerView.vue'
import SubmitView from '../views/SubmitView.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/search', name: 'CatalogSearch', component: CatalogSearchView },
  { path: '/modelcards', name: 'ExploreModelCards', redirect: { name: 'CatalogSearch', query: { type: 'model' } } },
  { path: '/modelcard/:uuid', name: 'ModelDetail', component: ModelDetailView },
  { path: '/datasheets', name: 'ExploreDatasheets', redirect: { name: 'CatalogSearch', query: { type: 'datasheet' } } },
  { path: '/datasheet/:uuid', name: 'DatasheetDetail', component: DatasheetDetailView },
  { path: '/record-map', name: 'RecordMap', component: RecordMapView },
  { path: '/story-portal', name: 'StoryPortal', component: StoryPortalView },
  { path: '/story-admin', name: 'StoryAdmin', component: StoryAdminView },
  { path: '/stories/:slug', name: 'ResourceStory', component: StoryDetailView },
  { path: '/my-collections', name: 'MyCollections', component: ProfileAreaView, props: { area: 'collections' }, meta: { tapis: true } },
  { path: '/my-submissions', name: 'MySubmissions', component: ProfileAreaView, props: { area: 'submissions' }, meta: { tapis: true } },
  { path: '/notifications', name: 'Notifications', component: ProfileAreaView, props: { area: 'notifications' }, meta: { tapis: true } },
  { path: '/account', name: 'AccountProfile', component: ProfileAreaView, props: { area: 'account' }, meta: { tapis: true } },
  { path: '/ask-patra', name: 'AskPatra', component: AskPatraView, meta: { feature: 'askPatra', tapis: true } },
  { path: '/agent-tools', name: 'AgentTools', component: AgentToolkitView, meta: { feature: 'agentTools', tapis: true } },
  { path: '/mcp-explorer', name: 'McpExplorer', component: McpExplorerView, meta: { feature: 'mcpExplorer' } },
  { path: '/animal-ecology', name: 'AnimalEcology', component: ExperimentsView, props: { domain: 'animal-ecology' }, meta: { feature: 'domainExperiments' } },
  { path: '/digital-agriculture', name: 'DigitalAgriculture', component: ExperimentsView, props: { domain: 'digital-ag' }, meta: { feature: 'domainExperiments' } },
  { path: '/edit-records', name: 'EditRecords', component: EditRecordsView, meta: { feature: 'editRecords', tapis: true } },
  { path: '/edit-assets', redirect: { name: 'EditRecords' } },
  { path: '/explore', redirect: { name: 'CatalogSearch' } },
  { path: '/submit', name: 'Submit', component: SubmitView, meta: { tapis: true } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'Dashboard' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 16, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  if (SUPPORTS_DEV_OPEN_ACCESS) return true
  if (to.meta.tapis && !auth.isTapisUser) return { name: 'Dashboard' }
  if (to.meta.feature === 'askPatra' && !SUPPORTS_ASK_PATRA) return { name: 'Dashboard' }
  if (to.meta.feature === 'agentTools' && !SUPPORTS_AGENT_TOOLS) return { name: 'Dashboard' }
  if (to.meta.feature === 'editRecords' && !SUPPORTS_EDIT_RECORDS) return { name: 'Dashboard' }
  if (to.meta.feature === 'domainExperiments' && !SUPPORTS_DOMAIN_EXPERIMENTS) return { name: 'Dashboard' }
  return true
})

export default router
