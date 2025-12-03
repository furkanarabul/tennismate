import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type NotificationContextType = {
    matchUnreadCounts: Record<string, number>; // Total (backward compatibility)
    messageUnreadCounts: Record<string, number>;
    proposalUnreadCounts: Record<string, number>;
    totalUnreadCount: number;
    loading: boolean;
    getUnreadCount: (matchId: string) => number; // Total
    getUnreadMessageCount: (matchId: string) => number;
    getUnreadProposalCount: (matchId: string) => number;
    fetchUnreadCounts: () => Promise<void>;
    markMatchAsRead: (matchId: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({
    matchUnreadCounts: {},
    messageUnreadCounts: {},
    proposalUnreadCounts: {},
    totalUnreadCount: 0,
    loading: false,
    getUnreadCount: () => 0,
    getUnreadMessageCount: () => 0,
    getUnreadProposalCount: () => 0,
    fetchUnreadCounts: async () => { },
    markMatchAsRead: () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [matchUnreadCounts, setMatchUnreadCounts] = useState<Record<string, number>>({});
    const [messageUnreadCounts, setMessageUnreadCounts] = useState<Record<string, number>>({});
    const [proposalUnreadCounts, setProposalUnreadCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const totalUnreadCount = Object.values(matchUnreadCounts).reduce((sum, count) => sum + count, 0);

    const getUnreadCount = (matchId: string) => {
        return matchUnreadCounts[matchId] || 0;
    };

    const getUnreadMessageCount = (matchId: string) => {
        return messageUnreadCounts[matchId] || 0;
    };

    const getUnreadProposalCount = (matchId: string) => {
        return proposalUnreadCounts[matchId] || 0;
    };

    const fetchUnreadCounts = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Get all matches for this user
            const { data: matches, error: matchError } = await supabase
                .from('matches')
                .select('id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

            if (matchError) throw matchError;
            if (!matches || matches.length === 0) return;

            const matchIds = matches.map(m => m.id);

            // Get unread messages count per match
            const { data: unreadMessages, error: msgError } = await supabase
                .from('messages')
                .select('match_id')
                .in('match_id', matchIds)
                .eq('read', false)
                .neq('sender_id', user.id);

            if (msgError) throw msgError;

            // Reset counts
            const newTotalCounts: Record<string, number> = {};
            const newMessageCounts: Record<string, number> = {};
            const newProposalCounts: Record<string, number> = {};

            matchIds.forEach(id => {
                newTotalCounts[id] = 0;
                newMessageCounts[id] = 0;
                newProposalCounts[id] = 0;
            });

            // Aggregate message counts
            unreadMessages?.forEach((msg: any) => {
                newMessageCounts[msg.match_id] = (newMessageCounts[msg.match_id] || 0) + 1;
                newTotalCounts[msg.match_id] = (newTotalCounts[msg.match_id] || 0) + 1;
            });

            // Also fetch pending proposals where we are the receiver
            const { data: pendingProposals, error: propError } = await supabase
                .from('match_proposals')
                .select('match_id')
                .in('match_id', matchIds)
                .eq('status', 'pending')
                .eq('receiver_id', user.id);

            if (propError) throw propError;

            // Add proposals to counts
            pendingProposals?.forEach((prop: any) => {
                newProposalCounts[prop.match_id] = (newProposalCounts[prop.match_id] || 0) + 1;
                newTotalCounts[prop.match_id] = (newTotalCounts[prop.match_id] || 0) + 1;
            });

            setMatchUnreadCounts(newTotalCounts);
            setMessageUnreadCounts(newMessageCounts);
            setProposalUnreadCounts(newProposalCounts);

        } catch (error) {
            console.error('Error fetching unread counts:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToNotifications = () => {
        if (!user) return;

        const channel = supabase
            .channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    const newMessage = payload.new as any;
                    if (newMessage.sender_id !== user.id) {
                        // Update message count
                        setMessageUnreadCounts(prev => {
                            const current = prev[newMessage.match_id] || 0;
                            return { ...prev, [newMessage.match_id]: current + 1 };
                        });
                        // Update total count
                        setMatchUnreadCounts(prev => {
                            const current = prev[newMessage.match_id] || 0;
                            return { ...prev, [newMessage.match_id]: current + 1 };
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_proposals'
                },
                async (payload) => {
                    const newProposal = payload.new as any;

                    // Case 1: New proposal received
                    if (payload.eventType === 'INSERT' && newProposal.receiver_id === user.id && newProposal.status === 'pending') {
                        // Update proposal count
                        setProposalUnreadCounts(prev => {
                            const current = prev[newProposal.match_id] || 0;
                            return { ...prev, [newProposal.match_id]: current + 1 };
                        });
                        // Update total count
                        setMatchUnreadCounts(prev => {
                            const current = prev[newProposal.match_id] || 0;
                            return { ...prev, [newProposal.match_id]: current + 1 };
                        });
                    }

                    // Case 2: Proposal status changed
                    if (payload.eventType === 'UPDATE' && newProposal.receiver_id === user.id) {
                        fetchUnreadCounts();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const markMatchAsRead = (matchId: string) => {
        // Only clear message counts, proposals remain until acted upon? 
        // Or maybe clear total? Usually "mark as read" implies messages.
        // For now, let's clear message count and update total.

        const messageCount = messageUnreadCounts[matchId] || 0;

        setMessageUnreadCounts(prev => ({ ...prev, [matchId]: 0 }));
        setMatchUnreadCounts(prev => ({ ...prev, [matchId]: (prev[matchId] || 0) - messageCount }));
    };

    useEffect(() => {
        if (user) {
            fetchUnreadCounts();
            const unsubscribe = subscribeToNotifications();
            return () => {
                if (unsubscribe) unsubscribe();
            };
        } else {
            setMatchUnreadCounts({});
            setMessageUnreadCounts({});
            setProposalUnreadCounts({});
        }
    }, [user]);

    return (
        <NotificationContext.Provider value={{
            matchUnreadCounts,
            messageUnreadCounts,
            proposalUnreadCounts,
            totalUnreadCount,
            loading,
            getUnreadCount,
            getUnreadMessageCount,
            getUnreadProposalCount,
            fetchUnreadCounts,
            markMatchAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
