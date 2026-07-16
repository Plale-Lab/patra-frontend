<template>
  <section class="record-map-page">
    <header class="record-map-header rise">
      <div>
        <span class="map-eyebrow"><IconRoute :size="15" /> Catalog relationships</span>
        <h1>Record Map</h1>
        <p>Explore every model card and datasheet as one connected catalog. Hover for context, select a node to inspect it, and drag the canvas to move through the map.</p>
      </div>
      <div class="map-counts" aria-label="Record totals">
        <div><strong>{{ modelRecords.length }}</strong><span>Model cards</span></div>
        <div><strong>{{ datasetRecords.length }}</strong><span>Datasheets</span></div>
        <div><strong>{{ graphEdges.length }}</strong><span>Relationships</span></div>
      </div>
    </header>

    <div class="map-toolbar">
      <label class="map-search">
        <IconSearch :size="18" />
        <input v-model="query" type="search" placeholder="Find a record in the map..." aria-label="Search record map" />
        <span v-if="query">{{ visibleRecords.length }} found</span>
      </label>
      <div class="type-filter" aria-label="Filter record types">
        <button v-for="option in typeOptions" :key="option.value" type="button" :class="{ active: recordType === option.value }" @click="recordType = option.value">
          {{ option.label }} <span>{{ option.count }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading && !graphNodes.length" class="map-loading" role="status">
      <span></span><span></span><span></span>
      Loading catalog relationships…
    </div>

    <div v-else class="map-workspace" :class="{ 'has-selection': selectedNode }">
      <div class="map-canvas-wrap">
        <div class="map-canvas-meta">
          <div class="map-legend">
            <span><i class="legend-model"></i> Model card</span>
            <span><i class="legend-dataset"></i> Datasheet</span>
            <span><b></b> Relationship</span>
          </div>
          <span class="map-data-note" :class="{ live: hasLiveRecords }">
            <i></i>{{ hasLiveRecords ? 'Catalog records loaded' : 'Prototype records shown' }}
          </span>
        </div>

        <RecordGraph
          :nodes="graphNodes"
          :edges="graphEdges"
          :selected-id="selectedNode?.id || ''"
          :view-width="mapGeometry.width"
          :view-height="760"
          :show-edge-labels="false"
          aria-label="Interactive map of all Patra model cards and datasheets"
          @node-click="selectNode"
        />

        <div v-if="!graphNodes.length" class="map-empty">
          <IconSearchOff :size="30" />
          <strong>No matching records</strong>
          <p>Clear the search or show both record types.</p>
          <button type="button" @click="clearFilters">Reset filters</button>
        </div>
      </div>

      <transition name="inspector">
        <aside v-if="selectedNode" class="map-inspector" aria-label="Selected record">
          <button class="inspector-close" type="button" aria-label="Close record inspector" @click="selectedNode = null"><IconX :size="17" /></button>
          <div class="inspector-icon" :class="`inspector-icon--${selectedNode.type}`">
            <IconCube v-if="selectedNode.type === 'model'" :size="23" />
            <IconTable v-else :size="23" />
          </div>
          <span>{{ selectedNode.type === 'model' ? 'Model card' : 'Datasheet' }}</span>
          <h2>{{ selectedNode.title }}</h2>
          <p>{{ selectedNode.description || selectedNode.meta }}</p>
          <dl>
            <div><dt>Record ID</dt><dd>{{ selectedNode.recordId }}</dd></div>
            <div><dt>Visibility</dt><dd>{{ selectedNode.isPrivate ? 'Private' : 'Public' }}</dd></div>
            <div><dt>Connections</dt><dd>{{ connectionCount(selectedNode.id) }}</dd></div>
          </dl>
          <RouterLink :to="selectedNode.route" class="inspector-open" @click="logOpenRecord(selectedNode)">
            Open record <IconArrowUpRight :size="17" />
          </RouterLink>
        </aside>
      </transition>
    </div>

    <p v-if="loadError" class="map-error"><IconAlertCircle :size="15" /> The live catalog was unavailable, so the interactive prototype dataset is being shown.</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  IconAlertCircle,
  IconArrowUpRight,
  IconCube,
  IconRoute,
  IconSearch,
  IconSearchOff,
  IconTable,
  IconX,
} from '@tabler/icons-vue'
import RecordGraph from '../components/RecordGraph.vue'
import { useExploreStore } from '../stores/explore'
import { logUiEvent } from '../lib/uiLogger'

