<script setup lang="ts">
interface LabelProps {
  for?: string
}

defineProps<LabelProps>()
</script>

<template>
  <label
    :for="for"
    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    <slot />
  </label>
</template>
