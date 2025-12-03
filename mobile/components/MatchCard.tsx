import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Trophy, MapPin, Calendar, MessageCircle } from 'lucide-react-native';
import { MatchProposal } from '../hooks/useMatchProposal';

interface MatchCardProps {
    match: any;
    proposal?: MatchProposal;
    messageUnreadCount?: number;
    proposalUnreadCount?: number;
    onPressProposal: () => void;
    onPressMessage: () => void;
}

export const MatchCard = ({ match, proposal, messageUnreadCount = 0, proposalUnreadCount = 0, onPressProposal, onPressMessage }: MatchCardProps) => {
    const getSkillLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'text-blue-500 bg-blue-500/10';
            case 'intermediate': return 'text-green-500 bg-green-500/10';
            case 'advanced': return 'text-purple-500 bg-purple-500/10';
            case 'pro': return 'text-orange-500 bg-orange-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getProposalButtonContent = () => {
        if (proposal?.status === 'accepted') {
            return (
                <View className="flex-row items-center justify-center gap-2 bg-green-600 py-3 rounded-xl">
                    <Calendar size={18} color="white" />
                    <Text className="text-white font-bold">Scheduled</Text>
                </View>
            );
        } else if (proposal?.status === 'pending') {
            return (
                <View className="flex-row items-center justify-center gap-2 bg-amber-500 py-3 rounded-xl">
                    <Calendar size={18} color="white" />
                    <Text className="text-white font-bold">Pending</Text>
                </View>
            );
        } else {
            return (
                <View className="flex-row items-center justify-center gap-2 bg-primary py-3 rounded-xl">
                    <Calendar size={18} color="white" />
                    <Text className="text-white font-bold">Propose Match</Text>
                </View>
            );
        }
    };

    return (
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4 shadow-sm">
            <View className="p-4 flex-row gap-4">
                {/* Avatar */}
                <View className="relative">
                    <View className="w-16 h-16 rounded-full bg-muted overflow-hidden border border-border">
                        {match.avatar_url ? (
                            <Image
                                source={{ uri: match.avatar_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-primary/10">
                                <Trophy size={24} color="#16a34a" />
                            </View>
                        )}
                    </View>
                    {/* Online Indicator (mock) */}
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                </View>

                {/* Info */}
                <View className="flex-1 justify-center gap-1">
                    <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                        {match.name}
                    </Text>

                    <View className="flex-row items-center gap-1">
                        <MapPin size={14} color="#6b7280" />
                        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                            {match.location || 'No location'}
                        </Text>
                    </View>

                    <View className={`self-start px-2 py-0.5 rounded-full ${getSkillLevelColor(match.skill_level).split(' ')[1]}`}>
                        <Text className={`text-xs font-bold uppercase ${getSkillLevelColor(match.skill_level).split(' ')[0]}`}>
                            {match.skill_level || 'Intermediate'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View className="p-4 pt-0 gap-3">
                <TouchableOpacity onPress={onPressProposal} className="relative">
                    {getProposalButtonContent()}
                    {proposalUnreadCount > 0 && (
                        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 border-2 border-card z-10">
                            <Text className="text-white text-[10px] font-bold">{proposalUnreadCount > 99 ? '99+' : proposalUnreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onPressMessage}
                    className="relative flex-row items-center justify-center gap-2 bg-secondary py-3 rounded-xl border border-border"
                >
                    <MessageCircle size={18} color="#6b7280" />
                    <Text className="text-foreground font-medium">Message</Text>
                    {messageUnreadCount > 0 && (
                        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 border-2 border-card z-10">
                            <Text className="text-white text-[10px] font-bold">{messageUnreadCount > 99 ? '99+' : messageUnreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
