import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notifications', () => {
    const authStore = useAuthStore()

    // State
    const matchUnreadCounts = ref<Record<string, number>>({})
    const loading = ref(false)
    const initialized = ref(false)

    // Getters
    const totalUnreadCount = computed(() => {
        return Object.values(matchUnreadCounts.value).reduce((sum, count) => sum + count, 0)
    })

    const getUnreadCount = (matchId: string) => {
        return matchUnreadCounts.value[matchId] || 0
    }

    // Actions
    const fetchUnreadCounts = async () => {
        if (!authStore.user) return

        loading.value = true
        try {
            // Get all matches for this user
            const { data: matches, error: matchError } = await supabase
                .from('matches')
                .select('id')
                .or(`user1_id.eq.${authStore.user.id},user2_id.eq.${authStore.user.id}`)

            if (matchError) throw matchError
            if (!matches || matches.length === 0) return

            const matchIds = matches.map(m => m.id)

            // Get unread messages count per match
            // We can't easily group by in Supabase JS client for counts without a view or RPC
            // So we'll fetch unread messages and count them client side for now (or use separate queries)
            // For scalability, an RPC function `get_unread_counts(user_id)` would be better, 
            // but for now let's fetch unread messages where receiver is current user

            const { data: unreadMessages, error: msgError } = await supabase
                .from('messages')
                .select('match_id')
                .in('match_id', matchIds)
                .eq('read', false)
                .neq('sender_id', authStore.user.id) // Only messages sent BY others

            if (msgError) throw msgError

            // Reset counts
            const newCounts: Record<string, number> = {}
            matchIds.forEach(id => newCounts[id] = 0)

            // Aggregate counts
            unreadMessages?.forEach(msg => {
                newCounts[msg.match_id] = (newCounts[msg.match_id] || 0) + 1
            })

            matchUnreadCounts.value = newCounts

        } catch (error) {
            console.error('Error fetching unread counts:', error)
        } finally {
            loading.value = false
        }
    }

    const subscribeToNotifications = () => {
        if (!authStore.user) return

        // Subscribe to new messages in any match this user is part of
        // Ideally we subscribe to user's specific channel, but for now let's listen to 'messages' table
        // and filter. A better approach for RLS is listening to specific match channels, 
        // but that requires multiple subscriptions.
        // Alternatively, we can listen to INSERT on messages where we are the receiver? 
        // Realtime doesn't support complex filters on columns that aren't in the payload easily for RLS.
        // Let's rely on a global listener for the table, but we need to be careful about volume.
        // Actually, for a simple app, we can subscribe to `messages` with a filter if possible, 
        // or just refresh counts on any message insert if we can't filter by receiver.

        // Better approach: Subscribe to a channel for the user's ID if we had a 'notifications' table.
        // Since we don't, let's subscribe to changes on 'messages' table.
        // Note: Supabase Realtime broadcasts all changes to subscribers who have permission.

        supabase
            .channel('global-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    const newMessage = payload.new as any
                    // Check if this message belongs to one of our matches and wasn't sent by us
                    if (newMessage.sender_id !== authStore.user?.id) {
                        // We need to know if we are part of this match. 
                        // We can check if the matchId exists in our known matches (from fetchUnreadCounts)
                        // or just optimistically fetch counts again.
                        // Let's just increment if we track this match
                        if (matchUnreadCounts.value[newMessage.match_id] !== undefined) {
                            matchUnreadCounts.value[newMessage.match_id]++
                        } else {
                            // New match? or we just haven't loaded it. Refresh all.
                            await fetchUnreadCounts()
                        }
                    }
                }
            )
            .subscribe()
    }

    const markMatchAsRead = (matchId: string) => {
        // Optimistically update UI
        if (matchUnreadCounts.value[matchId]) {
            matchUnreadCounts.value[matchId] = 0
        }

        // The actual DB update happens in useChat.markAsRead or similar, 
        // but we can also trigger it here if we want this store to be self-contained.
        // For now, we assume the view calls the API to mark read, and we just update local state.
    }

    const initialize = async () => {
        if (initialized.value) return
        await fetchUnreadCounts()
        subscribeToNotifications()
        initialized.value = true
    }

    const reset = () => {
        matchUnreadCounts.value = {}
        initialized.value = false
        loading.value = false
    }

    return {
        matchUnreadCounts,
        totalUnreadCount,
        loading,
        getUnreadCount,
        fetchUnreadCounts,
        markMatchAsRead,
        initialize,
        reset
    }
})
