import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

export interface UserProfile {
    id: string
    name: string
    email: string
    skill_level: string
    location: string
    bio: string
    availability: any[]
    avatar_url: string
    created_at: string
}

export const useMatching = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)

    /**
     * Fetch users for discovery (excluding current user and already swiped)
     */
    const getDiscoverUsers = async (currentUserId: string, limit = 10): Promise<UserProfile[]> => {
        loading.value = true
        error.value = null

        try {
            // Get already swiped user IDs
            const { data: swipedUsers } = await supabase
                .from('swipes')
                .select('target_user_id')
                .eq('user_id', currentUserId)

            const swipedIds = swipedUsers?.map(s => s.target_user_id) || []

            // Fetch users excluding current user and swiped users
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(limit)

            // Only add not.in filter if there are swiped users
            if (swipedIds.length > 0) {
                query = query.not('id', 'in', `(${swipedIds.join(',')})`)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            return data || []
        } catch (e: any) {
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * Record a swipe action (like or pass)
     */
    const swipeUser = async (
        currentUserId: string,
        targetUserId: string,
        action: 'like' | 'pass'
    ): Promise<boolean> => {
        try {
            console.log('🎾 Swiping:', { currentUserId, targetUserId, action })

            const { error: swipeError } = await supabase
                .from('swipes')
                .insert([
                    {
                        user_id: currentUserId,
                        target_user_id: targetUserId,
                        action
                    }
                ])

            if (swipeError) {
                console.error('❌ Swipe error:', swipeError)
                throw swipeError
            }

            console.log('✅ Swipe saved')

            // If like, check for match
            if (action === 'like') {
                console.log('❤️ Checking for match...')
                const isMatch = await checkAndCreateMatch(currentUserId, targetUserId)
                console.log('🎉 Match result:', isMatch)
                return isMatch
            }

            return false
        } catch (e: any) {
            error.value = e.message
            console.error('💥 Error in swipeUser:', e)
            return false
        }
    }

    /**
     * Check if target user also liked current user, and create match if yes
     */
    const checkAndCreateMatch = async (
        currentUserId: string,
        targetUserId: string
    ): Promise<boolean> => {
        try {
            console.log('🔍 Checking reciprocal like:', { from: targetUserId, to: currentUserId })

            // Check if target user liked current user
            const { data: reciprocalLike, error: queryError } = await supabase
                .from('swipes')
                .select('*')
                .eq('user_id', targetUserId)
                .eq('target_user_id', currentUserId)
                .eq('action', 'like')
                .maybeSingle()

            console.log('👀 Reciprocal like result:', { reciprocalLike, queryError })

            if (!reciprocalLike) {
                console.log('❌ No reciprocal like found')
                return false
            }

            console.log('💚 Reciprocal like found! Creating match...')

            // It's a match! Create match record
            const user1 = currentUserId < targetUserId ? currentUserId : targetUserId
            const user2 = currentUserId < targetUserId ? targetUserId : currentUserId

            console.log('📝 Creating match:', { user1, user2 })

            const { error: matchError } = await supabase
                .from('matches')
                .insert([
                    {
                        user1_id: user1,
                        user2_id: user2
                    }
                ])

            if (matchError) {
                console.error('⚠️ Match insert error:', matchError)
                // Match might already exist, that's ok
                if (matchError.code !== '23505') throw matchError
            }

            console.log('🎊 MATCH CREATED!')
            return true // It's a match!
        } catch (e: any) {
            console.error('💥 Error checking match:', e)
            return false
        }
    }

    /**
     * Get all matches for current user with match IDs
     */
    const getMatches = async (currentUserId: string): Promise<any[]> => {
        loading.value = true
        error.value = null

        try {
            // Get all match records
            const { data: matchRecords, error: matchError } = await supabase
                .from('matches')
                .select('*')
                .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
                .order('created_at', { ascending: false })

            if (matchError) throw matchError

            if (!matchRecords || matchRecords.length === 0) return []

            // Get the other user's IDs and match IDs
            const matchData = matchRecords.map(m => ({
                matchId: m.id,
                otherUserId: m.user1_id === currentUserId ? m.user2_id : m.user1_id,
                createdAt: m.created_at
            }))

            const matchedUserIds = matchData.map(m => m.otherUserId)

            // Fetch profiles for matched users
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', matchedUserIds)

            if (profileError) throw profileError

            // Combine match data with profiles
            return matchData.map(match => {
                const profile = profiles?.find(p => p.id === match.otherUserId)
                return {
                    ...profile,
                    matchId: match.matchId,
                    matchCreatedAt: match.createdAt
                }
            })
        } catch (e: any) {
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        getDiscoverUsers,
        swipeUser,
        getMatches
    }
}
