import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  API_MODES,
  getApiBaseUrl,
  getApiModeMeta,
  getStoredApiMode,
  isApiMode,
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
    setMode,
  }
})
