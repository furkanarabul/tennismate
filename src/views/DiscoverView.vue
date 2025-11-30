<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, X, MapPin, Trophy, Star, MessageCircle, User, Navigation, ChevronDown } from 'lucide-vue-next'
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching, type UserProfile } from '@/composables/useMatching'
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner.vue'
import DistanceFilter from '@/components/DistanceFilter.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { supabase } from '@/lib/supabase'
import gsap from 'gsap'

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

// Location filtering
const { getCurrentPosition, loading: geoLoading, error: geoError } = useGeolocation()
const maxDistance = ref<number | null>(25) // Default: 25km
const userLatitude = ref<number | null>(null)
const userLongitude = ref<number | null>(null)
const showLocationPrompt = ref(false)

// Player counts
const allPlayerDistances = ref<number[]>([])
const playerCounts = ref<Record<number | string, number>>({})
const nextBestRange = ref<number | null>(null)

const calculatePlayerCounts = (allPlayers: UserProfile[]) => {
  if (!userLatitude.value || !userLongitude.value) return

  const ranges = [2, 5, 10, 25, 50]
  const counts: Record<number | string, number> = { any: allPlayers.length }

  ranges.forEach(range => {
    counts[range] = allPlayers.filter(p => {
      if (p.distance == null) return false
      return p.distance <= range
    }).length
  })

  playerCounts.value = counts

  // Find next best range if current is empty
  const currentMax = maxDistance.value
  if (currentMax !== null && counts[currentMax] === 0) {
    for (const range of ranges) {
      const rangeCount = counts[range] ?? 0
      if (range > currentMax && rangeCount > 0) {
        nextBestRange.value = range
        return
      }
    }
    nextBestRange.value = null // Use "Any" if all are empty
  } else {
    nextBestRange.value = null
  }
}

const loadUsers = async () => {
  if (!authStore.user) return

  try {
    // Load user profile for banner
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single()

    if (profileData) {
      userProfile.value = profileData
      // Get user's location from profile
      if (profileData.latitude != null && profileData.longitude != null) {
        userLatitude.value = profileData.latitude
        userLongitude.value = profileData.longitude
      }
    }

    // Fetch users with location filtering
    const fetchedPlayers = await getDiscoverUsers(
      authStore.user.id,
      userLatitude.value,
      userLongitude.value,
      maxDistance.value
    )
    
    // Store all distances for client-side filtering/counting
    allPlayerDistances.value = fetchedPlayers
      .map(p => p.distance)
      .filter((d): d is number => d != null)
    
    // Calculate initial counts
    calculatePlayerCounts(fetchedPlayers)
    
    players.value = fetchedPlayers
    
    // Reset index if we have new players
    if (players.value.length > 0) {
      currentIndex.value = 0
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const getSkillStars = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'beginner': return 1
    case 'intermediate': return 2
    case 'advanced': return 3
    case 'pro': return 4
    default: return 1
  }
}

const isAvailabilityExpanded = ref(false)

const getAvailabilityItems = (availability: string | any[]): string[] => {
  if (!availability) return []
  
  let parsed = availability
  if (typeof availability === 'string') {
    try {
      parsed = JSON.parse(availability)
    } catch {
      return [availability]
    }
  }
  
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((slot: any) => {
      // Clean up the time slots to be more compact
      // e.g. "Afternoon (12pm-5pm)" -> "12pm-5pm"
      const times = slot.timeSlots.map((t: string) => {
        const match = t.match(/\((.*?)\)/)
        return match ? match[1] : t
      }).join(', ')
      
      // Shorten day names
      const shortDay = slot.day.substring(0, 3)
      
      return `${shortDay}: ${times}`
    })
  }
  
  return ['Flexible']
}

const getAvailabilitySummary = (availability: string | any[]): string => {
  const items = getAvailabilityItems(availability)
  if (items.length === 0) return 'Not set'
  if (items[0] === 'Flexible') return 'Flexible'
  return `${items.length} days available`
}

const updateCardRef = (el: any, index: number) => {
  if (index === 0) {
    cardRef.value = el as HTMLElement
  }
}

const animateSwipe = (direction: 'left' | 'right') => {
  if (!cardRef.value || isAnimating.value) return
  
  isAnimating.value = true
  
  const x = direction === 'right' ? 500 : -500
  const rotation = direction === 'right' ? 30 : -30

  gsap.to(cardRef.value, {
    x: x,
    rotation: rotation,
    opacity: 0,
    duration: 0.4,
    ease: 'power1.in',
    onComplete: () => {
      handleSwipeComplete(direction)
    }
  })
}

