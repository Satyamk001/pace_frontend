import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface MoodSelectorProps {
    selectedMood?: string;
    onSelectMood: (mood: string) => void;
}

const MOODS = [
    { id: 'GREAT', icon: 'happy-outline', label: 'Great', color: '#B5EAD7' },
    { id: 'GOOD', icon: 'leaf-outline', label: 'Good', color: '#C7CEEA' },
    { id: 'OKAY', icon: 'partly-sunny-outline', label: 'Okay', color: '#FFF9C4' },
    { id: 'LOW', icon: 'battery-dead-outline', label: 'Low', color: '#FFE0B2' },
    { id: 'PAIN', icon: 'medkit-outline', label: 'Pain', color: '#FFB7B2' },
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
                return (
                    <TouchableOpacity 
                        key={mood.id} 
                        style={[
                            styles.moodBtn, 
                            isSelected && styles.selectedBtn,
                            { backgroundColor: isSelected ? mood.color : colors.surface }
                        ]}
                        onPress={() => onSelectMood(mood.id)}
                    >
                        <Ionicons 
                            name={mood.icon as any} 
                            size={28} 
                            color={isSelected ? '#333' : colors.textLight} 
                        />
                        {isSelected && <Text style={styles.label}>{mood.label}</Text>}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.m,
        gap: spacing.m,
        paddingVertical: spacing.s,
    },
    moodBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.soft,
    },
    selectedBtn: {
        ...shadows.glow,
        transform: [{ scale: 1.1 }]
    },
    label: {
        fontSize: 10,
        color: '#333',
        fontWeight: 'bold',
        position: 'absolute',
        bottom: 8,
    }
});
