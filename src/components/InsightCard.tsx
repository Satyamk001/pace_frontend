import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {colors, spacing, borderRadius, typography} from '../theme';

interface InsightCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    color?: string;
}

export const InsightCard = ({ title, value, subtitle, icon, color = colors.primary }: InsightCardProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={[styles.iconContainer, { backgroundColor: color + '18' }]}>
                    {icon}
                </View>
            </View>
            
            <View style={styles.content}>
                <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface, // Clean white/surface
        borderRadius: borderRadius.l, // Soft corners (24px)
        padding: spacing.m,
        ...{} /* removed shadow */, // Very subtle lift
        borderWidth: 1,
        borderColor: colors.border,
        height: 140, // Taller, more vertical breathing room
        justifyContent: 'space-between',
        flex: 1, // Ensure it fills the half-width slot
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    iconContainer: {
        width: 36, // Smaller, more refined
        height: 36,
        borderRadius: 12, // Soft square
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        justifyContent: 'flex-end',
    },
    value: {
        ...typography.h1,

        color: colors.text,
        letterSpacing: -0.5,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.body,
        ...typography.body,

        color: colors.text, // Darker than before for readability
        marginBottom: 2,
    },
    subtitle: {
        ...typography.caption,
        ...typography.caption,
    color: colors.textSecondary,
        
    }
});
