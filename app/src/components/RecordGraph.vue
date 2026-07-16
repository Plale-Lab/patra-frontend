<template>
  <div
    ref="frame"
    class="record-graph"
    :class="{ 'record-graph--compact': compact, 'is-dragging': dragging }"
    @wheel.prevent="handleWheel"
    @pointerdown="startPan"
    @pointermove="movePan"
    @pointerup="endPan"
    @pointercancel="endPan"
  >
    <svg
      class="record-graph-svg"
      :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
      :aria-label="ariaLabel"
      role="img"
      @mouseleave="clearHover"
    >
      <defs>
        <pattern :id="gridId" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
        </pattern>
        <filter :id="shadowId" x="-30%" y="-40%" width="160%" height="180%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#17233b" flood-opacity=".14" />
        </filter>
        <marker :id="markerId" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
        </marker>
      </defs>

      <rect class="graph-grid" width="100%" height="100%" :fill="`url(#${gridId})`" />

      <g :transform="`translate(${pan.x} ${pan.y}) scale(${zoom})`">
        <g class="graph-edges">
          <g
            v-for="edge in renderedEdges"
            :key="`${edge.source}-${edge.target}-${edge.label || ''}`"
            class="graph-edge"
            :class="[`graph-edge--${edge.kind || 'relation'}`, { active: edgeIsActive(edge), muted: hoveredId && !edgeIsActive(edge) }]"
          >
            <path
              :d="edgePath(edge)"
              :marker-end="`url(#${markerId})`"
            />
            <g v-if="showEdgeLabels && (compact || edgeIsActive(edge))" class="edge-label" :transform="`translate(${edgeMidpoint(edge).x} ${edgeMidpoint(edge).y})`">
              <rect :x="-edgeLabelWidth(edge) / 2" y="-10" :width="edgeLabelWidth(edge)" height="20" rx="10" />
              <text text-anchor="middle" dominant-baseline="middle">{{ edge.label }}</text>
            </g>
          </g>
        </g>

        <g class="graph-nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            class="graph-node"
            :class="[`graph-node--${node.type}`, { active: hoveredId === node.id || selectedId === node.id, muted: hoveredId && hoveredId !== node.id && !isConnected(node.id), static: node.interactive === false }]"
            :transform="`translate(${node.x - 82} ${node.y - 34})`"
            :tabindex="node.interactive === false ? -1 : 0"
            :role="node.interactive === false ? 'img' : 'button'"
            :aria-label="`${node.type}: ${node.title}`"
            @mouseenter="showTooltip($event, node)"
            @mousemove="positionTooltip($event)"
            @mouseleave="clearHover"
            @focus="showKeyboardTooltip(node)"
            @blur="clearHover"
            @click.stop="selectNode(node)"
            @keydown.enter.prevent="selectNode(node)"
            @keydown.space.prevent="selectNode(node)"
          >
            <rect class="node-surface" width="164" height="68" rx="14" :filter="hoveredId === node.id || selectedId === node.id ? `url(#${shadowId})` : undefined" />
            <rect class="node-accent" x="0" y="0" width="5" height="68" rx="2.5" />
            <circle class="node-icon-surface" cx="28" cy="25" r="13" />
            <text class="node-icon" x="28" y="25" text-anchor="middle" dominant-baseline="middle">{{ nodeGlyph(node.type) }}</text>
            <text class="node-type" x="49" y="19">{{ typeLabel(node.type) }}</text>
            <text class="node-title" x="49" y="38">{{ truncate(node.title, 19) }}</text>
            <text class="node-meta" x="49" y="54">{{ truncate(node.meta || 'Catalog record', 23) }}</text>
          </g>
        </g>
      </g>
    </svg>

    <div class="graph-controls" aria-label="Graph zoom controls">
      <button type="button" aria-label="Zoom out" @click.stop="adjustZoom(-0.14)"><IconMinus :size="16" /></button>
      <span>{{ Math.round(zoom * 100) }}%</span>
      <button type="button" aria-label="Zoom in" @click.stop="adjustZoom(0.14)"><IconPlus :size="16" /></button>
      <button type="button" aria-label="Reset graph view" @click.stop="resetView"><IconFocus2 :size="16" /></button>
    </div>

    <transition name="graph-tip">
      <aside
        v-if="tooltip.node"
        class="graph-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        role="status"
      >
        <span class="tooltip-type">{{ typeLabel(tooltip.node.type) }}</span>
        <strong>{{ tooltip.node.title }}</strong>
        <p>{{ tooltip.node.meta || 'Catalog record' }}</p>
        <span class="tooltip-action">{{ tooltip.node.interactive === false ? 'Catalog relationship hub' : tooltip.node.route ? 'Click to open record' : 'Click to inspect' }} <IconArrowUpRight v-if="tooltip.node.interactive !== false" :size="13" /></span>
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { IconArrowUpRight, IconFocus2, IconMinus, IconPlus } from '@tabler/icons-vue'
import { logUiEvent } from '../lib/uiLogger'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  selectedId: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  showEdgeLabels: { type: Boolean, default: true },
  viewWidth: { type: Number, default: 1080 },
  viewHeight: { type: Number, default: 360 },
  ariaLabel: { type: String, default: 'Interactive graph of related catalog records' },
})

