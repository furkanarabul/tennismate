import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Calendar, Clock, MapPin, Check, X, Ban } from 'lucide-react-native';
import { MatchProposal } from '../hooks/useMatchProposal';

interface MatchProposalBannerProps {
    proposal: MatchProposal;
    isSender: boolean;
    loading?: boolean;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onCancel: (id: string) => void;
}

export const MatchProposalBanner = ({
    proposal,
    isSender,
    loading = false,
    onAccept,
    onDecline,
    onCancel
}: MatchProposalBannerProps) => {

    const date = new Date(proposal.scheduled_at);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleCancel = () => {
        Alert.alert(
            proposal.status === 'accepted' ? "Cancel Match" : "Cancel Proposal",
            "Are you sure you want to cancel?",
            [
                {
                    text: "No",
                    style: "cancel"
                },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => onCancel(proposal.id)
                }
            ]
        );
    };

    if (proposal.status === 'accepted') {
        return (
            <View className="bg-green-500/10 border-b border-green-500/20 p-4">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-green-600 font-bold text-lg">Match Scheduled! 🎾</Text>
                    {/* Only show cancel if future? For now always allow cancel */}
                    <TouchableOpacity
                        onPress={handleCancel}
                        disabled={loading}
                        className="bg-white/50 p-1.5 rounded-full"
                    >
                        <X size={16} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row gap-4 mb-1">
                    <View className="flex-row items-center gap-1">
                        <Calendar size={14} color="#16a34a" />
                        <Text className="text-green-700 font-medium">{dateStr}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Clock size={14} color="#16a34a" />
                        <Text className="text-green-700 font-medium">{timeStr}</Text>
                    </View>
                </View>
                {proposal.court_name && (
                    <View className="flex-row items-center gap-1">
                        <MapPin size={14} color="#16a34a" />
                        <Text className="text-green-700">{proposal.court_name}</Text>
                    </View>
                )}
            </View>
        );
    }

    if (proposal.status === 'pending') {
        return (
            <View className="bg-amber-500/10 border-b border-amber-500/20 p-4">
                <Text className="text-amber-600 font-bold text-lg mb-2">
                    {isSender ? 'Proposal Sent' : 'Match Proposal Received'}
                </Text>

                <View className="flex-row gap-4 mb-3">
                    <View className="flex-row items-center gap-1">
                        <Calendar size={14} color="#d97706" />
                        <Text className="text-amber-700 font-medium">{dateStr}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Clock size={14} color="#d97706" />
                        <Text className="text-amber-700 font-medium">{timeStr}</Text>
                    </View>
                </View>
                {proposal.court_name && (
                    <View className="flex-row items-center gap-1 mb-3">
                        <MapPin size={14} color="#d97706" />
                        <Text className="text-amber-700">{proposal.court_name}</Text>
                    </View>
                )}

                {isSender ? (
                    <TouchableOpacity
                        onPress={handleCancel}
                        disabled={loading}
                        className="bg-white/50 self-start px-4 py-2 rounded-full border border-amber-200"
                    >
                        <Text className="text-amber-700 font-bold text-xs">Cancel Proposal</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => onAccept(proposal.id)}
                            disabled={loading}
                            className="flex-1 bg-green-600 py-2 rounded-lg items-center flex-row justify-center gap-2"
                        >
                            <Check size={16} color="white" />
                            <Text className="text-white font-bold">Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onDecline(proposal.id)}
                            disabled={loading}
                            className="flex-1 bg-red-500 py-2 rounded-lg items-center flex-row justify-center gap-2"
                        >
                            <X size={16} color="white" />
                            <Text className="text-white font-bold">Decline</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    return null;
};
