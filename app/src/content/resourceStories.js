// Story content is deliberately isolated from the views. The team can replace
// this mock module with a CMS/API adapter without rewriting presentation code.
export const resourceStories = [
  {
    slug: 'wildlife-monitoring-at-the-edge',
    domain: 'Animal ecology',
    title: 'Wildlife monitoring at the edge',
    summary: 'Trace a field inference workflow from documented models and camera-trap data to edge scoring and quality review.',
    dek: 'A field team turns millions of motion-triggered images into a documented, reviewable signal without moving sensitive habitat data out of the region.',
    image: 'https://raw.githubusercontent.com/Plale-Lab/patra-frontend/dev/app/public/img/catalog/wildlife-jaguar.jpg',
    imageAlt: 'Jaguar photographed against a dark forest background',
    imagePosition: 'center 42%',
    author: 'Patra Editorial Team',
    publishedAt: 'July 8, 2026',
    readTime: '6 min read',
    accent: '#c78928',
    quote: 'The model is only one part of the evidence. The record becomes trustworthy when data, runtime, and review stay connected.',
    sections: [
      {
        eyebrow: 'The field problem',
        title: 'Keep inference close to the habitat',
        paragraphs: [
          'Camera traps produce a high-volume stream of images in places where bandwidth is constrained and location data can be sensitive. The team needed a workflow that could identify likely animal sightings on-site, while preserving enough context for researchers to audit every result.',
          'The catalog record joins the detector model to the image collection, edge device profile, inference run, and the quality-assurance result. Each part can evolve without erasing the path that produced a decision.',
        ],
      },
      {
        eyebrow: 'What changed',
        title: 'Reviewers follow evidence, not filenames',
        paragraphs: [
          'Instead of exchanging detached model binaries and spreadsheets, the team shares one durable story with the records that support it. A reviewer can open the exact model card or datasheet and understand which run generated the detection summary.',
          'This page is a content prototype. The narrative, linked records, and relationship map are placeholders for a future editorial workflow backed by Patra data.',
        ],
      },
    ],
    relatedRecords: [
      { id: 'mc-yolo-detect', type: 'model', title: 'YOLOv8 Object Detector', subtitle: 'Edge-ready wildlife detection model', meta: 'PyTorch · v8.2', route: '/modelcard/mc-yolo-detect' },
      { id: 'ds-coco', type: 'dataset', title: 'COCO: Common Objects in Context', subtitle: 'Reference training and evaluation data', meta: 'Dataset · 2014', route: '/datasheet/ds-coco' },
    ],
    graph: {
      nodes: [
        { id: 'wild-model', type: 'model', title: 'MegaDetector', meta: 'Model card', x: 120, y: 190, route: '/modelcard/mc-yolo-detect' },
        { id: 'wild-data', type: 'dataset', title: 'Camera traps', meta: 'Datasheet', x: 330, y: 92, route: '/datasheet/ds-coco' },
        { id: 'wild-compute', type: 'compute', title: 'CKN edge device', meta: 'Compute profile', x: 535, y: 190 },
        { id: 'wild-run', type: 'run', title: 'Operational inference', meta: 'Run · 24.7k frames', x: 740, y: 92 },
        { id: 'wild-result', type: 'result', title: 'Detection + QA', meta: 'Result · reviewed', x: 940, y: 190 },
      ],
      edges: [
        { source: 'wild-model', target: 'wild-compute', label: 'deployed to' },
        { source: 'wild-data', target: 'wild-compute', label: 'scored on' },
        { source: 'wild-compute', target: 'wild-run', label: 'executed' },
        { source: 'wild-run', target: 'wild-result', label: 'produced' },
      ],
    },
  },
  {
    slug: 'crop-monitoring-workflow',
    domain: 'Digital agriculture',
    title: 'Crop monitoring workflow',
    summary: 'Explore how crop and soil resources move from catalog records into edge deployments, parameters, and evaluations.',
    dek: 'From field imagery to a power-aware edge evaluation, a connected record makes the assumptions behind crop monitoring visible and reusable.',
    image: 'https://raw.githubusercontent.com/Plale-Lab/patra-frontend/dev/app/public/img/catalog/agriculture-aerial.jpg',
    imageAlt: 'Aerial view of geometric agricultural fields',
    imagePosition: 'center 55%',
    author: 'Patra Editorial Team',
    publishedAt: 'July 5, 2026',
    readTime: '5 min read',
    accent: '#718b25',
    quote: 'A reusable workflow records not just what scored well, but where the data came from and what the run cost.',
    sections: [
      {
        eyebrow: 'The use case',
        title: 'Measure crop conditions without losing context',
        paragraphs: [
          'Remote sensing teams combine field observations, aerial imagery, and compact neural networks to estimate crop health. The difficulty is not producing one score; it is retaining the dataset version, preprocessing assumptions, device profile, and evaluation criteria behind that score.',
          'Patra connects those records so a team in another region can judge whether the workflow transfers to its own crops and hardware.',
        ],
      },
      {
        eyebrow: 'The handoff',
        title: 'Share a documented path to deployment',
        paragraphs: [
          'The story format gives domain experts room to explain decisions, while related model cards and datasheets preserve machine-readable evidence. The relationship map makes the complete path visible at a glance.',
          'The content shown here is a mock editorial example and can later be generated from curated catalog relationships.',
        ],
      },
    ],
    relatedRecords: [
      { id: 'mc-resnet-152', type: 'model', title: 'Crop Weed YOLO Model CNN', subtitle: 'Compact classifier for field imagery', meta: 'TensorFlow · v1.3', route: '/modelcard/mc-resnet-152' },
      { id: 'ds-imagenet-sub', type: 'dataset', title: 'HLO Feature Dataset', subtitle: 'Deep-learning resource estimation samples', meta: 'Dataset · 2025', route: '/datasheet/ds-imagenet-sub' },
    ],
    graph: {
      nodes: [
        { id: 'crop-model', type: 'model', title: 'Crop model', meta: 'Model card', x: 120, y: 190, route: '/modelcard/mc-resnet-152' },
        { id: 'crop-data', type: 'dataset', title: 'Field data', meta: 'Datasheet', x: 330, y: 92, route: '/datasheet/ds-imagenet-sub' },
        { id: 'crop-compute', type: 'compute', title: 'Edge GPU', meta: 'Compute profile', x: 535, y: 190 },
        { id: 'crop-run', type: 'run', title: 'Evaluation', meta: 'Run · 3 regions', x: 740, y: 92 },
        { id: 'crop-result', type: 'result', title: 'Precision + power', meta: 'Result · verified', x: 940, y: 190 },
      ],
      edges: [
        { source: 'crop-model', target: 'crop-compute', label: 'deployed to' },
        { source: 'crop-data', target: 'crop-compute', label: 'evaluated on' },
        { source: 'crop-compute', target: 'crop-run', label: 'executed' },
        { source: 'crop-run', target: 'crop-result', label: 'measured' },
      ],
    },
  },
  {
    slug: 'traceable-model-reuse',
    domain: 'Cross-domain catalog',
    title: 'Traceable model reuse across datasets',
    summary: 'Start with public model and dataset documentation, then follow identifiers and lineage into reuse and evaluation.',
    dek: 'A shared catalog gives teams the language to explain why a public model was reused, which data challenged it, and where the result can be trusted.',
    image: 'https://raw.githubusercontent.com/Plale-Lab/patra-frontend/dev/app/public/img/catalog/compute-servers.jpg',
    imageAlt: 'Rows of illuminated servers in a data center',
    imagePosition: 'center 50%',
    author: 'Patra Editorial Team',
    publishedAt: 'June 30, 2026',
    readTime: '7 min read',
    accent: '#2f4ea2',
    quote: 'Reuse becomes accountable when identifiers survive every handoff between catalog, compute, evaluation, and publication.',
    sections: [
      {
        eyebrow: 'The catalog gap',
        title: 'Public does not automatically mean reusable',
        paragraphs: [
          'Model files often travel farther than the documentation that explains their limits. A team may know the architecture and accuracy while missing the dataset population, evaluation conditions, or changes introduced after download.',
          'Connected model cards and datasheets make those dependencies explicit before the model enters a new workflow.',
        ],
      },
      {
        eyebrow: 'The record',
        title: 'Lineage stays legible across domains',
        paragraphs: [
          'Stable identifiers link the reused model, reference data, compute environment, and evaluation output. The narrative layer captures the human reason for reuse; the graph keeps the evidence navigable.',
          'This prototype uses mock relationships to establish the intended sharing experience before the editorial service is connected.',
        ],
      },
    ],
    relatedRecords: [
      { id: 'mc-bert-sentiment', type: 'model', title: 'BERT Sentiment Analyzer', subtitle: 'Reusable public language model', meta: 'Transformers · v2.1', route: '/modelcard/mc-bert-sentiment' },
      { id: 'ds-imdb', type: 'dataset', title: 'Large Movie Review Dataset', subtitle: 'Reference evaluation data', meta: 'Dataset · 2011', route: '/datasheet/ds-imdb' },
    ],
    graph: {
      nodes: [
        { id: 'reuse-model', type: 'model', title: 'Reusable model', meta: 'Model card', x: 120, y: 190, route: '/modelcard/mc-bert-sentiment' },
        { id: 'reuse-data', type: 'dataset', title: 'Reference data', meta: 'Datasheet', x: 330, y: 92, route: '/datasheet/ds-imdb' },
        { id: 'reuse-compute', type: 'compute', title: 'Documented compute', meta: 'Compute profile', x: 535, y: 190 },
        { id: 'reuse-run', type: 'run', title: 'Evaluation', meta: 'Run · reproducible', x: 740, y: 92 },
        { id: 'reuse-result', type: 'result', title: 'Metrics + lineage', meta: 'Result · published', x: 940, y: 190 },
      ],
      edges: [
        { source: 'reuse-model', target: 'reuse-compute', label: 'loaded by' },
        { source: 'reuse-data', target: 'reuse-compute', label: 'evaluated on' },
        { source: 'reuse-compute', target: 'reuse-run', label: 'executed' },
        { source: 'reuse-run', target: 'reuse-result', label: 'published' },
      ],
    },
  },
]

export function getResourceStory(slug) {
  return resourceStories.find((story) => story.slug === slug) || null
}