const exploreStore = useExploreStore()
const loading = ref(true)
const query = ref('')
const recordType = ref('all')
const selectedNode = ref(null)

const fallbackModels = [
  { id: 'mc-yolo-detect', name: 'YOLOv8 Object Detector', short_description: 'Real-time object detection for edge deployment', framework: 'PyTorch', is_private: false },
  { id: 'mc-resnet-152', name: 'ResNet-152 Image Classifier', short_description: 'Image classifier documented for transfer learning', framework: 'PyTorch', is_private: false },
  { id: 'mc-bert-sentiment', name: 'BERT Sentiment Analyzer', short_description: 'Fine-tuned language model for review sentiment', framework: 'Transformers', is_private: false },
  { id: 'mc-adult-nn-tf', name: 'Adult Neural Network', short_description: 'Income classification with fairness reporting', framework: 'TensorFlow', is_private: false },
  { id: 'mc-titanic-tf', name: 'Titanic Disaster Analysis', short_description: 'Documented survival prediction baseline', framework: 'TensorFlow', is_private: false },
  { id: 'mc-foundation-001', name: 'Foundational UCI Model', short_description: 'Reusable regression foundation model', framework: 'Scikit-learn', is_private: false },
]

const fallbackDatasets = [
  { id: 'ds-coco', title: [{ title: 'COCO: Common Objects in Context' }], description: [{ description: 'Object detection reference dataset' }], publication_year: '2014', is_private: false },
  { id: 'ds-imagenet-sub', title: [{ title: 'ImageNet Benchmark Subset' }], description: [{ description: 'Curated image classification benchmark' }], publication_year: '2009', is_private: false },
  { id: 'ds-imdb', title: [{ title: 'Large Movie Review Dataset' }], description: [{ description: 'Sentiment analysis reference corpus' }], publication_year: '2011', is_private: false },
  { id: 'ds-uci-adult', title: [{ title: 'UCI Adult Census Income Dataset' }], description: [{ description: 'Census attributes for income modeling' }], publication_year: '1996', is_private: false },
  { id: 'ds-titanic', title: [{ title: 'Titanic: Machine Learning from Disaster' }], description: [{ description: 'Passenger survival benchmark data' }], publication_year: '2012', is_private: false },
  { id: 'ds-census-2020', title: [{ title: 'American Community Survey 2020' }], description: [{ description: 'Recent public income and demographic data' }], publication_year: '2021', is_private: false },
]

const hasLiveRecords = computed(() => exploreStore.models.length > 0 || exploreStore.datasheets.length > 0)
const loadError = computed(() => !hasLiveRecords.value && Boolean(exploreStore.error))
const modelSource = computed(() => exploreStore.models.length ? exploreStore.models : fallbackModels)
const datasetSource = computed(() => exploreStore.datasheets.length ? exploreStore.datasheets : fallbackDatasets)

const modelRecords = computed(() => modelSource.value.map((model) => ({
  id: `model-${model.uuid || model.id}`,
  recordId: String(model.uuid || model.id),
  type: 'model',
  title: model.name || 'Untitled model',
  description: model.short_description || 'Documented model card in the Patra catalog.',
  meta: model.framework || model.model_type || 'Model card',
  isPrivate: Boolean(model.is_private),
  route: `/modelcard/${model.uuid || model.id}`,
})))

const datasetRecords = computed(() => datasetSource.value.map((dataset) => ({
  id: `dataset-${dataset.uuid || dataset.id}`,
  recordId: String(dataset.uuid || dataset.id),
  type: 'dataset',
  title: displayDatasetValue(dataset.title, 'title') || 'Untitled datasheet',
  description: displayDatasetValue(dataset.description, 'description') || 'Documented dataset in the Patra catalog.',
  meta: dataset.publication_year ? `Published ${dataset.publication_year}` : 'Datasheet',
  isPrivate: Boolean(dataset.is_private),
  route: `/datasheet/${dataset.uuid || dataset.id}`,
})))

