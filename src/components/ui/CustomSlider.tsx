import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    runOnJS,
    useDerivedValue,
    withSpring
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import {colors, typography, spacing, borderRadius} from '../../theme';

interface CustomSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    color?: string;
}

const THUMB_SIZE = 40;
const TRACK_HEIGHT = 40;

export const CustomSlider = ({
    value,
    onValueChange,
    min = 0,
    max = 10,
    step = 1,
    label,
    color = colors.primary,
}: CustomSliderProps) => {
    const [width, setWidth] = useState(0);
    const isDragging = useSharedValue(false);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(1);
    const context = useSharedValue(0);

    // Sync only when NOT dragging to prevent fighting
    useEffect(() => {
        if (!isDragging.value && width > 0) {
            const range = max - min;
            const percentage = (value - min) / range;
            const clamped = Math.max(0, Math.min(1, percentage));
            translateX.value = withSpring(clamped * (width - THUMB_SIZE), { damping: 20 });
        }
    }, [value, width, min, max]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = translateX.value;
            isDragging.value = true;
            scale.value = withSpring(1.15);
            runOnJS(Haptics.selectionAsync)();
        })
        .onUpdate((e) => {
            const maxTranslate = width - THUMB_SIZE;
            let rawX = context.value + e.translationX;
            // Clamp
            if (rawX < 0) rawX = 0;
            if (rawX > maxTranslate) rawX = maxTranslate;
            
            translateX.value = rawX;

            // Calculate value
            const percentage = rawX / maxTranslate;
            const rawValue = min + percentage * (max - min);
            const steppedValue = Math.round(rawValue / step) * step;
            const finalValue = Math.max(min, Math.min(max, steppedValue));

            // Throttle Haptics/Updates? 
            // For now, simple runOnJS. If flickering persists, we debounce this.
            runOnJS(onValueChange)(finalValue);
        })
        .onEnd(() => {
            isDragging.value = false;
            scale.value = withSpring(1);
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            
            // Snap to exact step visually
            const maxTranslate = width - THUMB_SIZE;
            const percentage = translateX.value / maxTranslate;
            const rawValue = min + percentage * (max - min);
            const steppedValue = Math.round(rawValue / step) * step;
            const finalPct = (steppedValue - min) / (max - min);
            
            translateX.value = withSpring(Math.max(0, Math.min(1, finalPct)) * maxTranslate);
        });

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scale: scale.value }
        ],
        backgroundColor: color
    }));

    const trackFillStyle = useAnimatedStyle(() => ({
        width: translateX.value + THUMB_SIZE,
        backgroundColor: color
    }));

    return (
        <View style={styles.container}>
             {label && (
                <View style={styles.header}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={[styles.value, { color }]}>{Math.round(value)}/{max}</Text>
                </View>
            )}
            
            <View 
                style={styles.trackContainer}
                onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            >
                {/* Background Track */}
                <View style={[styles.trackBackground]} />
                
                {/* Active Fill */}
                <Animated.View style={[styles.trackFill, trackFillStyle]} />

                {/* Thumb */}
                <GestureDetector gesture={gesture}>
                    <Animated.View style={[styles.thumb, thumbStyle]}>
                         <View style={styles.thumbInner} />
                    </Animated.View>
                </GestureDetector>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    label: {
        ...typography.subheader,

        color: colors.text,
    },
    value: {
        ...typography.subheader,

    },
    trackContainer: {
        height: TRACK_HEIGHT,
        justifyContent: 'center',
    },
    trackBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: TRACK_HEIGHT / 2,
        backgroundColor: colors.border,
    },
    trackFill: {
        position: 'absolute',
        height: '100%',
        borderRadius: TRACK_HEIGHT / 2,
        opacity: 0.3,
    },
    thumb: {
        position: 'absolute',
        left: 0,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbInner: {
        width: 12,
        height: 12,
        borderRadius: borderRadius.s,
        backgroundColor: colors.surface,
    }
});
