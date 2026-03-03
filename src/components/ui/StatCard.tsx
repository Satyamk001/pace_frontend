import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {colors, typography, borderRadius, spacing} from '../../theme';
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
        borderRadius: borderRadius.md,
        padding: spacing.m,
        marginBottom: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.s,
    },
    statValue: {
        ...typography.h3,
        color: colors.text,
    },
    suffix: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
