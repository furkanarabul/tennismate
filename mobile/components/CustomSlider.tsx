import React, { useState, useEffect } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    withSpring,
} from 'react-native-reanimated';

interface CustomSliderProps {
    min: number;
    max: number;
    step: number;
    value: number;
    onValueChange: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
}

export const CustomSlider = ({ min, max, step, value, onValueChange, onSlidingComplete }: CustomSliderProps) => {
    const [width, setWidth] = useState(0);
    const position = useSharedValue(0);
    const context = useSharedValue(0);

    // Update position when value or width changes
    useEffect(() => {
        if (width > 0) {
            const percentage = (value - min) / (max - min);
            position.value = percentage * width;
        }
    }, [value, width, min, max]);

    const pan = Gesture.Pan()
        .onStart(() => {
            context.value = position.value;
        })
        .onUpdate((e) => {
            let newPos = context.value + e.translationX;
            if (newPos < 0) newPos = 0;
            if (newPos > width) newPos = width;

            position.value = newPos;

            const percentage = newPos / width;
            const rawValue = min + percentage * (max - min);
            const steppedValue = Math.round(rawValue / step) * step;
            const clampedValue = Math.min(Math.max(steppedValue, min), max);

            runOnJS(onValueChange)(clampedValue);
        })
        .onEnd(() => {
            if (onSlidingComplete) {
                const percentage = position.value / width;
                const rawValue = min + percentage * (max - min);
                const steppedValue = Math.round(rawValue / step) * step;
                const clampedValue = Math.min(Math.max(steppedValue, min), max);
                runOnJS(onSlidingComplete)(clampedValue);
            }
        });

    const animatedThumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: position.value }],
    }));

    const animatedTrackStyle = useAnimatedStyle(() => ({
        width: position.value,
    }));

    const onLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width - 24); // Subtract thumb width approximation
    };

    return (
        <View className="h-10 justify-center" onLayout={onLayout}>
            <View className="h-2 bg-muted rounded-full w-full overflow-hidden">
                <Animated.View className="h-full bg-primary" style={animatedTrackStyle} />
            </View>
            <GestureDetector gesture={pan}>
                <Animated.View
                    className="absolute w-6 h-6 bg-white border-2 border-primary rounded-full shadow-sm"
                    style={[animatedThumbStyle, { marginLeft: -12 }]} // Center thumb
                />
            </GestureDetector>
        </View>
    );
};
