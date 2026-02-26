import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, shadows, spacing } from '../../theme';
import { SkeletonBox } from './SkeletonLoader';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    suffix?: string;
    isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, suffix = '', isLoading = false }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <View>
            {isLoading ? (
                <SkeletonBox width={40} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
            ) : (
                <Text style={styles.statValue}>
                    {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}
                    {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
                </Text>
            )}
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    statCard: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.soft,
        borderWidth: 1,
        borderColor: colors.border + '20',
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statValue: {
        ...typography.h3,
        fontSize: 18,
        color: colors.text,
    },
    suffix: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: 'normal',
    },
    statLabel: {
        ...typography.caption,
        fontSize: 11,
        color: colors.textSecondary,
    },
});
