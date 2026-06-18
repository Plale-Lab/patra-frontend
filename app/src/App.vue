<template>
  <div class="admin-layout">
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
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'
</script>

<style>
#app { min-height: 100vh; }

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
