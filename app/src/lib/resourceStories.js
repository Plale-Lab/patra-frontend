const STORY_BLUEPRINTS = [
  {
    id: 'animal-ecology',
    title: 'Wildlife monitoring at the edge',
    description: 'Trace a field inference workflow from documented models and camera-trap data to edge scoring and quality review.',
    domain: 'Animal ecology',
    route: '/animal-ecology',
    keywords: ['animal', 'ecology', 'wildlife', 'species', 'camera', 'jaguar'],
    device: 'CKN edge device',
    run: 'Operational inference',
    result: 'Detection and power telemetry',
    image: '/img/catalog/wildlife-jaguar.jpg',
    imageAlt: 'Jaguar photographed against a dark forest background',
    imagePosition: '42% center',
  },
  {
    id: 'digital-agriculture',
    title: 'Crop monitoring workflow',
    description: 'Explore how crop and soil resources move from catalog records into edge deployments, parameters, and evaluations.',
    domain: 'Digital agriculture',
    route: '/digital-agriculture',
    keywords: ['agriculture', 'agricultural', 'crop', 'soil', 'wheat', 'farm'],
    device: 'Edge GPU',
    run: 'Evaluation',
    result: 'Precision, recall, and power',
    image: '/img/catalog/agriculture-aerial.jpg',
    imageAlt: 'Aerial view of patterned agricultural fields',
    imagePosition: 'center',
  },
  {
    id: 'catalog-provenance',
    title: 'Traceable model reuse across datasets',
    description: 'Start with public model and dataset documentation, then follow identifiers and lineage into reuse and evaluation.',
    domain: 'Cross-domain catalog',
    route: '/explore-model-cards',
    keywords: [],
    device: 'Documented compute',
    run: 'Evaluation',
    result: 'Metrics and provenance',
    image: '/img/catalog/compute-servers.jpg',
    imageAlt: 'Rows of servers in a computing facility',
    imagePosition: '65% center',
  },
]

function searchableText(record) {
  return JSON.stringify(record || {}).toLowerCase()
}
function firstMatching(records, keywords, usedIds) {
  const publicRecords = records.filter((record) => !record.is_private)
  const match = publicRecords.find((record) => {
    const id = String(record.id ?? record.uuid ?? record.identifier ?? '')
    return !usedIds.has(id) && keywords.some((keyword) => searchableText(record).includes(keyword))
  })
  const fallback = publicRecords.find((record) => {
    const id = String(record.id ?? record.uuid ?? record.identifier ?? '')
    return !usedIds.has(id)
  })
  const selected = match || fallback || null
  if (selected) usedIds.add(String(selected.id ?? selected.uuid ?? selected.identifier ?? ''))
  return selected
}

export function modelTitle(model) {
  return model?.name || model?.title || 'Model record not yet linked'
}

export function datasheetTitle(datasheet) {
  const value = datasheet?.title ?? datasheet?.titles
  if (Array.isArray(value) && value.length) {
    return typeof value[0] === 'object' ? value[0]?.title : value[0]
  }
  return typeof value === 'string' && value ? value : 'Dataset record not yet linked'
}

export function modelRoute(model, fallback = '/explore-model-cards') {
  const id = model?.id ?? model?.uuid ?? model?.external_id
  return id != null && id !== '' ? `/explore-model-cards/${id}` : fallback
}

export function datasheetRoute(datasheet, fallback = '/explore-datasheets') {
  const id = datasheet?.id ?? datasheet?.uuid ?? datasheet?.identifier
  return id != null && id !== '' ? `/explore-datasheets/${id}` : fallback
}

export function buildResourceStories(models = [], datasheets = [], options = {}) {
  const usedModels = new Set()
  const usedDatasheets = new Set()
  const supportsDomainRuns = options.supportsDomainRuns !== false

  return STORY_BLUEPRINTS.map((blueprint) => {
    const model = firstMatching(models, blueprint.keywords, usedModels)
    const datasheet = firstMatching(datasheets, blueprint.keywords, usedDatasheets)
    const hasCatalogRecords = Boolean(model || datasheet)
    const route = blueprint.id !== 'catalog-provenance' && !supportsDomainRuns
      ? modelRoute(model, datasheetRoute(datasheet, '/explore-model-cards'))
      : blueprint.route

    return {
      ...blueprint,
      route,
      model,
      datasheet,
      modelLabel: modelTitle(model),
      modelRoute: modelRoute(model),
      datasetLabel: datasheetTitle(datasheet),
      datasetRoute: datasheetRoute(datasheet),
      dataStatus: hasCatalogRecords
        ? 'Relationship mapping in progress'
        : 'Linked public records are still being mapped',
      isSampleMapping: true,
      chain: [
        { type: 'Model', label: blueprint.id === 'animal-ecology' ? 'MegaDetector' : blueprint.id === 'digital-agriculture' ? 'Crop model' : 'Reusable model', route: modelRoute(model), icon: 'model' },
        { type: 'Dataset', label: blueprint.id === 'animal-ecology' ? 'Camera traps' : blueprint.id === 'digital-agriculture' ? 'Field data' : 'Reference data', route: datasheetRoute(datasheet), icon: 'dataset' },
        { type: 'Compute', label: blueprint.device, route, icon: 'compute' },
        { type: 'Run', label: blueprint.run, route, icon: 'run' },
        { type: 'Result', label: blueprint.id === 'animal-ecology' ? 'Detection + QA' : blueprint.id === 'digital-agriculture' ? 'Precision + power' : 'Metrics + lineage', route, icon: 'result' },
      ],
    }
  })
}