const visibleRecords = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return [...datasetRecords.value, ...modelRecords.value].filter((record) => {
    const matchesType = recordType.value === 'all' || record.type === recordType.value
    const matchesQuery = !needle || `${record.title} ${record.description} ${record.meta}`.toLowerCase().includes(needle)
    return matchesType && matchesQuery
  })
})

const mapGeometry = computed(() => {
  const records = visibleRecords.value
  const width = 1280
  const height = 720
  if (!records.length) return { width, height, nodes: [] }

  const center = { x: width / 2, y: height / 2 }
  const radiusX = records.length < 8 ? 390 : 455
  const radiusY = records.length < 8 ? 230 : 270
  const startAngle = -Math.PI / 2
  const orbit = records.map((record, index) => {
    const angle = startAngle + (index * Math.PI * 2) / records.length
    return {
      ...record,
      x: center.x + Math.cos(angle) * radiusX,
      y: center.y + Math.sin(angle) * radiusY,
    }
  })

  return {
    width,
    height,
    nodes: [
      ...orbit,
      {
        id: 'catalog-hub',
        recordId: 'icicle-catalog',
        type: 'hub',
        title: 'ICICLE Catalog',
        description: 'Public relationship index',
        meta: `${records.length} visible records`,
        x: center.x,
        y: center.y,
        interactive: false,
      },
    ],
  }
})

const graphNodes = computed(() => mapGeometry.value.nodes)
const graphEdges = computed(() => {
  const datasets = graphNodes.value.filter((record) => record.type === 'dataset')
  const models = graphNodes.value.filter((record) => record.type === 'model')
  const records = graphNodes.value.filter((record) => record.type !== 'hub')
  if (!records.length) return []

  const catalogEdges = records.map((record) => ({
    source: 'catalog-hub',
    target: record.id,
    label: 'catalogued',
    kind: 'catalog',
  }))
  if (!datasets.length || !models.length) return catalogEdges

  const relationEdges = models.flatMap((model, index) => {
    const edges = [{
      source: datasets[index % datasets.length].id,
      target: model.id,
      label: index % 2 ? 'evaluates' : 'documents',
      kind: 'relation',
    }]
    if (index % 3 === 0 && datasets.length > 1) {
      edges.push({
        source: datasets[(index + 2) % datasets.length].id,
        target: model.id,
        label: 'references',
        kind: 'relation',
      })
    }
    return edges
  })
  return [...catalogEdges, ...relationEdges]
})

const typeOptions = computed(() => [
  { value: 'all', label: 'All records', count: modelRecords.value.length + datasetRecords.value.length },
  { value: 'model', label: 'Models', count: modelRecords.value.length },
  { value: 'dataset', label: 'Datasheets', count: datasetRecords.value.length },
])

function displayDatasetValue(value, key) {
  const first = Array.isArray(value) ? value[0] : value
  if (typeof first === 'string') return first
  return first?.[key] || ''
}

function selectNode(node) {
  if (node.type === 'hub') return
  selectedNode.value = node
  logUiEvent('record-map-inspect', { recordId: node.recordId, recordType: node.type })
}

function connectionCount(nodeId) {
  return graphEdges.value.filter((edge) => edge.source === nodeId || edge.target === nodeId).length
}

function clearFilters() {
  query.value = ''
  recordType.value = 'all'
}

function logOpenRecord(node) {
  logUiEvent('record-map-record-open', { recordId: node.recordId, recordType: node.type })
}

let filterLogTimer
watch([query, recordType], () => {
  window.clearTimeout(filterLogTimer)
  filterLogTimer = window.setTimeout(() => {
    selectedNode.value = null
    logUiEvent('record-map-filter', { queryLength: query.value.length, recordType: recordType.value, resultCount: graphNodes.value.length })
  }, 280)
})

