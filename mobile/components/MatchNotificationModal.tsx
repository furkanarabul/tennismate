import React, { useEffect } from 'react';
import { View, Text, Image, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { UserProfile } from '../hooks/useMatching';
import { MessageCircle, X, Heart } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withSequence,
    withRepeat,
    FadeIn
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

interface MatchNotificationModalProps {
    visible: boolean;
    currentUserAvatar?: string;
    matchedUser: UserProfile | null;
    matchId?: string | null;
    onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const MatchNotificationModal = ({
    visible,
    currentUserAvatar,
    matchedUser,
    matchId,
    onClose
}: MatchNotificationModalProps) => {
    const router = useRouter();
    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withSpring(1.2),
                withSpring(1)
            );
            rotate.value = withRepeat(
                withSequence(
                    withSpring(10),
                    withSpring(-10),
                    withSpring(0)
                ),
                2,
                true
            );
        } else {
            scale.value = 0;
            rotate.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { rotate: `${rotate.value}deg` }
            ]
        };
    });

    if (!matchedUser) return null;

    const handleSendMessage = () => {
        onClose();
        if (matchId) {
            router.push(`/chat/${matchId}`);
        } else {
            router.push('/(tabs)/dashboard');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/90 items-center justify-center px-6">
                <Animated.View
                    entering={FadeIn.duration(300)}
                    className="items-center w-full"
                >
                    {/* Title */}
                    <Animated.View style={[animatedStyle]} className="mb-12 items-center px-4">
                        <View className="p-4">
                            <Text
                                className="text-7xl text-primary text-center"
                                style={{
                                    fontFamily: 'Pacifico_400Regular',
                                    includeFontPadding: false,
                                    lineHeight: 110,
                                    paddingHorizontal: 20
                                }}
                            >
                                Match!
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Avatars */}
                    <View className="flex-row items-center justify-center mb-12 w-full">
                        {/* Current User */}
                        <View className="w-32 h-32 rounded-full border-4 border-white overflow-hidden -mr-6 z-10 shadow-2xl transform -rotate-6">
                            {currentUserAvatar ? (
                                <Image source={{ uri: currentUserAvatar }} className="w-full h-full" />
                            ) : (
                                <View className="w-full h-full bg-gray-300 items-center justify-center">
                                    <Heart size={40} color="#666" />
                                </View>
                            )}
                        </View>

                        {/* Matched User */}
                        <View className="w-32 h-32 rounded-full border-4 border-primary overflow-hidden -ml-6 z-20 shadow-2xl transform rotate-6">
                            {matchedUser.avatar_url ? (
                                <Image source={{ uri: matchedUser.avatar_url }} className="w-full h-full" />
                            ) : (
                                <View className="w-full h-full bg-gray-300 items-center justify-center">
                                    <Heart size={40} color="#666" />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Description */}
                    <Text className="text-white text-center text-lg mb-8 font-medium">
                        You and <Text className="text-primary font-bold">{matchedUser.name}</Text> liked each other!
                    </Text>

                    {/* Actions */}
                    <View className="w-full gap-4">
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            className="w-full bg-primary py-4 rounded-full flex-row items-center justify-center gap-2 shadow-lg shadow-primary/40"
                        >
                            <MessageCircle size={24} color="white" />
                            <Text className="text-white font-bold text-lg">Send a Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            className="w-full bg-white/10 py-4 rounded-full flex-row items-center justify-center gap-2 border border-white/20"
                        >
                            <X size={24} color="white" />
                            <Text className="text-white font-bold text-lg">Keep Swiping</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal >
    );
};
