import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    skill_level: string;
    location: string;
    bio: string;
    availability: any[];
    avatar_url: string;
    created_at: string;
    latitude?: number | null;
    longitude?: number | null;
    distance?: number; // Calculated distance in km
    hasLikedMe?: boolean; // If the user has already liked the current user
    age?: number | null;
}

export const useMatching = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371; // Earth's radius in km
        const toRad = (deg: number) => (deg * Math.PI) / 180;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 10) / 10; // Round to 1 decimal place
    };

    /**
     * Fetch users for discovery
     */
    const getDiscoverUsers = async (
        currentUserId: string,
        userLatitude?: number | null,
        userLongitude?: number | null,
        maxDistance?: number | null,
        limit = 50
    ): Promise<UserProfile[]> => {
        setLoading(true);
        setError(null);

        try {
            // Get already swiped user IDs
            const { data: swipedUsers } = await supabase
                .from('swipes')
                .select('target_user_id')
                .eq('user_id', currentUserId);

            const swipedIds = swipedUsers?.map((s) => s.target_user_id) || [];

            // Fetch users excluding current user
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(limit);

            // Only add not.in filter if there are swiped users
            if (swipedIds.length > 0) {
                query = query.not('id', 'in', `(${swipedIds.join(',')})`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            let users = (data as UserProfile[]) || [];

            // Check for incoming likes
            const userIds = users.map((u) => u.id);
            if (userIds.length > 0) {
                const { data: incomingLikes } = await supabase
                    .from('swipes')
                    .select('user_id')
                    .eq('target_user_id', currentUserId)
                    .eq('action', 'like')
                    .in('user_id', userIds);

                const likedUserIds = new Set(incomingLikes?.map((l) => l.user_id) || []);

                users = users.map((user) => ({
                    ...user,
                    hasLikedMe: likedUserIds.has(user.id),
                }));
            }

            // Calculate distances if user location is provided
            if (userLatitude != null && userLongitude != null) {
                users = users.map((user) => {
                    if (user.latitude != null && user.longitude != null) {
                        const distance = calculateDistance(
                            userLatitude,
                            userLongitude,
                            user.latitude,
                            user.longitude
                        );
                        return { ...user, distance };
                    }
                    return { ...user, distance: undefined };
                });

                // Filter by max distance if specified
                if (maxDistance != null) {
                    users = users.filter(
                        (user) => user.distance != null && user.distance <= maxDistance
                    );
                }

                // Sort by distance (closest first)
                users.sort((a, b) => {
                    // Prioritize users who liked me
                    if (a.hasLikedMe && !b.hasLikedMe) return -1;
                    if (!a.hasLikedMe && b.hasLikedMe) return 1;

                    if (a.distance == null) return 1;
                    if (b.distance == null) return -1;
                    return a.distance - b.distance;
                });
            }

            return users;
        } catch (err: any) {
            console.error('Error fetching discover users:', err);
            setError(err.message || 'Failed to fetch users');
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Record a swipe action
     */
    const swipeUser = async (
        currentUserId: string,
        targetUserId: string,
        action: 'like' | 'pass'
    ): Promise<boolean> => {
        try {
            const { error: swipeError } = await supabase.from('swipes').insert([
                {
                    user_id: currentUserId,
                    target_user_id: targetUserId,
                    action,
                },
            ]);

            if (swipeError) throw swipeError;

            // If like, check for match
            if (action === 'like') {
                const isMatch = await checkAndCreateMatch(currentUserId, targetUserId);
                return isMatch;
            }

            return false;
        } catch (e: any) {
            setError(e.message);
            console.error('Error in swipeUser:', e);
            return false;
        }
    };

    /**
     * Check if target user also liked current user, and create match if yes
     */
    const checkAndCreateMatch = async (
        currentUserId: string,
        targetUserId: string
    ): Promise<boolean> => {
        try {
            // Check if target user liked current user
            const { data: reciprocalLike } = await supabase
                .from('swipes')
                .select('*')
                .eq('user_id', targetUserId)
                .eq('target_user_id', currentUserId)
                .eq('action', 'like')
                .maybeSingle();

            if (!reciprocalLike) return false;

            // It's a match! Create match record
            const user1 = currentUserId < targetUserId ? currentUserId : targetUserId;
            const user2 = currentUserId < targetUserId ? targetUserId : currentUserId;

            const { error: matchError } = await supabase.from('matches').insert([
                {
                    user1_id: user1,
                    user2_id: user2,
                },
            ]);

            if (matchError && matchError.code !== '23505') throw matchError;

            return true;
        } catch (e: any) {
            console.error('Error checking match:', e);
            return false;
        }
    };

    /**
     * Get all matches for a user
     */
    const getMatches = async (currentUserId: string) => {
        try {
            // 1. Get all match records
            const { data: matchRecords, error: matchError } = await supabase
                .from('matches')
                .select('*')
                .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
                .order('created_at', { ascending: false });

            if (matchError) throw matchError;

            if (!matchRecords || matchRecords.length === 0) return [];

            // 2. Get the other user's IDs
            const matchData = matchRecords.map((m: any) => ({
                matchId: m.id,
                otherUserId: m.user1_id === currentUserId ? m.user2_id : m.user1_id,
                matched_at: m.created_at,
            }));

            const matchedUserIds = matchData.map((m: any) => m.otherUserId);

            // 3. Fetch profiles for matched users
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', matchedUserIds);

            if (profileError) throw profileError;

            // 4. Combine data
            return matchData.map((match: any) => {
                const profile = profiles?.find((p: any) => p.id === match.otherUserId);
                return {
                    ...profile,
                    matchId: match.matchId,
                    matched_at: match.matched_at,
                };
            });
        } catch (e: any) {
            console.error('Error fetching matches:', e);
            return [];
        }
    };

    return {
        loading,
        error,
        getDiscoverUsers,
        swipeUser,
        getMatches,
    };
};
