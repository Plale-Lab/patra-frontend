<template>
  <div class="stepper">
    <template v-for="(step, i) in steps" :key="step.id">
      <button
        type="button"
        class="stepper-step"
        :class="{ active: i === current, done: i < current }"
        :disabled="i > current"
        :aria-current="i === current ? 'step' : undefined"
        @click="i < current && emit('goto', i)"
      >
        <span class="stepper-index">{{ i + 1 }}</span>
        <span>{{ step.title }}</span>
      </button>
      <span v-if="i < steps.length - 1" class="stepper-divider" aria-hidden="true"></span>
    </template>
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
})
const emit = defineEmits(['goto'])
</script>
