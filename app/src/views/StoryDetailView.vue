<template>
  <article v-if="story" class="story-page">
    <div v-if="story.status === 'draft'" class="draft-preview" role="status">
      <span><IconEye :size="16" /> Draft preview</span>
      <p>This story is not published or visible on the homepage.</p>
      <RouterLink v-if="stories.isAdmin" :to="{ name: 'StoryPortal', query: { edit: story.slug } }"><IconPencil :size="15" /> Edit story</RouterLink>
    </div>
    <header class="story-hero rise">
      <img :src="story.image" :alt="story.imageAlt" :style="{ objectPosition: story.imagePosition }" />
      <div class="story-hero-scrim"></div>
      <RouterLink to="/" class="story-back"><IconArrowLeft :size="16" /> Resource stories</RouterLink>
      <div class="story-hero-copy">
        <span class="story-domain">{{ story.domain }}</span>
        <h1>{{ story.title }}</h1>
        <p>{{ story.dek }}</p>
        <div class="story-byline">
          <span>{{ story.author }}</span>
          <span>{{ story.publishedAt }}</span>
          <span>{{ story.readTime }}</span>
        </div>
      </div>
    </header>

    <div class="story-toolbar" aria-label="Story actions">
      <div>
        <span class="story-toolbar-kicker">Field note</span>
        <strong>Share this documented workflow</strong>
      </div>
      <button type="button" class="story-share" @click="shareStory">
        <IconShare3 :size="17" /> {{ shareLabel }}
      </button>
    </div>

    <div class="story-layout">
      <main class="story-body">
        <section v-for="section in story.sections" :key="section.title" class="story-section">
          <span>{{ section.eyebrow }}</span>
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>

        <blockquote :style="{ '--quote-accent': story.accent }">
          <IconQuote :size="24" />
          <p>{{ story.quote }}</p>
        </blockquote>
      </main>

      <aside class="story-records" aria-labelledby="related-records-title">
        <div class="story-records-heading">
          <span>Catalog evidence</span>
          <h2 id="related-records-title">Related records</h2>
          <p>Open the documentation that supports this story.</p>
        </div>
        <RouterLink
          v-for="record in story.relatedRecords"
          :key="record.id"
          :to="record.route"
          class="related-record"
          @click="logRecordOpen(record)"
        >
          <div class="record-icon" :class="`record-icon--${record.type}`">
            <IconCube v-if="record.type === 'model'" :size="19" />
            <IconTable v-else :size="19" />
          </div>
          <div>
            <span>{{ record.type === 'model' ? 'Model card' : 'Datasheet' }}</span>
            <strong>{{ record.title }}</strong>
            <p>{{ record.subtitle }}</p>
            <em>{{ record.meta }}</em>
          </div>
          <IconArrowUpRight class="related-arrow" :size="17" />
        </RouterLink>
        <p class="placeholder-note"><IconInfoCircle :size="15" /> Placeholder records for the editorial prototype.</p>
      </aside>
    </div>

    <section class="story-map-section">
      <div class="story-map-heading">
        <div>
          <span class="section-kicker">Relationship map</span>
          <h2>Follow the evidence chain</h2>
        </div>
        <p>Hover to preview a record. Drag to move the canvas, use the controls to zoom, or select a linked record to open it.</p>
      </div>
      <RecordGraph
        :nodes="story.graph.nodes"
        :edges="story.graph.edges"
        :view-width="1080"
        :view-height="350"
        compact
        @node-click="openGraphNode"
      />
    </section>

    <footer v-if="nextStory" class="story-next">
      <div>
        <span>Continue exploring</span>
        <h2>{{ nextStory.title }}</h2>
      </div>
      <RouterLink :to="`/stories/${nextStory.slug}`" @click="logStoryOpen(nextStory)">
        Read next story <IconArrowRight :size="18" />
      </RouterLink>
    </footer>
  </article>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconCube,
  IconEye,
  IconInfoCircle,
  IconPencil,
  IconQuote,
  IconShare3,
  IconTable,
} from '@tabler/icons-vue'
import RecordGraph from '../components/RecordGraph.vue'
import { logUiEvent } from '../lib/uiLogger'
import { useStoriesStore } from '../stores/stories'

const route = useRoute()
const router = useRouter()
const stories = useStoriesStore()
const shareLabel = ref('Share story')
const story = computed(() => stories.getBySlug(route.params.slug))
const nextStory = computed(() => {
  const available = stories.publishedStories
  if (!available.length) return null
  const index = available.findIndex((item) => item.slug === story.value?.slug)
  return available[(index + 1) % available.length]
})

