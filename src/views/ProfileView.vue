<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trophy, MapPin, Star, Calendar, User as UserIcon, LogOut, Edit2, Save, X, Hash } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import AvailabilityPicker from '@/components/AvailabilityPicker.vue'
import AvatarUpload from '@/components/AvatarUpload.vue'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const isEditing = ref(false)

const profile = ref({
  name: '',
  email: '',
  skillLevel: 'Intermediate',
  location: '',
  bio: '',
  availability: [] as any[],
  avatar_url: '',
  age: null as number | null
})

// Form data for editing
const formData = ref({
  skillLevel: 'Intermediate',
  location: '',
  bio: '',
  availability: [] as any[],
  avatar_url: '',
  age: null as number | null
})

const skillLevelOptions = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' }
]

// Mask email
const maskedEmail = computed(() => {
  const email = profile.value.email
  if (!email) return ''
  const [username, domain] = email.split('@')
  if (!username || !domain) return email
  return `${username[0]}***@${domain}`
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    // Ignore session missing errors - just redirect to login
    console.log('Logout completed (session may have already expired)')
    router.push('/login')
  }
}

const startEditing = () => {
  // Copy current values to form
  formData.value = {
    skillLevel: profile.value.skillLevel,
    location: profile.value.location,
    bio: profile.value.bio,
    availability: JSON.parse(JSON.stringify(profile.value.availability)),
    avatar_url: profile.value.avatar_url,
    age: profile.value.age
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveProfile = async () => {
  if (!authStore.user) return

  saving.value = true

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        skill_level: formData.value.skillLevel,
        location: formData.value.location || null,
        bio: formData.value.bio || null,
        availability: JSON.stringify(formData.value.availability),
        avatar_url: formData.value.avatar_url || null,
        age: formData.value.age || null
      })
      .eq('id', authStore.user.id)

    if (error) throw error

    // Update local state
    profile.value.skillLevel = formData.value.skillLevel
    profile.value.location = formData.value.location
    profile.value.bio = formData.value.bio
    profile.value.availability = formData.value.availability
    profile.value.avatar_url = formData.value.avatar_url
    profile.value.age = formData.value.age

    isEditing.value = false
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Failed to save profile. Please try again.')
  } finally {
    saving.value = false
  }
}

// Load user profile from Supabase
onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  loading.value = true
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .maybeSingle()

    if (error) throw error

    if (data) {
      // Profile exists
      profile.value = {
        name: data.name || 'No name',
        email: data.email || authStore.user.email || '',
        skillLevel: data.skill_level || 'Intermediate',
        location: data.location || '',
        bio: data.bio || '',
        availability: data.availability ? JSON.parse(data.availability) : [],
        avatar_url: data.avatar_url || '',
        age: data.age || null
      }
    } else {
      // Profile doesn't exist, create it
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authStore.user.id,
            email: authStore.user.email,
            name: authStore.user.user_metadata?.name || 'User',
            skill_level: 'Intermediate',
            avatar_url: authStore.user.user_metadata?.avatar_url || ''
          }
        ])

      if (insertError) throw insertError

      // Load default values
      profile.value = {
        name: authStore.user.user_metadata?.name || 'User',
        email: authStore.user.email || '',
        skillLevel: 'Intermediate',
        location: '',
        bio: '',
        availability: [],
        avatar_url: authStore.user.user_metadata?.avatar_url || '',
        age: null
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold tracking-tight">My Profile</h1>
        <div class="flex gap-3">
          <template v-if="!isEditing">
            <Button variant="outline" @click="startEditing" :disabled="loading">
              <Edit2 class="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" @click="handleLogout">
              <LogOut class="h-4 w-4 mr-2" />
              Logout
            </Button>
          </template>
          <template v-else>
            <Button @click="saveProfile" :disabled="saving">
              <Save class="h-4 w-4 mr-2" />
              {{ saving ? 'Saving...' : 'Save' }}
            </Button>
            <Button variant="outline" @click="cancelEditing" :disabled="saving">
              <X class="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </template>
        </div>
      </div>

      <Card>
        <CardHeader class="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div class="flex items-center gap-4">
            <div class="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
              <img
                v-if="profile.avatar_url"
                :src="profile.avatar_url"
                alt="Profile photo"
                class="w-full h-full object-cover"
              />
              <UserIcon v-else class="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle class="text-2xl">{{ loading ? 'Loading...' : profile.name }}</CardTitle>
              <CardDescription class="text-base mt-1">{{ maskedEmail }}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent class="space-y-6">
          <!-- View Mode -->
          <template v-if="!isEditing">
            <div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Trophy class="h-4 w-4" />
                <span>Skill Level</span>
              </div>
              <p class="font-medium">{{ profile.skillLevel || 'Not set' }}</p>
            </div>

            <div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin class="h-4 w-4" />
                <span>Location</span>
              </div>
              <p class="font-medium">{{ profile.location || 'Not set' }}</p>
            </div>

            <div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Hash class="h-4 w-4" />
                <span>Age</span>
              </div>
              <p class="font-medium">{{ profile.age || 'Not set' }}</p>
            </div>

            <div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <UserIcon class="h-4 w-4" />
                <span>About</span>
              </div>
              <p class="text-muted-foreground">{{ profile.bio || 'No bio yet' }}</p>
            </div>

            <div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar class="h-4 w-4" />
                <span>Availability</span>
              </div>
              <div v-if="profile.availability && profile.availability.length > 0" class="space-y-2">
                <div v-for="slot in profile.availability" :key="slot.day" class="flex items-center gap-2">
                  <span class="font-medium">{{ slot.day }}:</span>
                  <span class="text-muted-foreground">{{ slot.timeSlots.join(', ') || 'Any time' }}</span>
                </div>
              </div>
              <p v-else class="text-muted-foreground">Not set</p>
            </div>
          </template>

          <!-- Edit Mode -->
          <template v-else>
            <div class="space-y-2">
              <Label>Profile Photo</Label>
              <AvatarUpload
                v-if="authStore.user"
                :user-id="authStore.user.id"
                :current-avatar-url="formData.avatar_url"
                @update:avatar-url="(url) => formData.avatar_url = url"
              />
            </div>

            <div class="space-y-2">
              <Label for="skill-level">Skill Level</Label>
              <Select
                id="skill-level"
                v-model="formData.skillLevel"
                :options="skillLevelOptions"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="location">Location</Label>
                <Input
                  id="location"
                  v-model="formData.location"
                  placeholder="San Francisco, CA"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  v-model="formData.age"
                  placeholder="25"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="bio">About</Label>
              <Textarea
                id="bio"
                v-model="formData.bio"
                placeholder="Tell others about your tennis experience..."
                :rows="4"
                :maxlength="500"
              />
            </div>

            <div class="space-y-2">
              <Label>Availability</Label>
              <AvailabilityPicker v-model="formData.availability" />
            </div>
          </template>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
