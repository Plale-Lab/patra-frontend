import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  API_MODES,
  getApiBaseUrl,
  getApiModeMeta,
  getStoredApiMode,
  isApiMode,
  SHOW_API_MODE,
  setStoredApiMode,
} from '../config/api'

export const useApiModeStore = defineStore('apiMode', () => {
  const mode = ref(getStoredApiMode())

  const options = API_MODES.map((value) => ({
    value,
    label: getApiModeMeta(value).label,
    shortLabel: getApiModeMeta(value).shortLabel,
  }))

  const meta = computed(() => getApiModeMeta(mode.value))
  const apiBaseUrl = computed(() => getApiBaseUrl(mode.value))
  const displayLabel = computed(() => meta.value.label)
  const shortLabel = computed(() => meta.value.shortLabel)
  const description = computed(() => meta.value.description)
  const helpText = computed(() => meta.value.helpText)
  const isMockMode = computed(() => mode.value === 'mock')
  const supportsTickets = computed(() => Boolean(meta.value.supportsTickets))
  const supportsSubmissionQueue = computed(() => Boolean(meta.value.supportsSubmissionQueue))
  const supportsAgentTools = computed(() => Boolean(meta.value.supportsAgentTools))
  const supportsEditRecords = computed(() => Boolean(meta.value.supportsEditRecords))
  const supportsAutomatedIngestion = computed(() => Boolean(meta.value.supportsAutomatedIngestion))
  const supportsAskPatra = computed(() => Boolean(meta.value.supportsAskPatra))
  const supportsIntentSchema = computed(() => Boolean(meta.value.supportsIntentSchema))
  const supportsMetadataDiscovery = computed(() => Boolean(meta.value.supportsMetadataDiscovery))
  const supportsDatasetAssembly = computed(() => Boolean(meta.value.supportsDatasetAssembly))
  const supportsTrainingReadiness = computed(() => Boolean(meta.value.supportsTrainingReadiness))
  const supportsBaselineTrainingStub = computed(() => Boolean(meta.value.supportsBaselineTrainingStub))
  const supportsMvpDemoReport = computed(() => Boolean(meta.value.supportsMvpDemoReport))
  const supportsMcpExplorer = computed(() => Boolean(meta.value.supportsMcpExplorer))
  const supportsDomainExperiments = computed(() => Boolean(meta.value.supportsDomainExperiments))
  const supportsDevOpenAccess = computed(() => Boolean(meta.value.supportsDevOpenAccess))

  function setMode(nextMode) {
    if (!isApiMode(nextMode)) return
    mode.value = nextMode
    setStoredApiMode(nextMode)
  }

  return {
    mode,
    options,
    apiBaseUrl,
    displayLabel,
    shortLabel,
    description,
    helpText,
    isMockMode,
    supportsTickets,
    supportsSubmissionQueue,
    supportsAgentTools,
    supportsEditRecords,
    supportsAutomatedIngestion,
    supportsAskPatra,
    supportsIntentSchema,
    supportsMetadataDiscovery,
    supportsDatasetAssembly,
    supportsTrainingReadiness,
    supportsBaselineTrainingStub,
    supportsMvpDemoReport,
    supportsMcpExplorer,
    supportsDomainExperiments,
    supportsDevOpenAccess,
    showSelector: SHOW_API_MODE,
    setMode,
  }
})
