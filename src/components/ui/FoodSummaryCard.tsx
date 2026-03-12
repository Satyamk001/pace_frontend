import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FoodSummaryCardProps {
  totalCalories: number;
  totalProtein?: number;
  totalFat?: number;
  totalCarbs?: number;
  eatenCount: number;
  totalCount: number;
}

export const FoodSummaryCard: React.FC<FoodSummaryCardProps> = ({ totalCalories, totalProtein = 0, totalFat = 0, totalCarbs = 0, eatenCount, totalCount }) => {
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

      {/* Macros */}
      <View style={styles.macrosRow}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>{Number(totalProtein).toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>{Number(totalFat).toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>{Number(totalCarbs).toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
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
    marginBottom: spacing.m,
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
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.background,
    borderRadius: borderRadius.m,
    marginBottom: spacing.m,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    ...typography.h3,
    color: colors.text,
    fontSize: 16,
  },
  macroLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.m,
  },
});
