<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  successMessage.value = ''
  
  if (!email.value || !password.value) {
    error.value = t('login.errors.fill_all')
    return
  }

  loading.value = true

  try {
    // Use auth store login
    await authStore.login(email.value, password.value)
    
    // Check if email is verified
    if (authStore.user && !authStore.user.email_confirmed_at) {
      error.value = t('login.errors.verify_email')
      
      // Try to logout, but ignore errors if session is already gone
      try {
        await authStore.logout()
      } catch (logoutError) {
      }
      
      return
    }
    
    router.push('/discover')
  } catch (e: any) {
    error.value = e.message || t('login.errors.invalid_credentials')
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    await authStore.loginWithGoogle()
  } catch (e: any) {
    error.value = e.message || t('login.errors.google_failed')
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2 mb-4">
          <Trophy class="h-8 w-8 text-primary" />
          <h1 class="text-3xl font-bold">TennisMate</h1>
        </div>
        <p class="text-muted-foreground">{{ t('login.welcome') }}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('login.title') }}</CardTitle>
          <CardDescription>{{ t('login.subtitle') }}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Success Message -->
            <div v-if="successMessage" class="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {{ error }}
            </div>

            <div class="space-y-2">
              <Label for="email">{{ t('login.email_label') }}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                v-model="email"
                :disabled="loading"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">{{ t('login.password_label') }}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                v-model="password"
                :disabled="loading"
              />
            </div>

            <Button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white" :disabled="loading">
              {{ loading ? t('login.submitting_button') : t('login.submit_button') }}
            </Button>
          </form>

          <div class="mt-6 space-y-4">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground">
                  {{ t('login.or_divider') }}
                </span>
              </div>
            </div>

            <!-- Google Login -->
            <Button 
              type="button" 
              variant="outline" 
              class="w-full relative" 
              @click="handleGoogleLogin" 
              :disabled="loading"
            >
              <svg class="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              {{ t('login.google_button') }}
            </Button>

            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground">
                  {{ t('login.new_user') }}
                </span>
              </div>
            </div>

            <Button variant="outline" class="w-full" @click="router.push('/register')">
              {{ t('login.create_account') }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
