<template>
  <main class="admin-portal">
    <section v-if="!stories.isAdmin" class="admin-login rise">
      <div class="login-mark"><IconShieldLock :size="24" /></div>
      <span class="admin-kicker">Story administration</span>
      <h1>Manage the editorial queue</h1>
      <p>Review contributor drafts, publish finished stories, and choose the stories visible on the catalog homepage.</p>

      <form @submit.prevent="signIn">
        <label><span>Username</span><input v-model="credentials.username" autocomplete="username" autofocus /></label>
        <label><span>Password</span><input v-model="credentials.password" type="password" autocomplete="current-password" /></label>
        <p v-if="loginError" class="login-error" role="alert"><IconAlertCircle :size="16" /> {{ loginError }}</p>
        <button type="submit">Sign in <IconArrowRight :size="17" /></button>
      </form>

      <div class="prototype-credentials">
        <IconFlask :size="17" />
        <p><strong>Prototype access</strong><span>Username <code>admin</code> · Password <code>admin</code></span></p>
      </div>
      <RouterLink to="/story-portal" class="back-link"><IconArrowLeft :size="15" /> Return to Story Portal</RouterLink>
    </section>

    <template v-else>
      <header class="admin-heading rise">
        <div>
          <span class="admin-kicker">Editorial operations</span>
          <h1>Resource stories</h1>
          <p>Publication and homepage visibility are controlled independently.</p>
        </div>
        <div class="heading-actions">
          <button type="button" class="action-button action-button--quiet" @click="stories.logout"><IconLogout :size="17" /> Sign out</button>
          <RouterLink to="/story-portal" class="action-button action-button--primary"><IconPlus :size="17" /> New story</RouterLink>
        </div>
      </header>

      <section class="admin-overview" aria-label="Story status summary">
        <div><span>All stories</span><strong>{{ stories.stories.length }}</strong></div>
        <div><span>Published</span><strong>{{ publishedCount }}</strong></div>
        <div><span>On homepage</span><strong>{{ stories.homepageStories.length }}</strong></div>
        <div class="overview-note"><IconInfoCircle :size="17" /><p><strong>Homepage rule</strong><span>A story must be published before it can be featured.</span></p></div>
      </section>

      <section class="story-registry">
        <header>
          <div class="registry-title"><h2>Story registry</h2><span>{{ filteredStories.length }} shown</span></div>
          <div class="registry-tools">
            <label class="admin-search"><IconSearch :size="17" /><input v-model="query" type="search" placeholder="Search stories" /></label>
            <div class="filter-tabs" aria-label="Filter stories">
              <button v-for="option in filters" :key="option.value" type="button" :class="{ active: filter === option.value }" @click="filter = option.value">{{ option.label }}</button>
            </div>
          </div>
        </header>

        <div v-if="filteredStories.length" class="story-table-wrap">
          <table class="story-table">
            <thead><tr><th>Story</th><th>Status</th><th>Homepage</th><th>Updated</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
              <tr v-for="story in filteredStories" :key="story.id">
                <td>
                  <div class="story-identity">
                    <img :src="story.image" :alt="story.imageAlt" />
                    <div><strong>{{ story.title }}</strong><span>{{ story.domain }} · {{ story.author }}</span></div>
                  </div>
                </td>
                <td>
                  <button type="button" class="status-button" :class="`status-button--${story.status}`" @click="togglePublished(story)">
                    <span></span>{{ story.status === 'published' ? 'Published' : 'Draft' }}
                  </button>
                </td>
                <td>
                  <label class="visibility-toggle" :class="{ disabled: story.status !== 'published' }">
                    <input :checked="story.featured" :disabled="story.status !== 'published'" type="checkbox" :aria-label="`${story.featured ? 'Remove' : 'Add'} ${story.title} ${story.featured ? 'from' : 'to'} homepage`" @change="setHomepage(story, $event.target.checked)" />
                    <span></span><em>{{ story.featured ? 'Visible' : 'Hidden' }}</em>
                  </label>
                </td>
                <td><time :datetime="story.updatedAt">{{ formatDate(story.updatedAt) }}</time></td>
                <td>
                  <div class="row-actions">
                    <RouterLink :to="{ name: 'ResourceStory', params: { slug: story.slug }, query: story.status === 'draft' ? { preview: '1' } : {} }" title="Preview story" aria-label="Preview story"><IconExternalLink :size="17" /></RouterLink>
                    <RouterLink :to="{ name: 'StoryPortal', query: { edit: story.slug } }" title="Edit story" aria-label="Edit story"><IconPencil :size="17" /></RouterLink>
                    <button type="button" title="Delete story" aria-label="Delete story" @click="pendingDelete = story"><IconTrash :size="17" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="admin-empty"><IconFileOff :size="28" /><strong>No stories found</strong><p>Try another filter or create a new resource story.</p></div>
      </section>
    </template>

    <div v-if="pendingDelete" class="confirm-overlay" role="presentation" @click.self="pendingDelete = null">
      <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <span class="danger-icon"><IconTrash :size="20" /></span>
        <h2 id="delete-title">Delete this story?</h2>
        <p><strong>{{ pendingDelete.title }}</strong> and its local editorial data will be removed. This cannot be undone.</p>
        <div><button type="button" @click="pendingDelete = null">Cancel</button><button type="button" class="delete-button" @click="confirmDelete">Delete story</button></div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconExternalLink,
  IconFileOff,
  IconFlask,
  IconInfoCircle,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSearch,
  IconShieldLock,
  IconTrash,
} from '@tabler/icons-vue'
import { useStoriesStore } from '../stores/stories'