const emit = defineEmits(['node-click'])
const frame = ref(null)
const hoveredId = ref('')
const zoom = ref(1)
const pan = reactive({ x: 0, y: 0 })
const dragging = ref(false)
const dragOrigin = reactive({ x: 0, y: 0, panX: 0, panY: 0 })
const tooltip = reactive({ node: null, x: 0, y: 0 })

const instanceId = Math.random().toString(36).slice(2, 9)
const gridId = `record-grid-${instanceId}`
const markerId = `record-arrow-${instanceId}`
const shadowId = `record-shadow-${instanceId}`

const nodeById = computed(() => new Map(props.nodes.map((node) => [node.id, node])))
const renderedEdges = computed(() => props.edges.filter((edge) => nodeById.value.has(edge.source) && nodeById.value.has(edge.target)))

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function typeLabel(type) {
  return {
    model: 'Model card',
    dataset: 'Datasheet',
    compute: 'Compute',
    run: 'Run',
    result: 'Result',
    hub: 'Catalog index',
  }[type] || 'Record'
}

function nodeGlyph(type) {
  return { model: 'M', dataset: 'D', compute: 'C', run: 'R', result: '✓', hub: '◎' }[type] || '•'
}

function truncate(value, length) {
  const text = String(value || '')
  return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

function edgePath(edge) {
  const source = nodeById.value.get(edge.source)
  const target = nodeById.value.get(edge.target)
  if (!source || !target) return ''
  const dx = target.x - source.x
  const dy = target.y - source.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    const control = Math.max(50, Math.abs(dx) * 0.42)
    const direction = dx >= 0 ? 1 : -1
    return `M ${source.x} ${source.y} C ${source.x + control * direction} ${source.y}, ${target.x - control * direction} ${target.y}, ${target.x} ${target.y}`
  }
  const control = Math.max(50, Math.abs(dy) * 0.42)
  const direction = dy >= 0 ? 1 : -1
  return `M ${source.x} ${source.y} C ${source.x} ${source.y + control * direction}, ${target.x} ${target.y - control * direction}, ${target.x} ${target.y}`
}

function edgeMidpoint(edge) {
  const source = nodeById.value.get(edge.source)
  const target = nodeById.value.get(edge.target)
  return source && target ? { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 - 12 } : { x: 0, y: 0 }
}

function edgeLabelWidth(edge) {
  return Math.max(54, String(edge.label || '').length * 6.3 + 20)
}

function edgeIsActive(edge) {
  const activeId = hoveredId.value || props.selectedId
  return Boolean(activeId && (edge.source === activeId || edge.target === activeId))
}

