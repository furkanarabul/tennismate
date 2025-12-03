import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar, Clock, MapPin } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface MatchProposalModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { date: Date; time: Date; court: string }) => Promise<void>;
    loading?: boolean;
}

export const MatchProposalModal = ({ visible, onClose, onSubmit, loading = false }: MatchProposalModalProps) => {
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [court, setCourt] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleSubmit = () => {
        onSubmit({ date, time, court });
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            setTime(selectedTime);
        }
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
                    className="bg-background rounded-t-3xl p-6 pb-10"
                >
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-2xl font-bold text-foreground">Propose Match</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-secondary rounded-full">
                            <X size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View className="gap-4">
                        {/* Date Picker */}
                        <View>
                            <Text className="text-sm font-medium text-muted-foreground mb-2">Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="flex-row items-center bg-secondary p-4 rounded-xl border border-border"
                            >
                                <Calendar size={20} color="#16a34a" className="mr-3" />
                                <Text className="text-foreground text-base">
                                    {date.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </View>

                        {/* Time Picker */}
                        <View>
                            <Text className="text-sm font-medium text-muted-foreground mb-2">Time</Text>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                className="flex-row items-center bg-secondary p-4 rounded-xl border border-border"
                            >
                                <Clock size={20} color="#16a34a" className="mr-3" />
                                <Text className="text-foreground text-base">
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={time}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onTimeChange}
                                />
                            )}
                        </View>

                        {/* Court Name */}
                        <View>
                            <Text className="text-sm font-medium text-muted-foreground mb-2">Court (Optional)</Text>
                            <View className="flex-row items-center bg-secondary p-4 rounded-xl border border-border">
                                <MapPin size={20} color="#16a34a" className="mr-3" />
                                <TextInput
                                    value={court}
                                    onChangeText={setCourt}
                                    placeholder="e.g. Central Park Courts"
                                    placeholderTextColor="#9ca3af"
                                    className="flex-1 text-foreground text-base"
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            className="bg-primary p-4 rounded-xl items-center mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Send Proposal</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
