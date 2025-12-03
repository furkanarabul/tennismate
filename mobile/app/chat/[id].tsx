import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useChat, Message } from '../../hooks/useChat';
import { useMatching } from '../../hooks/useMatching';
import { useMatchProposal, MatchProposal } from '../../hooks/useMatchProposal';
import { Send, ArrowLeft, User as UserIcon, CalendarPlus } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { MatchProposalBanner } from '../../components/MatchProposalBanner';
import { MatchProposalModal } from '../../components/MatchProposalModal';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const matchId = Array.isArray(id) ? id[0] : id;
    const { user } = useAuth();
    const router = useRouter();
    const { getMessages, sendMessage, subscribeToMessages, unsubscribe, markMatchMessagesAsRead } = useChat();
    const { getMatches } = useMatching();
    const { markMatchAsRead } = useNotifications();
    const { getProposals, respondToProposal, createProposal } = useMatchProposal();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [matchedUser, setMatchedUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [activeProposal, setActiveProposal] = useState<MatchProposal | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [proposalLoading, setProposalLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!user || !matchId) return;

        loadChatData();

        subscribeToMessages(matchId, (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
            // Mark as read if it's not our message
            if (newMsg.sender_id !== user.id) {
                markMatchMessagesAsRead(matchId, user.id);
                markMatchAsRead(matchId); // Keep badge cleared while in chat
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user, matchId]);

    const loadChatData = async () => {
        if (!user || !matchId) return;

        try {
            // Get matched user info
            const matches = await getMatches(user.id);
            const match = matches.find((m: any) => m.matchId === matchId);
            setMatchedUser(match);

            // Get messages
            const msgs = await getMessages(matchId);
            setMessages(msgs);

            // Get proposals
            const proposals = await getProposals(matchId);
            const active = proposals.find(p => p.status === 'pending' || p.status === 'accepted');
            setActiveProposal(active || null);

            // Mark existing messages as read
            await markMatchMessagesAsRead(matchId, user.id);
            markMatchAsRead(matchId); // Update local notification state
        } catch (error) {
            console.error('Error loading chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !matchId || sending) return;

        setSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        const sentMsg = await sendMessage(matchId, user.id, content);

        if (!sentMsg) {
            console.error('Failed to send message');
        }

        setSending(false);
    };

    const handleCreateProposal = async (data: { date: Date; time: Date; court: string }) => {
        if (!user || !matchedUser) return;

        setProposalLoading(true);
        try {
            const scheduledAt = new Date(data.date);
            scheduledAt.setHours(data.time.getHours());
            scheduledAt.setMinutes(data.time.getMinutes());

            const newProposal = await createProposal(
                matchId,
                user.id,
                matchedUser.id,
                scheduledAt.toISOString(),
                data.court
            );

            if (newProposal) {
                setActiveProposal(newProposal);
                setModalVisible(false);
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
        } finally {
            setProposalLoading(false);
        }
    };

    const handleProposalAction = async (id: string, action: 'accepted' | 'declined' | 'cancelled') => {
        setProposalLoading(true);
        try {
            const updated = await respondToProposal(id, action);
            if (updated) {
                setActiveProposal(updated.status === 'cancelled' || updated.status === 'declined' ? null : updated);
            }
        } catch (error) {
            console.error('Error updating proposal:', error);
        } finally {
            setProposalLoading(false);
        }
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border bg-card">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="#6b7280" />
                    </TouchableOpacity>

                    <View className="w-10 h-10 rounded-full bg-muted overflow-hidden mr-3 border border-border">
                        {matchedUser?.avatar_url ? (
                            <Image source={{ uri: matchedUser.avatar_url }} className="w-full h-full" />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-primary/10">
                                <UserIcon size={20} color="#16a34a" />
                            </View>
                        )}
                    </View>
                    <View>
                        <Text className="font-bold text-lg text-foreground">{matchedUser?.name || 'Chat'}</Text>
                        <Text className="text-xs text-muted-foreground">{matchedUser?.skill_level}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-secondary p-2 rounded-full"
                >
                    <CalendarPlus size={24} color="#16a34a" />
                </TouchableOpacity>
            </View>

            {/* Proposal Banner - Only show if accepted */}
            {activeProposal && activeProposal.status === 'accepted' && (
                <MatchProposalBanner
                    proposal={activeProposal}
                    isSender={activeProposal.sender_id === user?.id}
                    loading={proposalLoading}
                    onAccept={(id) => handleProposalAction(id, 'accepted')}
                    onDecline={(id) => handleProposalAction(id, 'declined')}
                    onCancel={(id) => handleProposalAction(id, 'cancelled')}
                />
            )}

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isMe = item.sender_id === user?.id;
                    return (
                        <View className={`flex-row mb-4 px-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <View
                                className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-primary rounded-tr-none' : 'bg-secondary rounded-tl-none'
                                    }`}
                            >
                                <Text className={`${isMe ? 'text-white' : 'text-foreground'}`}>
                                    {item.content}
                                </Text>
                                <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                                    {formatTime(item.created_at)}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                contentContainerStyle={{ paddingVertical: 16 }}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View className="p-4 border-t border-border bg-card flex-row items-center gap-2 pb-8">
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Type a message..."
                        placeholderTextColor="#9ca3af"
                        className="flex-1 bg-secondary p-3 rounded-full text-foreground max-h-24"
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className={`p-3 rounded-full ${!newMessage.trim() || sending ? 'bg-muted' : 'bg-primary'}`}
                    >
                        <Send size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <MatchProposalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleCreateProposal}
                loading={proposalLoading}
            />
        </SafeAreaView>
    );
}
