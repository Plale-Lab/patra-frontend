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
    showSelector: SHOW_API_MODE,
    setMode,
  }
})
