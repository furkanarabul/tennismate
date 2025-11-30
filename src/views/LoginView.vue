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

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  successMessage.value = ''
  
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true

  try {
    // Use auth store login
    await authStore.login(email.value, password.value)
    
    // Check if email is verified
    if (authStore.user && !authStore.user.email_confirmed_at) {
      error.value = 'Please verify your email before logging in. Check your inbox for the verification link.'
      
      // Try to logout, but ignore errors if session is already gone
      try {
        await authStore.logout()
      } catch (logoutError) {
        console.log('Session already cleared')
      }
      
      return
    }
    
    router.push('/discover')
  } catch (e: any) {
    error.value = e.message || 'Invalid email or password'
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
    error.value = e.message || 'Failed to sign in with Google'
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
        <p class="text-muted-foreground">Welcome back! Sign in to continue</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
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
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                v-model="email"
                :disabled="loading"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                v-model="password"
                :disabled="loading"
              />
            </div>

            <Button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white" :disabled="loading">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </Button>
          </form>

          <div class="mt-6 space-y-4">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground">
                  or
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
              Continue with Google
            </Button>

            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground">
                  New to TennisMate?
                </span>
              </div>
            </div>

            <Button variant="outline" class="w-full" @click="router.push('/register')">
              Create an Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
