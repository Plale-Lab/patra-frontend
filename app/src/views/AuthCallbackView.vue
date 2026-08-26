<template>
  <div class="loading-state" v-if="!auth.error">
    <IconLoader2 :size="32" stroke-width="1.5" class="spin" />
    <span>Completing Tapis sign-in...</span>
  </div>

  <div class="empty-state" v-else>
    <IconAlertCircle :size="48" stroke-width="1.2" />
    <h3>Sign-in failed</h3>
    <p>{{ auth.error }}</p>
    <RouterLink to="/" class="btn btn-primary">Back to Dashboard</RouterLink>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { IconAlertCircle, IconLoader2 } from '@tabler/icons-vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const ok = await auth.completeRedirectLogin({
    code: route.query.code,
    state: route.query.state,
    error: route.query.error,
  })
  if (ok) router.replace({ name: 'Dashboard' })
})
</script>
