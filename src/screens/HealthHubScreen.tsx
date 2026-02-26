import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { createApiService } from '../services/api';


// ─────────────────────────────────────────────────────────
// Module config — colours kept outside theme intentionally
// as these are semantic health-category colours, not brand UI
// ─────────────────────────────────────────────────────────

const MODULES = [
  {
    title: 'Food & Calories',
    icon: 'restaurant-outline',
    iconFilled: 'restaurant',
    color: colors.accentDark,
    route: 'Food',
    description: 'Track meals & macros',
  },
  {
    title: 'Medicine',
    icon: 'medkit-outline',
    iconFilled: 'medkit',
    color: colors.accentDark,
    route: 'Medicine',
    description: 'Schedule & intake logs',
  },
  {
    title: 'Weight',
    icon: 'barbell-outline',
    iconFilled: 'barbell',
    color: colors.accentDark,
    route: 'Weight',
    description: 'Track your progress',
  },
  {
    title: 'Reports',
    icon: 'bar-chart-outline',
    iconFilled: 'bar-chart',
    color: colors.accentDark,
    route: 'Reports',
    description: 'Insights & trends',
  },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const getDayGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

/** Single stat tile in the Today banner */
const StatTile = ({
  icon,
  iconColor,
  value,
  label,
  onPress,
}: {
  icon: any;
  iconColor: string;
  value: string;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.statTile}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.statIconWrap, { backgroundColor: iconColor + '18' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

/** Module card in the 2-col grid */
const ModuleCard = ({
  title,
  icon,
  color,
  route,
  description,
  onPress,
}: (typeof MODULES)[0] & { onPress: () => void }) => (
  <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.75}>
    {/* Icon circle */}
    <View style={[styles.moduleIconCircle, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={26} color={color} />
    </View>

    {/* Text */}
    <View style={styles.moduleTextCol}>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleDesc}>{description}</Text>
    </View>

    {/* Arrow */}
    <View style={[styles.moduleArrow, { backgroundColor: color + '12' }]}>
      <Ionicons name="chevron-forward" size={14} color={color} />
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────

export const HealthHubScreen = () => {
  const navigation = useNavigation<any>();
  const { getToken } = useAuth();
  const api = createApiService(getToken);

  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    calories: 0,
    medicinesTaken: 0,
    medicinesTotal: 0,
    weight: null as number | null,
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchSummary = async () => {
    try {
      const [foodLogs, meds, intake, weightHistory] = await Promise.all([
        api.getDailyFoodLog(today),
        api.getMedicines(),
        api.getIntakeHistory(today),
        api.getWeightHistory(today, today),
      ]);

      const totalCalories = foodLogs
        ? foodLogs.reduce((s: number, i: any) => s + (i.calories || 0), 0)
        : 0;

      let totalDoses = 0;
      if (meds) {
        meds.forEach((m: any) => {
          if (m.frequency === 'DAILY' || !m.frequency) {
            totalDoses += m.times?.length ?? 0;
          }
        });
      }

      setSummary({
        calories: totalCalories,
        medicinesTaken: intake?.length ?? 0,
        medicinesTotal: totalDoses,
        weight:
          weightHistory?.history?.length > 0
            ? weightHistory.history[weightHistory.history.length - 1].weight
            : null,
      });
    } catch (e) {
      console.error('Failed to fetch health summary', e);
    }
  };

  useFocusEffect(useCallback(() => { fetchSummary(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  // Medicine completion fraction for colour hint
  const medFraction =
    summary.medicinesTotal > 0
      ? summary.medicinesTaken / summary.medicinesTotal
      : 0;
  const medColor =
    medFraction === 1 ? colors.mood.great : medFraction > 0 ? colors.mood.okay : colors.accentDark;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            {/* <Text style={styles.greeting}>{getDayGreeting()}</Text> */}
            <Text style={styles.title}>Health Hub</Text>
          </View>
          
        </View>

        {/* ── Today's Summary Banner ── */}
        <View style={styles.summaryBanner}>
          {/* Banner header */}
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTitleRow}>
              <View style={styles.bannerDot} />
              <Text style={styles.bannerTitle}>Today's Summary</Text>
            </View>
            <Text style={styles.bannerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {/* Stat tiles */}
          <View style={styles.statRow}>
            <StatTile
              icon="flame-outline"
              iconColor={colors.accentDark}
              value={summary.calories > 0 ? `${summary.calories}` : '—'}
              label="kcal"
              onPress={() => navigation.navigate('Food')}
            />

            <View style={styles.statDivider} />

            <StatTile
              icon="medkit-outline"
              iconColor={colors.accentDark}
              value={
                summary.medicinesTotal > 0
                  ? `${summary.medicinesTaken}/${summary.medicinesTotal}`
                  : '—'
              }
              label="Medicines"
              onPress={() => navigation.navigate('Medicine')}
            />

            <View style={styles.statDivider} />

            <StatTile
              icon="barbell-outline"
              iconColor={colors.accentDark}
              value={summary.weight != null ? `${summary.weight} kg` : '—'}
              label="Weight"
              onPress={() => navigation.navigate('Weight')}
            />
          </View>

     
        </View>

        {/* ── Modules ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Modules</Text>
        </View>

        <View style={styles.moduleList}>
          {MODULES.map((m) => (
            <ModuleCard
              key={m.route}
              {...m}
              onPress={() => navigation.navigate(m.route)}
            />
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.m,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },

  // ── Summary Banner
  summaryBanner: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border + '70',
    ...shadows.soft,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },
  bannerDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Stat tiles
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },

  // Medicine progress
  medProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border + '60',
  },
  medProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.l2,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  medProgressFill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  medProgressLabel: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },

  // ── Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Module cards (full-width rows)
  moduleList: {
    gap: spacing.s,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border + '60',
    ...shadows.soft,
    gap: spacing.m,
  },
  moduleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleTextCol: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  moduleArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});