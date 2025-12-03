import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useMatching } from '../../hooks/useMatching';
import { useMatchProposal, MatchProposal } from '../../hooks/useMatchProposal';
import { useNotifications } from '../../context/NotificationContext';
import { MatchCard } from '../../components/MatchCard';
import { Users, Heart } from 'lucide-react-native';

import { MatchProposalModal } from '../../components/MatchProposalModal';
import { MatchProposalDetailsModal } from '../../components/MatchProposalDetailsModal';

export default function Dashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { getMatches } = useMatching();
    const { getActiveProposalsForMatches } = useMatchProposal();
    const { getUnreadMessageCount, getUnreadProposalCount } = useNotifications();

    const [modalVisible, setModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [selectedProposal, setSelectedProposal] = useState<MatchProposal | null>(null);
    const [proposalLoading, setProposalLoading] = useState(false);

    const [matches, setMatches] = useState<any[]>([]);
    const [activeProposals, setActiveProposals] = useState<Record<string, MatchProposal>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { createProposal, respondToProposal } = useMatchProposal();

    const loadData = async () => {
        if (!user) return;

        try {
            const matchesData = await getMatches(user.id);
            setMatches(matchesData);

            if (matchesData.length > 0) {
                const matchIds = matchesData.map((m: any) => m.matchId);
                const proposals = await getActiveProposalsForMatches(matchIds);

                const proposalsMap: Record<string, MatchProposal> = {};
                proposals.forEach((p) => {
                    const current = proposalsMap[p.match_id];
                    // Prefer accepted proposals over pending ones
                    if (!current || (current.status === 'pending' && p.status === 'accepted')) {
                        proposalsMap[p.match_id] = p;
                    }
                });
                setActiveProposals(proposalsMap);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handlePressProposal = (match: any) => {
        const proposal = activeProposals[match.matchId];
        if (proposal) {
            setSelectedProposal(proposal);
            setDetailsModalVisible(true);
        } else {
            setSelectedMatch(match);
            setModalVisible(true);
        }
    };

    const handleCreateProposal = async (data: { date: Date; time: Date; court: string }) => {
        if (!user || !selectedMatch) return;

        setProposalLoading(true);
        try {
            // Combine date and time
            const scheduledAt = new Date(data.date);
            scheduledAt.setHours(data.time.getHours());
            scheduledAt.setMinutes(data.time.getMinutes());

            await createProposal(
                selectedMatch.matchId,
                user.id,
                selectedMatch.id,
                scheduledAt.toISOString(),
                data.court
            );

            setModalVisible(false);
            loadData(); // Refresh to show new status
        } catch (error) {
            console.error('Error creating proposal:', error);
        } finally {
            setProposalLoading(false);
        }
    };

    const handleProposalAction = async (id: string, action: 'accepted' | 'declined' | 'cancelled') => {
        setProposalLoading(true);
        try {
            await respondToProposal(id, action);
            setDetailsModalVisible(false);
            loadData();
        } catch (error) {
            console.error('Error updating proposal:', error);
        } finally {
            setProposalLoading(false);
        }
    };

    const handlePressMessage = (match: any) => {
        router.push(`/chat/${match.matchId}`);
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background px-4">
            <View className="py-4 mb-2">
                <Text className="text-3xl font-bold text-primary">Matches</Text>
                <Text className="text-muted-foreground">Your tennis connections</Text>
            </View>

            {matches.length > 0 ? (
                <FlatList
                    data={matches}
                    keyExtractor={(item) => item.matchId}
                    renderItem={({ item }) => (
                        <MatchCard
                            match={item}
                            proposal={activeProposals[item.matchId]}
                            messageUnreadCount={getUnreadMessageCount(item.matchId)}
                            proposalUnreadCount={getUnreadProposalCount(item.matchId)}
                            onPressProposal={() => handlePressProposal(item)}
                            onPressMessage={() => handlePressMessage(item)}
                        />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View className="flex-1 items-center justify-center pb-20">
                    <View className="bg-primary/10 p-6 rounded-full mb-6">
                        <Users size={48} color="#16a34a" />
                    </View>
                    <Text className="text-2xl font-bold text-foreground mb-2">No matches yet</Text>
                    <Text className="text-muted-foreground text-center mb-8 px-8">
                        Start swiping to find your perfect tennis partner!
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/discover')}
                        className="bg-primary px-8 py-4 rounded-full flex-row items-center gap-2 shadow-lg"
                    >
                        <Heart size={20} color="white" />
                        <Text className="text-white font-bold text-lg">Start Matching</Text>
                    </TouchableOpacity>
                </View>
            )}

            <MatchProposalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleCreateProposal}
                loading={proposalLoading}
            />

            <MatchProposalDetailsModal
                visible={detailsModalVisible}
                proposal={selectedProposal}
                isSender={selectedProposal?.sender_id === user?.id}
                onClose={() => setDetailsModalVisible(false)}
                onAccept={(id) => handleProposalAction(id, 'accepted')}
                onDecline={(id) => handleProposalAction(id, 'declined')}
                onCancel={(id) => handleProposalAction(id, 'cancelled')}
                loading={proposalLoading}
            />
        </SafeAreaView>
    );
}
