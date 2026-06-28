<template>
  <main class="catalog-home">
    <section class="catalog-hero">
      <img
        class="hero-image"
        src="/img/catalog/hero-field.jpg"
        alt="Rows of crops extending across a sunlit agricultural landscape"
      />
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-inner">
        <div class="hero-brand">ICICLE AI Resource Catalog</div>
        <h1>Discover connected AI resources.</h1>
        <p>Search models, datasets, workflows, devices, evaluations, and provenance across the ICICLE ecosystem.</p>

        <form class="hero-search" role="search" @submit.prevent="searchCatalog">
          <IconSearch :size="22" aria-hidden="true" />
          <label class="sr-only" for="catalog-home-search">Search the public resource catalog</label>
          <input
            id="catalog-home-search"
            v-model="searchQuery"
            type="search"
            placeholder="Search models, datasets, workflows, devices, or identifiers"
          />
          <button type="submit">
            Search
            <IconArrowRight :size="17" aria-hidden="true" />
          </button>
        </form>
      </div>
      <a class="hero-credit" href="https://images.unsplash.com/photo-1560493676-04071c5f467b" target="_blank" rel="noreferrer">
        Dan Meyers / Unsplash
      </a>
    </section>

    <div class="catalog-body">
      <div v-if="catalogError" class="catalog-notice" role="status">
        <IconAlertCircle :size="18" aria-hidden="true" />
        <span>Live catalog records are unavailable. Public navigation and documented development mappings remain available.</span>
      </div>

      <section id="resource-stories" class="stories-section" aria-labelledby="featured-stories">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Featured connections</span>
            <h2 id="featured-stories">Resource stories</h2>
          </div>
          <p>Follow a use case from its documented model and data through compute, run type, and result.</p>
        </div>

        <div class="stories-layout">
          <article v-for="story in stories" :key="story.id" class="story-card">
            <RouterLink :to="story.route" class="story-media" :aria-label="`Explore ${story.title}`">
              <img
                :src="story.image"
                :alt="story.imageAlt"
                :style="{ objectPosition: story.imagePosition }"
                loading="lazy"
              />
              <div class="story-media-shade" aria-hidden="true"></div>
              <span class="story-domain">{{ story.domain }}</span>
              <span class="story-open"><IconArrowUpRight :size="18" aria-hidden="true" /></span>
            </RouterLink>

            <div class="story-content">
              <h3><RouterLink :to="story.route">{{ story.title }}</RouterLink></h3>
              <p>{{ story.description }}</p>

              <ol class="resource-chain" :aria-label="`${story.title} connected resource chain`">
                <li v-for="(node, index) in story.chain" :key="node.type">
                  <RouterLink :to="node.route" :title="`${node.type}: ${node.label}`">
                    <span class="chain-icon">
                      <component :is="chainIcons[node.icon]" :size="17" aria-hidden="true" />
                    </span>
                    <span class="chain-copy">
                      <small>{{ node.type }}</small>
                      <strong>{{ node.label }}</strong>
                    </span>
                  </RouterLink>
                  <IconArrowRight v-if="index < story.chain.length - 1" class="chain-arrow" :size="14" aria-hidden="true" />
                </li>
              </ol>

              <div class="linked-records">
                <span>Linked records</span>
                <RouterLink :to="story.modelRoute" :title="story.modelLabel">{{ story.modelLabel }}</RouterLink>
                <RouterLink :to="story.datasetRoute" :title="story.datasetLabel">{{ story.datasetLabel }}</RouterLink>
              </div>

              <div class="story-footer">
                <span><i aria-hidden="true"></i>{{ story.dataStatus }}</span>
                <RouterLink :to="story.route">View story <IconArrowRight :size="15" aria-hidden="true" /></RouterLink>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="browse-catalog" class="browse-section" aria-labelledby="browse-heading">
        <div class="section-heading browse-heading">
          <div>
            <span class="section-kicker">Browse the repository</span>
            <h2 id="browse-heading">Explore by resource type</h2>
          </div>
          <RouterLink to="/search" class="section-link">Search everything <IconArrowRight :size="17" aria-hidden="true" /></RouterLink>
        </div>

        <nav class="browse-list" aria-label="Catalog resource types">
          <RouterLink to="/explore-model-cards">
            <span class="browse-number">01</span>
            <span><strong>Models</strong><small>Documentation, versions, metrics, and deployment context</small></span>
            <IconArrowUpRight :size="20" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/explore-datasheets">
            <span class="browse-number">02</span>
            <span><strong>Datasets</strong><small>Datasheets, creators, identifiers, rights, and provenance</small></span>
            <IconArrowUpRight :size="20" aria-hidden="true" />
          </RouterLink>
          <RouterLink v-if="SUPPORTS_DOMAIN_EXPERIMENTS" to="/animal-ecology">
            <span class="browse-number">03</span>
            <span><strong>Workflows and runs</strong><small>Operational inference, evaluations, devices, images, and power</small></span>
            <IconArrowUpRight :size="20" aria-hidden="true" />
          </RouterLink>
          <RouterLink v-if="SUPPORTS_MCP_EXPLORER" to="/mcp-explorer">
            <span class="browse-number">04</span>
            <span><strong>Tools and agents</strong><small>Agent-facing integrations and catalog capabilities</small></span>
            <IconArrowUpRight :size="20" aria-hidden="true" />
          </RouterLink>
        </nav>
      </section>

      <footer id="catalog-about" class="catalog-about">
        <div>
          <strong>About this catalog</strong>
          <p>Public browsing does not require a Tapis account. Sign in only for personal collections and contributor tools.</p>
        </div>
        <div class="image-credits">
          <span>Photography:</span>
          <a href="https://unsplash.com/photos/jaguar-yawning-with-mouth-wide-open-ghxjsVpmzP4" target="_blank" rel="noreferrer">Carla Redhead Alvarado</a>
          <a href="https://images.unsplash.com/photo-1508175688576-0c076b47b5b5" target="_blank" rel="noreferrer">Yulian Alexeyev</a>
          <a href="https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_17.jpg" target="_blank" rel="noreferrer">Victor Grigas, CC BY-SA 3.0</a>
        </div>
      </footer>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  IconActivity,
  IconAlertCircle,
  IconArrowRight,
  IconArrowUpRight,
  IconChartLine,
  IconCpu,
  IconCube,
  IconDatabase,
  IconSearch,
} from '@tabler/icons-vue'
import { SUPPORTS_DOMAIN_EXPERIMENTS, SUPPORTS_MCP_EXPLORER } from '../config/api'
import { buildResourceStories } from '../lib/resourceStories'
import { useExploreStore } from '../stores/explore'

