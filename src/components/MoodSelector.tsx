import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming,
    Easing
} from 'react-native-reanimated';
import { ScalePressable } from './ui/ScalePressable';
import { colors, spacing, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface MoodSelectorProps {
    selectedMood?: string;
    onSelectMood: (mood: string) => void;
}

const MOODS = [
    { id: 'GREAT', icon: 'happy-outline', label: 'Great', color: colors.mood.great },
    { id: 'GOOD', icon: 'leaf-outline', label: 'Good', color: colors.mood.good },
    { id: 'OKAY', icon: 'partly-sunny-outline', label: 'Okay', color: colors.mood.okay },
    { id: 'LOW', icon: 'battery-dead-outline', label: 'Low', color: colors.mood.low },
    { id: 'PAIN', icon: 'medkit-outline', label: 'Pain', color: colors.mood.pain },
];

export const MoodSelector = ({ selectedMood, onSelectMood }: MoodSelectorProps) => {
    // Shared value for the breathing animation
    const breathScale = useSharedValue(1.1);

    useEffect(() => {
        // Start the breathing loop whenever the component mounts/updates
        breathScale.value = withRepeat(
            withTiming(1.15, { 
                duration: 1500, 
                easing: Easing.inOut(Easing.ease) 
            }), 
            -1, // Infinite repeat
            true // Reverse (pulse in and out)
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: breathScale.value }]
        };
    });

    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.container}
        >
            {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                
                // Static vs Animated Wrapper
                const Wrapper = isSelected ? Animated.View : View;
                const wrapperStyle = isSelected ? [styles.moodBtnActive, { borderColor: mood.color, shadowColor: mood.color }, animatedStyle] : styles.moodBtn;

                return (
                    <ScalePressable 
                        key={mood.id} 
                        onPress={() => onSelectMood(mood.id)}
                        scaleTo={0.95}
                    >
                        <Wrapper style={wrapperStyle}>
                            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                 {/* Icon Color */}
                                <Ionicons 
                                    name={mood.icon as any} 
                                    size={28} 
                                    color={isSelected ? mood.color : colors.textLight} 
                                />
                                {isSelected && (
                                    <Text style={[styles.label, { color: colors.text }]}>
                                        {mood.label}
                                    </Text>
                                )}
                            </View>
                        </Wrapper>
                    </ScalePressable>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.l,
        gap: 12,
        paddingVertical: spacing.s,
    },
    moodBtn: {
        width: 68,
        height: 80,
        borderRadius: 24,
        backgroundColor: colors.surface, // Clean surface
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.soft, // Soft shadow for depth
        borderWidth: 1,
        borderColor: colors.border,
    },
    moodBtnActive: {
        width: 68,
        height: 80,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2, 
        ...shadows.glow, // STRICT THEME USAGE
    },
    label: {
        fontSize: 12,
        color: colors.textPrimary,
        fontWeight: '600',
        marginTop: 6,
        letterSpacing: 0.3
    }
});
