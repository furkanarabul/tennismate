<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, X, MapPin, Trophy, Star, MessageCircle, User } from 'lucide-vue-next'
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching, type UserProfile } from '@/composables/useMatching'
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner.vue'
import { supabase } from '@/lib/supabase'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'

// Register GSAP plugins
gsap.registerPlugin(Draggable)

const router = useRouter()
const authStore = useAuthStore()
const { getDiscoverUsers, swipeUser, loading } = useMatching()

const players = ref<UserProfile[]>([])
const currentIndex = ref(0)
const cardRef = ref<HTMLElement | null>(null)
const isAnimating = ref(false)
const showMatchModal = ref(false)
const matchedUser = ref<UserProfile | null>(null)
const userProfile = ref<any>(null)
const showBanner = ref(true)

let draggableInstance: any = null

const loadUsers = async () => {
  if (!authStore.user) return
  
  // Load user profile for banner
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authStore.user.id)
    .single()
  
  userProfile.value = profile
  
  players.value = await getDiscoverUsers(authStore.user.id, 20)
  
  if (players.value.length > 0) {
    nextTick(() => {
      gsap.set(cardRef.value, {
        opacity: 1,
        scale: 1
      })
      setupDraggable()
    })
  }
}

const parseAvailability = (availability: string | any[]) => {
  if (!availability) return 'Not set'
  if (typeof availability === 'string') {
    try {
      const parsed = JSON.parse(availability)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((slot: any) => `${slot.day}: ${slot.timeSlots.join(', ')}`).join(' | ')
      }
    } catch {
      return availability
    }
  }
  if (Array.isArray(availability) && availability.length > 0) {
    return availability.map((slot: any) => `${slot.day}: ${slot.timeSlots.join(', ')}`).join(' | ')
  }
  return 'Flexible'
}

const setupDraggable = () => {
  if (!cardRef.value) return

  draggableInstance = Draggable.create(cardRef.value, {
    type: 'x,y',
    bounds: { minX: -300, maxX: 300, minY: -100, maxY: 100 },
    inertia: true,
    onDrag: function() {
      const x = this.x
      const rotation = x / 10
      
      gsap.set(cardRef.value, {
        rotation: rotation,
        transformOrigin: 'center bottom'
      })
    },
    onDragEnd: function() {
      const x = this.x
      
      if (Math.abs(x) > 120) {
        // Swipe threshold met
        const direction = x > 0 ? 'right' : 'left'
        animateSwipe(direction)
      } else {
        // Return to center
        gsap.to(cardRef.value, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.3,
          ease: 'back.out(1.7)'
        })
      }
    }
  })[0]
}

const animateSwipe = (direction: 'left' | 'right') => {
  return new Promise<void>(resolve => {
    const multiplier = direction === 'right' ? 1 : -1
    gsap.to(cardRef.value, {
      x: 800 * multiplier,
      y: -100,
      rotation: 30 * multiplier,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        resolve()
      }
    })
  })
}

const handleLike = async () => {
  if (isAnimating.value || currentIndex.value >= players.value.length) return
  
  isAnimating.value = true
  const direction = 'right'
  
  await animateSwipe(direction)
  
  if (authStore.user) {
    const currentPlayer = players.value[currentIndex.value]
    const isMatch = await swipeUser(
      authStore.user.id,
      currentPlayer.id,
      'like'
    )
    
    if (isMatch) {
      matchedUser.value = currentPlayer
      showMatchModal.value = true
    }
  }
  
  // Remove swiped user from array
  players.value.splice(currentIndex.value, 1)
  resetCard()
  isAnimating.value = false
}

const handlePass = async () => {
  if (isAnimating.value || currentIndex.value >= players.value.length) return
  
  isAnimating.value = true
  const direction = 'left'
  
  await animateSwipe(direction)
  
  if (authStore.user) {
    await swipeUser(
      authStore.user.id,
      players.value[currentIndex.value].id,
      'pass'
    )
  }
  
  // Remove swiped user from array
  players.value.splice(currentIndex.value, 1)
  resetCard()
  isAnimating.value = false
}

const resetCard = () => {
  if (cardRef.value) {
    gsap.set(cardRef.value, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1
    })
    setupDraggable()
  }
}

