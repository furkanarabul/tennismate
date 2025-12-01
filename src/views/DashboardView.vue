<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, MapPin, Calendar, User as UserIcon, Heart, Users, Trophy } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching } from '@/composables/useMatching'
import { supabase } from '@/lib/supabase'

import { useI18n } from 'vue-i18n'

const router = useRouter()
const authStore = useAuthStore()
const { getMatches } = useMatching()
const { t } = useI18n()

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

const getSkillLevelLabel = (level: string) => {
  if (!level) return ''
  const key = level.toLowerCase()
  return t(`profile.skill_levels.${key}`) || level
}

const formatMatchDate = (dateString: string) => {
  if (!dateString) return t('dashboard.dates.recently')
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return t('dashboard.dates.today')
  if (diffDays === 1) return t('dashboard.dates.yesterday')
  if (diffDays < 7) return t('dashboard.dates.days_ago', { n: diffDays })
  if (diffDays < 30) return t('dashboard.dates.weeks_ago', { n: Math.floor(diffDays / 7) })
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          {{ t('dashboard.title') }}
        </h1>
        <p class="text-muted-foreground">{{ t('dashboard.subtitle') }}</p>
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
                    <span class="truncate">{{ match.location || t('dashboard.card.location_not_set') }}</span>
                  </div>
                  
                  <!-- Skill badge -->
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20">
                    <Trophy class="h-3.5 w-3.5 text-primary" />
                    <span class="text-xs font-medium text-primary">{{ getSkillLevelLabel(match.skill_level) }}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent class="pt-0">
              <div class="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <div class="flex items-center text-muted-foreground">
                  <Calendar class="h-4 w-4 mr-1.5" />
                  <span>{{ t('dashboard.card.matched') }} {{ formatMatchDate(match.matched_at) }}</span>
                </div>
              </div>
            </CardContent>

            <!-- Actions -->
            <div class="p-4 pt-0 flex gap-3">
              <Button class="flex-1 gap-2" variant="outline" @click="router.push(`/chat/${match.matchId}`)">
                <MessageCircle class="h-4 w-4" />
                {{ t('dashboard.card.message') }}
              </Button>
              <Button class="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Calendar class="h-4 w-4" />
                {{ t('dashboard.card.play') }}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-24 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/5">
        <div class="bg-primary/10 rounded-full p-6 inline-flex items-center justify-center mb-6">
          <Users class="h-10 w-10 text-primary" />
        </div>
        <h3 class="text-2xl font-bold mb-2">{{ t('dashboard.empty_state.title') }}</h3>
        <p class="text-muted-foreground mb-8 text-lg">{{ t('dashboard.empty_state.description') }}</p>
        <Button size="lg" @click="router.push('/discover')" class="bg-primary text-primary-foreground hover:bg-primary/90">
          <Heart class="h-4 w-4 mr-2" />
          {{ t('dashboard.empty_state.button') }}
        </Button>
      </div>
    </div>
  </div>
</template>
