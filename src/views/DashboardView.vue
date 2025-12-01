<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, MapPin, Calendar, User as UserIcon, Heart, Users, Trophy } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching } from '@/composables/useMatching'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()
const { getMatches } = useMatching()

const matches = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  
  matches.value = await getMatches(authStore.user.id)
  loading.value = false
})

const formatMatchDate = (dateString: string) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          Your Matches
        </h1>
        <p class="text-muted-foreground">Connect and play with your tennis partners</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>

      <!-- Matches Grid -->
      <div v-else-if="matches.length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="match in matches"
          :key="match.id"
          class="group"
        >
          <!-- Card -->
          <Card class="h-full overflow-hidden bg-card border-2">
            <CardHeader class="pb-4">
              <div class="flex items-start gap-4">
                <!-- Avatar -->
                <div class="relative">
                  <div class="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20">
                    <img
                      v-if="match.avatar_url"
                      :src="match.avatar_url"
                      :alt="match.name"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <User class="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <!-- Online indicator -->
                  <div class="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <CardTitle class="text-xl mb-1 truncate">{{ match.name }}</CardTitle>
                  <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin class="h-3.5 w-3.5 flex-shrink-0" />
                    <span class="truncate">{{ match.location || 'Location not set' }}</span>
                  </div>
                  
                  <!-- Skill badge -->
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20">
                    <Trophy class="h-3.5 w-3.5 text-primary" />
                    <span class="text-xs font-medium text-primary">{{ match.skill_level }}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent class="pt-0">
              <!-- Match date -->
              <div class="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Calendar class="h-3.5 w-3.5" />
                <span>Matched {{ formatMatchDate(match.matchCreatedAt) }}</span>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  class="flex-1 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                  @click="router.push(`/chat/${match.matchId}`)"
                >
                  <MessageCircle class="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  size="sm"
                  class="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
                >
                  <Calendar class="h-4 w-4 mr-2" />
                  Play
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Empty State -->
      <Card v-else class="text-center py-16 border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-colors duration-300">
        <CardContent>
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Users class="h-10 w-10 text-primary" />
          </div>
          <CardTitle class="mb-3 text-2xl">No matches yet</CardTitle>
          <CardDescription class="mb-6 text-base">
            Start swiping to find tennis partners!
          </CardDescription>
          <Button 
            @click="router.push('/discover')"
            class="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
          >
            <Heart class="h-4 w-4 mr-2" />
            Discover Players
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
