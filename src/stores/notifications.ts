import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notifications', () => {
    const authStore = useAuthStore()

    // State
    const matchUnreadCounts = ref<Record<string, number>>({}) // Only messages
    const proposalUnreadCounts = ref<Record<string, number>>({}) // Only proposals
    const loading = ref(false)
    const initialized = ref(false)

    // Getters
    const totalUnreadCount = computed(() => {
        const messageCount = Object.values(matchUnreadCounts.value).reduce((sum, count) => sum + count, 0)
        const proposalCount = Object.values(proposalUnreadCounts.value).reduce((sum, count) => sum + count, 0)
        return messageCount + proposalCount
    })

    // Returns ONLY message unread count
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

            // 1. Get unread messages count per match
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

        } catch (error) {
            console.error('Error fetching unread counts:', error)
        } finally {
            loading.value = false
        }
    }

    const subscribeToNotifications = () => {
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

                    // We just refresh everything on proposal changes to be safe and simple
                    // since status changes (pending -> accepted) affect counts too.
                    if (newProposal.receiver_id === authStore.user?.id || newProposal.sender_id === authStore.user?.id) {
                        await fetchUnreadCounts()
                    }
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
        subscribeToNotifications()
        initialized.value = true
    }

    const reset = () => {
        matchUnreadCounts.value = {}
        proposalUnreadCounts.value = {}
        initialized.value = false
        loading.value = false
    }

    return {
        matchUnreadCounts,
        proposalUnreadCounts,
        totalUnreadCount,
        loading,
        getUnreadCount,
        fetchUnreadCounts,
        markMatchAsRead,
        initialize,
        reset
    }
})
