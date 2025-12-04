import { useEffect, useState } from 'react';
import { RefreshCcw, X, Heart, MapPin, Sliders } from 'lucide-react-native';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMatching, UserProfile } from '../../hooks/useMatching';
import { useAuth } from '../../context/AuthContext';
import { SwipeableCard } from '../../components/SwipeableCard';
import { MatchNotificationModal } from '../../components/MatchNotificationModal';
import * as Location from 'expo-location';
import { CustomSlider } from '../../components/CustomSlider';

export default function Discover() {
    const { user } = useAuth();
    const { getDiscoverUsers, swipeUser, loading } = useMatching();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
    const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    // Location & Filter State
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [maxDistance, setMaxDistance] = useState<number | null>(25); // Default 25km
    const [displayDistance, setDisplayDistance] = useState<number | null>(25); // For UI only
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    const loadProfiles = async () => {
        if (!user) return;

        const lat = location?.coords.latitude;
        const lon = location?.coords.longitude;

        const users = await getDiscoverUsers(
            user.id,
            lat,
            lon,
            maxDistance
        );
        setProfiles(users);
        setCurrentIndex(0);
    };

    useEffect(() => {
        loadProfiles();
    }, [user, location, maxDistance]);

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

        const { isMatch, matchId } = await swipeUser(user.id, targetUser.id, 'like');
        if (isMatch) {
            setMatchedUser(targetUser);
            setCurrentMatchId(matchId || null);
            setShowMatchModal(true);
        }
    };

    const DISTANCE_OPTIONS = [10, 25, 50, 100, null];

    if (loading && profiles.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header / Filter Button */}
            <View className="flex-row justify-between items-center px-4 py-2 z-20">
                <View>
                    {/* Placeholder for left side if needed */}
                </View>

                <TouchableOpacity
                    onPress={() => setShowFilterModal(true)}
                    className="w-10 h-10 bg-secondary/80 rounded-full items-center justify-center shadow-sm"
                >
                    <Sliders size={20} color="#16a34a" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 relative items-center justify-center mt-2">
                {currentIndex < profiles.length && (
                    <View className="absolute top-0 z-10 bg-secondary/80 px-4 py-2 rounded-full">
                        <Text className="text-foreground font-medium">
                            {profiles.length - currentIndex} people nearby
                        </Text>
                    </View>
                )}
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
                            {errorMsg ? "Enable location to see nearby players." : "Check back later or adjust your filters to see more people."}
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
                matchId={currentMatchId}
                onClose={() => setShowMatchModal(false)}
            />

            {/* Filter Modal */}
            {showFilterModal && (
                <View className="absolute inset-0 bg-black/50 z-50 justify-end">
                    <View className="bg-card rounded-t-3xl p-6 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-foreground">Distance Filter</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="items-center mb-6">
                            <Text className="text-4xl font-bold text-primary mb-2">
                                {displayDistance ? `${displayDistance} km` : 'Unlimited'}
                            </Text>
                            <Text className="text-muted-foreground">Maximum distance</Text>
                        </View>

                        <View className="w-full px-4 mb-4">
                            <CustomSlider
                                min={5}
                                max={100}
                                step={5}
                                value={displayDistance || 100}
                                onValueChange={(value) => {
                                    if (value === 100) {
                                        setDisplayDistance(null);
                                    } else {
                                        setDisplayDistance(value);
                                    }
                                }}
                                onSlidingComplete={(value) => {
                                    if (value === 100) {
                                        setMaxDistance(null);
                                    } else {
                                        setMaxDistance(value);
                                    }
                                }}
                            />
                            <View className="flex-row justify-between mt-2">
                                <Text className="text-muted-foreground text-xs">5 km</Text>
                                <Text className="text-muted-foreground text-xs">Unlimited</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowFilterModal(false)}
                            className="bg-primary w-full py-4 rounded-xl items-center mt-4"
                        >
                            <Text className="text-white font-bold text-lg">Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