const router = useRouter()
const exploreStore = useExploreStore()
const searchQuery = ref('')
const chainIcons = {
  model: IconCube,
  dataset: IconDatabase,
  compute: IconCpu,
  run: IconActivity,
  result: IconChartLine,
}

const catalogError = computed(() => exploreStore.error)
const stories = computed(() => buildResourceStories(
  exploreStore.models,
  exploreStore.datasheets,
  { supportsDomainRuns: SUPPORTS_DOMAIN_EXPERIMENTS },
))

function searchCatalog() {
  const query = searchQuery.value.trim()
  router.push({ name: 'CatalogSearch', query: query ? { q: query } : {} })
}

onMounted(() => {
  void Promise.allSettled([
    exploreStore.fetchModels(),
    exploreStore.fetchDatasheets(),
  ])
})
</script>

<style scoped>
.catalog-home {
  margin: -32px -36px 0;
  color: #171918;
}

.catalog-hero {
  position: relative;
  min-height: 455px;
  overflow: hidden;
  background: #17211a;
  color: #fff;
  isolation: isolate;
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 58%;
  animation: hero-settle 900ms var(--ease-out) both;
  z-index: -3;
}

.hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(9, 18, 12, .9) 0%, rgba(9, 18, 12, .66) 42%, rgba(9, 18, 12, .12) 78%),
    linear-gradient(0deg, rgba(8, 13, 9, .38), transparent 55%);
  z-index: -2;
}

.hero-inner {
  width: min(1440px, calc(100% - 80px));
  margin: 0 auto;
  padding: 52px 0 44px;
  animation: hero-copy-in 650ms 80ms var(--ease-out) both;
}

