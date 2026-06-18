<template>
  <div v-if="auth.isInitializing" class="auth-resolving" role="status" aria-live="polite">
    <div class="auth-resolving-mark" aria-hidden="true"></div>
    <strong>Connecting to ICICLE/Tapis…</strong>
    <span>Checking for an existing portal session.</span>
  </div>
  <div v-else class="admin-layout">
    <Sidebar />
    <div class="admin-main">
      <HeaderBar />
      <div class="admin-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'

const auth = useAuthStore()
</script>

<style>
#app { min-height: 100vh; }
.auth-resolving {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text);
  background: var(--color-bg);
  text-align: center;
}
.auth-resolving span {
  color: var(--color-text-muted);
  font-size: .9rem;
}
.auth-resolving-mark {
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: patra-auth-spin .8s linear infinite;
}
@keyframes patra-auth-spin {
  to { transform: rotate(360deg); }
}
</style>
