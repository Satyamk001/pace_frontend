import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

interface InsightCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    color?: string;
}

export const InsightCard = ({ title, value, subtitle, icon, color = colors.primary }: InsightCardProps) => {
    return (
        <View style={[styles.container, { borderColor: color, shadowColor: color }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    {icon}
                </View>
                <Text style={[styles.title, { color: colors.textLight }]}>{title}</Text>
            </View>
            <Text style={[styles.value, { color: color }]}>{value}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        marginBottom: spacing.m,
        borderWidth: 1,
        // Soft colored glow effect
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        gap: spacing.s
    },
    iconContainer: {
        padding: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        ...typography.bodyBold,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -1
    },
    subtitle: {
        ...typography.caption,
        color: colors.textLight,
        fontSize: 12
    }
});
