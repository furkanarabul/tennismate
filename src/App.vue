<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Trophy, Home, Compass, Users, User, Heart, ListTodo } from 'lucide-vue-next'
import InstallPrompt from '@/components/InstallPrompt.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ConsentBanner from '@/components/ConsentBanner.vue'
</script>

<template>
  <div class="min-h-screen bg-background pb-16 md:pb-0">
    <!-- Desktop Header - Hidden on mobile -->
    <header class="hidden md:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-2">
          <Trophy class="h-6 w-6 text-primary" />
          <span class="text-xl font-bold text-foreground">TennisMate</span>
        </RouterLink>
        
        <nav class="flex items-center gap-6">
          <RouterLink to="/" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </RouterLink>
          <RouterLink to="/discover" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Discover
          </RouterLink>
          <RouterLink to="/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ListTodo class="h-4 w-4" />
            Matches
          </RouterLink>
          <RouterLink to="/profile" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <User class="h-4 w-4" />
            Profile
          </RouterLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>

    <!-- Mobile Top Header - Minimal -->
    <header class="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="flex h-14 items-center justify-center px-4">
        <RouterLink to="/" class="flex items-center gap-2">
          <Trophy class="h-5 w-5 text-primary" />
          <span class="text-lg font-bold text-foreground">TennisMate</span>
        </RouterLink>
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
          <span class="text-xs font-medium">Home</span>
        </RouterLink>
        
        <RouterLink 
          to="/discover"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          :class="$route.path === '/discover' ? 'text-primary' : 'text-muted-foreground'"
        >
          <Heart class="h-5 w-5" />
          <span class="text-xs font-medium">Discover</span>
        </RouterLink>
        
        <RouterLink 
          to="/dashboard"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          :class="$route.path === '/dashboard' ? 'text-primary' : 'text-muted-foreground'"
        >
          <ListTodo class="h-5 w-5" />
          <span class="text-xs font-medium">Matches</span>
        </RouterLink>
        
        <RouterLink 
          to="/profile"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          :class="$route.path === '/profile' ? 'text-primary' : 'text-muted-foreground'"
        >
          <User class="h-5 w-5" />
          <span class="text-xs font-medium">Profile</span>
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