function isConnected(nodeId) {
  return renderedEdges.value.some((edge) => (
    (edge.source === hoveredId.value && edge.target === nodeId)
    || (edge.target === hoveredId.value && edge.source === nodeId)
  ))
}

function showTooltip(event, node) {
  if (hoveredId.value !== node.id) {
    logUiEvent('record-node-hover', { recordId: node.id, recordType: node.type })
  }
  hoveredId.value = node.id
  tooltip.node = node
  positionTooltip(event)
}

function showKeyboardTooltip(node) {
  hoveredId.value = node.id
  tooltip.node = node
  tooltip.x = 20
  tooltip.y = 20
}

function positionTooltip(event) {
  if (!frame.value || !tooltip.node) return
  const bounds = frame.value.getBoundingClientRect()
  tooltip.x = clamp(event.clientX - bounds.left + 18, 12, Math.max(12, bounds.width - 248))
  tooltip.y = clamp(event.clientY - bounds.top + 16, 12, Math.max(12, bounds.height - 126))
}

function clearHover() {
  hoveredId.value = ''
  tooltip.node = null
}

function selectNode(node) {
  if (node.interactive === false) return
  logUiEvent('record-node-select', { recordId: node.id, recordType: node.type, hasRoute: Boolean(node.route) })
  emit('node-click', node)
}

function adjustZoom(delta) {
  zoom.value = clamp(Number((zoom.value + delta).toFixed(2)), 0.58, 1.72)
  logUiEvent('record-graph-zoom', { source: 'control', zoom: zoom.value })
}

function handleWheel(event) {
  zoom.value = clamp(Number((zoom.value + (event.deltaY > 0 ? -0.06 : 0.06)).toFixed(2)), 0.58, 1.72)
}

function resetView() {
  zoom.value = 1
  pan.x = 0
  pan.y = 0
  logUiEvent('record-graph-reset')
}