const getSkillStars = (skillLevel: string) => {
  switch (skillLevel) {
    case 'Beginner': return 1
    case 'Intermediate': return 2
    case 'Advanced': return 3
    default: return 1
  }
}

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  await loadUsers()
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- Profile Completion Banner -->
      <ProfileCompletionBanner 
        v-if="userProfile && showBanner" 
        :profile="userProfile"
        @dismiss="showBanner = false"
        class="mb-6"
      />
      
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold mb-2">Discover Players</h1>
        <p class="text-muted-foreground">Drag cards or use buttons to swipe</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-lg text-muted-foreground">Loading players...</p>
      </div>

      <div v-else-if="players.length === 0 || currentIndex >= players.length" class="text-center py-12">
        <Trophy class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 class="text-2xl font-bold mb-2">No More Players</h2>
        <p class="text-muted-foreground mb-6">You've seen all available players for now.</p>
        <Button @click="loadUsers">Refresh</Button>
      </div>

      <div v-else class="space-y-6">
        <!-- Card container with 3D perspective -->
        <div class="relative h-[520px] perspective-1000">
          <!-- Stack of all remaining cards -->
          <div 
            v-for="(player, index) in players.slice(currentIndex)" 
            :key="player.id"
            class="absolute inset-0 transition-transform duration-300"
            :style="{
              transform: `scale(${1 - index * 0.03}) translateY(${index * 12}px)`,
              zIndex: players.length - index,
              opacity: index < 3 ? 1 : 0,
              pointerEvents: index === 0 ? 'auto' : 'none'
            }"
          >
            <div 
              :ref="index === 0 ? 'cardRef' : undefined"
              class="h-full"
              :class="index === 0 ? 'cursor-grab active:cursor-grabbing' : ''"
            >
              <Card class="overflow-hidden h-full shadow-lg border-2 relative">
                <CardHeader class="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4">
                  <!-- Avatar Section -->
                  <div class="flex items-center justify-center mb-4">
                    <div class="h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg">
                      <img
                        v-if="player.avatar_url"
                        :src="player.avatar_url"
                        :alt="player.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full bg-primary/10 flex items-center justify-center">
                        <UserIcon class="h-16 w-16 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div class="flex items-start justify-between">
                    <div>
                      <CardTitle class="text-3xl mb-1">{{ player.name }}</CardTitle>
                      <CardDescription class="flex items-center gap-1 text-base">
                        <MapPin class="h-4 w-4" />
                        {{ player.location || 'Location not set' }}
                      </CardDescription>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-full">
                      <div class="flex items-center gap-0.5">
                        <Star 
                          v-for="i in getSkillStars(player.skill_level)" 
                          :key="i"
                          class="h-3.5 w-3.5 fill-current" 
                        />
                      </div>
                      <span class="font-semibold text-xs">{{ player.skill_level }}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent class="space-y-5 pt-6">
                  <div class="space-y-3">
                    <div class="flex items-start gap-3">
                      <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Trophy class="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p class="text-sm text-muted-foreground mb-0.5">Skill Level</p>
                        <p class="font-semibold">{{ player.skill_level }}</p>
                      </div>
                    </div>
                    
                    <div class="bg-muted/30 rounded-lg p-4">
                      <p class="text-sm text-muted-foreground mb-2 font-medium">About</p>
                      <p class="text-base leading-relaxed">{{ player.bio || 'No bio yet' }}</p>
                    </div>

                    <div class="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <p class="text-sm text-muted-foreground mb-2 font-medium">Availability</p>
                      <p class="text-base font-semibold text-primary">{{ parseAvailability(player.availability) }}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <!-- Action buttons with enhanced styling -->
        <div class="flex gap-6 justify-center items-center">
          <!-- Pass Button -->
          <Button
            variant="outline"
            size="icon"
            class="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 shadow-lg"
            @click="handlePass"
            :disabled="isAnimating"
          >
            <X class="h-8 w-8" />
          </Button>

          <div class="text-center">
            <p class="text-sm text-muted-foreground font-medium">
              {{ currentIndex + 1 }} / {{ players.length }}
            </p>
          </div>

          <!-- Like Button -->
          <Button
            size="icon"
            class="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:shadow-2xl transition-all duration-200 shadow-lg"
            @click="handleLike"
            :disabled="isAnimating"
          >
            <Heart class="h-8 w-8" />
          </Button>
        </div>

        <p class="text-center text-sm text-muted-foreground">
          💡 Tip: Drag the card left or right to swipe!
        </p>
      </div>
    </div>

    <!-- Match Modal -->
    <div
      v-if="showMatchModal && matchedUser"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click="showMatchModal = false"
    >
      <div
        class="relative max-w-md w-full mx-4"
        @click.stop
      >
        <Card class="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader class="text-center pb-6 pt-8">
            <CardTitle class="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              It's a Match!
            </CardTitle>
            <CardDescription class="text-base">You both liked each other!</CardDescription>
          </CardHeader>
          
          <CardContent class="pt-0 pb-8">
            <!-- Matched User Info -->
            <div class="flex flex-col items-center text-center mb-8">
              <div class="relative mb-4">
                <div class="h-28 w-28 rounded-full overflow-hidden border-4 border-primary/30">
                  <img
                    v-if="matchedUser.avatar_url"
                    :src="matchedUser.avatar_url"
                    :alt="matchedUser.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <User class="h-14 w-14 text-primary" />
                  </div>
                </div>
                <!-- Green check -->
                <div class="absolute -bottom-1 -right-1 h-10 w-10 bg-green-500 border-4 border-card rounded-full flex items-center justify-center">
                  <Heart class="h-5 w-5 text-white fill-white" />
                </div>
              </div>
              
              <h3 class="text-2xl font-bold mb-1">{{ matchedUser.name }}</h3>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 mb-2">
                <Trophy class="h-3.5 w-3.5 text-primary" />
                <span class="text-xs font-medium text-primary">{{ matchedUser.skill_level }}</span>
              </div>
              <p class="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin class="h-3.5 w-3.5" />
                {{ matchedUser.location || 'Location not set' }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <Button 
                variant="outline" 
                class="flex-1 hover:bg-primary/10 hover:border-primary/50 transition-colors" 
                @click="showMatchModal = false"
              >
                Keep Playing
              </Button>
              <Button 
                class="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity" 
                @click="router.push('/dashboard')"
              >
                <MessageCircle class="h-4 w-4 mr-2" />
                View Match
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.cursor-grab:active {
  cursor: grabbing !important;
}
</style>
