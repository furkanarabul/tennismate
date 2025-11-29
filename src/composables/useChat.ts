import { supabase } from '@/lib/supabase'
import { ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Message {
    id: string
    match_id: string
    sender_id: string
    content: string
    read: boolean
    created_at: string
}

export const useChat = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)
    let subscription: RealtimeChannel | null = null

    /**
     * Fetch message history for a match
     */
    const getMessages = async (matchId: string): Promise<Message[]> => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true })

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
     * Send a new message
     */
    const sendMessage = async (
        matchId: string,
        senderId: string,
        content: string
    ): Promise<Message | null> => {
        try {
            const { data, error: sendError } = await supabase
                .from('messages')
                .insert([
                    {
                        match_id: matchId,
                        sender_id: senderId,
                        content: content.trim()
                    }
                ])
                .select()
                .single()

            if (sendError) throw sendError

            return data
        } catch (e: any) {
            error.value = e.message
            console.error('Error sending message:', e)
            return null
        }
    }

    /**
     * Mark a message as read
     */
    const markAsRead = async (messageId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', messageId)

            if (updateError) throw updateError

            return true
        } catch (e: any) {
            console.error('Error marking message as read:', e)
            return false
        }
    }

    /**
     * Subscribe to new messages for a match (Realtime)
     */
    const subscribeToMessages = (
        matchId: string,
        callback: (message: Message) => void
    ) => {
        subscription = supabase
            .channel(`messages:${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`
                },
                (payload) => {
                    callback(payload.new as Message)
                }
            )
            .subscribe()
    }

    /**
     * Unsubscribe from message updates
     */
    const unsubscribe = () => {
        if (subscription) {
            supabase.removeChannel(subscription)
            subscription = null
        }
    }

    /**
     * Get count of unread messages for current user
     */
    const getUnreadCount = async (userId: string): Promise<number> => {
        try {
            // Get all matches for this user
            const { data: matchRecords } = await supabase
                .from('matches')
                .select('id')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

            if (!matchRecords || matchRecords.length === 0) return 0

            const matchIds = matchRecords.map(m => m.id)

            // Count unread messages in these matches (not sent by current user)
            const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('match_id', matchIds)
                .eq('read', false)
                .neq('sender_id', userId)

            if (countError) throw countError

            return count || 0
        } catch (e: any) {
            console.error('Error getting unread count:', e)
            return 0
        }
    }

    return {
        loading,
        error,
        getMessages,
        sendMessage,
        markAsRead,
        subscribeToMessages,
        unsubscribe,
        getUnreadCount
    }
}
