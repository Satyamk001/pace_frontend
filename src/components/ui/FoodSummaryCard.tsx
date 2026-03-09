import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FoodSummaryCardProps {
  totalCalories: number;
  eatenCount: number;
  totalCount: number;
}

export const FoodSummaryCard: React.FC<FoodSummaryCardProps> = ({ totalCalories, eatenCount, totalCount }) => {
  const progress = totalCount > 0 ? eatenCount / totalCount : 0;

  return (
    <View style={styles.summaryCard}>
      {/* Calorie count */}
      <View style={styles.calorieSection}>
        <Text style={styles.summaryLabel}>Calories Today</Text>
        <Text style={styles.summaryValue}>
          {totalCalories} <Text style={styles.unit}>kcal</Text>
        </Text>
      </View>

      {/* Progress bar */}
      {totalCount > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {eatenCount} of {totalCount} items logged
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calorieSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textLight,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    ...typography.h1,
    fontSize: 48,
    color: colors.primary,
  },
  unit: {
    ...typography.h3,
    color: colors.textLight,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
