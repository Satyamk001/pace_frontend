import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface HealthInsightCardProps {
  title: string;
  insight: string;
  type: 'positive' | 'warning' | 'info' | 'tip';
}

const TYPE_CONFIG = {
  positive: { icon: 'trending-up', color: '#4CAF50', bg: '#E8F5E9' },
  warning:  { icon: 'warning-outline', color: '#FF9800', bg: '#FFF3E0' },
  info:     { icon: 'information-circle-outline', color: colors.primary, bg: colors.accentSoft },
  tip:      { icon: 'bulb-outline', color: '#9C27B0', bg: '#F3E5F5' },
};

export const HealthInsightCard: React.FC<HealthInsightCardProps> = ({ title, insight, type }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.insight}>{insight}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  insight: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
