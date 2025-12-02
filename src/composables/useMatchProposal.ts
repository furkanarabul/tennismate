import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface MatchProposal {
    id: string
    match_id: string
    sender_id: string
    receiver_id: string
    court_name: string | null
    scheduled_at: string
    status: 'pending' | 'accepted' | 'declined' | 'cancelled'
    created_at: string
}

export const useMatchProposal = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)

    const createProposal = async (
        matchId: string,
        senderId: string,
        receiverId: string,
        scheduledAt: string,
        courtName?: string
    ) => {
        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .insert({
                    match_id: matchId,
                    sender_id: senderId,
                    receiver_id: receiverId,
                    scheduled_at: scheduledAt,
                    court_name: courtName,
                    status: 'pending'
                })
                .select()
                .single()

            if (err) throw err
            return data
        } catch (e: any) {
            console.error('Error creating proposal:', e)
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    const respondToProposal = async (
        proposalId: string,
        status: 'accepted' | 'declined' | 'cancelled'
    ) => {
        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .update({ status })
                .eq('id', proposalId)
                .select()
                .single()

            if (err) throw err
            return data
        } catch (e: any) {
            console.error('Error responding to proposal:', e)
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    const getProposals = async (matchId: string) => {
        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: false })

            if (err) throw err
            return data as MatchProposal[]
        } catch (e: any) {
            console.error('Error fetching proposals:', e)
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    const subscribeToProposals = (matchId: string, callback: (payload: any) => void) => {
        return supabase
            .channel(`proposals:${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_proposals',
                    filter: `match_id=eq.${matchId}`
                },
                (payload) => {
                    callback(payload)
                }
            )
            .subscribe()
    }

    const getActiveProposalsForMatches = async (matchIds: string[]) => {
        if (matchIds.length === 0) return []

        loading.value = true
        error.value = null
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .select('*')
                .in('match_id', matchIds)
                .in('status', ['pending', 'accepted'])
                .order('created_at', { ascending: false })

            if (err) throw err
            return data as MatchProposal[]
        } catch (e: any) {
            console.error('Error fetching active proposals:', e)
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        createProposal,
        respondToProposal,
        getProposals,
        getActiveProposalsForMatches,
        subscribeToProposals
    }
}
