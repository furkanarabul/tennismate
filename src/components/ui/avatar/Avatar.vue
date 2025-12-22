<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src?: string | null
  alt?: string
  fallback?: string
}>()

const showImage = computed(() => !!props.src)
</script>

<template>
  <div class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
    <img
      v-if="showImage && src"
      :src="src"
      :alt="alt"
      class="aspect-square h-full w-full object-cover"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center rounded-full bg-muted text-stone-500 font-medium"
    >
      {{ fallback }}
    </div>
  </div>
</template>
