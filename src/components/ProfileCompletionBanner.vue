<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{
  profile: any
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const router = useRouter()

// Calculate profile completion
const completionItems = computed(() => {
  let availability = props.profile?.availability
  
  // Parse if it's a JSON string
  if (typeof availability === 'string' && availability.trim().startsWith('[')) {
    try {
      availability = JSON.parse(availability)
    } catch (e) {
      console.warn('Failed to parse availability:', e)
    }
  }
  
  console.log('🔍 Availability Debug:')
  console.log('  Raw value:', props.profile?.availability)
  console.log('  Parsed value:', availability)
  console.log('  Type:', typeof availability)
  console.log('  Is Array:', Array.isArray(availability))
  
  const isAvailabilityComplete = 
    availability && 
    availability !== 'Not set' &&
    availability !== 'Flexible' &&
    (Array.isArray(availability) ? availability.length > 0 : typeof availability === 'string' && availability.length > 0)
  
  console.log('  Is Complete:', isAvailabilityComplete)
  
  const items = [
    { name: 'Profile Photo', completed: !!props.profile?.avatar_url },
    { name: 'Location', completed: !!props.profile?.location && props.profile.location !== 'Not set' },
    { name: 'Skill Level', completed: !!props.profile?.skill_level },
    { name: 'Bio', completed: !!props.profile?.bio && props.profile.bio.length > 0 && props.profile.bio !== 'No bio yet' },
    { name: 'Availability', completed: !!isAvailabilityComplete }
  ]
  
  console.log('📊 All Items:', items)
  
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
            <h3 class="font-semibold text-lg mb-1">Complete Your Profile</h3>
            <p class="text-sm text-muted-foreground mb-3">
              Stand out to potential tennis partners by completing your profile
            </p>
            
            <!-- Progress Bar -->
            <div class="mb-3">
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{{ completionPercentage }}% Complete</span>
                <span>{{ missingItems.length }} items remaining</span>
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
              Complete Profile
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
