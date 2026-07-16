<template>
  <main class="story-studio">
    <header class="studio-header rise">
      <div>
        <span class="studio-eyebrow">Story publishing</span>
        <h1>{{ editingStory ? 'Edit resource story' : 'Create a resource story' }}</h1>
        <p>Turn a documented workflow into the same editorial format used across the catalog.</p>
      </div>
      <div class="studio-header-actions">
        <RouterLink v-if="stories.isAdmin" to="/story-admin" class="studio-button studio-button--quiet">
          <IconLayoutDashboard :size="17" /> Admin dashboard
        </RouterLink>
        <RouterLink v-else to="/story-admin" class="studio-button studio-button--quiet">
          <IconLock :size="16" /> Admin sign in
        </RouterLink>
      </div>
    </header>

    <div class="studio-notice" role="note">
      <IconInfoCircle :size="17" />
      <span>New stories are saved as drafts. An administrator reviews, publishes, and chooses whether they appear on the homepage.</span>
    </div>

    <div class="studio-layout">
      <form class="story-form" @submit.prevent="saveStory">
        <section class="form-block">
          <header><span>01</span><div><h2>Story identity</h2><p>The title and short copy readers see first.</p></div></header>
          <div class="field-grid">
            <label class="field field--wide">
              <span>Story title <em>Required</em></span>
              <input v-model.trim="draft.title" required maxlength="90" placeholder="Wildlife monitoring at the edge" />
              <small>{{ draft.title.length }}/90</small>
            </label>
            <label class="field">
              <span>Domain</span>
              <input v-model.trim="draft.domain" maxlength="40" placeholder="Animal ecology" />
            </label>
            <label class="field">
              <span>Author</span>
              <input v-model.trim="draft.author" maxlength="60" placeholder="Your team or name" />
            </label>
            <label class="field field--wide">
              <span>Card summary <em>Required</em></span>
              <textarea v-model.trim="draft.summary" required rows="2" maxlength="190" placeholder="A concise description for the homepage story card."></textarea>
              <small>{{ draft.summary.length }}/190</small>
            </label>
            <label class="field field--wide">
              <span>Hero introduction <em>Required</em></span>
              <textarea v-model.trim="draft.dek" required rows="3" maxlength="280" placeholder="Explain the workflow and why it matters."></textarea>
              <small>{{ draft.dek.length }}/280</small>
            </label>
          </div>
        </section>

        <section class="form-block">
          <header><span>02</span><div><h2>Cover and byline</h2><p>A strong landscape image anchors the story template.</p></div></header>
          <div class="field-grid">
            <label class="field field--wide">
              <span>Image URL <em>Required</em></span>
              <input v-model.trim="draft.image" required type="url" placeholder="https://images.example.org/field-work.jpg" />
              <small>Use an HTTPS image at least 1600 px wide.</small>
            </label>
            <label class="field field--wide">
              <span>Image alt text</span>
              <input v-model.trim="draft.imageAlt" maxlength="140" placeholder="Describe the image for screen readers" />
            </label>
            <label class="field">
              <span>Read time</span>
              <input v-model.trim="draft.readTime" maxlength="24" placeholder="5 min read" />
            </label>
            <label class="field">
              <span>Accent color</span>
              <span class="color-input"><input v-model="draft.accent" type="color" /><input v-model.trim="draft.accent" aria-label="Accent color hex value" maxlength="7" /></span>
            </label>
          </div>
        </section>

        <section class="form-block">
          <header><span>03</span><div><h2>Narrative</h2><p>Two focused sections preserve the current editorial rhythm.</p></div></header>
          <div class="story-section-editor">
            <span class="section-label">Section one</span>
            <div class="field-grid">
              <label class="field"><span>Eyebrow</span><input v-model.trim="draft.sectionOneEyebrow" placeholder="The field problem" /></label>
              <label class="field"><span>Heading</span><input v-model.trim="draft.sectionOneTitle" placeholder="Keep inference close to the habitat" /></label>
              <label class="field field--wide"><span>Body <em>Required</em></span><textarea v-model="draft.sectionOneBody" required rows="7" placeholder="Write the section. Separate paragraphs with a blank line."></textarea></label>
            </div>
          </div>
          <div class="story-section-editor">
            <span class="section-label">Section two</span>
            <div class="field-grid">
              <label class="field"><span>Eyebrow</span><input v-model.trim="draft.sectionTwoEyebrow" placeholder="What changed" /></label>
              <label class="field"><span>Heading</span><input v-model.trim="draft.sectionTwoTitle" placeholder="Reviewers follow evidence" /></label>
              <label class="field field--wide"><span>Body</span><textarea v-model="draft.sectionTwoBody" rows="7" placeholder="Write the second section. Separate paragraphs with a blank line."></textarea></label>
            </div>
          </div>
          <label class="field field--wide quote-field">
            <span>Pull quote</span>
            <textarea v-model.trim="draft.quote" rows="3" maxlength="260" placeholder="The model is only one part of the evidence…"></textarea>
          </label>
        </section>

        <section class="form-block">
          <header><span>04</span><div><h2>Related records</h2><p>Add one model card and one datasheet to seed the evidence map.</p></div></header>
          <div class="record-editor">
            <span class="record-type record-type--model"><IconCube :size="16" /> Model card</span>
            <div class="field-grid">
              <label class="field"><span>Title</span><input v-model.trim="draft.modelTitle" placeholder="YOLOv8 Object Detector" /></label>
              <label class="field"><span>Catalog route</span><input v-model.trim="draft.modelRoute" placeholder="/modelcard/record-id" /></label>
              <label class="field field--wide"><span>Description</span><input v-model.trim="draft.modelSubtitle" placeholder="Edge-ready wildlife detection model" /></label>
            </div>
          </div>
          <div class="record-editor">
            <span class="record-type record-type--dataset"><IconTable :size="16" /> Datasheet</span>
            <div class="field-grid">
              <label class="field"><span>Title</span><input v-model.trim="draft.datasetTitle" placeholder="COCO: Common Objects in Context" /></label>
              <label class="field"><span>Catalog route</span><input v-model.trim="draft.datasetRoute" placeholder="/datasheet/record-id" /></label>
              <label class="field field--wide"><span>Description</span><input v-model.trim="draft.datasetSubtitle" placeholder="Reference training and evaluation data" /></label>
            </div>
          </div>
        </section>

        <footer class="form-actions">
          <p><IconDeviceFloppy :size="16" /> {{ editingStory ? 'Changes retain the current URL and publication state.' : 'The generated page will be ready for admin review.' }}</p>
          <button type="submit" class="studio-button studio-button--primary">
            {{ editingStory ? 'Save changes' : 'Generate story page' }} <IconArrowRight :size="17" />
          </button>
        </footer>
      </form>

      <aside class="preview-panel" aria-label="Live story preview">
        <header><div><span>Live preview</span><strong>Story template</strong></div><span class="preview-status">Draft</span></header>
        <article class="preview-canvas">
          <div class="preview-hero">
            <img v-if="preview.image" :src="preview.image" :alt="preview.imageAlt" @error="imageFailed = true" />
            <div v-if="!preview.image || imageFailed" class="preview-image-fallback"><IconPhoto :size="30" /><span>Add a valid cover image</span></div>
            <div class="preview-scrim"></div>
            <div class="preview-hero-copy">
              <span>{{ preview.domain }}</span>
              <h2>{{ preview.title }}</h2>
              <p>{{ preview.dek || 'Your hero introduction will appear here.' }}</p>
              <small>{{ preview.author }} · {{ preview.readTime }}</small>
            </div>
          </div>
          <div class="preview-body">
            <div>
              <span>{{ preview.sections[0]?.eyebrow || 'The field problem' }}</span>
              <h3>{{ preview.sections[0]?.title || 'Your first section heading' }}</h3>
              <p>{{ preview.sections[0]?.paragraphs[0] || 'The opening paragraph will appear here as you write.' }}</p>
            </div>
            <aside>
              <span>Catalog evidence</span>
              <strong>Related records</strong>
              <div v-for="record in preview.relatedRecords" :key="record.id"><IconCube v-if="record.type === 'model'" :size="15" /><IconTable v-else :size="15" /><p><b>{{ record.title }}</b><small>{{ record.subtitle }}</small></p></div>
            </aside>
          </div>
        </article>
        <p class="preview-help"><IconSparkles :size="15" /> The full generated page also includes the pull quote and interactive relationship map.</p>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  IconArrowRight,
  IconCube,
  IconDeviceFloppy,
  IconInfoCircle,
  IconLayoutDashboard,
  IconLock,
  IconPhoto,
  IconSparkles,
  IconTable,
} from '@tabler/icons-vue'
import { useStoriesStore } from '../stores/stories'

