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

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  successMessage.value = ''
  
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    // Check if email confirmation is required by signing up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          name: name.value
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    })

    if (signUpError) throw signUpError

    // Check if email confirmation is required (no session returned)
    if (data.user && !data.session) {
      // Email confirmation required
      successMessage.value = '✅ Registration successful! Please check your email to verify your account before logging in.'
      
      // Clear form
      name.value = ''
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      // Email confirmation not required - use regular flow
      await authStore.register(email.value, password.value, name.value)
      router.push('/profile')
    }
  } catch (e: any) {
    console.error('Registration error:', e)
    error.value = e.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2 mb-4">
          <Trophy class="h-8 w-8 text-primary" />
          <h1 class="text-3xl font-bold">TennisMate</h1>
        </div>
        <p class="text-muted-foreground">Create your account and find tennis partners</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up to start matching with tennis players</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- Success Message -->
            <div v-if="successMessage" class="p-4 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {{ error }}
            </div>

            <div class="space-y-2">
              <Label for="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                v-model="name"
                :disabled="loading || !!successMessage"
              />
            </div>

            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                v-model="email"
                :disabled="loading || !!successMessage"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                v-model="password"
                :disabled="loading || !!successMessage"
              />
              <p class="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>

            <div class="space-y-2">
              <Label for="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                v-model="confirmPassword"
                :disabled="loading || !!successMessage"
              />
            </div>

            <Button type="submit" class="w-full" :disabled="loading || !!successMessage">
              {{ loading ? 'Creating account...' : successMessage ? 'Redirecting...' : 'Create Account' }}
            </Button>
          </form>

          <div class="mt-6 space-y-4">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <Button variant="outline" class="w-full" @click="router.push('/login')">
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>

      <p class="text-xs text-center text-muted-foreground mt-6">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  </div>
</template>
