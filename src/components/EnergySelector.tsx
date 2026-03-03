import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScalePressable } from './ui/ScalePressable';
import {colors, spacing, borderRadius, typography} from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface EnergySelectorProps {
    value: 'LOW' | 'MEDIUM' | 'HIGH';
    onChange: (value: 'LOW' | 'MEDIUM' | 'HIGH') => void;
}

const LEVELS = [
    { id: 'LOW', icon: 'leaf-outline', label: 'Light', color: colors.mood.great },          // Greenish
    { id: 'MEDIUM', icon: 'partly-sunny-outline', label: 'Medium', color: colors.mood.okay }, // Yellowish
    { id: 'HIGH', icon: 'flame-outline', label: 'Heavy', color: colors.mood.pain },         // Reddish
];

export const EnergySelector = ({ value, onChange }: EnergySelectorProps) => {
    return (
        <View style={styles.container}>
            {LEVELS.map((level) => {
                const isSelected = value === level.id;
                const dynamicStyle = isSelected ? {
                    borderColor: level.color,
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    transform: [{ scale: 1.05 }]
                } : {};

                return (
                    <ScalePressable
                        key={level.id}
                        style={[
                            styles.btn,
                            dynamicStyle
                        ]}
                        onPress={() => onChange(level.id as any)}
                        scaleTo={0.95}
                    >
                        <View style={styles.content}>
                            <Ionicons
                                name={level.icon as any}
                                size={28}
                                color={isSelected ? level.color : colors.textLight}
                            />
                            {isSelected && (
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {level.label}
                                </Text>
                            )}
                        </View>
                    </ScalePressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: spacing.s,
        paddingVertical: spacing.s,
        // justifyContent: 'space-between', // Optional: spread them out
    },
    btn: {
        flex: 1, // Equal width
        height: 80,
        borderRadius: borderRadius.l,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    content: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        ...typography.caption,

        marginTop: 6,
        letterSpacing: 0.3
    }
});
