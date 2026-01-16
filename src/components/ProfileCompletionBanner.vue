<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  profile: any
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const router = useRouter()
const { t } = useI18n()

// Calculate profile completion
const completionItems = computed(() => {
  let availability = props.profile?.availability
  
  // Parse if it's a JSON string
  if (typeof availability === 'string' && availability.trim().startsWith('[')) {
    try {
      availability = JSON.parse(availability)
    } catch (e) {
    }
  }
  
  const isAvailabilityComplete = 
    availability && 
    availability !== 'Not set' &&
    availability !== 'Flexible' &&
    (Array.isArray(availability) ? availability.length > 0 : typeof availability === 'string' && availability.length > 0)
  
  const items = [
    { name: t('profile_completion.items.photo'), completed: !!props.profile?.avatar_url },
    { name: t('profile_completion.items.location'), completed: !!props.profile?.location && props.profile.location !== 'Not set' },
    { name: t('profile_completion.items.skill_level'), completed: !!props.profile?.skill_level },
    { name: t('profile_completion.items.bio'), completed: !!props.profile?.bio && props.profile.bio.length > 0 && props.profile.bio !== 'No bio yet' },
    { name: t('profile_completion.items.availability'), completed: !!isAvailabilityComplete }
  ]
  
  return items
})

const completionPercentage = computed(() => {
  const completed = completionItems.value.filter(item => item.completed).length
  return Math.round((completed / completionItems.value.length) * 100)
})

const missingItems = computed(() => {
  return completionItems.value.filter(item => !item.completed)
})

const isComplete = computed(() => completionPercentage.value === 100)
</script>

<template>
  <Card 
    v-if="!isComplete" 
    class="border-2 border-primary/30 bg-gradient-to-b from-primary/10 via-primary/5 to-background mb-6"
  >
    <div class="p-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3 flex-1">
          <AlertCircle class="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-lg mb-1">{{ t('profile_completion.title') }}</h3>
            <p class="text-sm text-muted-foreground mb-3">
              {{ t('profile_completion.subtitle') }}
            </p>
            
            <!-- Progress Bar -->
            <div class="mb-3">
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{{ completionPercentage }}% {{ t('profile_completion.complete') }}</span>
                <span>{{ missingItems.length }} {{ t('profile_completion.items_remaining') }}</span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                  :style="{ width: `${completionPercentage}%` }"
                ></div>
              </div>
            </div>

            <!-- Missing Items -->
            <div class="flex flex-wrap gap-2 mb-3">
              <div 
                v-for="item in missingItems" 
                :key="item.name"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded-md"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-destructive"></span>
                {{ item.name }}
              </div>
            </div>

            <!-- Action Button -->
            <Button 
              size="sm" 
              class="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
              @click="router.push('/profile')"
            >
              {{ t('profile_completion.button') }}
            </Button>
          </div>
        </div>

        <!-- Close Button -->
        <Button 
          variant="ghost" 
          size="icon" 
          class="h-6 w-6 flex-shrink-0"
          @click="emit('dismiss')"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </Card>
</template>