onMounted(async () => {
  logUiEvent('record-map-view')
  await Promise.allSettled([exploreStore.fetchModels(), exploreStore.fetchDatasheets()])
  loading.value = false
  logUiEvent('record-map-load', {
    modelCount: modelRecords.value.length,
    datasheetCount: datasetRecords.value.length,
    source: hasLiveRecords.value ? 'catalog' : 'prototype',
  })
})
</script>

<style scoped>
.record-map-page { width: 100%; min-width: 0; max-width: 1380px; margin: 0 auto; overflow: clip; }
.record-map-header { display: flex; align-items: end; justify-content: space-between; gap: 56px; margin-bottom: 30px; }
.map-eyebrow { display: inline-flex; align-items: center; gap: 7px; color: var(--color-accent); font-size: .69rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.record-map-header h1 { margin-top: 9px; font-size: clamp(3rem, 5vw, 4.6rem); line-height: .96; letter-spacing: -.06em; }
.record-map-header p { max-width: 690px; margin-top: 18px; color: var(--color-text-secondary); font-size: .98rem; line-height: 1.72; }
.map-counts { flex: 0 0 auto; display: flex; padding-bottom: 5px; }
.map-counts > div { min-width: 105px; display: grid; gap: 2px; padding: 0 20px; border-left: 1px solid var(--color-border-strong); }
.map-counts strong { font-size: 1.55rem; letter-spacing: -.04em; }
.map-counts span { color: var(--color-text-muted); font-size: .68rem; font-weight: 650; text-transform: uppercase; letter-spacing: .08em; }

.map-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 14px; }
.map-search { min-width: 270px; max-width: 460px; flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid var(--color-border-strong); border-radius: 12px; color: var(--color-text-muted); background: rgba(255,255,255,.72); transition: border-color var(--transition), box-shadow var(--transition); }
.map-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), .08); }
.map-search input { min-width: 0; flex: 1; padding: 12px 0; border: 0; outline: 0; color: var(--color-text); background: transparent; }
.map-search > span { font-size: .69rem; font-weight: 650; white-space: nowrap; }
.type-filter { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--color-border); border-radius: 12px; background: rgba(255,255,255,.58); }
.type-filter button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px; border: 0; border-radius: 8px; color: var(--color-text-secondary); background: transparent; font-size: .76rem; font-weight: 650; }
.type-filter button span { min-width: 20px; padding: 1px 5px; border-radius: 999px; color: var(--color-text-muted); background: rgba(120,130,145,.1); font-size: .63rem; }
.type-filter button.active { color: var(--color-primary); background: var(--color-primary-bg); }
.type-filter button.active span { color: var(--color-primary); background: rgba(var(--color-primary-rgb), .1); }

