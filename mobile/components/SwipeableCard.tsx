import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolate,
} from 'react-native-reanimated';
import { UserProfile } from '../hooks/useMatching';
import { MapPin, Trophy } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeableCardProps {
    user: UserProfile;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}

export const SwipeableCard = ({ user, onSwipeLeft, onSwipeRight }: SwipeableCardProps) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                // Swipe detected
                const direction = event.translationX > 0 ? 'right' : 'left';
                translateX.value = withSpring(direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100);

                if (direction === 'right') {
                    runOnJS(onSwipeRight)();
                } else {
                    runOnJS(onSwipeLeft)();
                }
            } else {
                // Return to center
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            [-10, 0, 10]
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[cardStyle, { zIndex: 10 }]} className="absolute w-full h-[75%] px-4">
                <View className="flex-1 bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
                    {/* Image Section */}
                    <View className="h-3/5 bg-muted relative">
                        {user.avatar_url ? (
                            <Image
                                source={{ uri: user.avatar_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-primary/10">
                                <Trophy size={64} color="#16a34a" />
                            </View>
                        )}

                        {/* Gradient Overlay could go here */}
                        <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                        <View className="absolute bottom-4 left-4">
                            <Text className="text-white text-3xl font-bold shadow-sm">
                                {user.name}
                                {user.age ? <Text className="text-2xl font-normal">, {user.age}</Text> : null}
                            </Text>
                        </View>
                    </View>

                    {/* Info Section */}
                    <View className="flex-1 p-5 gap-3">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-primary/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                                <Trophy size={14} color="#16a34a" />
                                <Text className="text-primary font-bold text-xs uppercase">{user.skill_level}</Text>
                            </View>

                            {user.distance != null && (
                                <View className="bg-secondary px-3 py-1 rounded-full flex-row items-center gap-1">
                                    <MapPin size={14} color="#6b7280" />
                                    <Text className="text-muted-foreground text-xs">{user.distance} km</Text>
                                </View>
                            )}
                        </View>

                        <Text className="text-muted-foreground text-base leading-6" numberOfLines={3}>
                            {user.bio || "No bio available."}
                        </Text>

                        {/* Availability Preview */}
                        <View className="mt-auto pt-4 border-t border-border">
                            <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Availability</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {(() => {
                                    let availability = user.availability;
                                    if (typeof availability === 'string') {
                                        try {
                                            availability = JSON.parse(availability);
                                        } catch (e) {
                                            availability = [];
                                        }
                                    }

                                    if (Array.isArray(availability) && availability.length > 0) {
                                        return availability.slice(0, 3).map((slot: any, i: number) => (
                                            <View key={i} className="bg-secondary px-2 py-1 rounded-md">
                                                <Text className="text-xs text-foreground">{slot.day ? slot.day.substring(0, 3) : '???'}</Text>
                                            </View>
                                        ));
                                    }

                                    return <Text className="text-sm text-foreground">Flexible</Text>;
                                })()}
                            </View>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
