import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
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
    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.container}
        >
            {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                const dynamicStyle = isSelected ? {
                    borderColor: mood.color,
                    backgroundColor: colors.surface, // Keep surface clean
                    borderWidth: 2, // Thicker border
                    shadowColor: mood.color,
                    shadowOpacity: 0.25, 
                    shadowRadius: 8,
                    elevation: 5,
                    transform: [{ scale: 1.05 }]
                } : {};

                return (
                    <ScalePressable 
                        key={mood.id} 
                        style={[
                            styles.moodBtn, 
                            dynamicStyle 
                        ]}
                        onPress={() => onSelectMood(mood.id)}
                        scaleTo={0.95}
                    >
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
    label: {
        fontSize: 12,
        color: colors.textPrimary,
        fontWeight: '600',
        marginTop: 6,
        letterSpacing: 0.3
    }
});
