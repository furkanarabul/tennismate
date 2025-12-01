<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { Trophy, Home, Compass, Users, User, Heart, ListTodo, Loader2 } from 'lucide-vue-next'
import InstallPrompt from '@/components/InstallPrompt.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ConsentBanner from '@/components/ConsentBanner.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { detectIpLanguage } from '@/utils/language'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

const loading = ref(true)
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Check if we already have a stored language preference
  const hasStoredLanguage = localStorage.getItem('user-language')
  
  if (hasStoredLanguage) {
    // If we have a stored language, we can load immediately
    loading.value = false
  } else {
    // If first visit, wait for IP detection to avoid flash of wrong language
    await detectIpLanguage()
    loading.value = false
  }
  
  // Initialize notifications if user is logged in
  if (authStore.user) {
    notificationStore.initialize()
  }
})

// Watch for auth changes to init/reset notifications
watch(() => authStore.user, (user) => {
  if (user) {
    notificationStore.initialize()
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="min-h-screen bg-background flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <Trophy class="h-12 w-12 text-primary animate-pulse" />
      <Loader2 class="h-6 w-6 text-muted-foreground animate-spin" />
    </div>
  </div>

  <div v-else class="min-h-screen bg-background pb-16 md:pb-0">
    <!-- Desktop Header - Hidden on mobile -->
    <header class="hidden md:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-2">
          <Trophy class="h-6 w-6 text-primary" />
          <span class="text-xl font-bold text-foreground">TennisMate</span>
        </RouterLink>
        
        <nav class="flex items-center gap-6">
          <RouterLink to="/" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {{ $t('app.nav.home') }}
          </RouterLink>
          <RouterLink to="/discover" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {{ $t('app.nav.discover') }}
          </RouterLink>
          <RouterLink to="/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 relative">
            <ListTodo class="h-4 w-4" />
            {{ $t('app.nav.matches') }}
            <!-- Notification Badge -->
            <span 
              v-if="notificationStore.totalUnreadCount > 0" 
              class="absolute -top-0.5 -right-1 flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"
            ></span>
          </RouterLink>
          <RouterLink to="/profile" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <User class="h-4 w-4" />
            {{ $t('app.nav.profile') }}
          </RouterLink>
        </nav>
        <div class="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Mobile Top Header - Minimal -->
    <header class="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="flex h-14 items-center justify-center px-4 relative">
        <RouterLink to="/" class="flex items-center gap-2">
          <Trophy class="h-5 w-5 text-primary" />
          <span class="text-lg font-bold text-foreground">TennisMate</span>
        </RouterLink>
        
        <div class="absolute right-4 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <RouterView />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 safe-bottom">
      <div class="flex items-center justify-around h-16 px-2">
        <RouterLink 
          to="/"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          :class="$route.path === '/' ? 'text-primary' : 'text-muted-foreground'"
        >
          <Home class="h-5 w-5" />
          <span class="text-xs font-medium">{{ $t('app.nav.home') }}</span>
        </RouterLink>
        
        <RouterLink 
          to="/discover"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          :class="$route.path === '/discover' ? 'text-primary' : 'text-muted-foreground'"
        >
          <Heart class="h-5 w-5" />
          <span class="text-xs font-medium">{{ $t('app.nav.discover') }}</span>
        </RouterLink>
        
        <RouterLink 
          to="/dashboard"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative"
          :class="$route.path === '/dashboard' ? 'text-primary' : 'text-muted-foreground'"
        >
          <ListTodo class="h-5 w-5" />
          <span class="text-xs font-medium">{{ $t('app.nav.matches') }}</span>
          <!-- Notification Badge Mobile -->
          <span 
            v-if="notificationStore.totalUnreadCount > 0" 
            class="absolute top-3 right-8 flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"
          ></span>
        </RouterLink>
        
        <RouterLink 
          to="/profile"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          :class="$route.path === '/profile' ? 'text-primary' : 'text-muted-foreground'"
        >
          <User class="h-5 w-5" />
          <span class="text-xs font-medium">{{ $t('app.nav.profile') }}</span>
        </RouterLink>
      </div>
    </nav>
    
    <!-- PWA Install Prompt -->
    <InstallPrompt />
    
    <!-- Privacy Consent Banner -->
    <ConsentBanner />
  </div>
</template>

<style>
@import '@/assets/main.css';
</style>
