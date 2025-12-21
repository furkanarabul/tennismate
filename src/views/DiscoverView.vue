<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Heart, X, MapPin, Trophy, Star, MessageCircle, User, Navigation, ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatching, type UserProfile } from '@/composables/useMatching'
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner.vue'
import DistanceFilter from '@/components/DistanceFilter.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { supabase } from '@/lib/supabase'
import gsap from 'gsap'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
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
const { getCurrentPosition, loading: geoLoading, error: geoError, checkPermission } = useGeolocation()
const maxDistance = ref<number | null>(25) // Default: 25km
const userLatitude = ref<number | null>(null)
const userLongitude = ref<number | null>(null)
const showLocationPrompt = ref(false)
const showFilters = ref(false)
const genderFilter = ref('any')

const genderOptions = computed(() => [
  { value: 'any', label: t('filters.gender.any') },
  { value: 'male', label: t('filters.gender.male') },
  { value: 'female', label: t('filters.gender.female') }
])

// Player counts
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

const allFetchedUsers = ref<UserProfile[]>([])

const genderFilteredUsers = computed(() => {
  if (genderFilter.value === 'any') return allFetchedUsers.value
  return allFetchedUsers.value.filter(p => p.gender === genderFilter.value)
})

const allPlayerDistances = computed(() => {
  return genderFilteredUsers.value
    .map(p => p.distance)
    .filter((d): d is number => d != null)
})

