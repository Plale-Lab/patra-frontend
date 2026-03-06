<template>
  <div class="admin-layout">
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
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'
</script>

<style>
#app { min-height: 100vh; }
</style>