.hero-brand {
  margin-bottom: 18px;
  font-size: .74rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.catalog-hero h1 {
  max-width: 760px;
  font-size: clamp(3rem, 5vw, 5.4rem);
  font-weight: 700;
  line-height: .94;
  letter-spacing: -.06em;
}

.catalog-hero p {
  max-width: 680px;
  margin-top: 17px;
  color: rgba(255,255,255,.83);
  font-size: 1rem;
  line-height: 1.55;
}

.hero-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  width: min(850px, 100%);
  margin-top: 25px;
  padding: 7px 7px 7px 17px;
  border: 1px solid rgba(255,255,255,.35);
  border-radius: 11px;
  background: rgba(255,255,255,.96);
  color: #5d625e;
  box-shadow: 0 18px 46px rgba(0,0,0,.18);
}

.hero-search:focus-within { box-shadow: 0 22px 52px rgba(0,0,0,.24), 0 0 0 3px rgba(255,255,255,.2); }
.hero-search input { min-width: 0; border: 0; outline: 0; background: transparent; color: #171918; font-size: 1rem; }
.hero-search button { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 19px; border: 0; border-radius: 7px; background: #1769e0; color: #fff; font-weight: 650; }
.hero-search button:hover { background: #0d56bd; }

.hero-credit { position: absolute; right: 20px; bottom: 13px; color: rgba(255,255,255,.58); font-size: .65rem; }
.hero-credit:hover { color: #fff; }

.catalog-body {
  width: min(1440px, calc(100% - 80px));
  margin: 0 auto;
}

.catalog-notice { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid #deded9; color: #676a67; font-size: .82rem; }
.stories-section { scroll-margin-top: 90px; padding: 48px 0 18px; }
.browse-section { scroll-margin-top: 90px; padding: 72px 0 10px; }

.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 40px; margin-bottom: 24px; }
.section-kicker { display: block; margin-bottom: 7px; color: #1769e0; font-size: .7rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.section-heading h2 { font-size: clamp(1.9rem, 2.6vw, 2.7rem); line-height: 1.05; letter-spacing: -.045em; }
.section-heading > p { max-width: 520px; color: #666962; line-height: 1.55; text-align: right; }

.stories-layout { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.story-card { min-width: 0; overflow: hidden; border: 1px solid #dfdfda; border-radius: 14px; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.035); transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition); }
.story-card:hover, .story-card:focus-within { border-color: #bfc2bc; transform: translateY(-3px); box-shadow: 0 14px 38px rgba(20,24,21,.09); }

.story-media { position: relative; display: block; height: 210px; overflow: hidden; color: #fff; }
.story-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 650ms var(--ease-out); }
.story-card:hover .story-media img, .story-card:focus-within .story-media img { transform: scale(1.035); }
.story-media-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,11,8,.18), transparent 50%, rgba(7,11,8,.48)); }
.story-domain { position: absolute; top: 15px; left: 15px; padding: 5px 8px; border: 1px solid rgba(255,255,255,.42); border-radius: 999px; background: rgba(11,16,12,.28); font-size: .65rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; backdrop-filter: blur(8px); }
.story-open { position: absolute; top: 14px; right: 14px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.94); color: #171918; transition: transform var(--transition); }
.story-card:hover .story-open { transform: translate(2px, -2px); }

.story-content { display: flex; min-height: 390px; flex-direction: column; padding: 22px; }
.story-content h3 { font-size: 1.35rem; line-height: 1.14; letter-spacing: -.03em; }
.story-content h3 a:hover { color: #1769e0; }
.story-content > p { min-height: 66px; margin-top: 9px; color: #666962; font-size: .84rem; line-height: 1.55; }

.resource-chain { display: flex; align-items: stretch; margin: 19px -5px 0; padding: 0; list-style: none; }
.resource-chain li { position: relative; display: flex; min-width: 0; flex: 1; align-items: center; }
.resource-chain li > a { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: center; gap: 6px; padding: 5px 3px; border-radius: 8px; text-align: center; transition: background var(--transition), color var(--transition); }
.resource-chain li > a:hover, .resource-chain li > a:focus-visible { background: #edf2ff; color: #1769e0; }
.chain-icon { display: grid; place-items: center; width: 31px; height: 31px; border: 1px solid #dce5f7; border-radius: 9px; background: #f5f8ff; color: #1769e0; }
.chain-copy { min-width: 0; }
.chain-copy small, .chain-copy strong { display: block; }
.chain-copy small { color: #999d96; font-size: .56rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
.chain-copy strong { margin-top: 2px; color: #4f554e; font-size: .64rem; font-weight: 600; line-height: 1.25; overflow-wrap: anywhere; }
.chain-arrow { flex: 0 0 auto; color: #aeb4ad; }

.linked-records { display: grid; gap: 6px; margin-top: 18px; padding-top: 15px; border-top: 1px solid #ecece8; }
.linked-records > span { color: #999d96; font-size: .62rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.linked-records a { color: #4d5664; font-size: .75rem; line-height: 1.35; }
.linked-records a:hover { color: #1769e0; text-decoration: underline; text-underline-offset: 2px; }

.story-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 18px; color: #858881; font-size: .68rem; }
.story-footer > span { display: inline-flex; align-items: center; gap: 7px; }
.story-footer i { width: 6px; height: 6px; border-radius: 50%; background: #1769e0; }
.story-footer > a { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; color: #1769e0; font-weight: 650; }

.browse-heading { margin-bottom: 10px; }
.section-link { display: inline-flex; align-items: center; gap: 8px; color: #1769e0; font-weight: 600; }
.browse-list { border-top: 1px solid #cfcfca; }
.browse-list a { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 23px 4px; border-bottom: 1px solid #deded9; color: #62655f; transition: padding var(--transition), color var(--transition), background var(--transition); }
.browse-list a:hover { padding-right: 12px; padding-left: 12px; background: rgba(255,255,255,.55); color: #1769e0; }
.browse-number { color: #a5a7a2; font-size: .72rem; font-variant-numeric: tabular-nums; }
.browse-list strong, .browse-list small { display: block; }
.browse-list strong { color: #171918; font-size: 1.02rem; }
.browse-list small { margin-top: 3px; color: #777a74; }

.catalog-about { scroll-margin-top: 90px; display: flex; justify-content: space-between; gap: 50px; margin-top: 70px; padding: 25px 0 32px; border-top: 1px solid #deded9; color: #777a74; font-size: .76rem; }
.catalog-about strong { color: #171918; }
.catalog-about p { max-width: 590px; margin-top: 5px; }
.image-credits { display: flex; max-width: 560px; flex-wrap: wrap; justify-content: flex-end; gap: 4px 12px; color: #92958f; font-size: .66rem; text-align: right; }
.image-credits a { text-decoration: underline; text-underline-offset: 2px; }
.image-credits a:hover { color: #1769e0; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes hero-settle { from { opacity: .4; transform: scale(1.035); } to { opacity: 1; transform: scale(1); } }
@keyframes hero-copy-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1220px) {
  .stories-layout { grid-template-columns: 1fr; }
  .story-card { display: grid; grid-template-columns: minmax(280px, .65fr) minmax(0, 1.35fr); }
  .story-media { height: 100%; min-height: 330px; }
  .story-content { min-height: 330px; }
  .story-content > p { min-height: 0; }
}

@media (max-width: 760px) {
  .catalog-home { margin: -20px -18px 0; }
  .catalog-hero { min-height: 535px; }
  .hero-inner, .catalog-body { width: min(100% - 36px, 1440px); }
  .hero-inner { padding: 45px 0 38px; }
  .catalog-hero h1 { font-size: clamp(3rem, 13vw, 4.5rem); }
  .hero-search { grid-template-columns: auto minmax(0, 1fr); }
  .hero-search button { grid-column: 1 / -1; justify-content: center; }
  .hero-credit { display: none; }
  .section-heading { display: block; }
  .section-heading > p { margin-top: 10px; text-align: left; }
  .stories-section { padding-top: 42px; }
  .browse-section { padding-top: 55px; }
  .story-card { display: block; }
  .story-media { height: 220px; min-height: 0; }
  .story-content { min-height: 0; }
  .resource-chain { display: grid; gap: 0; margin: 18px 0 0; overflow: visible; }
  .resource-chain li { display: grid; grid-template-columns: 1fr; min-width: 0; }
  .resource-chain li > a { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 10px; align-items: center; padding: 9px 7px; text-align: left; }
  .chain-copy small { font-size: .58rem; }
  .chain-copy strong { font-size: .75rem; overflow-wrap: normal; }
  .chain-arrow { margin: -4px 0 -4px 17px; transform: rotate(90deg); }
  .story-footer { align-items: flex-end; }
  .section-link { margin-top: 13px; }
  .catalog-about { display: block; }
  .image-credits { justify-content: flex-start; margin-top: 18px; text-align: left; }
}
</style>
