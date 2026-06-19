<template>
  <div v-if="auth.isInitializing" class="auth-resolving" role="status" aria-live="polite">
    <strong>Connecting to ICICLE/Tapis...</strong>
    <span>Checking for an existing portal session.</span>
  </div>
  <div v-else class="admin-layout">
    <Sidebar />
    <div class="admin-main">
      <HeaderBar />
      <div class="admin-content">
        <RouterView v-slot="{ Component }">
          <transition name="view" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
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

/* Routed-view transition (neutralized under prefers-reduced-motion) */
.view-enter-active {
  transition: opacity var(--transition-slow), transform var(--transition-slow);
}
.view-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.view-leave-active {
  transition: opacity 0.08s linear;
}
.view-leave-to {
  opacity: 0;
}
</style>