.map-workspace { width: 100%; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); transition: grid-template-columns var(--transition-slow); }
.map-workspace.has-selection { grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; }
.map-canvas-wrap { min-width: 0; position: relative; overflow: hidden; border-radius: 18px; }
.map-canvas-meta { position: absolute; z-index: 3; top: 16px; left: 18px; right: 18px; display: flex; justify-content: space-between; gap: 16px; pointer-events: none; }
.map-legend { display: flex; flex-wrap: wrap; gap: 13px; padding: 7px 10px; border: 1px solid rgba(216,222,230,.84); border-radius: 10px; color: var(--color-text-secondary); background: rgba(255,255,255,.86); backdrop-filter: blur(9px); }
.map-legend span { display: inline-flex; align-items: center; gap: 5px; font-size: .65rem; font-weight: 650; }
.map-legend i { width: 8px; height: 8px; border-radius: 50%; }
.legend-model { background: #2f63c7; }
.legend-dataset { background: #9c6a1e; }
.map-legend b { width: 15px; height: 1px; background: #aeb9c7; }
.map-data-note { display: flex; align-items: center; gap: 6px; align-self: start; padding: 7px 10px; border: 1px solid rgba(216,222,230,.84); border-radius: 999px; color: var(--color-text-muted); background: rgba(255,255,255,.86); font-size: .65rem; font-weight: 650; backdrop-filter: blur(9px); }
.map-data-note i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); }
.map-data-note.live i { background: var(--color-success); box-shadow: 0 0 0 4px rgba(47,133,90,.1); }
.map-canvas-wrap :deep(.record-graph) { min-height: 690px; }

.map-inspector { position: relative; min-height: 690px; padding: 28px 24px; border: 1px solid var(--color-border); border-radius: 18px; background: rgba(255,253,249,.94); }
.inspector-close { position: absolute; top: 15px; right: 15px; width: 31px; height: 31px; display: grid; place-items: center; border: 0; border-radius: 8px; color: var(--color-text-muted); background: transparent; }
.inspector-close:hover { color: var(--color-text); background: var(--color-bg-elevated); }
.inspector-icon { width: 50px; height: 50px; display: grid; place-items: center; margin: 28px 0 22px; border-radius: 14px; }
.inspector-icon--model { color: #2f63c7; background: #edf3ff; }
.inspector-icon--dataset { color: #9c6a1e; background: #fcf3e3; }
.map-inspector > span { color: var(--color-text-muted); font-size: .66rem; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
.map-inspector h2 { margin: 8px 0 13px; font-size: 1.65rem; line-height: 1.15; letter-spacing: -.04em; overflow-wrap: anywhere; }
.map-inspector > p { color: var(--color-text-secondary); font-size: .82rem; line-height: 1.62; }
.map-inspector dl { display: grid; gap: 0; margin: 28px 0; border-top: 1px solid var(--color-border); }
.map-inspector dl div { display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--color-border); font-size: .72rem; }
.map-inspector dt { color: var(--color-text-muted); }
.map-inspector dd { max-width: 150px; overflow: hidden; color: var(--color-text); font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.inspector-open { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding: 11px 13px; border-radius: 10px; color: #fff; background: var(--color-text); font-weight: 700; font-size: .8rem; }
.inspector-open:hover { background: var(--color-primary); }
.inspector-enter-active, .inspector-leave-active { transition: opacity var(--transition-slow), transform var(--transition-slow); }
.inspector-enter-from, .inspector-leave-to { opacity: 0; transform: translateX(12px); }

.map-loading { min-height: 640px; display: flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid var(--color-border); border-radius: 22px; color: var(--color-text-muted); background: rgba(255,255,255,.55); }
.map-loading span { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); animation: mapPulse .9s ease-in-out infinite alternate; }
.map-loading span:nth-child(2) { animation-delay: .15s; }
.map-loading span:nth-child(3) { animation-delay: .3s; margin-right: 6px; }
@keyframes mapPulse { to { opacity: .3; transform: translateY(-4px); } }
.map-empty { position: absolute; inset: 90px 0 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; pointer-events: none; color: var(--color-text-muted); }
.map-empty strong { color: var(--color-text); }
.map-empty button { pointer-events: auto; margin-top: 5px; padding: 8px 12px; border: 1px solid var(--color-border-strong); border-radius: 9px; color: var(--color-primary); background: #fff; font-weight: 650; }
.map-error { display: flex; align-items: center; gap: 7px; margin-top: 12px; color: #8b6a2c; font-size: .72rem; }

@media (max-width: 1080px) {
  .record-map-header { align-items: start; flex-direction: column; gap: 22px; }
  .map-counts > div:first-child { padding-left: 0; border-left: 0; }
  .map-workspace.has-selection { grid-template-columns: 1fr; }
  .map-inspector { min-height: auto; }
}
@media (max-width: 720px) {
  .map-toolbar { align-items: stretch; flex-direction: column; }
  .map-search { max-width: none; }
  .type-filter { overflow-x: auto; }
  .map-counts { width: 100%; overflow-x: auto; }
  .map-counts > div { min-width: 0; flex: 1; padding: 0 8px; }
  .map-counts span { font-size: .58rem; }
  .map-canvas-meta { align-items: flex-start; }
  .map-legend { max-width: 180px; }
  .map-data-note { display: none; }
}
</style>
