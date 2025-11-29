<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'

const themeStore = useThemeStore()

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
] as const
</script>

<template>
  <div class="space-y-3">
    <Label>Theme</Label>
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="themeOption in themes"
        :key="themeOption.value"
        @click="themeStore.setTheme(themeOption.value)"
        :class="[
          'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors',
          themeStore.theme === themeOption.value
            ? 'border-primary bg-primary/10'
            : 'border-muted hover:border-muted-foreground/30'
        ]"
      >
        <component :is="themeOption.icon" class="h-5 w-5" />
        <span class="text-sm font-medium">{{ themeOption.label }}</span>
      </button>
    </div>
  </div>
</template>
