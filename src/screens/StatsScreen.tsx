import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { InsightCard } from '../components/InsightCard';
import { MascotCorner } from '../components/MascotCorner';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const RANGE_OPTIONS = [
    { label: '7D', value: '7' },
    { label: '30D', value: '30' },
    { label: '3M', value: '90' },
];

export const StatsScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState('30');

  const fetchStats = async () => {
    try {
      const data = await api.getStats(selectedRange);
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [selectedRange]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStats();
    }, [selectedRange])
  );

  // Compute derived values from real data
  const summary = stats?.summary || {};
  const healthData = stats?.history?.health || [];

  // Calculate avg pain from health history
  const avgPain = healthData.length > 0 
    ? (healthData.reduce((sum: number, h: any) => sum + (h.pain_level || 0), 0) / healthData.length).toFixed(1)
    : '—';

  // Calculate avg fatigue from health history
  const avgFatigue = healthData.length > 0
    ? (healthData.reduce((sum: number, h: any) => sum + (h.fatigue_level || 0), 0) / healthData.length).toFixed(1)
    : '—';

  // Completion rate
  const totalTasks = summary.totalTasks || 0;
  const calmDays = summary.calmDays || 0;
  const streak = summary.streak || 0;

  // Build chart data from real health history
  const getChartData = () => {
      if (!healthData || healthData.length === 0) return { labels: [], datasets: [{ data: [0] }] };
      
      // Sample data points for readability
      const step = healthData.length > 20 ? Math.ceil(healthData.length / 10) : 1;
      
      const sampled = healthData.filter((_: any, i: number) => i % step === 0);

      const labels = sampled.map((h: any) => {
          const d = new Date(h.date);
          return `${d.getMonth()+1}/${d.getDate()}`;
      });

      const painData = sampled.map((h: any) => h.pain_level || 0);
      const fatigueData = sampled.map((h: any) => h.fatigue_level || 0);

      return {
          labels,
          datasets: [
              {
                  data: painData,
                  color: (opacity = 1) => `rgba(239, 154, 154, ${opacity})`, // Soft red for pain
                  strokeWidth: 3
              },
              {
                  data: fatigueData,
                  color: (opacity = 1) => `rgba(144, 202, 249, ${opacity})`, // Soft blue for fatigue
                  strokeWidth: 2
              }
          ],
          legend: ["Pain Level", "Fatigue Level"]
      };
  };

  const chartConfig = {
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      color: (opacity = 1) => colors.primary,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: true,
      decimalPlaces: 0,
      labelColor: (opacity = 1) => colors.textLight,
      propsForDots: {
          r: "4",
          strokeWidth: "2",
          stroke: colors.surface
      }
  };

  const getRangeLabel = () => {
      switch(selectedRange) {
          case '7': return 'Past 7 Days';
          case '30': return 'Past 30 Days';
          case '90': return 'Past 3 Months';
          default: return 'Selected Period';
      }
  };

  if (loading && !stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textLight, marginTop: spacing.m }}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards Row */}
        <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
                <InsightCard 
                    title="Tasks Done" 
                    value={totalTasks}
                    subtitle={getRangeLabel()}
                    icon={<Ionicons name="checkbox" size={20} color={colors.secondary} />}
                    color={colors.secondary}
                />
            </View>
            <View style={styles.cardHalf}>
                <InsightCard 
                    title="Streak" 
                    value={`${streak} 🔥`}
                    subtitle="Consecutive days"
                    icon={<Ionicons name="flame" size={20} color="#FF6B35" />}
                    color="#FF6B35"
                />
            </View>
        </View>

        <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
                <InsightCard 
                    title="Avg Pain" 
                    value={avgPain}
                    subtitle={getRangeLabel()}
                    icon={<Ionicons name="medical" size={20} color={colors.error} />}
                    color={colors.error}
                />
            </View>
            <View style={styles.cardHalf}>
                <InsightCard 
                    title="Avg Fatigue" 
                    value={avgFatigue}
                    subtitle={getRangeLabel()}
                    icon={<Ionicons name="battery-half" size={20} color={colors.primary} />}
                    color={colors.primary}
                />
            </View>
        </View>

        <InsightCard 
            title="Calm Days" 
            value={calmDays}
            subtitle="Days without flare-ups"
            icon={<Ionicons name="leaf" size={20} color={colors.success} />}
            color={colors.success}
        />

        {/* Health Trends Chart */}
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Health Trends</Text>
            <Text style={styles.chartSubtitle}>{getRangeLabel()}</Text>
            {healthData.length > 0 ? (
                <LineChart
                    data={getChartData()}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                />
            ) : (
                <View style={styles.noDataChart}>
                    <Ionicons name="analytics-outline" size={48} color={colors.border} />
                    <Text style={styles.noDataText}>No health data logged yet.</Text>
                    <Text style={styles.noDataHint}>Log your daily health check-in to see trends here.</Text>
                </View>
            )}
        </View>

        {/* Premium Upsell */}
        <TouchableOpacity 
            style={styles.premiumCard}
            onPress={() => navigation.navigate('Premium')}
        >
            <View>
                <Text style={styles.premiumTitle}>Unlock Advanced Analytics</Text>
                <Text style={styles.premiumSubtitle}>See correlations & extended history.</Text>
            </View>
            <Ionicons name="lock-closed" size={24} color="#DAA520" />
        </TouchableOpacity>

        <View style={{height: 80}} />
      </ScrollView>
      <MascotCorner mood="SLEEPY" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  header: {
      paddingHorizontal: spacing.l,
      marginBottom: spacing.m,
  },
  headerTitle: {
      ...typography.header,
      color: colors.text,
  },
  rangeSelector: {
      flexDirection: 'row',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.l,
      gap: spacing.m,
  },
  rangeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
  },
  rangeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
  },
  rangeText: {
      ...typography.caption,
      fontWeight: 'bold',
  },
  rangeTextActive: {
      color: '#FFF',
  },
  content: {
      paddingHorizontal: spacing.l,
      paddingBottom: 100,
  },
  cardRow: {
      flexDirection: 'row',
      gap: spacing.m,
  },
  cardHalf: {
      flex: 1,
  },
  chartCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.l,
      padding: spacing.l,
      marginBottom: spacing.m,
      ...shadows.soft,
      alignItems: 'center'
  },
  chartTitle: {
      ...typography.bodyBold,
      alignSelf: 'flex-start',
      color: colors.text
  },
  chartSubtitle: {
      ...typography.caption,
      alignSelf: 'flex-start',
      color: colors.textLight,
      marginBottom: spacing.m,
  },
  noDataChart: {
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.s,
  },
  noDataText: {
      color: colors.textLight,
      fontStyle: 'italic',
      fontSize: 14,
  },
  noDataHint: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
  },
  premiumCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFBE6',
      padding: spacing.l,
      borderRadius: borderRadius.l,
      marginTop: spacing.s,
      borderWidth: 1,
      borderColor: '#FFD700',
      borderStyle: 'dashed'
  },
  premiumTitle: {
      fontWeight: 'bold',
      color: '#DAA520',
      fontSize: 16
  },
  premiumSubtitle: {
      ...typography.caption,
      color: '#B8860B',
      marginTop: 2
  }
});
