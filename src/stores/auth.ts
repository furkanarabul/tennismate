import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<any>(null)
    const loading = ref(true)

    const isAuthenticated = computed(() => !!user.value)

    const isProfileComplete = computed(() => {
        if (!profile.value) return false
        return !!(
            profile.value.name &&
            profile.value.gender &&
            profile.value.skill_level &&
            profile.value.location
        )
    })

    // Initialize auth state
    const initialize = async () => {
        loading.value = true
        try {
            const { data: { session } } = await supabase.auth.getSession()
            user.value = session?.user ?? null

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                user.value = session?.user ?? null
                if (user.value) {
                    await fetchProfile()
                } else {
                    profile.value = null
                }
            })

            if (user.value) {
                await fetchProfile()
            }
        } catch (error) {
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
        if (data.user) await fetchProfile()
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
                        skill_level: null, // Force user to select
                        created_at: new Date().toISOString()
                    }
                ])

            if (profileError) {
            }

            user.value = data.user
            await fetchProfile()
        }

        return data.user
    }

    // Logout
    const logout = async () => {
        try {
            // Use 'local' scope instead of 'global' to avoid session issues
            const { error } = await supabase.auth.signOut({ scope: 'local' })
            if (error) { }
        } catch (error) {
        } finally {
            // Always clear user state, even if API call fails
            user.value = null
            profile.value = null
        }
    }

    // Set user (helper for auth callbacks)
    const setUser = (newUser: User | null) => {
        user.value = newUser
    }

    const fetchProfile = async () => {
        if (!user.value) return

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.value.id)
                .single()

            if (error) throw error
            profile.value = data
        } catch (error) {
        }
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
        setUser,
        profile,
        fetchProfile,
        isProfileComplete
    }
})