const applyFilters = () => {
  if (!allFetchedUsers.value.length) {
    players.value = []
    return
  }

  // Filter by max distance
  // Filter by max distance
  let filtered = genderFilteredUsers.value
  if (maxDistance.value !== null) {
    filtered = filtered.filter(p => p.distance != null && p.distance <= maxDistance.value!)
  }
  
  // Filter by gender
  if (genderFilter.value !== 'any') {
    filtered = filtered.filter(p => p.gender === genderFilter.value)
  }
  
  // Filter by gender (already done in genderFilteredUsers, but keeping structure if needed)
  // if (genderFilter.value !== 'any') {
  //   filtered = filtered.filter(p => p.gender === genderFilter.value)
  // }
  
  players.value = filtered
  
  // Reset index if we have new players
  if (players.value.length > 0) {
    currentIndex.value = 0
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

    // Fetch users WITHOUT distance limit to get everyone for stats
    const fetchedPlayers = await getDiscoverUsers(
      authStore.user.id,
      userLatitude.value,
      userLongitude.value,
      null // Fetch all within limit, filter locally
    )
    
    allFetchedUsers.value = fetchedPlayers

    // Calculate initial counts (will be triggered by watcher too, but safe to do here)
    // calculatePlayerCounts(fetchedPlayers) 
    // applyFilters()
    
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

const getSkillLevelLabel = (level: string) => {
  if (!level) return ''
  const key = level.toLowerCase()
  return t(`profile.skill_levels.${key}`) || level
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

const currentMatchId = ref<string | null>(null)

const handleSwipeComplete = async (direction: 'left' | 'right') => {
  const currentPlayer = players.value[currentIndex.value]
  if (!currentPlayer || !authStore.user) {
    isAnimating.value = false
    return
  }

  try {
    if (direction === 'right') {
      const { isMatch, matchId } = await swipeUser(authStore.user.id, currentPlayer.id, 'like')
      if (isMatch) {
        matchedUser.value = currentPlayer
        currentMatchId.value = matchId || null
        showMatchModal.value = true
      }
    } else {
      await swipeUser(authStore.user.id, currentPlayer.id, 'pass')
    }
  } catch (error) {
    console.error('Swipe error:', error)
  } finally {
    // Remove swiped user from array
    players.value.splice(currentIndex.value, 1)
    
    await nextTick()
    
    resetCard()
    isAnimating.value = false
  }
}

const handleMessage = () => {
  if (currentMatchId.value) {
    router.push(`/chat/${currentMatchId.value}`)
  } else {
    router.push('/dashboard')
  }
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

const reloadPage = () => {
  window.location.reload()
}

// Request location permission
const requestLocation = async () => {
  try {
    const position = await getCurrentPosition()
    
    if (position) {
      userLatitude.value = position.latitude
      userLongitude.value = position.longitude
      showLocationPrompt.value = false
      
      // Save to profile
      if (authStore.user) {
        await supabase
          .from('profiles')
          .update({
            latitude: position.latitude,
            longitude: position.longitude
          })
          .eq('id', authStore.user.id)
      }
      
      await loadUsers()
    } else {
       // If failed, but we have a saved location from DB, allow it!
       if (userLatitude.value != null && userLongitude.value != null) {
         console.warn('⚠️ Live location failed, using saved DB location instead.')
         showLocationPrompt.value = false
         await loadUsers()
         return
       }

       // Only show prompt if we truly have no location
       if (checkPermission) {
         const status = await checkPermission()
         console.log('📍 Permission status check:', status)
       }
       showLocationPrompt.value = true
    }
  } catch (err: any) {
    // Similarly for unexpected errors
    if (userLatitude.value != null && userLongitude.value != null) {
         console.warn('⚠️ Location error caught, using saved DB location.', err)
         showLocationPrompt.value = false
         return
    }

    console.error('Unexpected location error:', err)
    showLocationPrompt.value = true
  }
}

// Watch for distance filter changes
watch(maxDistance, () => {
  applyFilters()
})

// Watch for gender filtered users to update counts and re-apply filters
watch(genderFilteredUsers, (newUsers) => {
  calculatePlayerCounts(newUsers)
  applyFilters()
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
        // Load users with saved location initially
        await loadUsers()
      }
    }
  } catch (error: any) {
    console.error('❌ Error loading profile:', {
      message: error.message,
      code: error.code,
      details: error.details
    })
  }

  // Always request fresh location from browser to ensure accuracy
  console.log('📍 Requesting fresh location from browser...')
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
        <h1 class="text-3xl font-bold mb-2">{{ t('discover.title') }}</h1>
        <p class="text-muted-foreground">{{ t('discover.subtitle') }}</p>
      </div>

      <!-- Location Prompt -->
      <div v-if="showLocationPrompt" class="mb-6 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-3">
          <MapPin class="h-5 w-5 text-primary" />
          <p class="text-sm font-medium">{{ t('discover.location_prompt') }}</p>
        </div>
        <Button size="sm" @click="geoError?.code === 1 ? reloadPage() : requestLocation()">
          {{ geoError?.code === 1 ? t('common.reload_page') : t('discover.enable_location') }}
        </Button>
      </div>

      <!-- Location & Distance Filter -->
      <div class="mb-6 flex items-center justify-between gap-4">
         <Button variant="outline" class="gap-2" @click="showFilters = true">
            <SlidersHorizontal class="h-4 w-4" />
            {{ t('discover.filters') }}
         </Button>

         <Button variant="ghost" size="icon" @click="loadUsers" :disabled="loading">
            <RotateCcw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
         </Button>
      </div>

      <!-- Filter Modal -->
      <Dialog v-model:open="showFilters">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{{ t('discover.filters') }}</DialogTitle>
            <DialogDescription>
              {{ t('discover.filters_description') }}
            </DialogDescription>
          </DialogHeader>
          
          <div class="grid gap-6 py-4">
            <!-- Gender Filter -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ t('filters.gender.label') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in genderOptions"
                  :key="option.value"
                  @click="genderFilter = option.value"
                  class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  :class="genderFilter === option.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Distance Filter -->
            <div class="space-y-2" v-if="userLatitude">
               <DistanceFilter 
                v-model="maxDistance"
                :player-counts="playerCounts"
                :all-distances="allPlayerDistances"
                :total-count="genderFilteredUsers.length"
                @update:modelValue="loadUsers"
              />
            </div>
          </div>

          <DialogFooter>
            <Button @click="showFilters = false" class="w-full">
              {{ t('common.show_results', { count: players.length }) }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <!-- Player Cards (only show when location enabled) -->
      <div v-if="userLatitude && !showLocationPrompt">
        <div v-if="loading" class="text-center py-12">
          <p class="text-lg text-muted-foreground">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="players.length === 0 || currentIndex >= players.length" class="text-center py-12">
          
          <!-- Smart Empty State -->
          <div v-if="nextBestRange">
            <h2 class="text-2xl font-bold mb-2">{{ t('discover.smart_empty_state.title', { dist: maxDistance }) }}</h2>
            <p class="text-muted-foreground mb-4">
              {{ t('discover.smart_empty_state.description', { count: playerCounts[nextBestRange] || 0, nextDist: nextBestRange }) }}
            </p>
            <Button @click="maxDistance = nextBestRange" class="mb-2">
              {{ t('discover.smart_empty_state.expand', { dist: nextBestRange }) }}
            </Button>
          </div>
          
          <!-- Regular Empty State -->
          <div v-else-if="players.length === 0" class="text-center py-12">

            <h3 class="text-xl font-semibold mb-2">{{ t('discover.empty_state.title') }}</h3>
            <p class="text-muted-foreground mb-6">{{ t('discover.empty_state.description') }}</p>
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
                          v-for="i in getSkillStars(player.skill_level)" 
                          :key="i"
                          class="h-3 w-3 fill-current" 
                        />
                        <div 
                          v-if="player.hasLikedMe" 
                          class="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 flex items-center"
                        >
                          <Heart class="h-3 w-3 fill-current mr-1" />
                          {{ t('discover.card.liked_you') }}
                        </div>
                      </div>

                      <!-- Location -->
                      <div class="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                        <MapPin class="h-3.5 w-3.5 flex-shrink-0" />
                        <span class="truncate">{{ player.location || t('discover.card.location_not_set') }}</span>
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
                        <span class="font-semibold text-xs">{{ getSkillLevelLabel(player.skill_level) }}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent class="space-y-4 p-5 pt-2 flex-1 overflow-y-auto">
                  <div class="space-y-3">
                    <!-- About Section -->
                    <div class="bg-muted/30 rounded-lg p-3">
                      <p class="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">{{ t('discover.card.about') }}</p>
                      <p class="text-sm leading-relaxed">{{ player.bio || t('discover.card.no_bio') }}</p>
                    </div>

                    <!-- Availability Accordion -->
                    <div class="bg-primary/5 rounded-lg border border-primary/20 overflow-hidden">
                      <button 
                        @click.stop="isAvailabilityExpanded = !isAvailabilityExpanded"
                        class="w-full p-3 flex items-center justify-between hover:bg-primary/5 transition-colors"
                      >
                        <span class="text-sm font-medium text-muted-foreground">{{ t('discover.card.availability') }}</span>
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
        <div class="flex gap-6 justify-center items-center relative z-20">
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
        <Card class="overflow-hidden border-none dark:border dark:border-white/10 bg-white dark:bg-card/10 dark:backdrop-blur-md shadow-2xl rounded-3xl">
          <CardContent class="pt-10 pb-8 px-6 flex flex-col items-center">
            
            <!-- Title -->
            <h2 class="text-3xl font-bold text-green-600 dark:text-green-500 mb-2 text-center">It's a Match!</h2>
            <p class="text-gray-500 dark:text-muted-foreground text-center mb-8">
              You and <span class="font-semibold text-gray-900 dark:text-foreground">{{ matchedUser.name }}</span> liked each other!
            </p>

            <!-- Overlapping Avatars -->
            <div class="relative h-32 w-full flex justify-center items-center mb-8">
              <!-- Current User (Left) -->
              <div class="absolute left-[20%] z-10 h-28 w-28 rounded-full border-4 border-white dark:border-card shadow-lg overflow-hidden">
                <img
                  v-if="userProfile?.avatar_url"
                  :src="userProfile.avatar_url"
                  alt="You"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full bg-gray-200 dark:bg-muted flex items-center justify-center">
                  <User class="h-12 w-12 text-gray-400 dark:text-muted-foreground" />
                </div>
              </div>

              <!-- Matched User (Right) -->
              <div class="absolute right-[20%] z-20 h-28 w-28 rounded-full border-4 border-green-500 dark:border-green-600 shadow-lg overflow-hidden">
                <img
                  v-if="matchedUser.avatar_url"
                  :src="matchedUser.avatar_url"
                  :alt="matchedUser.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full bg-gray-200 dark:bg-muted flex items-center justify-center">
                  <User class="h-12 w-12 text-gray-400 dark:text-muted-foreground" />
                </div>
              </div>

              <!-- Tennis Ball Badge -->
              <div class="absolute z-30 bg-white dark:bg-card p-2 rounded-full shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-6 w-6 text-green-600 dark:text-green-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12C2 12 5 12 8 9C11 6 12 2 12 2" />
                  <path d="M22 12C22 12 19 12 16 15C13 18 12 22 12 22" />
                </svg>
              </div>
            </div>

            <!-- Actions -->
            <div class="w-full space-y-3">
              <Button 
                class="w-full h-12 rounded-md bg-[#1ea955] hover:bg-[#188a44] dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold text-base shadow-sm" 
                @click="handleMessage"
              >
                <MessageCircle class="h-4 w-4 mr-2" />
                {{ t('discover.match_modal.view_match') }}
              </Button>
              
              <Button 
                variant="outline" 
                class="w-full h-12 rounded-md border-gray-200 dark:border-gray-700 text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted font-semibold text-base" 
                @click="showMatchModal = false"
              >
                <X class="h-4 w-4 mr-2" />
                {{ t('discover.match_modal.keep_playing') }}
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
