import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface Notification {
    id: string
    user_id: string
    sender_id: string
    type: 'post_like' | 'post_comment' | 'comment_reply'
    resource_id: string
    comment_id?: string
    is_read: boolean
    created_at: string
    sender?: {
        name: string
        avatar_url: string
    }
}

export const useNotificationStore = defineStore('notifications', () => {
    // We'll get auth store inside actions to avoid circular dependency

    // State
    const matchUnreadCounts = ref<Record<string, number>>({}) // Only messages
    const proposalUnreadCounts = ref<Record<string, number>>({}) // Only proposals
    const notifications = ref<Notification[]>([])
    const socialUnreadCount = ref(0)
    const loading = ref(false)
    const initialized = ref(false)

    // Getters
    const totalUnreadCount = computed(() => {
        const messageCount = Object.values(matchUnreadCounts.value).reduce((sum, count) => sum + count, 0)
        const proposalCount = Object.values(proposalUnreadCounts.value).reduce((sum, count) => sum + count, 0)
        return messageCount + proposalCount + socialUnreadCount.value
    })

    // Returns ONLY message unread count
    const getUnreadCount = (matchId: string) => {
        return matchUnreadCounts.value[matchId] || 0
    }

    // Actions
    const fetchUnreadCounts = async () => {
        const authStore = useAuthStore()
        if (!authStore.user) return

        loading.value = true
        try {
            // Get all matches for this user
            const { data: matches, error: matchError } = await supabase
                .from('matches')
                .select('id')
                .or(`user1_id.eq.${authStore.user.id},user2_id.eq.${authStore.user.id}`)

            if (matchError) throw matchError

            // 1. Get unread messages count per match
            if (matches && matches.length > 0) {
                const matchIds = matches.map(m => m.id)
                const { data: unreadMessages, error: msgError } = await supabase
                    .from('messages')
                    .select('match_id')
                    .in('match_id', matchIds)
                    .eq('read', false)
                    .neq('sender_id', authStore.user.id) // Only messages sent BY others

                if (msgError) throw msgError

                // Reset message counts
                const newMessageCounts: Record<string, number> = {}
                matchIds.forEach(id => newMessageCounts[id] = 0)

                // Aggregate message counts
                unreadMessages?.forEach(msg => {
                    newMessageCounts[msg.match_id] = (newMessageCounts[msg.match_id] || 0) + 1
                })
                matchUnreadCounts.value = newMessageCounts

                // 2. Fetch pending proposals where we are the receiver
                const { data: pendingProposals, error: propError } = await supabase
                    .from('match_proposals')
                    .select('match_id')
                    .in('match_id', matchIds)
                    .eq('status', 'pending')
                    .eq('receiver_id', authStore.user.id)

                if (propError) throw propError

                // Reset proposal counts
                const newProposalCounts: Record<string, number> = {}
                matchIds.forEach(id => newProposalCounts[id] = 0)

                // Add proposals to counts
                pendingProposals?.forEach(prop => {
                    newProposalCounts[prop.match_id] = (newProposalCounts[prop.match_id] || 0) + 1
                })
                proposalUnreadCounts.value = newProposalCounts
            }

            // 3. Fetch social notifications unread count
            const { count, error: notifError } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', authStore.user.id)
                .eq('is_read', false)

            if (notifError) throw notifError
            socialUnreadCount.value = count || 0

        } catch (error) {
            console.error('Error fetching unread counts:', error)
        } finally {
            loading.value = false
        }
    }

    const fetchNotifications = async () => {
        const authStore = useAuthStore()
        if (!authStore.user) return

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    sender:sender_id (name, avatar_url)
                `)
                .eq('user_id', authStore.user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error
            notifications.value = data as Notification[]
        } catch (err) {
            console.error('Error fetching notifications:', err)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            // Optimistic update
            const notif = notifications.value.find(n => n.id === notificationId)
            if (notif && !notif.is_read) {
                notif.is_read = true
                socialUnreadCount.value = Math.max(0, socialUnreadCount.value - 1)
            }

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)

            if (error) throw error
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const markAllAsRead = async () => {
        const authStore = useAuthStore()
        if (!authStore.user) return

        try {
            // Optimistic
            notifications.value.forEach(n => n.is_read = true)
            socialUnreadCount.value = 0

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', authStore.user.id)
                .eq('is_read', false)

            if (error) throw error
        } catch (err) {
            console.error('Error marking all as read:', err)
        }
    }

    const subscribeToNotifications = () => {
        const authStore = useAuthStore()
        if (!authStore.user) return

        // Subscribe to new messages
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
                        const currentCount = matchUnreadCounts.value[newMessage.match_id]
                        if (currentCount !== undefined) {
                            matchUnreadCounts.value[newMessage.match_id] = currentCount + 1
                        } else {
                            // New match? or we just haven't loaded it. Refresh all.
                            await fetchUnreadCounts()
                        }
                    }
                }
            )
            .subscribe()

        // Subscribe to match proposals
        supabase
            .channel('global-proposals')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_proposals'
                },
                async (payload) => {
                    const newProposal = payload.new as any
                    if (newProposal.receiver_id === authStore.user?.id || newProposal.sender_id === authStore.user?.id) {
                        await fetchUnreadCounts()
                    }
                }
            )
            .subscribe()

        // Subscribe to social notifications
        supabase
            .channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${authStore.user.id}`
                },
                async (payload) => {
                    const newNotif = payload.new as any
                    socialUnreadCount.value++
                    // Optionally fetch latest to update the list if open
                    await fetchNotifications()
                }
            )
            .subscribe()
    }

    const markMatchAsRead = (matchId: string) => {
        // Optimistically update UI - only clears messages
        if (matchUnreadCounts.value[matchId]) {
            matchUnreadCounts.value[matchId] = 0
        }
    }

    const initialize = async () => {
        if (initialized.value) return
        await fetchUnreadCounts()
        await fetchNotifications()
        subscribeToNotifications()
        initialized.value = true
    }

    const reset = () => {
        matchUnreadCounts.value = {}
        proposalUnreadCounts.value = {}
        notifications.value = []
        socialUnreadCount.value = 0
        initialized.value = false
        loading.value = false
    }

    return {
        matchUnreadCounts,
        proposalUnreadCounts,
        notifications,
        socialUnreadCount,
        totalUnreadCount,
        loading,
        getUnreadCount,
        fetchUnreadCounts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        markMatchAsRead,
        initialize,
        reset
    }
})
