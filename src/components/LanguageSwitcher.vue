<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/utils/language'

const { locale } = useI18n()
const isOpen = ref(false)

const languages = [
  { code: 'en', label: 'English', flagClass: 'fi fi-gb' },
  { code: 'tr', label: 'Türkçe', flagClass: 'fi fi-tr' },
  { code: 'de', label: 'Deutsch', flagClass: 'fi fi-de' }
] as const

const currentLanguage = computed(() => 
  languages.find(l => l.code === locale.value) ?? languages[0]
)

const toggleDropdown = () => isOpen.value = !isOpen.value

const selectLanguage = (code: string) => {
  setLanguage(code)
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <!-- Backdrop to close -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>

    <button 
      @click="toggleDropdown"
      class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors relative z-50"
      :aria-label="'Current language: ' + currentLanguage.label"
    >
      <span :class="currentLanguage.flagClass" class="rounded-sm"></span>
      <span class="hidden md:inline text-sm font-medium text-muted-foreground">{{ currentLanguage.code.toUpperCase() }}</span>
    </button>

    <div 
      v-if="isOpen"
      class="absolute right-0 mt-2 w-32 bg-popover border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="selectLanguage(lang.code)"
        class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
        :class="{ 'bg-accent/50 font-medium': lang.code === locale }"
      >
        <span :class="lang.flagClass" class="rounded-sm"></span>
        <span>{{ lang.label }}</span>
      </button>
    </div>
  </div>
</template>
