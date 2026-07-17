import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { logUiEvent } from '../lib/uiLogger'

const STORAGE_KEY = 'patra.saved-record-set.v1'
const MAX_RECORDS = 5

function readStoredRecords() {
  if (typeof window === 'undefined') return []
  try {
    const records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(records) ? records.slice(0, MAX_RECORDS) : []
  } catch {
    return []
  }
}

function encodeRecords(records) {
  const bytes = new TextEncoder().encode(JSON.stringify(records))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeRecords(token) {
  if (!token || String(token).length > 12_000) throw new Error('Invalid shared set token')
  const base64 = String(token || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const records = JSON.parse(new TextDecoder().decode(bytes))
  return Array.isArray(records) ? records.slice(0, MAX_RECORDS) : []
}

function isValidRecord(record) {
  if (!record || typeof record !== 'object') return false
  if (typeof record.key !== 'string' || typeof record.title !== 'string' || typeof record.route !== 'string') return false
  if (!['model', 'datasheet'].includes(record.type) || record.title.length > 240 || record.route.length > 500) return false
  const expectedPrefix = record.type === 'model' ? '/modelcard/' : '/datasheet/'
  return record.key.startsWith(`${record.type}:`) && record.route.startsWith(expectedPrefix)
}

export const useSavedSetStore = defineStore('saved-set', () => {
  const records = ref(readStoredRecords().filter(isValidRecord))
  const count = computed(() => records.value.length)
  const isFull = computed(() => count.value >= MAX_RECORDS)

  function persist() {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  function contains(key) {
    return records.value.some((record) => record.key === key)
  }

  function add(record) {
    if (!isValidRecord(record) || contains(record.key) || isFull.value) return false
    records.value.push({
      key: record.key,
      type: record.type,
      id: String(record.id || ''),
      title: record.title,
      subtitle: String(record.subtitle || ''),
      route: record.route,
    })
    persist()
    logUiEvent('saved-set-record-add', { recordType: record.type, setSize: count.value })
    return true
  }

  function remove(key) {
    const record = records.value.find((item) => item.key === key)
    records.value = records.value.filter((item) => item.key !== key)
    persist()
    if (record) logUiEvent('saved-set-record-remove', { recordType: record.type, setSize: count.value })
  }

  function toggle(record) {
    if (contains(record.key)) {
      remove(record.key)
      return false
    }
    return add(record)
  }

  function clear() {
    records.value = []
    persist()
    logUiEvent('saved-set-clear')
  }

  function shareToken() {
    return encodeRecords(records.value)
  }

  function hydrateFromShareToken(token) {
    try {
      const decoded = decodeRecords(token).filter(isValidRecord)
      if (!decoded.length) return false
      records.value = decoded
      persist()
      logUiEvent('saved-set-shared-open', { setSize: count.value })
      return true
    } catch {
      return false
    }
  }

  return { records, count, isFull, contains, add, remove, toggle, clear, shareToken, hydrateFromShareToken }
})
