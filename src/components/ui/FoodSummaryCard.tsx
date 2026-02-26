import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, shadows, spacing } from '../../theme';

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
        ...shadows.soft,
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
        fontSize: 20,
        color: colors.textLight,
        fontWeight: '400',
    },
});
