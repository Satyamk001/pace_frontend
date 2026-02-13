import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { InsightCard } from '../components/InsightCard';
import { MascotCorner } from '../components/MascotCorner';
import { StatsSkeleton } from '../components/ui/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';

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

  // Completion rate & Counts
  const totalTasks = summary.totalTasks || 0;
  const calmDays = summary.calmDays || 0;
  const painDays = summary.painDays || 0;
  const streak = summary.streak || 0;

  // Build chart data from real health history
  const getChartData = () => {
      if (!healthData || healthData.length === 0) return { labels: [], datasets: [{ data: [0] }] };
      
      // Sample data points for readability (aim for ~6-8 labels on X axis)
      // For 365 days, step ~45. For 30 days, step ~5.
      const targetLabels = 6;
      const step = Math.ceil(healthData.length / targetLabels);
      
      const labels = healthData
          .filter((_: any, i: number) => i % step === 0)
          .map((h: any) => {
              const d = new Date(h.date);
              return `${d.getMonth()+1}/${d.getDate()}`;
          });

      const painData = healthData.map((h: any) => h.pain_level || 0);
      const fatigueData = healthData.map((h: any) => h.fatigue_level || 0);

      // Downsample data if too huge for performance (ChartKit can lag with 365 points)
      // Ensure we match the labels length roughly or just pass full data if ChartKit handles it (it draws bezier)
      // ChartKit needs `data` array length to match `labels` if used strictly, but for Bezier it often interpolates. 
      // Safest: pass full data for lines, but labels are just X-axis strings.
      // Actually ChartKit behaves best when data points align. Let's just pass all points for the line 
      // but we need to match dataset length to labels length? No, labels are just string ticks.
      // WAIT: ChartKit maps data[i] to label[i]. If lengths mismatch, it looks weird.
      // So we MUST downsample the data points to match the labels if we want them aligned.
      
      const sampledData = healthData.filter((_: any, i: number) => i % step === 0);
      const sampledPain = sampledData.map((h: any) => h.pain_level || 0);
      const sampledFatigue = sampledData.map((h: any) => h.fatigue_level || 0);

      return {
          labels,
          datasets: [
              {
                  data: sampledPain,
                  color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})`, // Error/Red for pain
                  strokeWidth: 2
              },
              {
                  data: sampledFatigue,
                  color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`, // Blue for fatigue
                  strokeWidth: 2
              }
          ],
          legend: ["Pain", "Fatigue"]
      };
  };

  const chartConfig = {
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      color: (opacity = 1) => colors.primary,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
      labelColor: (opacity = 1) => colors.textLight,
      propsForDots: {
          r: "3",
          strokeWidth: "1",
          stroke: colors.surface
      },
      fillShadowGradientFrom: colors.surface,
      fillShadowGradientTo: colors.surface,
  };

  const getRangeLabel = () => {
      switch(selectedRange) {
          case '7': return 'Past 7 Days';
          case '30': return 'Past 30 Days';
          case '90': return 'Past 3 Months';
          case '365': return 'Past Year';
          default: return 'Selected Period';
      }
  };

  if (loading && !stats) {
    return <StatsSkeleton />;
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
        {/* Row 1: Tasks & Streak */}
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
                    subtitle="Consecutive"
                    icon={<Ionicons name="flame" size={20} color="#FF6B35" />}
                    color="#FF6B35"
                />
            </View>
        </View>

        {/* Row 2: Calm Days & Pain Days (New) */}
        <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
                <InsightCard 
                    title="Calm Days" 
                    value={calmDays}
                    subtitle="No flare-ups"
                    icon={<Ionicons name="leaf" size={20} color={colors.success} />}
                    color={colors.success}
                />
            </View>
            <View style={styles.cardHalf}>
                <InsightCard 
                    title="Pain Days" 
                    value={painDays}
                    subtitle="High Pain (7+)"
                    icon={<Ionicons name="alert-circle" size={20} color={colors.error} />}
                    color={colors.error}
                />
            </View>
        </View>

        {/* Health Trends Chart */}
        <View style={styles.chartCard}>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
                <View>
                    <Text style={styles.chartTitle}>Health Trends</Text>
                    <Text style={styles.chartSubtitle}>{getRangeLabel()}</Text>
                </View>
                <View style={{alignItems:'flex-end'}}>
                   <Text style={{fontSize:10, color:colors.textLight}}>Avg Pain: {avgPain}</Text>
                   <Text style={{fontSize:10, color:colors.textLight}}>Avg Fatigue: {avgFatigue}</Text>
                </View>
            </View>
            
            {healthData.length > 0 ? (
                <LineChart
                    data={getChartData()}
                    width={screenWidth - 48} // Adjusted for padding
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={false}
                    fromZero
                />
            ) : (
                <View style={styles.noDataChart}>
                    <Ionicons name="analytics-outline" size={48} color={colors.border} />
                    <Text style={styles.noDataText}>No data for this period.</Text>
                    <Text style={styles.noDataHint}>Log your daily health to see trends.</Text>
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