const stories = useStoriesStore()
const credentials = reactive({ username: '', password: '' })
const loginError = ref('')
const query = ref('')
const filter = ref('all')
const pendingDelete = ref(null)
const filters = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Homepage', value: 'homepage' },
]

const publishedCount = computed(() => stories.stories.filter((story) => story.status === 'published').length)
const filteredStories = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return stories.sortedStories.filter((story) => {
    const matchesFilter = filter.value === 'all'
      || story.status === filter.value
      || (filter.value === 'homepage' && story.featured)
    const matchesQuery = !needle || `${story.title} ${story.domain} ${story.author}`.toLowerCase().includes(needle)
    return matchesFilter && matchesQuery
  })
})

function signIn() {
  loginError.value = stories.login(credentials.username, credentials.password) ? '' : 'The username or password is incorrect.'
  credentials.password = ''
}

function togglePublished(story) {
  stories.setPublished(story.id, story.status !== 'published')
}

function setHomepage(story, featured) {
  stories.setFeatured(story.id, featured)
}

function confirmDelete() {
  stories.deleteStory(pendingDelete.value.id)
  pendingDelete.value = null
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
</script>

<style scoped>
.admin-portal { max-width: 1380px; margin: 0 auto; color: #192235; }
.admin-kicker { color: var(--color-primary); font-size: .66rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.admin-login { width: min(430px, 100%); margin: clamp(36px, 8vh, 90px) auto 0; padding: 34px; border: 1px solid var(--color-border); border-radius: 10px; background: rgba(255,255,255,.78); box-shadow: 0 22px 58px rgba(28,34,48,.08); }
.login-mark { width: 46px; height: 46px; display: grid; place-items: center; margin-bottom: 25px; border: 1px solid #cfd9ee; border-radius: 10px; color: var(--color-primary); background: var(--color-primary-bg); }
.admin-login h1 { margin: 9px 0 10px; font-size: 2rem; line-height: 1.05; letter-spacing: -.045em; }
.admin-login > p { color: var(--color-text-secondary); font-size: .84rem; line-height: 1.6; }
.admin-login form { display: grid; gap: 15px; margin-top: 27px; }
.admin-login label { display: grid; gap: 7px; color: #424d60; font-size: .74rem; font-weight: 700; }
.admin-login input { min-height: 44px; padding: 0 11px; border: 1px solid #d5d9e1; border-radius: 7px; outline: 0; background: #fff; }
.admin-login input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb),.08); }
.admin-login form button { min-height: 45px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; border: 1px solid var(--color-primary); border-radius: 7px; color: #fff; background: var(--color-primary); font-weight: 700; }
.admin-login form button:hover { background: #243f86; }
.login-error { display: flex; align-items: center; gap: 7px; padding: 9px 10px; border: 1px solid #eccdcc; border-radius: 7px; color: #9a3632 !important; background: #fff5f4; font-size: .72rem !important; }
.prototype-credentials { display: flex; gap: 10px; margin-top: 22px; padding: 12px; border: 1px solid #e3dac5; border-radius: 7px; color: #865e22; background: #fffaf0; }
.prototype-credentials svg { flex: 0 0 auto; margin-top: 1px; }
.prototype-credentials p { display: grid; gap: 3px; font-size: .69rem; }
.prototype-credentials span { color: #766950; }
.prototype-credentials code { padding: 2px 4px; border-radius: 3px; color: #594417; background: #f4ead4; }
.back-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 20px; color: var(--color-text-secondary); font-size: .72rem; font-weight: 650; }
.back-link:hover { color: var(--color-primary); }
.admin-heading { display: flex; align-items: end; justify-content: space-between; gap: 32px; padding: 4px 0 24px; border-bottom: 1px solid var(--color-border); }
.admin-heading h1 { margin-top: 7px; font-size: clamp(2rem, 3.2vw, 3rem); line-height: 1; letter-spacing: -.05em; }
.admin-heading p { margin-top: 8px; color: var(--color-text-secondary); font-size: .84rem; }
.heading-actions { display: flex; gap: 8px; }
.action-button { min-height: 42px; display: inline-flex; align-items: center; gap: 7px; padding: 0 13px; border: 1px solid var(--color-border-strong); border-radius: 7px; color: var(--color-text); background: #fff; font-size: .78rem; font-weight: 700; }
.action-button:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }
.action-button--primary { border-color: var(--color-primary); color: #fff; background: var(--color-primary); }
.action-button--primary:hover { color: #fff; background: #243f86; }
.admin-overview { display: grid; grid-template-columns: repeat(3, minmax(120px, .65fr)) minmax(260px, 1.3fr); margin: 18px 0; border: 1px solid var(--color-border); border-radius: 9px; background: rgba(255,255,255,.62); }
.admin-overview > div { min-height: 82px; display: flex; flex-direction: column; justify-content: center; padding: 14px 18px; border-right: 1px solid var(--color-border); }
.admin-overview > div:last-child { border: 0; }
.admin-overview span { color: var(--color-text-muted); font-size: .67rem; }
.admin-overview > div > strong { margin-top: 3px; font-size: 1.45rem; letter-spacing: -.04em; }
.admin-overview .overview-note { flex-direction: row; align-items: center; justify-content: flex-start; gap: 10px; color: var(--color-primary); }
.overview-note p { display: grid; gap: 2px; }
.overview-note p strong { color: var(--color-text); font-size: .74rem; }
.overview-note p span { line-height: 1.4; }
.story-registry { overflow: hidden; border: 1px solid var(--color-border); border-radius: 9px; background: rgba(255,255,255,.72); }
.story-registry > header { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 18px; border-bottom: 1px solid var(--color-border); }
.registry-title { display: flex; align-items: baseline; gap: 9px; }
.registry-title h2 { font-size: .98rem; }
.registry-title span { color: var(--color-text-muted); font-size: .65rem; }
.registry-tools { display: flex; align-items: center; gap: 9px; }
.admin-search { min-height: 34px; display: flex; align-items: center; gap: 7px; width: 220px; padding: 0 9px; border: 1px solid #d7dae0; border-radius: 6px; color: var(--color-text-muted); background: #fff; }
.admin-search:focus-within { border-color: var(--color-primary); }
.admin-search input { min-width: 0; width: 100%; border: 0; outline: 0; background: transparent; font-size: .72rem; }
.filter-tabs { display: flex; padding: 3px; border: 1px solid #d7dae0; border-radius: 7px; background: #f5f6f8; }
.filter-tabs button { min-height: 28px; padding: 0 9px; border: 0; border-radius: 5px; color: var(--color-text-muted); background: transparent; font-size: .66rem; font-weight: 700; }
.filter-tabs button.active { color: var(--color-text); background: #fff; box-shadow: 0 1px 3px rgba(30,40,56,.1); }
.story-table-wrap { overflow-x: auto; }
.story-table { width: 100%; border-collapse: collapse; font-size: .76rem; }
.story-table th { padding: 10px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-muted); background: #fafaf9; font-size: .61rem; font-weight: 800; letter-spacing: .08em; text-align: left; text-transform: uppercase; }
.story-table td { padding: 13px 14px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.story-table tr:last-child td { border-bottom: 0; }
.story-table tbody tr:hover { background: #fafbfc; }
.story-identity { min-width: 280px; display: grid; grid-template-columns: 58px 1fr; gap: 11px; align-items: center; }
.story-identity img { width: 58px; height: 42px; object-fit: cover; border-radius: 6px; background: #e8e9eb; }
.story-identity div { display: grid; gap: 3px; min-width: 0; }
.story-identity strong { overflow: hidden; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.story-identity span { overflow: hidden; color: var(--color-text-muted); font-size: .64rem; text-overflow: ellipsis; white-space: nowrap; }
.status-button { display: inline-flex; align-items: center; gap: 6px; min-height: 28px; padding: 0 8px; border: 1px solid; border-radius: 999px; font-size: .64rem; font-weight: 750; }
.status-button > span { width: 6px; height: 6px; border-radius: 50%; }
.status-button--published { border-color: #cbe4d7; color: #2b7651; background: #f2fbf6; }
.status-button--published > span { background: #38a16c; }
.status-button--draft { border-color: #e1d8c2; color: #8b672c; background: #fffaf0; }
.status-button--draft > span { background: #c8963d; }
.visibility-toggle { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; }
.visibility-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.visibility-toggle > span { position: relative; width: 31px; height: 18px; border-radius: 999px; background: #d7dae0; transition: background var(--transition); }
.visibility-toggle > span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform var(--transition); }
.visibility-toggle input:checked + span { background: var(--color-primary); }
.visibility-toggle input:checked + span::after { transform: translateX(13px); }
.visibility-toggle em { color: var(--color-text-muted); font-size: .64rem; font-style: normal; }
.visibility-toggle.disabled { cursor: not-allowed; opacity: .45; }
.story-table time { color: var(--color-text-muted); font-size: .67rem; white-space: nowrap; }
.row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.row-actions a, .row-actions button { width: 31px; height: 31px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 6px; color: var(--color-text-muted); background: transparent; }
.row-actions a:hover, .row-actions button:hover { border-color: var(--color-border); color: var(--color-primary); background: #fff; }
.admin-empty { min-height: 260px; display: grid; place-content: center; justify-items: center; color: var(--color-text-muted); text-align: center; }
.admin-empty strong { margin-top: 10px; color: var(--color-text); font-size: .86rem; }
.admin-empty p { margin-top: 4px; font-size: .7rem; }
.confirm-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(22,29,41,.34); backdrop-filter: blur(5px); }
.confirm-dialog { width: min(410px, 100%); padding: 26px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; box-shadow: 0 28px 70px rgba(20,27,40,.2); }
.danger-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 9px; color: #a23b36; background: #fff0ef; }
.confirm-dialog h2 { margin-top: 18px; font-size: 1.2rem; }
.confirm-dialog > p { margin-top: 8px; color: var(--color-text-secondary); font-size: .76rem; line-height: 1.55; }
.confirm-dialog > div { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.confirm-dialog button { min-height: 38px; padding: 0 12px; border: 1px solid var(--color-border-strong); border-radius: 7px; background: #fff; font-size: .72rem; font-weight: 700; }
.confirm-dialog .delete-button { border-color: #a23b36; color: #fff; background: #a23b36; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

@media (max-width: 980px) { .admin-overview { grid-template-columns: repeat(3, 1fr); } .admin-overview .overview-note { grid-column: 1 / -1; border-top: 1px solid var(--color-border); } .story-registry > header { align-items: flex-start; flex-direction: column; } .registry-tools { width: 100%; justify-content: space-between; } }
@media (max-width: 700px) { .admin-heading, .registry-tools { align-items: flex-start; flex-direction: column; } .heading-actions, .action-button, .admin-search { width: 100%; } .heading-actions { flex-direction: column-reverse; } .admin-overview { grid-template-columns: repeat(3, 1fr); } .admin-overview > div { min-width: 0; padding: 12px 10px; } .filter-tabs { max-width: 100%; overflow-x: auto; } }
</style>
