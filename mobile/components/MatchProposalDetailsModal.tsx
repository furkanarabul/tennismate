import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { X, Calendar, Clock, MapPin, Check, Ban } from 'lucide-react-native';
import { MatchProposal } from '../hooks/useMatchProposal';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface MatchProposalDetailsModalProps {
    visible: boolean;
    proposal: MatchProposal | null;
    isSender: boolean;
    onClose: () => void;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onCancel: (id: string) => void;
    loading?: boolean;
}

export const MatchProposalDetailsModal = ({
    visible,
    proposal,
    isSender,
    onClose,
    onAccept,
    onDecline,
    onCancel,
    loading = false
}: MatchProposalDetailsModalProps) => {
    if (!proposal) return null;

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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <Animated.View
                    entering={SlideInDown.duration(300)}
                    className="bg-background w-full rounded-t-3xl p-6 pb-10 shadow-xl"
                >
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold text-foreground">
                            {proposal.status === 'accepted' ? 'Match Scheduled' : 'Match Proposal'}
                        </Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-secondary rounded-full">
                            <X size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View className="bg-secondary/50 p-4 rounded-2xl mb-6 gap-3">
                        <View className="flex-row items-center gap-3">
                            <View className="bg-primary/10 p-2 rounded-full">
                                <Calendar size={20} color="#16a34a" />
                            </View>
                            <View>
                                <Text className="text-xs text-muted-foreground">Date</Text>
                                <Text className="text-foreground font-semibold text-base">{dateStr}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center gap-3">
                            <View className="bg-primary/10 p-2 rounded-full">
                                <Clock size={20} color="#16a34a" />
                            </View>
                            <View>
                                <Text className="text-xs text-muted-foreground">Time</Text>
                                <Text className="text-foreground font-semibold text-base">{timeStr}</Text>
                            </View>
                        </View>

                        {proposal.court_name && (
                            <View className="flex-row items-center gap-3">
                                <View className="bg-primary/10 p-2 rounded-full">
                                    <MapPin size={20} color="#16a34a" />
                                </View>
                                <View>
                                    <Text className="text-xs text-muted-foreground">Court</Text>
                                    <Text className="text-foreground font-semibold text-base">{proposal.court_name}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    {proposal.status === 'pending' && !isSender && (
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => onDecline(proposal.id)}
                                disabled={loading}
                                className="flex-1 bg-red-500/10 py-3 rounded-xl items-center flex-row justify-center gap-2 border border-red-500/20"
                            >
                                {loading ? <ActivityIndicator color="#ef4444" /> : (
                                    <>
                                        <X size={18} color="#ef4444" />
                                        <Text className="text-red-600 font-bold">Decline</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => onAccept(proposal.id)}
                                disabled={loading}
                                className="flex-1 bg-green-600 py-3 rounded-xl items-center flex-row justify-center gap-2 shadow-sm"
                            >
                                {loading ? <ActivityIndicator color="white" /> : (
                                    <>
                                        <Check size={18} color="white" />
                                        <Text className="text-white font-bold">Accept</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {(isSender || proposal.status === 'accepted') && (
                        <TouchableOpacity
                            onPress={handleCancel}
                            disabled={loading}
                            className="w-full bg-red-500/10 py-3 rounded-xl items-center flex-row justify-center gap-2 border border-red-500/20"
                        >
                            {loading ? <ActivityIndicator color="#ef4444" /> : (
                                <>
                                    <Ban size={18} color="#ef4444" />
                                    <Text className="text-red-600 font-bold">
                                        {proposal.status === 'accepted' ? 'Cancel Match' : 'Cancel Proposal'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};
