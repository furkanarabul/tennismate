import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
    id: string;
    match_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

export const useChat = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const subscriptionRef = useRef<RealtimeChannel | null>(null);

    const getMessages = async (matchId: string): Promise<Message[]> => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            return data || [];
        } catch (e: any) {
            setError(e.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

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
                .single();

            if (sendError) throw sendError;

            return data;
        } catch (e: any) {
            setError(e.message);
            console.error('Error sending message:', e);
            return null;
        }
    };

    const markAsRead = async (messageId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', messageId);

            if (updateError) throw updateError;

            return true;
        } catch (e: any) {
            console.error('Error marking message as read:', e);
            return false;
        }
    };

    const subscribeToMessages = (
        matchId: string,
        callback: (message: Message) => void
    ) => {
        if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
        }

        subscriptionRef.current = supabase
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
                    callback(payload.new as Message);
                }
            )
            .subscribe();
    };

    const unsubscribe = () => {
        if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
            subscriptionRef.current = null;
        }
    };

    const markMatchMessagesAsRead = async (matchId: string, currentUserId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('match_id', matchId)
                .eq('read', false)
                .neq('sender_id', currentUserId);

            if (updateError) throw updateError;

            return true;
        } catch (e: any) {
            console.error('Error marking match messages as read:', e);
            return false;
        }
    };

    return {
        loading,
        error,
        getMessages,
        sendMessage,
        markAsRead,
        markMatchMessagesAsRead,
        subscribeToMessages,
        unsubscribe
    };
};
