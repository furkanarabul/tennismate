<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Tennis ball circle -->
    <circle cx="12" cy="12" r="10" :fill="color" />
    
    <!-- Tennis ball curves -->
    <path 
      d="M4 12 Q8 8, 12 12 T20 12" 
      stroke="white" 
      stroke-width="1.5" 
      fill="none"
      opacity="0.9"
    />
    <path 
      d="M4 12 Q8 16, 12 12 T20 12" 
      stroke="white" 
      stroke-width="1.5" 
      fill="none"
      opacity="0.9"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: [String, Number],
    default: 24
  },
  color: {
    type: String,
    default: '#10b981' // primary green color
  }
})
</script>
