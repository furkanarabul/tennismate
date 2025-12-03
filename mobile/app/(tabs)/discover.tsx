import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMatching, UserProfile } from '../../hooks/useMatching';
import { useAuth } from '../../context/AuthContext';
import { SwipeableCard } from '../../components/SwipeableCard';
import { MatchNotificationModal } from '../../components/MatchNotificationModal';
import { RefreshCcw, X, Heart } from 'lucide-react-native';

export default function Discover() {
    const { user } = useAuth();
    const { getDiscoverUsers, swipeUser, loading } = useMatching();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    const loadProfiles = async () => {
        if (!user) return;
        const users = await getDiscoverUsers(user.id);
        setProfiles(users);
        setCurrentIndex(0);
    };

    useEffect(() => {
        loadProfiles();
    }, [user]);

    const handleSwipeLeft = async () => {
        if (!user || currentIndex >= profiles.length) return;
        const targetUser = profiles[currentIndex];

        // Optimistic update
        setCurrentIndex(prev => prev + 1);

        await swipeUser(user.id, targetUser.id, 'pass');
    };

    const handleSwipeRight = async () => {
        if (!user || currentIndex >= profiles.length) return;
        const targetUser = profiles[currentIndex];

        // Optimistic update
        setCurrentIndex(prev => prev + 1);

        const isMatch = await swipeUser(user.id, targetUser.id, 'like');
        if (isMatch) {
            setMatchedUser(targetUser);
            setShowMatchModal(true);
        }
    };

    if (loading && profiles.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 relative items-center justify-center mt-4">
                {currentIndex < profiles.length ? (
                    profiles.slice(currentIndex, currentIndex + 2).reverse().map((profile, index) => {
                        const realIndex = currentIndex + (profiles.slice(currentIndex, currentIndex + 2).length - 1 - index);
                        const p = profiles[realIndex];

                        if (!p) return null;

                        return (
                            <SwipeableCard
                                key={p.id}
                                user={p}
                                onSwipeLeft={handleSwipeLeft}
                                onSwipeRight={handleSwipeRight}
                            />
                        );
                    })
                ) : (
                    <View className="items-center justify-center px-8">
                        <Text className="text-2xl font-bold text-foreground mb-2">No more players</Text>
                        <Text className="text-muted-foreground text-center mb-6">
                            Check back later or adjust your filters to see more people.
                        </Text>
                        <TouchableOpacity
                            onPress={loadProfiles}
                            className="bg-primary px-6 py-3 rounded-full flex-row items-center gap-2"
                        >
                            <RefreshCcw size={20} color="white" />
                            <Text className="text-primary-foreground font-bold">Refresh</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            {currentIndex < profiles.length && (
                <View className="flex-row justify-center items-center gap-8 mb-8">
                    <TouchableOpacity
                        onPress={handleSwipeLeft}
                        className="w-16 h-16 bg-background border-2 border-destructive rounded-full items-center justify-center shadow-sm"
                    >
                        <X size={32} color="#ef4444" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSwipeRight}
                        className="w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/30"
                    >
                        <Heart size={32} color="white" fill="white" />
                    </TouchableOpacity>
                </View>
            )}

            <MatchNotificationModal
                visible={showMatchModal}
                currentUserAvatar={user?.user_metadata?.avatar_url}
                matchedUser={matchedUser}
                onClose={() => setShowMatchModal(false)}
            />
        </SafeAreaView>
    );
}