function logPageView() {
  if (!story.value) {
    router.replace('/')
    return
  }
  logUiEvent('resource-story-view', { slug: story.value.slug })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function shareStory() {
  const shareData = { title: story.value.title, text: story.value.summary, url: window.location.href }
  try {
    if (navigator.share) {
      await navigator.share(shareData)
      shareLabel.value = 'Shared'
      logUiEvent('resource-story-share', { slug: story.value.slug, method: 'native' })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      shareLabel.value = 'Link copied'
      logUiEvent('resource-story-share', { slug: story.value.slug, method: 'clipboard' })
    }
  } catch (error) {
    if (error?.name === 'AbortError') return
    shareLabel.value = 'Copy unavailable'
    logUiEvent('resource-story-share-error', { slug: story.value.slug })
  }
  window.setTimeout(() => { shareLabel.value = 'Share story' }, 2200)
}

function logRecordOpen(record) {
  logUiEvent('resource-story-related-record-open', { slug: story.value.slug, recordId: record.id, recordType: record.type })
}

function openGraphNode(node) {
  if (node.route) router.push(node.route)
}

function logStoryOpen(item) {
  logUiEvent('resource-story-open', { slug: item.slug, source: 'story-footer' })
}

onMounted(logPageView)
watch(() => route.params.slug, logPageView)
</script>

<style scoped>
.story-page { max-width: 1160px; margin: 0 auto; padding-bottom: 28px; }
.draft-preview { display: flex; align-items: center; gap: 16px; margin: -8px 0 16px; padding: 10px 12px; border: 1px solid #e1d6bd; border-radius: 8px; color: #755624; background: #fff9ec; font-size: .72rem; }
.draft-preview > span, .draft-preview a { display: inline-flex; align-items: center; gap: 6px; font-weight: 750; }
.draft-preview p { flex: 1; color: #806f51; }
.draft-preview a { color: var(--color-primary); }

.story-hero {
  position: relative;
  height: min(480px, calc(100vh - var(--header-height) - 48px));
  min-height: 430px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  margin: -8px 0 0;
  border-radius: 20px;
  color: #fff;
  background: #192132;
  box-shadow: 0 28px 70px rgba(29, 34, 44, .18);
}
.story-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 900ms var(--ease-out); }
.story-hero:hover img { transform: scale(1.018); }
.story-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,16,24,.18) 8%, rgba(10,16,24,.08) 35%, rgba(10,16,24,.86) 100%); }
.story-back {
  position: absolute;
  top: 24px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid rgba(255,255,255,.34);
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 650;
  background: rgba(16, 22, 31, .24);
  backdrop-filter: blur(10px);
}
.story-back:hover { background: rgba(16, 22, 31, .5); }
.story-hero-copy { position: relative; z-index: 1; max-width: 760px; padding: 38px 42px; }
.story-domain { display: inline-flex; margin-bottom: 14px; padding: 5px 9px; border: 1px solid rgba(255,255,255,.42); border-radius: 999px; font-size: .63rem; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; background: rgba(255,255,255,.12); }
.story-hero h1 { max-width: 15ch; margin: 0; font-size: clamp(2.7rem, 4vw, 4rem); line-height: .98; letter-spacing: -.055em; text-wrap: balance; }
.story-hero-copy > p { max-width: 620px; margin: 17px 0 0; color: rgba(255,255,255,.84); font-size: .94rem; line-height: 1.58; }
.story-byline { display: flex; flex-wrap: wrap; gap: 10px 22px; margin-top: 20px; color: rgba(255,255,255,.7); font-size: .71rem; font-weight: 600; }
.story-byline span + span::before { content: '·'; margin-right: 24px; }

.story-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 24px 0 56px; padding: 16px 4px 20px; border-bottom: 1px solid var(--color-border); }
.story-toolbar > div { display: grid; gap: 3px; }
.story-toolbar-kicker { color: var(--color-accent); font-size: .66rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.story-toolbar strong { font-size: .94rem; }
.story-share { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--color-border-strong); border-radius: 999px; color: var(--color-text); background: rgba(255,255,255,.7); font-weight: 650; }
.story-share:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }

