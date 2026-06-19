// Pure, dependency-free parser for Ask Patra assistant text. Tokenizes a
// response string into renderable blocks (text / code / sources). Moved
// verbatim from AskPatraView's inline parser so it can be reasoned about and
// tested in isolation. All output is rendered through escaped Vue {{ }}
// interpolation by AssistantContent.vue — there is no v-html, so no XSS surface.
//
// Hardening vs. the original: the input is length-capped to guard against
// pathological/runaway strings. The tokenization itself is unchanged.

const MAX_INPUT = 100000

export function parseAssistantContent(content) {
  const blocks = []
  const sourceItems = []
  const raw = String(content || '').slice(0, MAX_INPUT)
  const codeRegex = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g
  let cursor = 0
  let match

  while ((match = codeRegex.exec(raw)) !== null) {
    if (match.index > cursor) {
      parseTextIntoBlocks(raw.slice(cursor, match.index), blocks, sourceItems)
    }
    blocks.push({
      type: 'code',
      language: (match[1] || '').trim(),
      content: match[2].trim(),
    })
    cursor = codeRegex.lastIndex
  }

  if (cursor < raw.length) {
    parseTextIntoBlocks(raw.slice(cursor), blocks, sourceItems)
  }

  if (sourceItems.length) {
    blocks.push({
      type: 'sources',
      items: sourceItems,
    })
  }

  return blocks.filter((block) => {
    if (block.type === 'text') return Array.isArray(block.sections) && block.sections.length > 0
    if (block.type === 'code') return Boolean(block.content)
    if (block.type === 'sources') return block.items.length > 0
    return false
  })
}

function parseTextIntoBlocks(text, blocks, sourceItems) {
  const normalized = String(text || '').trim()
  if (!normalized) return

  const sections = []
  for (const chunk of normalized.split(/\n\s*\n/)) {
    const cleaned = chunk.trim()
    if (!cleaned) continue
    const extracted = extractSourceItems(cleaned)
    if (extracted.length && cleaned.replace(urlRegex(), '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '').trim().length < 12) {
      sourceItems.push(...extracted)
      continue
    }
    sections.push(...parseTextSection(cleaned))
  }

  if (sections.length) {
    blocks.push({ type: 'text', sections })
  }
}

function parseTextSection(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return []

  const orderedList = []
  const bulletList = []
  let ordered = true
  let bulleted = true

  for (const line of lines) {
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
    const bulletMatch = line.match(/^[-*]\s+(.*)$/)
    if (orderedMatch) {
      orderedList.push(parseInlineSegments(orderedMatch[1]))
    } else {
      ordered = false
    }
    if (bulletMatch) {
      bulletList.push(parseInlineSegments(bulletMatch[1]))
    } else {
      bulleted = false
    }
  }

  if (ordered && orderedList.length) {
    return [{ kind: 'ordered-list', items: orderedList }]
  }

  if (bulleted && bulletList.length) {
    return [{ kind: 'list', items: bulletList }]
  }

  return [{ kind: 'paragraph', segments: parseInlineSegments(lines.join(' ')) }]
}

function parseInlineSegments(text) {
  const segments = []
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', text: text.slice(lastIndex, match.index) })
    }
    if (match[2]) {
      segments.push({ kind: 'bold', text: match[2] })
    } else if (match[3]) {
      segments.push({ kind: 'code', text: match[3] })
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', text: text.slice(lastIndex) })
  }

  return segments.filter((segment) => segment.text)
}

function extractSourceItems(text) {
  const items = []
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  let markdownMatch
  while ((markdownMatch = markdownRegex.exec(text)) !== null) {
    items.push({ label: markdownMatch[1], href: markdownMatch[2] })
  }

  const rawUrlRegex = urlRegex()
  let urlMatch
  while ((urlMatch = rawUrlRegex.exec(text)) !== null) {
    const href = urlMatch[0]
    if (!items.some((item) => item.href === href)) {
      items.push({ label: href, href })
    }
  }

  return items
}

function urlRegex() {
  return /https?:\/\/[^\s)]+/g
}
