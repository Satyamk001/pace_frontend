import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
}

export const EmptyState = ({ icon, title, message }: EmptyStateProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={40} color={colors.border} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surfaceSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '15',
    },
    title: {
        ...typography.h3,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    message: {
        ...typography.body,
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        opacity: 0.8,
    },
});
