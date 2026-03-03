import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {colors, fonts, borderRadius, spacing, typography} from '../../theme';

interface FoodSummaryCardProps {
    totalCalories: number;
}

export const FoodSummaryCard: React.FC<FoodSummaryCardProps> = ({ totalCalories }) => {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Calories Today</Text>
            <Text style={styles.summaryValue}>{totalCalories} <Text style={styles.unit}>kcal</Text></Text>
        </View>
    );
};

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    summaryLabel: {
        ...fonts.caption,
        color: colors.textLight,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryValue: {
        ...fonts.h1,
        fontSize: 48,
        color: colors.primary,
    },
    unit: {
        ...typography.h3,
        color: colors.textLight,
    },
});
