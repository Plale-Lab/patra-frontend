<template>
  <img src="/img/huggingface-logo.png" alt="" class="hf-logo-img" :width="size" :height="size" />
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 16 },
})
</script>

<style scoped>
.hf-logo-img {
  display: inline-block;
  object-fit: contain;
}
</style>
