import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MatchProposal {
    id: string;
    match_id: string;
    sender_id: string;
    receiver_id: string;
    court_name: string | null;
    scheduled_at: string;
    status: 'pending' | 'accepted' | 'declined' | 'cancelled';
    created_at: string;
}

export const useMatchProposal = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createProposal = async (
        matchId: string,
        senderId: string,
        receiverId: string,
        scheduledAt: string,
        courtName?: string
    ) => {
        setLoading(true);
        setError(null);
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
                .single();

            if (err) throw err;
            return data;
        } catch (e: any) {
            console.error('Error creating proposal:', e);
            setError(e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const respondToProposal = async (
        proposalId: string,
        status: 'accepted' | 'declined' | 'cancelled'
    ) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .update({ status })
                .eq('id', proposalId)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e: any) {
            console.error('Error responding to proposal:', e);
            setError(e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getProposals = async (matchId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: false });

            if (err) throw err;
            return data as MatchProposal[];
        } catch (e: any) {
            console.error('Error fetching proposals:', e);
            setError(e.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getActiveProposalsForMatches = async (matchIds: string[]) => {
        if (matchIds.length === 0) return [];

        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('match_proposals')
                .select('*')
                .in('match_id', matchIds)
                .in('status', ['pending', 'accepted'])
                .order('created_at', { ascending: false });

            if (err) throw err;
            return data as MatchProposal[];
        } catch (e: any) {
            console.error('Error fetching active proposals:', e);
            setError(e.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        createProposal,
        respondToProposal,
        getProposals,
        getActiveProposalsForMatches,
    };
};
