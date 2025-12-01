<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { X, ShieldCheck } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isVisible = ref(false)

const checkConsent = () => {
  const consent = localStorage.getItem('tennis_mate_consent')
  if (!consent) {
    isVisible.value = true
  }
}

const acceptConsent = () => {
  localStorage.setItem('tennis_mate_consent', 'accepted')
  isVisible.value = false
  // Dispatch event for other components to know
  window.dispatchEvent(new Event('consent-updated'))
}

const declineConsent = () => {
  localStorage.setItem('tennis_mate_consent', 'declined')
  isVisible.value = false
  window.dispatchEvent(new Event('consent-updated'))
}

onMounted(() => {
  // Small delay to not overwhelm user immediately on load
  setTimeout(checkConsent, 1000)
})
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-full opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isVisible" 
      class="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
    >
      <div class="mx-auto max-w-4xl bg-background/95 backdrop-blur border rounded-xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
        
        <div class="flex items-start gap-4 flex-1">
          <div class="p-2 bg-primary/10 rounded-lg shrink-0">
            <ShieldCheck class="h-6 w-6 text-primary" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-foreground">{{ t('consent.title') }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ t('consent.description') }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            class="flex-1 md:flex-none"
            @click="declineConsent"
          >
            {{ t('consent.decline') }}
          </Button>
          <Button 
            class="flex-1 md:flex-none"
            @click="acceptConsent"
          >
            {{ t('consent.accept') }}
          </Button>
        </div>

      </div>
    </div>
  </Transition>
</template>
