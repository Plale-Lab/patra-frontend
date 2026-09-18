import { describe, expect, it } from 'vitest'
import { buildDatasheetPayload, buildModelCardPayload } from './assetPayloads'

describe('asset creator identity payloads', () => {
  it('keeps a model author separate from card creator identity', () => {
    const payload = buildModelCardPayload({
      name: 'Example model', version: '', short_description: '', full_description: '',
      category: '', input_type: '', author: 'Model Author', creator_tapis_id: 'swathivm',
      creator_name: 'Swathi Vallabhajosyula', keywords: '', foundational_model: '',
      input_data: '', output_data: '', citation: '', documentation: '', location: '',
      framework: '', license: '', test_accuracy: '', is_private: false, is_gated: false,
    })

    expect(payload).toMatchObject({
      author: 'Model Author',
      creator_tapis_id: 'swathivm',
      creator_name: 'Swathi Vallabhajosyula',
    })
  })

  it('maps the datasheet Author field to its DataCite creator record', () => {
    const payload = buildDatasheetPayload({
      title: 'Example dataset', version: '', description: '', author: 'Dataset Author',
      creator_tapis_id: 'swathivm', creator_name: 'Swathi Vallabhajosyula', publisher: '',
      resource_type: 'Dataset', publication_year: '', subjects: '', download_url: '', is_private: false,
    })

    expect(payload).toMatchObject({
      creators: [{ creator_name: 'Dataset Author' }],
      creator_tapis_id: 'swathivm',
      creator_name: 'Swathi Vallabhajosyula',
    })
  })
})
