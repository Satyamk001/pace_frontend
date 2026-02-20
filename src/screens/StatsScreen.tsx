import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { HealthTrendsChart } from '../components/HealthTrendsChart';
import { useFocusEffect } from '@react-navigation/native';
import { StatsContentSkeleton, SkeletonBox } from '../components/ui/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ui/ScreenLayout';

const screenWidth = Dimensions.get('window').width;

const RANGE_OPTIONS = [
    { label: '7D', value: '7' },
    { label: '30D', value: '30' },
    { label: '3M', value: '90' },
    { label: '1Y', value: '365' },
];


export const StatsScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);
  
  // Data State
  const [graphData, setGraphData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  
  // Filter State
  const [selectedRange, setSelectedRange] = useState('30');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation Logic
  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    // Prevent future navigation check
    const today = new Date();
    if (newDate > today) return; 
    
    setCurrentDate(newDate);
  };

  const canGoNext = (() => {
      const today = new Date();
      const testDate = new Date(currentDate);
      testDate.setMonth(testDate.getMonth() + 1);
      return testDate <= today || (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()); 
      // Actually strictly: disable if current view IS current month
      return !(currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear());
  })();

  // 1. Fetch Graph Data (Always 1 Year to support Month Nav)
  // We fetch 365 days to allow local filtering by month without re-fetching
  const fetchGraphStats = async () => {
    try {
      const data = await api.getStats('365');
      setGraphData(data);
    } catch (e) {
      console.error('Failed to fetch graph stats:', e);
    }
  };

  // 2. Fetch Summary Data (Based on Selected Range)
  const fetchSummaryStats = async () => {
      setIsStatsLoading(true);
      try {
          const data = await api.getStats(selectedRange);
          setSummaryData(data);
      } catch (e) {
          console.error('Failed to fetch summary stats:', e);
      } finally {
          setIsStatsLoading(false);
      }
  };

  // Combined Load
  const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchGraphStats(), fetchSummaryStats()]);
      setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchGraphStats(), fetchSummaryStats()]);
    setRefreshing(false);
  }, [selectedRange, currentDate]);

  // Initial Load
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  // Update Summary when Range Changes
  useEffect(() => {
      fetchSummaryStats();
  }, [selectedRange]);

  const getChartData = () => {
      if (!graphData?.history?.health) return [];
      
      const healthData = graphData.history.health;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Find logs for this specific month
      const logsInMonth = healthData.filter((h: any) => {
          const logDate = new Date(h.date);
          return logDate.getMonth() === month && logDate.getFullYear() === year;
      });

      // Get days in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      return Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const log = logsInMonth.find((h: any) => new Date(h.date).getDate() === day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return {
              day: day, 
              pain: log?.pain_level ?? 0,
              fatigue: log?.fatigue_level ?? 0,
              hasData: !!log,
              isToday: isToday
          };
      });
  };

  const chartData = getChartData();
  const hasData = chartData.some(d => d.hasData);
  const summary = summaryData?.summary || {};

  return (
    <ScreenLayout edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
      </View>

      <View style={styles.rangeSelector}>
          {RANGE_OPTIONS.map((opt) => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.rangeBtn, selectedRange === opt.value && styles.rangeBtnActive]}
                onPress={() => setSelectedRange(opt.value)}
              >
                  <Text style={[styles.rangeText, selectedRange === opt.value && styles.rangeTextActive]}>
                      {opt.label}
                  </Text>
              </TouchableOpacity>
          ))}
      </View>

      {loading ? (
        <StatsContentSkeleton />
      ) : (
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
                <>
                    <View style={styles.statsRow}>
                        <View style={styles.statsItem}>
                            {isStatsLoading ? (
                                <SkeletonBox width={40} height={32} borderRadius={8} style={{ marginBottom: 4 }} />
                            ) : (
                                <Text style={styles.statsValue}>{summary.totalTasks || 0}</Text>
                            )}
                            <Text style={styles.statsLabel}>Tasks Done</Text>
                        </View>
                        <View style={styles.statsItem}>
                            {isStatsLoading ? (
                                <SkeletonBox width={40} height={32} borderRadius={8} style={{ marginBottom: 4 }} />
                            ) : (
                                <Text style={styles.statsValue}>{summary.streak || 0}🔥</Text>
                            )}
                            <Text style={styles.statsLabel}>Streak</Text>
                        </View>
                    </View>
                    <View style={styles.statsDivider} />
                    <View style={styles.statsRow}>
                        <View style={styles.statsItem}>
                            {isStatsLoading ? (
                                <SkeletonBox width={40} height={32} borderRadius={8} style={{ marginBottom: 4 }} />
                            ) : (
                                <Text style={[styles.statsValue, {color: colors.accent}]}>{summary.calmDays || 0}</Text>
                            )}
                            <Text style={styles.statsLabel}>Calm Days</Text>
                        </View>
                        <View style={styles.statsItem}>
                            {isStatsLoading ? (
                                <SkeletonBox width={40} height={32} borderRadius={8} style={{ marginBottom: 4 }} />
                            ) : (
                                <Text style={[styles.statsValue, {color: colors.error}]}>{summary.painDays || 0}</Text>
                            )}
                            <Text style={styles.statsLabel}>Pain Days</Text>
                        </View>
                    </View>
                </>

        </View>

                {/* Journal Bar Chart */}
            <View style={styles.chartCard}>
                
                {/* Chart Header - Month Navigation */}
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartTitle}>Health Trends</Text>
                        <Text style={styles.chartSubtitle}>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.monthNav}>
                        <TouchableOpacity 
                            onPress={goToPrevMonth}
                            style={styles.navBtn}
                        >
                            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={goToNextMonth}
                            disabled={!canGoNext}
                            style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
                        >
                            <Ionicons name="chevron-forward" size={20} color={!canGoNext ? colors.border : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Chart Content */}
                {hasData ? (
                    <View style={styles.chartContainer}>
                        <HealthTrendsChart data={chartData} />
                    </View>
                ) : (
                    <View style={styles.noDataChart}>
                        <Ionicons name="journal-outline" size={32} color={colors.textLight} />
                        <Text style={styles.noDataText}>No Data</Text>
                        <Text style={styles.noDataHint}>
                            No logs found for this period.
                        </Text>
                    </View>
                )}
            </View>

        {/* Premium Upgrade */}
        <TouchableOpacity 
            style={styles.premiumCard}
            onPress={() => navigation.navigate('Premium')}
        >
            <View style={{flex: 1}}>
                <Text style={styles.premiumTitle}>Unlock Advanced Analysis</Text>
                <Text style={styles.premiumSubtitle}>Identify triggers, correlations & more.</Text>
            </View>
            <View style={styles.premiumIcon}>
                <Ionicons name="lock-closed" size={20} color={colors.premium} />
            </View>
        </TouchableOpacity>

        <View style={{height: 100}} />
      </ScrollView>
      )}

      
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background and safe area handled by ScreenLayout
  },
  header: {
      paddingHorizontal: spacing.l,
      marginBottom: spacing.m,
      paddingTop: spacing.m,
      flexDirection: 'row',
      alignItems: 'center',
  },
  headerTitle: {
      ...typography.header,
      color: colors.text,
  },
  monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  navBtn: {
      padding: 8,
      backgroundColor: colors.l2,
      borderRadius: borderRadius.s,
      ...shadows.level1,
  },
  navBtnDisabled: {
      opacity: 0.3,
      ...shadows.soft, // flatter
  },
  content: {
      paddingHorizontal: spacing.l,
      paddingBottom: 100,
  },
  chartCard: {
      backgroundColor: colors.l1,
      borderRadius: borderRadius.l,
      padding: spacing.m, 
      marginBottom: spacing.m,
      ...shadows.level1,
      borderWidth: 1,
      borderColor: colors.border + '30', 
  },
  chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.s,
      paddingHorizontal: spacing.xs
  },
  chartTitle: {
      ...typography.bodyBold,
      color: colors.text,
      fontSize: 15,
  },
  chartSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '600'
  },
  chartContainer: {
     alignItems: 'center',
     justifyContent: 'center',
     overflow: 'hidden',
  },
  noDataChart: {
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      opacity: 0.6
  },
  noDataText: {
      color: colors.textSecondary,
      fontWeight: '600'
  },
  noDataHint: {
      ...typography.caption,
      color: colors.textLight,
  },
  statsGrid: {
      flexDirection: 'column',
      backgroundColor: colors.l1,
      borderRadius: borderRadius.l,
      padding: spacing.m,
      marginBottom: spacing.l,
      ...shadows.level1,
  },
  statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
  },
  statsDivider: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.1,
      marginVertical: spacing.m,
  },
  statsItem: {
      alignItems: 'center',
      flex: 1,
  },
  statsValue: {
      ...typography.header,
      fontSize: 24,
      color: colors.text,
      marginBottom: 4
  },
  statsLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600'
  },
  premiumCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.l2,
      padding: spacing.l,
      borderRadius: borderRadius.l,
      marginTop: spacing.s,
      borderWidth: 1,
      borderColor: colors.premium + '40',
      borderStyle: 'dashed'
  },
  premiumTitle: {
      fontWeight: 'bold',
      color: colors.premium,
      fontSize: 15
  },
  premiumSubtitle: {
      ...typography.caption,
      color: colors.premium,
      opacity: 0.8,
      marginTop: 2
  },
  premiumIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.premium + '20',
      alignItems: 'center',
      justifyContent: 'center'
  },
  // Styles
  rangeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.l1, 
      borderRadius: borderRadius.m,
      padding: 4,
      marginHorizontal: spacing.l,
      marginBottom: spacing.l,
  },
  rangeBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.s,
  },
  rangeBtnActive: {
      backgroundColor: colors.l0, 
      ...shadows.level1,
  },
  rangeText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
  },
  rangeTextActive: {
      color: colors.primary, 
      fontWeight: '700',
  },
});
