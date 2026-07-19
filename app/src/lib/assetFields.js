// Single source of truth for the editable/creatable fields of each asset type.
// Pure data — no Vue imports. Consumed by SubmitView (create) and
// EditRecordsView (edit) through the shared FormField renderer, and by
// lib/fieldValidation.js. Field `key`s match the reactive form object keys
// used by both views (datasheet uses the canonical title/resource_type/subjects
// keys; see lib/assetPayloads.js + features/edit-records/api.js).

const VISIBILITY_OPTIONS = [
  { value: false, label: 'Public' },
  { value: true, label: 'Private' },
]

const ACCESS_OPTIONS = [
  { value: false, label: 'Open' },
  { value: true, label: 'Gated' },
]

export const MODEL_CARD_SECTIONS = [
  {
    id: 'identity',
    title: 'Identity',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. ResNet-50 Image Classifier' },
      { key: 'version', label: 'Version', type: 'text', placeholder: 'e.g. 1.0' },
      { key: 'author', label: 'Author', type: 'text', placeholder: 'e.g. Jane Doe', help: 'Defaults to your name if left blank.' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Image Classification' },
    ],
  },
  {
    id: 'details',
    title: 'Description',
    fields: [
      { key: 'short_description', label: 'Short Description', type: 'textarea', rows: 2, placeholder: 'Brief summary of the model' },
      { key: 'full_description', label: 'Full Description', type: 'textarea', rows: 4, placeholder: 'Detailed description of what the model does' },
      { key: 'input_type', label: 'Input Type', type: 'text', placeholder: 'e.g. Image, Text, Tabular' },
      { key: 'keywords', label: 'Keywords', type: 'text', placeholder: 'e.g. computer vision, deep learning' },
    ],
  },
  {
    id: 'ai_links',
    title: 'AI Model & Links',
    fields: [
      { key: 'framework', label: 'Framework', type: 'text', placeholder: 'e.g. PyTorch, TensorFlow' },
      { key: 'license', label: 'License', type: 'text', placeholder: 'e.g. Apache 2.0, MIT' },
      { key: 'test_accuracy', label: 'Test Accuracy', type: 'number', step: '0.01', min: '0', max: '1', validate: ['accuracy'], placeholder: 'e.g. 0.95', help: 'A value between 0 and 1.' },
      { key: 'foundational_model', label: 'Model Architecture', type: 'text', placeholder: 'e.g. ResNet-50, Transformer' },
      { key: 'training_datasheet_uuid', label: 'Last Dataset Trained On', type: 'text', placeholder: 'UUID of the datasheet this model was last trained/fine-tuned on', help: 'Links to the datasheet in PATRA for the dataset used to train or fine-tune this model.' },
      { key: 'input_data', label: 'Input Data URL', type: 'url', validate: ['url'], placeholder: 'https://…' },
      { key: 'documentation', label: 'Documentation URL', type: 'url', validate: ['url'], placeholder: 'https://…' },
      { key: 'location', label: 'Model Location / Weights URL', type: 'url', validate: ['url'], placeholder: 'https://github.com/org/repo/releases/download/v1/model.pt' },
      { key: 'citation', label: 'Citation', type: 'textarea', rows: 2, placeholder: 'BibTeX or plain-text citation' },
    ],
  },
  {
    id: 'access',
    title: 'Access',
    fields: [
      { key: 'is_private', label: 'Visibility', type: 'segmented', options: VISIBILITY_OPTIONS },
      { key: 'is_gated', label: 'Access', type: 'segmented', options: ACCESS_OPTIONS },
    ],
  },
]

export const DATASHEET_SECTIONS = [
  {
    id: 'identity',
    title: 'Identity',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. CIFAR-10 Dataset' },
      { key: 'version', label: 'Version', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 4, placeholder: 'What this dataset contains and how it was collected' },
    ],
  },
  {
    id: 'details',
    title: 'DataCite',
    fields: [
      { key: 'creator', label: 'Creator', type: 'text', placeholder: 'e.g. Jane Doe', help: 'Comma-separated names. Defaults to your name if left blank.' },
      { key: 'publisher', label: 'Publisher', type: 'text' },
      { key: 'resource_type', label: 'Resource Type', type: 'text', placeholder: 'e.g. Dataset' },
      { key: 'publication_year', label: 'Publication Year', type: 'number', placeholder: 'e.g. 2025' },
      { key: 'subjects', label: 'Features / Subjects', type: 'text', placeholder: 'Comma-separated keywords' },
      { key: 'download_url', label: 'Download URL', type: 'url', validate: ['url'], placeholder: 'https://…' },
    ],
  },
  {
    id: 'access',
    title: 'Access',
    fields: [
      { key: 'is_private', label: 'Visibility', type: 'segmented', options: VISIBILITY_OPTIONS },
    ],
  },
]

export function sectionsFor(assetType) {
  return assetType === 'datasheet' ? DATASHEET_SECTIONS : MODEL_CARD_SECTIONS
}

export function fieldsFor(assetType) {
  return sectionsFor(assetType).flatMap((section) => section.fields)
}
