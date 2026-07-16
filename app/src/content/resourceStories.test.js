import { describe, expect, it } from 'vitest'
import { getResourceStory, resourceStories } from './resourceStories'

describe('resource story prototypes', () => {
  it('uses stable unique slugs and resolves each story', () => {
    const slugs = resourceStories.map((story) => story.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(getResourceStory(slug)?.slug).toBe(slug)
  })

  it('keeps every relationship attached to an existing node', () => {
    for (const story of resourceStories) {
      const nodeIds = new Set(story.graph.nodes.map((node) => node.id))
      for (const edge of story.graph.edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
      }
    }
  })
})
