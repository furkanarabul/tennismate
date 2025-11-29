<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { Sun, Moon } from 'lucide-vue-next'
import { computed } from 'vue'

const themeStore = useThemeStore()

// Toggle between light and dark (ignore system for simplicity)
const toggleTheme = () => {
  if (themeStore.effectiveTheme === 'dark') {
    themeStore.setTheme('light')
  } else {
    themeStore.setTheme('dark')
  }
}

const isDark = computed(() => themeStore.effectiveTheme === 'dark')
</script>

<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-md hover:bg-accent transition-colors"
    aria-label="Toggle theme"
  >
    <Sun v-if="isDark" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </button>
</template>
