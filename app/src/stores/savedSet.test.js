import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSavedSetStore } from './savedSet'

const record = (index) => ({
  key: `model:${index}`,
  type: 'model',
  id: String(index),
  title: `Model ${index}`,
  subtitle: 'Test model',
  route: `/modelcard/${index}`,
})

describe('saved record set', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('persists a bounded five-record working set', () => {
    const store = useSavedSetStore()
    for (let index = 1; index <= 6; index += 1) store.add(record(index))

    expect(store.count).toBe(5)
    expect(store.isFull).toBe(true)
    expect(store.contains('model:6')).toBe(false)
    expect(JSON.parse(window.localStorage.getItem('patra.saved-record-set.v1'))).toHaveLength(5)
  })

  it('round-trips a share token without adding unsupported fields', () => {
    const source = useSavedSetStore()
    source.add(record(1))
    const token = source.shareToken()

    window.localStorage.clear()
    setActivePinia(createPinia())
    const target = useSavedSetStore()

    expect(target.hydrateFromShareToken(token)).toBe(true)
    expect(target.records).toEqual([record(1)])
  })

  it('rejects a shared set whose route does not match its record type', () => {
    const unsafe = [{ ...record(1), route: 'https://example.com/redirect' }]
    const bytes = new TextEncoder().encode(JSON.stringify(unsafe))
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    const token = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

    const store = useSavedSetStore()
    expect(store.hydrateFromShareToken(token)).toBe(false)
    expect(store.records).toEqual([])
  })
})