const handleSwipeComplete = async (direction: 'left' | 'right') => {
  const currentPlayer = players.value[currentIndex.value]
  if (!currentPlayer || !authStore.user) {
    isAnimating.value = false
    return
  }

  if (direction === 'right') {
    const isMatch = await swipeUser(authStore.user.id, currentPlayer.id, 'like')
    if (isMatch) {
      matchedUser.value = currentPlayer
      showMatchModal.value = true
    }
  } else {
    await swipeUser(authStore.user.id, currentPlayer.id, 'pass')
  }

  // Remove swiped user from array
  players.value.splice(currentIndex.value, 1)
  
  await nextTick()
  
  resetCard()
  isAnimating.value = false
}

const handleLike = () => {
  animateSwipe('right')
}

const handlePass = () => {
  animateSwipe('left')
}

const resetCard = () => {
  if (cardRef.value) {
    gsap.set(cardRef.value, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      clearProps: 'all'
    })
    isAvailabilityExpanded.value = false
  }
}

// Request location permission
const requestLocation = async () => {
  try {
    const position = await getCurrentPosition()
    // Fix: Check if position exists before accessing coords
    if (position && position.coords) {
      userLatitude.value = position.coords.latitude
      userLongitude.value = position.coords.longitude
      showLocationPrompt.value = false
      
      // Save to profile
      if (authStore.user) {
        await supabase
          .from('profiles')
          .update({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          .eq('id', authStore.user.id)
      }
      
      await loadUsers()
    } else {
       showLocationPrompt.value = true
    }
  } catch (err: any) {
    console.error('Location error:', err)
    if (err.code === 1) { // Permission denied
      showLocationPrompt.value = true
    }
  }
}

// Watch for distance filter changes
watch(maxDistance, async (newDistance) => {
  if (newDistance) {
    await loadUsers()
  }
})

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // Load user profile first to check if they have a saved location
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single()

    if (profileData) {
      userProfile.value = profileData
      
      // Check if user has saved location
      if (profileData.latitude != null && profileData.longitude != null) {
        userLatitude.value = profileData.latitude
        userLongitude.value = profileData.longitude
        console.log('✅ Using saved location from DB:', { 
          lat: userLatitude.value, 
          lng: userLongitude.value 
        })
        // Load users with saved location
        await loadUsers()
        return
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  }

  // If no saved location, try to request it
  console.log('⚠️ No saved location, requesting from browser...')
  await requestLocation()
})

// Watch for players loaded to setup cards (no draggable needed anymore)
watch(players, () => {
  // Reset card position if needed
  if (cardRef.value) {
    gsap.set(cardRef.value, { x: 0, y: 0, rotation: 0, opacity: 1 })
  }
}, { deep: true })
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

      <!-- Location & Distance Filter -->
      <div class="mb-6 space-y-4">
        <!-- Distance Filter (only when location enabled) -->
        <DistanceFilter 
          v-if="userLatitude"
          v-model="maxDistance"
          :player-counts="playerCounts"
          :all-distances="allPlayerDistances"
          @update:modelValue="loadUsers"
        />
      </div>

      <!-- Location Required Prompt (BLOCKING) -->
      <div v-if="!userLatitude || showLocationPrompt" class="max-w-md mx-auto">
        <Card class="border-2 border-primary/30 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
          <CardContent class="p-6 text-center space-y-4">
            <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MapPin class="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <h3 class="text-xl font-bold mb-2">Location Required</h3>
              <p class="text-muted-foreground mb-4">
                Enable location to discover tennis players near you and see how far they are.
              </p>
            </div>

            <div v-if="geoError" class="p-4 text-sm bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
              <p class="font-semibold text-destructive">{{ geoError.message }}</p>
              <div class="text-muted-foreground space-y-1 text-xs">
                <p class="font-medium">How to fix:</p>
                <ul class="list-disc list-inside space-y-1">
                  <li>Click the 🔒 icon in your browser's address bar</li>
                  <li>Look for "Location" permission</li>
                  <li>Change it to "Allow"</li>
                  <li>Refresh this page and try again</li>
                </ul>
              </div>
            </div>

            <Button 
              @click="requestLocation"
              class="w-full"
              size="lg"
              :disabled="geoLoading"
            >
              <Navigation class="h-5 w-5 mr-2" />
              {{ geoLoading ? 'Getting location...' : geoError ? 'Try Again' : 'Enable Location' }}
            </Button>

            <p class="text-xs text-muted-foreground">
              Your exact location is never shared. Only distance is shown to other players.
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Player Cards (only show when location enabled) -->
      <div v-if="userLatitude && !showLocationPrompt">
        <div v-if="loading" class="text-center py-12">
          <p class="text-lg text-muted-foreground">Loading players...</p>
        </div>

        <div v-else-if="players.length === 0 || currentIndex >= players.length" class="text-center py-12">
          <Trophy class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          
          <!-- Smart Empty State -->
          <div v-if="nextBestRange">
            <h2 class="text-2xl font-bold mb-2">No Players Within {{ maxDistance }} km</h2>
            <p class="text-muted-foreground mb-4">
              But there are {{ playerCounts[nextBestRange] || 0 }} players within {{ nextBestRange }} km
            </p>
            <Button @click="maxDistance = nextBestRange" class="mb-2">
              Expand to {{ nextBestRange }} km
            </Button>
            <Button @click="loadUsers" variant="outline">
              Refresh
            </Button>
          </div>
          
          <!-- Regular Empty State -->
          <div v-else>
            <h2 class="text-2xl font-bold mb-2">No More Players</h2>
            <p class="text-muted-foreground mb-6">You've seen all available players for now.</p>
            <Button @click="loadUsers">Refresh</Button>
          </div>
        </div>

        <div v-else class="space-y-6">
        <!-- Card container with 3D perspective -->
        <div class="relative h-[520px] perspective-1000">
          <!-- Stack of all remaining cards -->
          <div 
            v-for="(player, index) in players.slice(currentIndex)" 
            :key="player.id"
            class="absolute inset-0 transition-transform duration-300"
            :class="{ 'cursor-default': index === 0 }"
            :ref="(el) => updateCardRef(el, index)"
            :style="{
              transform: `scale(${1 - index * 0.03}) translateY(${index * 12}px)`,
              zIndex: players.length - index,
              opacity: index < 3 ? 1 : 0,
              pointerEvents: index === 0 ? 'auto' : 'none'
            }"
          >
            <div 
              class="h-full"
            >
              <Card class="overflow-hidden h-full shadow-lg border-2 relative flex flex-col">
                <CardHeader class="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 flex-shrink-0">
                  <div class="flex items-center gap-4">
                    <!-- Avatar Section (Left) -->
                    <div class="h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg flex-shrink-0 bg-muted">
                      <img
                        v-if="player.avatar_url"
                        :src="player.avatar_url"
                        :alt="player.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full bg-primary/10 flex items-center justify-center">
                        <User class="h-14 w-14 text-primary" />
                      </div>
                    </div>

                    <!-- Info Section (Right) -->
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                      <!-- Name & Liked Badge -->
                      <div class="flex items-center gap-2 mb-1">
                        <CardTitle class="text-2xl font-bold truncate">
                          {{ player.name }}<span v-if="player.age" class="font-normal text-muted-foreground ml-1">, {{ player.age }}</span>
                        </CardTitle>
                        <div 
                          v-if="player.hasLikedMe" 
                          class="px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                        >
                          <Heart class="h-3 w-3 fill-current" />
                        </div>
                      </div>

                      <!-- Location -->
                      <div class="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                        <MapPin class="h-3.5 w-3.5 flex-shrink-0" />
                        <span class="truncate">{{ player.location || 'Location not set' }}</span>
                        <span v-if="player.distance != null" class="text-primary font-medium text-xs flex-shrink-0">
                          ({{ player.distance }} km)
                        </span>
                      </div>

                      <!-- Skill Level Badge -->
                      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full w-fit">
                        <div class="flex items-center gap-0.5">
                          <Star 
                            v-for="i in getSkillStars(player.skill_level)" 
                            :key="i"
                            class="h-3 w-3 fill-current" 
                          />
                        </div>
                        <span class="font-semibold text-xs">{{ player.skill_level }}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent class="space-y-4 p-5 pt-2 flex-1 overflow-y-auto">
                  <div class="space-y-3">
                    <!-- About Section -->
                    <div class="bg-muted/30 rounded-lg p-3">
                      <p class="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">About</p>
                      <p class="text-sm leading-relaxed">{{ player.bio || 'No bio yet' }}</p>
                    </div>

                    <!-- Availability Accordion -->
                    <div class="bg-primary/5 rounded-lg border border-primary/20 overflow-hidden">
                      <button 
                        @click.stop="isAvailabilityExpanded = !isAvailabilityExpanded"
                        class="w-full p-3 flex items-center justify-between hover:bg-primary/5 transition-colors"
                      >
                        <span class="text-sm font-medium text-muted-foreground">Availability</span>
                        <div class="flex items-center gap-1">
                          <span v-if="!isAvailabilityExpanded" class="text-xs text-primary font-semibold">
                            {{ getAvailabilitySummary(player.availability) }}
                          </span>
                          <ChevronDown 
                            class="h-4 w-4 text-primary transition-transform duration-300"
                            :class="{ 'rotate-180': isAvailabilityExpanded }"
                          />
                        </div>
                      </button>
                      
                      <div 
                        v-show="isAvailabilityExpanded"
                        class="px-3 pb-3 pt-0 max-h-[140px] overflow-y-auto"
                      >
                        <div class="space-y-1.5 mt-1">
                           <div v-for="item in getAvailabilityItems(player.availability)" :key="item" class="text-sm font-medium text-primary/90 flex items-center gap-2">
                             <div class="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></div>
                             {{ item }}
                           </div>
                        </div>
                      </div>
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
      </div>

      <!-- End location-gated content -->
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
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.cursor-grab:active {
  cursor: grabbing !important;
}

/* Prevent browser handling of gestures on the card */
.touch-none {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
</style>