.story-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, .72fr); gap: clamp(42px, 7vw, 96px); padding: 0 4px; }
.story-body { max-width: 720px; }
.story-section + .story-section { margin-top: 74px; }
.story-section > span, .story-records-heading > span, .section-kicker, .story-next span { color: var(--color-accent); font-size: .67rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.story-section h2 { max-width: 17ch; margin: 12px 0 24px; font-size: clamp(2rem, 3.5vw, 3.2rem); line-height: 1.05; letter-spacing: -.05em; text-wrap: balance; }
.story-section p { margin: 0 0 20px; color: #485365; font-family: Georgia, 'Times New Roman', serif; font-size: 1.13rem; line-height: 1.92; }
blockquote { position: relative; margin: 72px 0 0; padding: 35px 38px 38px; border: 0; border-left: 4px solid var(--quote-accent); color: var(--color-text); background: rgba(255,255,255,.54); }
blockquote svg { color: var(--quote-accent); }
blockquote p { margin: 10px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(1.45rem, 2.4vw, 2rem); line-height: 1.46; letter-spacing: -.025em; }

.story-records { position: sticky; top: calc(var(--header-height) + 24px); align-self: start; display: grid; gap: 12px; }
.story-records-heading { margin-bottom: 8px; }
.story-records-heading h2 { margin: 8px 0 5px; font-size: 1.55rem; letter-spacing: -.03em; }
.story-records-heading p { color: var(--color-text-secondary); font-size: .82rem; }
.related-record { position: relative; display: grid; grid-template-columns: 42px 1fr 18px; gap: 12px; padding: 16px 14px; border-top: 1px solid var(--color-border); transition: background var(--transition), transform var(--transition); }
.related-record:last-of-type { border-bottom: 1px solid var(--color-border); }
.related-record:hover { background: rgba(255,255,255,.56); transform: translateX(3px); }
.record-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; }
.record-icon--model { color: var(--color-primary); background: var(--color-primary-bg); }
.record-icon--dataset { color: #9a671b; background: var(--color-accent-bg); }
.related-record > div:nth-child(2) { display: grid; min-width: 0; }
.related-record span { color: var(--color-text-muted); font-size: .63rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.related-record strong { margin-top: 3px; line-height: 1.35; }
.related-record p { margin-top: 3px; color: var(--color-text-secondary); font-size: .76rem; line-height: 1.45; }
.related-record em { margin-top: 7px; color: var(--color-text-muted); font-size: .68rem; font-style: normal; }
.related-arrow { margin-top: 3px; color: var(--color-text-muted); }
.related-record:hover .related-arrow { color: var(--color-primary); }
.placeholder-note { display: flex; gap: 6px; margin-top: 4px; color: var(--color-text-muted); font-size: .69rem; line-height: 1.5; }
.placeholder-note svg { flex: 0 0 auto; margin-top: 2px; }

.story-map-section { margin-top: 112px; }
.story-map-heading { display: flex; align-items: end; justify-content: space-between; gap: 48px; margin-bottom: 24px; }
.story-map-heading h2 { margin-top: 7px; font-size: clamp(2rem, 3.5vw, 3.2rem); letter-spacing: -.05em; }
.story-map-heading > p { max-width: 440px; color: var(--color-text-secondary); font-size: .83rem; line-height: 1.65; }

.story-next { display: flex; align-items: center; justify-content: space-between; gap: 32px; margin-top: 84px; padding: 42px 4px 12px; border-top: 1px solid var(--color-border-strong); }
.story-next h2 { max-width: 20ch; margin-top: 7px; font-size: 1.7rem; line-height: 1.15; letter-spacing: -.035em; }
.story-next a { display: inline-flex; align-items: center; gap: 9px; flex: 0 0 auto; padding: 12px 16px; border-radius: 999px; color: #fff; background: var(--color-text); font-weight: 700; }
.story-next a:hover { background: var(--color-primary); }

@media (max-width: 900px) {
  .story-hero { height: 450px; min-height: 410px; }
  .story-hero-copy { padding: 34px 28px; }
  .story-layout { grid-template-columns: 1fr; }
  .story-body { max-width: none; }
  .story-records { position: static; }
  .story-map-heading { align-items: start; flex-direction: column; gap: 12px; }
}

@media (max-width: 620px) {
  .story-hero { height: 430px; min-height: 400px; border-radius: 16px; }
  .story-hero h1 { font-size: 2.75rem; }
  .story-toolbar, .story-next { align-items: flex-start; flex-direction: column; }
  .story-byline span + span::before { display: none; }
  .story-section p { font-size: 1.02rem; }
  blockquote { padding: 28px 24px; }
}
</style>
