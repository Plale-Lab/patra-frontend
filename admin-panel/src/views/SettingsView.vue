<template>
  <div>
    <div class="page-header">
      <h1>System Settings</h1>
      <p>Configure global options for the Patra Knowledge Base</p>
    </div>

    <div class="settings-grid">
      <!-- Access & Visibility -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconShield :size="18" stroke-width="1.8" />
            <span>Access & Visibility</span>
          </div>
        </div>
        <div class="card-body">
          <div class="setting-row">
            <div>
              <div class="setting-label">Allow Public Access</div>
              <div class="setting-desc">Enable unauthenticated users to view public models</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" :checked="store.settings.allowPublicAccess" @change="store.updateSetting('allowPublicAccess', !store.settings.allowPublicAccess)" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Default Visibility</div>
              <div class="setting-desc">Default visibility for newly uploaded model cards</div>
            </div>
            <select class="form-input" style="width: 140px;" :value="store.settings.defaultVisibility" @change="store.updateSetting('defaultVisibility', $event.target.value)">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Maintenance Mode</div>
              <div class="setting-desc">Take the system offline for maintenance</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" :checked="store.settings.maintenanceMode" @change="store.updateSetting('maintenanceMode', !store.settings.maintenanceMode)" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Data & Storage -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconDatabase :size="18" stroke-width="1.8" />
            <span>Data & Storage</span>
          </div>
        </div>
        <div class="card-body">
          <div class="setting-row">
            <div>
              <div class="setting-label">Retention Period</div>
              <div class="setting-desc">Days to retain audit log entries</div>
            </div>
            <div class="flex items-center gap-8">
              <input class="form-input" type="number" style="width: 80px;" :value="store.settings.retentionDays" @change="store.updateSetting('retentionDays', Number($event.target.value))" />
              <span class="text-sm text-muted">days</span>
            </div>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Max Upload Size</div>
              <div class="setting-desc">Maximum file size for model card uploads</div>
            </div>
            <div class="flex items-center gap-8">
              <input class="form-input" type="number" style="width: 80px;" :value="store.settings.maxUploadSizeMB" @change="store.updateSetting('maxUploadSizeMB', Number($event.target.value))" />
              <span class="text-sm text-muted">MB</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconSparkles :size="18" stroke-width="1.8" />
            <span>Features</span>
          </div>
        </div>
        <div class="card-body">
          <div class="setting-row">
            <div>
              <div class="setting-label">Model Similarity</div>
              <div class="setting-desc">Enable OAAI embedding-based similarity detection</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" :checked="store.settings.enableSimilarity" @change="store.updateSetting('enableSimilarity', !store.settings.enableSimilarity)" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Email Notifications</div>
              <div class="setting-desc">Send email alerts for key admin events</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" :checked="store.settings.enableNotifications" @change="store.updateSetting('enableNotifications', !store.settings.enableNotifications)" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">API Rate Limit</div>
              <div class="setting-desc">Requests per hour per client</div>
            </div>
            <div class="flex items-center gap-8">
              <input class="form-input" type="number" style="width: 100px;" :value="store.settings.apiRateLimit" @change="store.updateSetting('apiRateLimit', Number($event.target.value))" />
              <span class="text-sm text-muted">req/hr</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconTool :size="18" stroke-width="1.8" />
            <span>Actions</span>
          </div>
        </div>
        <div class="card-body">
          <div class="actions-grid">
            <button class="btn btn-primary w-full" @click="saveSettings">
              <IconDeviceFloppy :size="16" stroke-width="2" /> Save Settings
            </button>
            <button class="btn btn-outline w-full" @click="resetSettings">
              <IconRefresh :size="16" stroke-width="2" /> Reset Defaults
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div class="toast toast-success" v-if="showToast">
        <IconCheck :size="16" stroke-width="2" /> Settings saved successfully
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import {
  IconShield, IconDatabase, IconSparkles, IconTool,
  IconDeviceFloppy, IconRefresh, IconCheck,
} from '@tabler/icons-vue'

const store = useSettingsStore()
const showToast = ref(false)

function saveSettings() {
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

function resetSettings() {
  store.resetDefaults()
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
}
.setting-row + .setting-row {
  border-top: 1px solid var(--color-border);
}
.setting-label { font-weight: 600; font-size: .92rem; }
.setting-desc { font-size: .78rem; color: var(--color-text-muted); margin-top: 2px; }

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(16px); }
</style>