const DEFAULT_IMAGE = 'https://raw.githubusercontent.com/Plale-Lab/patra-frontend/dev/app/public/img/catalog/wildlife-jaguar.jpg'

function emptyDraft() {
  return {
    title: '', domain: 'Field note', author: '', summary: '', dek: '', image: DEFAULT_IMAGE,
    imageAlt: '', imagePosition: 'center 50%', readTime: '5 min read', accent: '#c78928', quote: '',
    sectionOneEyebrow: 'The field problem', sectionOneTitle: '', sectionOneBody: '',
    sectionTwoEyebrow: 'What changed', sectionTwoTitle: '', sectionTwoBody: '',
    modelTitle: '', modelSubtitle: '', modelMeta: 'Model card', modelRoute: '/modelcards',
    datasetTitle: '', datasetSubtitle: '', datasetMeta: 'Datasheet', datasetRoute: '/datasheets',
  }
}

function fromStory(story) {
  const model = story.relatedRecords?.find((record) => record.type === 'model') || {}
  const dataset = story.relatedRecords?.find((record) => record.type === 'dataset') || {}
  return {
    ...emptyDraft(),
    ...story,
    sectionOneEyebrow: story.sections?.[0]?.eyebrow || '',
    sectionOneTitle: story.sections?.[0]?.title || '',
    sectionOneBody: story.sections?.[0]?.paragraphs?.join('\n\n') || '',
    sectionTwoEyebrow: story.sections?.[1]?.eyebrow || '',
    sectionTwoTitle: story.sections?.[1]?.title || '',
    sectionTwoBody: story.sections?.[1]?.paragraphs?.join('\n\n') || '',
    modelTitle: model.title || '', modelSubtitle: model.subtitle || '', modelMeta: model.meta || '', modelRoute: model.route || '',
    datasetTitle: dataset.title || '', datasetSubtitle: dataset.subtitle || '', datasetMeta: dataset.meta || '', datasetRoute: dataset.route || '',
  }
}

