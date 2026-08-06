import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isLikelyHuggingFaceUrl, importFromHuggingFace } from './huggingFaceImport'

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

describe('isLikelyHuggingFaceUrl', () => {
  it('accepts huggingface.co and hf.co URLs', () => {
    expect(isLikelyHuggingFaceUrl('https://huggingface.co/distilbert/distilbert-base-uncased')).toBe(true)
    expect(isLikelyHuggingFaceUrl('https://hf.co/distilbert/distilbert-base-uncased')).toBe(true)
  })

  it('rejects non-HF URLs and unparseable input', () => {
    expect(isLikelyHuggingFaceUrl('https://github.com/org/repo')).toBe(false)
    expect(isLikelyHuggingFaceUrl('not a url')).toBe(false)
  })
})

describe('importFromHuggingFace', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs to /v1/hf-import/preview with the url and asset_type, and returns the fields on success', async () => {
    const fields = { name: 'Distilbert Base Uncased', author: 'distilbert', license: 'apache-2.0', is_gated: false }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, fields))
    vi.stubGlobal('fetch', fetchMock)

    const result = await importFromHuggingFace(
      'https://huggingface.co/distilbert/distilbert-base-uncased',
      'model_card',
    )

    expect(result).toEqual(fields)
    const [calledUrl, options] = fetchMock.mock.calls[0]
    expect(calledUrl).toContain('/v1/hf-import/preview')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      url: 'https://huggingface.co/distilbert/distilbert-base-uncased',
      asset_type: 'model_card',
    })
  })

  it('throws the backend detail message on a 404 (repo not found)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404, { detail: 'Hugging Face repo not found' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      importFromHuggingFace('https://huggingface.co/nobody/does-not-exist', 'model_card'),
    ).rejects.toThrow('Hugging Face repo not found')
  })

  it('throws the backend detail message on a 403 (gated repo)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(403, { detail: 'This Hugging Face repo is gated.' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      importFromHuggingFace('https://huggingface.co/meta-llama/Llama-3.1-8B', 'model_card'),
    ).rejects.toThrow('This Hugging Face repo is gated.')
  })

  it('throws the backend detail message on a 422 (mismatched asset type)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(422, { detail: 'That looks like a dataset URL. Switch the record type to Datasheet.' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      importFromHuggingFace('https://huggingface.co/datasets/rajpurkar/squad', 'model_card'),
    ).rejects.toThrow('Switch the record type to Datasheet')
  })

  it('throws on a 502 (upstream failure)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(502, { detail: 'Failed to fetch data from Hugging Face: timed out' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      importFromHuggingFace('https://huggingface.co/org/repo', 'model_card'),
    ).rejects.toThrow('Failed to fetch data from Hugging Face')
  })
})
