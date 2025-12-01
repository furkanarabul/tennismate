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

import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()
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

const skillLevelOptions = computed(() => [
  { value: 'Beginner', label: t('profile.skill_levels.beginner') },
  { value: 'Intermediate', label: t('profile.skill_levels.intermediate') },
  { value: 'Advanced', label: t('profile.skill_levels.advanced') },
  { value: 'Pro', label: t('profile.skill_levels.pro') }
])

const getSkillLevelLabel = (level: string) => {
  if (!level) return ''
  const key = level.toLowerCase()
  return t(`profile.skill_levels.${key}`) || level
}

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
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">{{ t('profile.title') }}</h1>
          <p class="text-muted-foreground">{{ t('profile.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <template v-if="!isEditing">
            <Button @click="startEditing" variant="outline" class="gap-2">
              <Edit2 class="h-4 w-4" />
              {{ t('profile.actions.edit') }}
            </Button>
            <Button variant="destructive" @click="handleLogout" class="gap-2">
              <LogOut class="h-4 w-4" />
              {{ t('profile.actions.logout') }}
            </Button>
          </template>
          <template v-else>
            <Button variant="outline" @click="cancelEditing" :disabled="saving">
              {{ t('profile.actions.cancel') }}
            </Button>
            <Button @click="saveProfile" :disabled="saving" class="gap-2">
              <Save class="h-4 w-4" />
              {{ saving ? 'Saving...' : t('profile.actions.save') }}
            </Button>
          </template>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-[300px_1fr]">
        <!-- Sidebar / Basic Info -->
        <Card class="h-fit">
          <CardHeader>
            <CardTitle>{{ t('profile.sections.basic_info') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Avatar -->
            <div class="flex flex-col items-center">
              <AvatarUpload
                v-if="authStore.user"
                :user-id="authStore.user.id"
                :current-avatar-url="isEditing ? formData.avatar_url : profile.avatar_url"
                @update:avatar-url="(url) => { if(isEditing) formData.avatar_url = url }"
                :editable="isEditing"
              />
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <Label>{{ t('profile.labels.name') }}</Label>
                <Input 
                  v-if="isEditing" 
                  v-model="profile.name" 
                  disabled 
                  class="bg-muted"
                />
                <div v-else class="font-medium">{{ profile.name }}</div>
              </div>

              <div class="space-y-2">
                <Label>{{ t('profile.labels.email') }}</Label>
                <div class="text-sm text-muted-foreground break-all">
                  {{ maskedEmail }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Main Content -->
        <div class="space-y-6">
          <!-- Tennis Profile -->
          <Card>
            <CardHeader>
              <CardTitle>{{ t('profile.sections.tennis_profile') }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>{{ t('profile.labels.skill_level') }}</Label>
                  <Select v-if="isEditing" v-model="formData.skillLevel" :options="skillLevelOptions" />
                  <div v-else class="flex items-center gap-2">
                    <Trophy class="h-4 w-4 text-primary" />
                    <span>{{ getSkillLevelLabel(profile.skillLevel) }}</span>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label>{{ t('profile.labels.age') }}</Label>
                  <Input 
                    v-if="isEditing" 
                    v-model.number="formData.age" 
                    type="number" 
                    :placeholder="t('profile.placeholders.age')"
                  />
                  <div v-else class="flex items-center gap-2">
                    <UserIcon class="h-4 w-4 text-muted-foreground" />
                    <span>{{ profile.age || '-' }}</span>
                  </div>
                </div>

                <div class="space-y-2 md:col-span-2">
                  <Label>{{ t('profile.labels.location') }}</Label>
                  <div v-if="isEditing" class="relative">
                    <MapPin class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      v-model="formData.location" 
                      class="pl-9" 
                      :placeholder="t('profile.placeholders.location')"
                    />
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <MapPin class="h-4 w-4 text-muted-foreground" />
                    <span>{{ profile.location || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label>{{ t('profile.labels.bio') }}</Label>
                <Textarea 
                  v-if="isEditing" 
                  v-model="formData.bio" 
                  :placeholder="t('profile.placeholders.bio')"
                  :rows="4"
                />
                <p v-else class="text-sm text-muted-foreground whitespace-pre-wrap">
                  {{ profile.bio || 'No bio yet.' }}
                </p>
              </div>
            </CardContent>
          </Card>

          <!-- Availability -->
          <Card>
            <CardHeader>
              <CardTitle>{{ t('profile.sections.availability') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityPicker 
                :model-value="isEditing ? formData.availability : profile.availability"
                @update:model-value="(val) => { if(isEditing) formData.availability = val }"
                :readonly="!isEditing"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