function startPan(event) {
  if (event.target.closest?.('.graph-node') || event.target.closest?.('.graph-controls')) return
  dragging.value = true
  dragOrigin.x = event.clientX
  dragOrigin.y = event.clientY
  dragOrigin.panX = pan.x
  dragOrigin.panY = pan.y
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function movePan(event) {
  if (!dragging.value) return
  const bounds = frame.value?.getBoundingClientRect()
  if (!bounds) return
  pan.x = dragOrigin.panX + ((event.clientX - dragOrigin.x) * props.viewWidth) / bounds.width
  pan.y = dragOrigin.panY + ((event.clientY - dragOrigin.y) * props.viewHeight) / bounds.height
}

function endPan(event) {
  if (!dragging.value) return
  dragging.value = false
  event.currentTarget.releasePointerCapture?.(event.pointerId)
}
</script>

<style scoped>
.record-graph {
  position: relative;
  min-height: 420px;
  width: 100%;
  min-width: 0;
  overflow: clip;
  border: 1px solid #dfe3e8;
  border-radius: 18px;
  color: #bdc7d4;
  background: #fbfcfd;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.record-graph.is-dragging { cursor: grabbing; }
.record-graph--compact { min-height: 355px; border-radius: 18px; }
.record-graph-svg { display: block; width: 100%; min-width: 0; height: 100%; min-height: inherit; }
.graph-grid { color: rgba(72,91,118,.1); }

.graph-edge { color: #aeb9c7; transition: opacity var(--transition), color var(--transition); }
.graph-edge path { fill: none; stroke: currentColor; stroke-width: 1.55; vector-effect: non-scaling-stroke; }
.graph-edge--catalog { color: #c8d0da; opacity: .66; }
.graph-edge--catalog path { stroke-width: 1.05; stroke-dasharray: 4 5; }
.graph-edge--relation { color: #9eafc3; }
.graph-edge.active { color: var(--color-primary); }
.graph-edge.active path { stroke-width: 2.2; }
.graph-edge.muted { opacity: .18; }
.edge-label rect { fill: rgba(255,255,255,.92); stroke: #dfe4ea; }
.edge-label text { fill: #788394; font-size: 9px; font-weight: 650; letter-spacing: .02em; }

.graph-node { cursor: pointer; outline: none; transition: opacity var(--transition); }
.node-surface { fill: rgba(255,255,255,.96); stroke: #d8dfe8; stroke-width: 1.1; transition: stroke var(--transition), transform var(--transition); }
.node-accent { fill: var(--node-color, var(--color-primary)); }
.node-icon-surface { fill: var(--node-tint, var(--color-primary-bg)); stroke: color-mix(in srgb, var(--node-color, var(--color-primary)) 22%, transparent); }
.node-icon { fill: var(--node-color, var(--color-primary)); font-size: 10px; font-weight: 800; }
.node-type { fill: #8b94a2; font-size: 8px; font-weight: 750; letter-spacing: .11em; text-transform: uppercase; }
.node-title { fill: #1f2a3b; font-size: 11.5px; font-weight: 720; }
.node-meta { fill: #7b8697; font-size: 8.8px; }
.graph-node.active .node-surface { stroke: var(--node-color, var(--color-primary)); stroke-width: 1.8; }
.graph-node:focus-visible .node-surface { stroke: var(--color-primary); stroke-width: 2.5; }
.graph-node.muted { opacity: .26; }
.graph-node--model { --node-color: #2f63c7; --node-tint: #edf3ff; }
.graph-node--dataset { --node-color: #9c6a1e; --node-tint: #fcf3e3; }
.graph-node--compute { --node-color: #6d5aac; --node-tint: #f1edfb; }
.graph-node--run { --node-color: #267e73; --node-tint: #e9f6f3; }
.graph-node--result { --node-color: #347d48; --node-tint: #eaf6ed; }
.graph-node--hub { --node-color: #1d2738; --node-tint: #eef1f5; }
.graph-node--hub .node-surface { fill: #1d2738; stroke: #1d2738; }
.graph-node--hub .node-type,.graph-node--hub .node-meta { fill: #aeb8c8; }
.graph-node--hub .node-title { fill: #fff; }
.graph-node.static { cursor: default; }

.graph-controls {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 4;
  display: flex;
  align-items: center;
  padding: 5px;
  border: 1px solid rgba(208, 215, 225, .9);
  border-radius: 12px;
  color: var(--color-text-secondary);
  background: rgba(255,255,255,.9);
  box-shadow: 0 8px 24px rgba(35, 45, 64, .08);
  backdrop-filter: blur(10px);
}
.graph-controls button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: inherit;
  background: transparent;
}
.graph-controls button:hover { color: var(--color-primary); background: var(--color-primary-bg); }
.graph-controls span { min-width: 45px; text-align: center; font-size: .72rem; font-weight: 700; }

.graph-tooltip {
  position: absolute;
  z-index: 5;
  width: 226px;
  pointer-events: none;
  display: grid;
  gap: 4px;
  padding: 14px 15px;
  border: 1px solid rgba(216, 222, 231, .92);
  border-radius: 14px;
  color: var(--color-text);
  background: rgba(255,255,255,.95);
  box-shadow: 0 16px 38px rgba(27, 36, 54, .15);
  backdrop-filter: blur(12px);
}
.tooltip-type { color: var(--color-primary); font-size: .66rem; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
.graph-tooltip strong { font-size: .9rem; line-height: 1.3; }
.graph-tooltip p { color: var(--color-text-muted); font-size: .76rem; }
.tooltip-action { display: flex; align-items: center; gap: 4px; margin-top: 3px; color: var(--color-text-secondary); font-size: .72rem; font-weight: 650; }
.graph-tip-enter-active, .graph-tip-leave-active { transition: opacity .14s ease, transform .14s ease; }
.graph-tip-enter-from, .graph-tip-leave-to { opacity: 0; transform: translateY(4px); }

@media (max-width: 760px) {
  .record-graph { overflow: hidden; }
  .graph-controls { position: sticky; float: right; margin: -54px 12px 12px 0; }
}
</style>
