import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    useAnimatedProps, 
    withSpring, 
    runOnJS 
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../theme';

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
    const [containerWidth, setContainerWidth] = useState(0);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(1);
    const isDragging = useSharedValue(false);

    // Calculate position percent based on value
    useEffect(() => {
        if (containerWidth > 0 && !isDragging.value) {
            const usableWidth = containerWidth - THUMB_SIZE;
            const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
            translateX.value = withSpring(pct * usableWidth, { damping: 20, stiffness: 150 });
        }
    }, [value, containerWidth, min, max]);

    const computeValue = (posX: number) => {
        'worklet';
        const usableWidth = containerWidth - THUMB_SIZE;
        if (usableWidth <= 0) return min;
        
        const pct = Math.max(0, Math.min(1, posX / usableWidth));
        const raw = min + pct * (max - min);
        const stepped = Math.round(raw / step) * step;
        return Math.max(min, Math.min(max, stepped));
    };

    const pan = useMemo(() => Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
            scale.value = withSpring(1.2);
            runOnJS(Haptics.selectionAsync)();
        })
        .onUpdate((event) => {
            const usableWidth = containerWidth - THUMB_SIZE;
            let newPos = event.x - THUMB_SIZE / 2; // Center on finger
            // Clamp
            newPos = Math.max(0, Math.min(newPos, usableWidth));
            
            translateX.value = newPos;
            
            const newValue = computeValue(newPos);
            runOnJS(onValueChange)(newValue);
        })
        .onEnd(() => {
            isDragging.value = false;
            scale.value = withSpring(1);
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);

            // Snap to exact step position
            const finalValue = computeValue(translateX.value);
            const usableWidth = containerWidth - THUMB_SIZE;
            const pct = (finalValue - min) / (max - min);
            translateX.value = withSpring(pct * usableWidth);
        }), [containerWidth, min, max, step, onValueChange]);

    const animatedThumbStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scale: scale.value }
        ],
        backgroundColor: color
    }));

    const animatedFillStyle = useAnimatedStyle(() => ({
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
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
                <View style={styles.trackBackground} />
                
                <Animated.View style={[styles.trackFill, animatedFillStyle]} />

                <GestureDetector gesture={pan}>
                    <Animated.View style={[styles.thumb, animatedThumbStyle]}>
                        <View style={styles.thumbInner} />
                    </Animated.View>
                </GestureDetector>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    trackContainer: {
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        justifyContent: 'center',
        position: 'relative',
    },
    trackBackground: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: TRACK_HEIGHT / 2,
        backgroundColor: colors.border,
    },
    trackFill: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        borderRadius: TRACK_HEIGHT / 2,
        opacity: 0.35,
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.level2,
        position: 'absolute',
        left: 0,
    },
    thumbInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
});