const stories = useStoriesStore()
const route = useRoute()
const router = useRouter()
const imageFailed = ref(false)
const editingStory = computed(() => route.query.edit && stories.isAdmin ? stories.getBySlug(route.query.edit) : null)
const draft = reactive(editingStory.value && stories.isAdmin ? fromStory(editingStory.value) : emptyDraft())
const preview = computed(() => stories.previewFromDraft(draft, editingStory.value?.id))

watch(() => draft.image, () => { imageFailed.value = false })

function saveStory() {
  const story = editingStory.value && stories.isAdmin
    ? stories.updateStory(editingStory.value.id, draft)
    : stories.createStory(draft)
  if (story) router.push({ name: 'ResourceStory', params: { slug: story.slug }, query: { preview: '1' } })
}
</script>

<style scoped>
.story-studio { max-width: 1460px; margin: 0 auto; color: #192235; }
.studio-header { display: flex; align-items: end; justify-content: space-between; gap: 32px; padding: 4px 0 22px; border-bottom: 1px solid var(--color-border); }
.studio-eyebrow { color: var(--color-primary); font-size: .67rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.studio-header h1 { margin-top: 7px; font-size: clamp(2rem, 3.2vw, 3rem); line-height: 1; letter-spacing: -.05em; }
.studio-header p { margin-top: 9px; color: var(--color-text-secondary); font-size: .9rem; }
.studio-header-actions { flex: 0 0 auto; }
.studio-button { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 14px; border: 1px solid var(--color-border-strong); border-radius: 8px; color: var(--color-text); background: #fff; font-size: .82rem; font-weight: 700; transition: border-color var(--transition), background var(--transition), color var(--transition), transform var(--transition); }
.studio-button:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }
.studio-button:active { transform: scale(.985); }
.studio-button--primary { min-height: 46px; padding: 0 18px; border-color: var(--color-primary); color: #fff; background: var(--color-primary); }
.studio-button--primary:hover { color: #fff; background: #243f86; }
.studio-notice { display: flex; align-items: center; gap: 9px; margin: 18px 0; padding: 11px 13px; border: 1px solid #d9e2f4; border-radius: 8px; color: #44577c; background: #f5f8fe; font-size: .78rem; line-height: 1.45; }
.studio-notice svg { flex: 0 0 auto; color: var(--color-primary); }
.studio-layout { display: grid; grid-template-columns: minmax(500px, 1fr) minmax(360px, .72fr); gap: 24px; align-items: start; min-width: 0; }
.story-form { min-width: 0; border: 1px solid var(--color-border); border-radius: 10px; background: rgba(255,255,255,.68); }
.form-block { padding: 28px 30px; border-bottom: 1px solid var(--color-border); }
.form-block > header { display: grid; grid-template-columns: 28px 1fr; gap: 10px; margin-bottom: 24px; }
.form-block > header > span { width: 24px; height: 24px; display: grid; place-items: center; border: 1px solid #ccd6ec; border-radius: 6px; color: var(--color-primary); background: var(--color-primary-bg); font-size: .66rem; font-weight: 800; }
.form-block h2 { font-size: 1.02rem; letter-spacing: -.015em; }
.form-block header p { margin-top: 3px; color: var(--color-text-muted); font-size: .73rem; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 16px; }
.field { position: relative; display: grid; gap: 7px; min-width: 0; color: #3d485a; font-size: .75rem; font-weight: 700; }
.field--wide { grid-column: 1 / -1; }
.field > span:first-child { display: flex; justify-content: space-between; gap: 8px; }
.field em { color: #a16c1b; font-size: .61rem; font-style: normal; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.field input, .field textarea { width: 100%; border: 1px solid #d7dae0; border-radius: 7px; outline: 0; color: var(--color-text); background: #fff; font: inherit; font-weight: 500; line-height: 1.55; transition: border-color var(--transition), box-shadow var(--transition); }
.field input { min-height: 42px; padding: 0 11px; }
.field textarea { resize: vertical; padding: 10px 11px; }
.field input:focus, .field textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),.08); }
.field input::placeholder, .field textarea::placeholder { color: #9aa1ad; }
.field small { color: var(--color-text-muted); font-size: .63rem; font-weight: 500; text-align: right; }
.color-input { display: grid !important; grid-template-columns: 42px 1fr; gap: 7px; }
.color-input input[type='color'] { padding: 4px; cursor: pointer; }
.story-section-editor + .story-section-editor { margin-top: 25px; padding-top: 24px; border-top: 1px solid var(--color-border); }
.section-label, .record-type { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 13px; color: var(--color-text-muted); font-size: .64rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.quote-field { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--color-border); }
.record-editor + .record-editor { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--color-border); }
.record-type--model { color: var(--color-primary); }
.record-type--dataset { color: #9a671b; }
.form-actions { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 20px 30px; }
.form-actions p { display: flex; align-items: center; gap: 7px; color: var(--color-text-muted); font-size: .69rem; }
.preview-panel { position: sticky; top: calc(var(--header-height) + 20px); min-width: 0; overflow: hidden; border: 1px solid var(--color-border); border-radius: 10px; background: #f3f1eb; box-shadow: 0 18px 44px rgba(28,34,48,.07); }
.preview-panel > header { display: flex; align-items: center; justify-content: space-between; padding: 13px 15px; border-bottom: 1px solid var(--color-border); background: rgba(255,255,255,.8); }
.preview-panel > header div { display: grid; gap: 2px; }
.preview-panel > header span { color: var(--color-text-muted); font-size: .61rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.preview-panel > header strong { font-size: .78rem; }
.preview-status { padding: 4px 8px; border: 1px solid #e0d4b8; border-radius: 999px; color: #8c611e !important; background: #fff9eb; letter-spacing: .04em !important; }
.preview-canvas { margin: 16px; overflow: hidden; border: 1px solid #d8d6cf; border-radius: 9px; background: #f8f6f0; }
.preview-hero { position: relative; height: 310px; display: flex; align-items: end; overflow: hidden; color: #fff; background: #1a2230; }
.preview-hero > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.preview-image-fallback { position: absolute; inset: 0; display: grid; place-content: center; gap: 8px; color: #9ba5b5; text-align: center; font-size: .75rem; }
.preview-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,12,18,.05), rgba(8,12,18,.9)); }
.preview-hero-copy { position: relative; z-index: 1; padding: 24px; }
.preview-hero-copy > span { display: inline-block; padding: 4px 7px; border: 1px solid rgba(255,255,255,.45); border-radius: 999px; font-size: .54rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.preview-hero h2 { max-width: 13ch; margin-top: 10px; font-size: clamp(2rem, 3vw, 2.7rem); line-height: .98; letter-spacing: -.055em; }
.preview-hero p { max-width: 52ch; margin-top: 10px; color: rgba(255,255,255,.8); font-size: .7rem; line-height: 1.5; }
.preview-hero small { display: block; margin-top: 12px; color: rgba(255,255,255,.65); font-size: .58rem; }
.preview-body { display: grid; grid-template-columns: 1.35fr .75fr; gap: 24px; padding: 28px 24px 34px; }
.preview-body > div > span, .preview-body > aside > span { color: #c27e16; font-size: .54rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.preview-body h3 { margin: 7px 0 10px; font-size: 1.35rem; line-height: 1.08; letter-spacing: -.04em; }
.preview-body > div > p { color: #596170; font-family: Georgia, serif; font-size: .76rem; line-height: 1.7; }
.preview-body aside > strong { display: block; margin: 6px 0 8px; font-size: .86rem; }
.preview-body aside > div { display: grid; grid-template-columns: 17px 1fr; gap: 7px; padding: 8px 0; border-top: 1px solid #dedbd3; color: var(--color-primary); }
.preview-body aside b, .preview-body aside small { display: block; color: var(--color-text); font-size: .58rem; line-height: 1.35; }
.preview-body aside small { margin-top: 2px; color: var(--color-text-muted); }
.preview-help { display: flex; align-items: center; gap: 7px; margin: 0 16px 16px; color: var(--color-text-muted); font-size: .66rem; line-height: 1.45; }
.preview-help svg { flex: 0 0 auto; color: var(--color-primary); }

@media (max-width: 1180px) { .studio-layout { grid-template-columns: 1fr; } .preview-panel { position: static; order: -1; } .preview-canvas { max-width: 720px; } }
@media (max-width: 700px) { .studio-header, .form-actions { align-items: flex-start; flex-direction: column; } .studio-layout { min-width: 0; } .form-block { padding: 23px 18px; } .field-grid { grid-template-columns: 1fr; } .field--wide { grid-column: auto; } .form-actions { padding: 18px; } .studio-button--primary { width: 100%; } .preview-body { grid-template-columns: 1fr; } }
</style>
