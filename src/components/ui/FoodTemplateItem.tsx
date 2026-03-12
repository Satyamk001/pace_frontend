import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FoodTemplateItemProps {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  isEaten: boolean;
  isAdhoc?: boolean;
  onToggle: (id: string) => void;
  onPress?: (id: string) => void;
}

export const FoodTemplateItem: React.FC<FoodTemplateItemProps> = ({
  id, name, quantity, unit, calories, protein = 0, fat = 0, carbs = 0, isEaten, isAdhoc, onToggle, onPress,
}) => {
  const checkScale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    // Pop animation on check
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 0.75, useNativeDriver: true, speed: 40 }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
    ]).start();
    onToggle(id);
  };

  const detailStr = quantity ? `${quantity} ${unit || ''}`.trim() : unit || 'serving';

  return (
    <TouchableOpacity
      style={[styles.container, isEaten && styles.containerEaten]}
      onPress={() => onPress?.(id)}
      onLongPress={() => onPress?.(id)}
      activeOpacity={0.72}
    >
      {/* ── Checkbox ── */}
      <TouchableOpacity onPress={handleToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.8}>
        <Animated.View style={[
          styles.checkbox,
          isEaten && styles.checkboxChecked,
          { transform: [{ scale: checkScale }] },
        ]}>
          {isEaten
            ? <Ionicons name="checkmark" size={15} color="#fff" />
            : null
          }
        </Animated.View>
      </TouchableOpacity>

      {/* ── Info ── */}
      <View style={styles.info}>
        <Text
          style={[styles.name, isEaten && styles.nameEaten]}
          numberOfLines={1}
        >
          {name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.detailPill}>
            <Ionicons name="scale-outline" size={10} color={colors.textLight} />
            <Text style={styles.detail}>{detailStr}</Text>
          </View>
          {isAdhoc && (
            <View style={styles.adhocPill}>
              <Text style={styles.adhocText}>one-off</Text>
            </View>
          )}
          
          {/* Macro Badges */}
          <View style={styles.macroPills}>
            <Text style={styles.macroText}>P:{Number(protein).toFixed(1)}g</Text>
            <Text style={styles.macroText}>F:{Number(fat).toFixed(1)}g</Text>
            <Text style={styles.macroText}>C:{Number(carbs).toFixed(1)}g</Text>
          </View>
        </View>
      </View>

      {/* ── Calorie badge ── */}
      <View style={[styles.calorieBadge, isEaten && styles.calorieBadgeEaten]}>
        <Text style={[styles.calories, isEaten && styles.caloriesEaten]}>
          {calories}
        </Text>
        <Text style={[styles.calUnit, isEaten && styles.calUnitEaten]}>kcal</Text>
      </View>

      {/* ── Chevron hint (only when not eaten) ── */}
      {!isEaten && onPress && (
        <Ionicons name="ellipsis-vertical" size={14} color={colors.border} style={styles.moreIcon} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.m,
  },
  containerEaten: {
    backgroundColor: colors.primary + '0C',
    borderColor: colors.primary + '30',
  },

  // ── Checkbox ──
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.s,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // ── Info ──
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 15,
  },
  nameEaten: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detail: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 12,
  },
  adhocPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.round,
    backgroundColor: colors.accentDark + '18',
  },
  adhocText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accentDark,
    letterSpacing: 0.3,
  },
  macroPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  macroText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ── Calorie badge ──
  calorieBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '12',
    borderRadius: borderRadius.s,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    minWidth: 52,
  },
  calorieBadgeEaten: {
    backgroundColor: colors.success + '15',
  },
  calories: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 20,
  },
  caloriesEaten: {
    color: colors.success,
  },
  calUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary + 'AA',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  calUnitEaten: {
    color: colors.success + 'AA',
  },

  moreIcon: {
    paddingLeft: spacing.xs,
  },
});