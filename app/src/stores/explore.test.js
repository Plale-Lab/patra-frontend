import { describe, expect, it } from 'vitest'
import { normalizeDatasheet, normalizeModel } from './explore'

describe('explore record identity normalization', () => {
  it('uses the production mc_id for model-card routing', () => {
    expect(normalizeModel({
      mc_id: 43,
      name: 'BioCLIP 2',
    })).toMatchObject({
      id: 43,
      uuid: 43,
      external_id: 43,
    })
  })

  it('uses the production identifier for datasheet routing', () => {
    expect(normalizeDatasheet({
      identifier: 1,
      title: 'Example dataset',
    })).toMatchObject({
      id: 1,
      uuid: 1,
      identifier: 1,
    })
  })

  it('preserves explicit UUIDs when newer API payloads provide them', () => {
    expect(normalizeModel({
      id: 43,
      uuid: 'model-uuid',
    }).uuid).toBe('model-uuid')

    expect(normalizeDatasheet({
      identifier: 1,
      uuid: 'datasheet-uuid',
    }).uuid).toBe('datasheet-uuid')
  })
})
