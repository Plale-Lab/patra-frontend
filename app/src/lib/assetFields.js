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
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. ResNet-50 Image Classifier', help: 'The human-readable name people will search for and see everywhere this model is listed.' },
      { key: 'version', label: 'Version', type: 'text', placeholder: 'e.g. 1.0', help: 'A version tag for this model, e.g. 1.0 or 2.1.3.' },
      { key: 'author', label: 'Author', type: 'text', placeholder: 'e.g. Jane Doe', help: 'Defaults to your name if left blank.' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Image Classification', help: 'The task or domain this model belongs to, e.g. Image Classification or NLP.' },
    ],
  },
  {
    id: 'details',
    title: 'Description',
    fields: [
      { key: 'short_description', label: 'Short Description', type: 'textarea', rows: 2, placeholder: 'Brief summary of the model', help: 'A one- or two-sentence summary shown on cards and search results.' },
      { key: 'full_description', label: 'Full Description', type: 'textarea', rows: 4, placeholder: 'Detailed description of what the model does', help: 'The full write-up shown on the model’s detail page.' },
      { key: 'input_type', label: 'Input Type', type: 'text', placeholder: 'e.g. Image, Text, Tabular', help: 'The kind of data this model expects as input.' },
      { key: 'keywords', label: 'Keywords', type: 'text', placeholder: 'e.g. computer vision, deep learning', help: 'Comma-separated terms that help this model turn up in search.' },
    ],
  },
  {
    id: 'ai_links',
    title: 'AI Model & Links',
    fields: [
      { key: 'framework', label: 'Framework', type: 'text', placeholder: 'e.g. PyTorch, TensorFlow', help: 'The ML framework this model was built with.' },
      { key: 'model_type', label: 'Model Type', type: 'text', placeholder: 'e.g. cnn, dnn, llm, rnn, gnn', help: 'The architecture family this model belongs to (cnn, dnn, llm, rnn, lstm, gnn, svm, kmeans, decision_tree, random_forest, or other).' },
      { key: 'license', label: 'License', type: 'text', placeholder: 'e.g. Apache 2.0, MIT', help: 'The usage license for this model, e.g. Apache 2.0 or MIT.' },
      { key: 'test_accuracy', label: 'Test Accuracy', type: 'number', step: '0.01', min: '0', max: '1', validate: ['accuracy'], placeholder: 'e.g. 0.95', help: 'A value between 0 and 1.' },
      { key: 'foundational_model', label: 'Model Architecture', type: 'text', placeholder: 'e.g. ResNet-50, Transformer', help: 'The underlying architecture or base model this was built on.' },
      { key: 'training_datasheet_uuid', label: 'Last Dataset Trained On', type: 'text', validate: ['uuid'], placeholder: 'UUID of the datasheet this model was last trained/fine-tuned on', help: 'Links to the datasheet in PATRA for the dataset used to train or fine-tune this model.' },
      { key: 'input_data', label: 'Input Data URL', type: 'url', validate: ['url'], placeholder: 'https://…', help: 'A link to a sample of the data this model accepts as input.' },
      { key: 'documentation', label: 'Documentation URL', type: 'url', validate: ['url'], placeholder: 'https://…', help: 'A link to this model’s docs, README, or paper.' },
      { key: 'location', label: 'Model Location / Weights URL', type: 'url', validate: ['url'], placeholder: 'https://github.com/org/repo/releases/download/v1/model.pt', help: 'A direct link to download the trained model weights.' },
      { key: 'citation', label: 'Citation', type: 'textarea', rows: 2, placeholder: 'BibTeX or plain-text citation', help: 'How this model should be cited in a paper or report.' },
    ],
  },
  {
    id: 'access',
    title: 'Access',
    fields: [
      { key: 'is_private', label: 'Visibility', type: 'segmented', options: VISIBILITY_OPTIONS, help: 'Public cards are visible to everyone; private ones stay restricted.' },
      { key: 'is_gated', label: 'Access', type: 'segmented', options: ACCESS_OPTIONS, help: 'Gated models require approval before their weights can be downloaded.' },
    ],
  },
]

export const DATASHEET_SECTIONS = [
  {
    id: 'identity',
    title: 'Identity',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. CIFAR-10 Dataset', help: 'The human-readable name of this dataset.' },
      { key: 'version', label: 'Version', type: 'text', help: 'A version tag for this datasheet, e.g. 1.0.' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 4, placeholder: 'What this dataset contains and how it was collected', help: 'What the dataset contains and how it was collected.' },
    ],
  },
  {
    id: 'details',
    title: 'DataCite',
    fields: [
      { key: 'creator', label: 'Creator', type: 'text', placeholder: 'e.g. Jane Doe', help: 'Comma-separated names. Defaults to your name if left blank.' },
      { key: 'publisher', label: 'Publisher', type: 'text', help: 'The organization or individual that made this dataset available.' },
      { key: 'resource_type', label: 'Resource Type', type: 'text', placeholder: 'e.g. Dataset', help: 'The DataCite resource type, e.g. Dataset.' },
      { key: 'publication_year', label: 'Publication Year', type: 'number', placeholder: 'e.g. 2025', help: 'The year this dataset was published or released.' },
      { key: 'subjects', label: 'Features / Subjects', type: 'text', placeholder: 'Comma-separated keywords', help: 'Comma-separated keywords describing the dataset’s subject matter or features.' },
      { key: 'download_url', label: 'Download URL', type: 'url', validate: ['url'], placeholder: 'https://…', help: 'A direct link to download this dataset.' },
      { key: 'license', label: 'License', type: 'text', placeholder: 'e.g. CC BY 4.0, MIT', help: 'The usage rights or license for this dataset, e.g. CC BY 4.0.' },
      { key: 'license_uri', label: 'License URL', type: 'url', validate: ['url'], placeholder: 'https://…', help: 'A link to the full text of the license.' },
    ],
  },
  {
    id: 'access',
    title: 'Access',
    fields: [
      { key: 'is_private', label: 'Visibility', type: 'segmented', options: VISIBILITY_OPTIONS, help: 'Public cards are visible to everyone; private ones stay restricted.' },
    ],
  },
]

export function sectionsFor(assetType) {
  return assetType === 'datasheet' ? DATASHEET_SECTIONS : MODEL_CARD_SECTIONS
}

export function fieldsFor(assetType) {
  return sectionsFor(assetType).flatMap((section) => section.fields)
}
