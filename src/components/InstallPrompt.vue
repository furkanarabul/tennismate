<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-vue-next'

const showPrompt = ref(false)
let deferredPrompt: any = null

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth <= 768
}

onMounted(() => {
  // Only show on mobile devices
  if (!isMobile()) {
    return
  }
  
  // Always show after 2 seconds for demo/testing
  setTimeout(() => {
    showPrompt.value = true
  }, 2000)
  
  // Also listen for real PWA install event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
})

const install = async () => {
  if (deferredPrompt) {
    // Real PWA install
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    deferredPrompt = null
  } else {
    // Fallback: show instructions
    alert('This browser doesn\'t support PWA. Use Chrome or Safari and look for "Add to Home Screen" option!')
  }
  
  showPrompt.value = false
}

const dismiss = () => {
  showPrompt.value = false
  // Remember dismissal for 7 days
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div 
      v-if="showPrompt"
      class="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
    >
      <div class="bg-card border-2 border-primary/20 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
        <button 
          @click="dismiss"
          class="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Close"
        >
          <X class="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div class="flex items-start gap-3 pr-6">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download class="h-5 w-5 text-primary" />
          </div>
          
          <div class="flex-1">
            <h3 class="font-semibold text-sm mb-1">Install TennisMate</h3>
            <p class="text-xs text-muted-foreground mb-3">
              Add to home screen for faster access! 🎾
            </p>
            
            <div class="flex gap-2">
              <Button 
                size="sm" 
                @click="install"
                class="flex-1"
              >
                Install
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                @click="dismiss"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
