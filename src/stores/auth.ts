import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const loading = ref(true)

    const isAuthenticated = computed(() => !!user.value)

    // Initialize auth state
    const initialize = async () => {
        loading.value = true
        try {
            const { data: { session } } = await supabase.auth.getSession()
            user.value = session?.user ?? null

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                user.value = session?.user ?? null
            })
        } catch (error) {
            console.error('Auth initialization error:', error)
        } finally {
            loading.value = false
        }
    }

    // Login
    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error

        user.value = data.user
        return data.user
    }

    // Login with Google
    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/discover`
            }
        })

        if (error) throw error
        return data
    }

    // Register
    const register = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        })

        if (error) throw error

        // Create profile in profiles table
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        email: data.user.email,
                        name: name,
                        skill_level: 'Intermediate',
                        created_at: new Date().toISOString()
                    }
                ])

            if (profileError) {
                console.error('Profile creation error:', profileError)
            }

            user.value = data.user
        }

        return data.user
    }

    // Logout
    const logout = async () => {
        try {
            // Use 'local' scope instead of 'global' to avoid session issues
            const { error } = await supabase.auth.signOut({ scope: 'local' })
            if (error) console.error('Logout API error:', error)
        } catch (error) {
            console.error('Logout exception:', error)
        } finally {
            // Always clear user state, even if API call fails
            user.value = null
        }
    }

    // Set user (helper for auth callbacks)
    const setUser = (newUser: User | null) => {
        user.value = newUser
    }

    return {
        user,
        loading,
        isAuthenticated,
        initialize,
        login,
        loginWithGoogle,
        register,
        logout,
        setUser
    }
})
