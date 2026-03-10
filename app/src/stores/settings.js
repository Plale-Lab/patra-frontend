import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref({
        allowPublicAccess: true,
        defaultVisibility: 'public',
        maintenanceMode: false,
        retentionDays: 90,
        maxUploadSizeMB: 500,
        enableSimilarity: false,
        enableNotifications: true,
        apiRateLimit: 1000,
    })

    function updateSetting(key, value) {
        if (key in settings.value) {
            settings.value[key] = value
        }
    }

    function resetDefaults() {
        settings.value = {
            allowPublicAccess: true,
            defaultVisibility: 'public',
            maintenanceMode: false,
            retentionDays: 90,
            maxUploadSizeMB: 500,
            enableSimilarity: false,
            enableNotifications: true,
            apiRateLimit: 1000,
        }
    }

    return { settings, updateSetting, resetDefaults }
})
