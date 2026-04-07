<template>
  <div>
    <!-- Back link -->
    <RouterLink to="/explore-datasheets" class="back-link">
      <IconArrowLeft :size="16" stroke-width="2" /> Back to Datasheets
    </RouterLink>

    <!-- Loading -->
    <div class="loading-state" v-if="store.loading">
      <IconLoader2 :size="32" stroke-width="1.5" class="spin" />
      <span>Loading datasheet…</span>
    </div>

    <!-- Error -->
    <div class="empty-state" v-else-if="!ds">
      <IconAlertCircle :size="48" stroke-width="1.2" />
      <h3>Datasheet not found</h3>
      <RouterLink to="/explore-datasheets" class="btn btn-primary">← Back to Datasheets</RouterLink>
    </div>

    <!-- Detail Content -->
    <template v-else>
      <!-- Header Card -->
      <div class="detail-header card">
        <div class="card-body">
          <div class="detail-top">
            <div>
              <div class="flex items-center gap-8" style="margin-bottom: 6px;">
                <span class="badge" :class="ds.is_private ? 'badge-private' : 'badge-public'">
                  {{ ds.is_private ? 'Private' : 'Public' }}
                </span>
                <span class="badge badge-accent">{{ ds.resource_type?.resourceTypeGeneral || 'Dataset' }}</span>
                <span class="badge badge-info" v-if="ds.version">v{{ ds.version }}</span>
              </div>
              <h1 class="detail-name">{{ displayTitle }}</h1>
              <p class="detail-desc">{{ displayDescription }}</p>
              <div class="detail-meta">
                <span v-if="displayCreator"><IconUser :size="14" stroke-width="1.8" /> {{ displayCreator }}</span>
                <span v-if="displayPublisher"><IconBuilding :size="14" stroke-width="1.8" /> {{ displayPublisher }}</span>
                <span v-if="ds.publication_year"><IconCalendar :size="14" stroke-width="1.8" /> {{ ds.publication_year }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="detail-grid">
        <!-- Creators -->
        <div class="card" v-if="ds.creator && ds.creator.length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconUsers :size="18" stroke-width="1.8" /> Creators</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Affiliation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(c, i) in ds.creator" :key="i">
                  <td style="font-weight: 500;">
                    {{ c.creatorName?.name || 'Unknown' }}
                    <span v-if="c.givenName || c.familyName" class="text-muted"> ({{ [c.givenName, c.familyName].filter(Boolean).join(' ') }})</span>
                  </td>
                  <td>{{ c.creatorName?.nameType || '—' }}</td>
                  <td>
                    <template v-if="c.affiliation && c.affiliation.length">
                      {{ c.affiliation.map(a => typeof a === 'object' ? a.name : a).join(', ') }}
                    </template>
                    <template v-else>—</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resource Info -->
        <div class="card">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconInfoCircle :size="18" stroke-width="1.8" /> Resource Info</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item" v-if="ds.resource_type">
                <span class="info-label">Resource Type</span>
                <span class="info-value">{{ ds.resource_type.resourceType }} ({{ ds.resource_type.resourceTypeGeneral }})</span>
              </div>
              <div class="info-item" v-if="ds.publication_year">
                <span class="info-label">Publication Year</span>
                <span class="info-value">{{ ds.publication_year }}</span>
              </div>
              <div class="info-item" v-if="ds.version">
                <span class="info-label">Version</span>
                <span class="info-value">{{ ds.version }}</span>
              </div>
              <div class="info-item" v-if="ds.format && ds.format.length">
                <span class="info-label">Format</span>
                <span class="info-value">{{ ds.format.join(', ') }}</span>
              </div>
              <div class="info-item" v-if="ds.size && ds.size.length">
                <span class="info-label">Size</span>
                <span class="info-value">{{ ds.size.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rights -->
        <div class="card" v-if="ds.rights && ds.rights.length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconLicense :size="18" stroke-width="1.8" /> Rights</span>
          </div>
          <div class="card-body">
            <div v-for="(r, i) in ds.rights" :key="i" class="rights-item">
              <div class="info-value">{{ r.rights }}</div>
              <a v-if="r.rightsURI" :href="r.rightsURI" target="_blank" class="info-link">{{ r.rightsURI }}</a>
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="card" v-if="ds.date && ds.date.length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconCalendarEvent :size="18" stroke-width="1.8" /> Dates</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Type</th></tr></thead>
              <tbody>
                <tr v-for="(d, i) in ds.date" :key="i">
                  <td>{{ d.date }}</td>
                  <td>{{ d.dateType }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Related Identifiers -->
        <div class="card" v-if="ds.related_identifier && ds.related_identifier.length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconLink :size="18" stroke-width="1.8" /> Related Identifiers</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead><tr><th>Identifier</th><th>Type</th><th>Relation</th></tr></thead>
              <tbody>
                <tr v-for="(ri, i) in ds.related_identifier" :key="i">
                  <td style="font-weight: 500;">{{ ri.relatedIdentifier }}</td>
                  <td>{{ ri.relatedIdentifierType }}</td>
                  <td>{{ ri.relationType }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Descriptions -->
        <div class="card" v-if="ds.description && ds.description.length > 1">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconFileText :size="18" stroke-width="1.8" /> Descriptions</span>
          </div>
          <div class="card-body">
            <div v-for="(d, i) in ds.description" :key="i" class="desc-block">
              <span class="info-label">{{ d.descriptionType || 'Description' }}</span>
              <p class="desc-text">{{ d.description }}</p>
            </div>
          </div>
        </div>

        <!-- Geo Locations -->
        <div class="card" v-if="ds.geo_location && ds.geo_location.length">
          <div class="card-header">
            <span class="flex items-center gap-8"><IconMapPin :size="18" stroke-width="1.8" /> Geo Locations</span>
          </div>
          <div class="card-body">
            <div v-for="(g, i) in ds.geo_location" :key="i" class="geo-item">
              <span class="info-value" v-if="g.geoLocationPlace">{{ g.geoLocationPlace }}</span>
              <span class="info-link" v-if="g.geoLocationPoint">
                Point: {{ g.geoLocationPoint.pointLatitude }}, {{ g.geoLocationPoint.pointLongitude }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useExploreStore } from '../stores/explore'
import { useApiModeStore } from '../stores/apiMode'
import {
  IconArrowLeft, IconLoader2, IconAlertCircle,
  IconUser, IconBuilding, IconCalendar, IconUsers,
  IconInfoCircle, IconLicense, IconCalendarEvent,
  IconLink, IconFileText, IconMapPin,
} from '@tabler/icons-vue'

const route = useRoute()
const store = useExploreStore()
const apiMode = useApiModeStore()

const ds = computed(() => store.currentDatasheet)

const displayTitle = computed(() => {
  if (!ds.value) return ''
  if (Array.isArray(ds.value.title) && ds.value.title.length) {
    const t = ds.value.title[0]
    return typeof t === 'object' ? t.title : t
  }
  return ds.value.title || 'Untitled'
})

const displayDescription = computed(() => {
  if (!ds.value) return ''
  if (Array.isArray(ds.value.description) && ds.value.description.length) {
    const d = ds.value.description[0]
    return typeof d === 'object' ? d.description : d
  }
  return ''
})

const displayCreator = computed(() => {
  if (!ds.value?.creator?.length) return ''
  const names = ds.value.creator.map(c => c.creatorName?.name || 'Unknown')
  return names.join(', ')
})

const displayPublisher = computed(() => {
  if (!ds.value?.publisher) return ''
  return typeof ds.value.publisher === 'object' ? ds.value.publisher.name : ds.value.publisher
})

function loadDatasheet() {
  const id = route.params.id
  if (id) store.fetchDatasheetById(id)
}

onMounted(loadDatasheet)
watch(() => route.params.id, loadDatasheet)
watch(() => apiMode.mode, loadDatasheet)
</script>

<style scoped>
.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: .88rem; font-weight: 500;
  color: var(--color-primary); text-decoration: none;
  margin-bottom: 18px; transition: opacity var(--transition);
}
.back-link:hover { opacity: .7; }
.detail-header { margin-bottom: 20px; }
.detail-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; }
.detail-name { font-size: 1.6rem; font-weight: 700; margin-bottom: 8px; }
.detail-desc { font-size: .92rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 12px; max-width: 700px; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 16px; }
.detail-meta span { display: flex; align-items: center; gap: 5px; font-size: .82rem; color: var(--color-text-muted); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: .75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .5px; }
.info-value { font-size: .9rem; font-weight: 500; }
.info-link { font-size: .82rem; color: var(--color-primary); text-decoration: none; word-break: break-all; }
.info-link:hover { text-decoration: underline; }
.text-muted { color: var(--color-text-muted); font-size: .8rem; }
.rights-item { margin-bottom: 8px; }
.desc-block { margin-bottom: 14px; }
.desc-block:last-child { margin-bottom: 0; }
.desc-text { font-size: .88rem; line-height: 1.6; color: var(--color-text-secondary); margin-top: 4px; }
.geo-item { margin-bottom: 8px; }
.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 300px;
  color: var(--color-text-muted); gap: 10px;
}
.empty-state h3 { font-size: 1.1rem; color: var(--color-text-secondary); }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
