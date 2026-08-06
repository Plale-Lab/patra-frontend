<template>
  <ModalDialog title="Import from Hugging Face" hide-header @close="emit('close')">
    <p class="hf-import-intro">
      Paste a Hugging Face {{ isDataset ? 'dataset' : 'model' }} URL and we'll pre-fill the form below.
      You can review and edit every field before creating the record.
    </p>

    <div class="form-group">
      <label class="form-label" for="hf-import-url">{{ isDataset ? 'Dataset' : 'Model' }} URL</label>
      <input
        id="hf-import-url"
        class="form-input"
        type="url"
        :placeholder="isDataset ? 'https://huggingface.co/datasets/org/dataset-name' : 'https://huggingface.co/org/model-name'"
        v-model="url"
        :aria-invalid="validationError ? 'true' : undefined"
        @keydown.enter="handleImport"
      />
      <div v-if="validationError" class="field-error">{{ validationError }}</div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-outline" @click="emit('close')">Cancel</button>
      <button type="button" class="btn btn-primary" :disabled="loading" @click="handleImport">
        <IconLoader2 v-if="loading" :size="16" stroke-width="2" class="spin" />
        {{ loading ? 'Importing…' : prefillButtonLabel }}
      </button>
    </template>
  </ModalDialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconLoader2 } from '@tabler/icons-vue'
import ModalDialog from './ModalDialog.vue'
import { isLikelyHuggingFaceUrl, importFromHuggingFace } from '../lib/huggingFaceImport'

const props = defineProps({
  assetType: { type: String, default: 'model_card' },
})
const emit = defineEmits(['close', 'imported'])

const url = ref('')
const validationError = ref('')
const loading = ref(false)

const isDataset = computed(() => props.assetType === 'datasheet')
const prefillButtonLabel = computed(() => (isDataset.value ? 'Pre-fill Patra Datasheet Fields' : 'Pre-fill Patra Model Card Fields'))

async function handleImport() {
  if (loading.value) return

  if (!isLikelyHuggingFaceUrl(url.value)) {
    validationError.value = 'Enter a valid huggingface.co URL.'
    return
  }
  validationError.value = ''
  loading.value = true

  try {
    const fields = await importFromHuggingFace(url.value, props.assetType)
    emit('imported', fields)
  } catch (e) {
    validationError.value = e.message || 'Failed to import from Hugging Face.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.hf-import-intro {
  margin: 0 0 16px;
  font-size: 0.86rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>
