import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Platform, Animated, ActivityIndicator,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, typography, spacing, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { HealthTrendsChart } from '../components/HealthTrendsChart';
import { useFocusEffect } from '@react-navigation/native';
import { StatsContentSkeleton } from '../components/ui/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { useSubscription } from '../context/SubscriptionContext';
import { BackButton } from '../components/ui/BackButton';
import { StatCard } from '../components/ui/StatCard';
import { HealthInsightCard } from '../components/ui/HealthInsightCard';

const RANGE_OPTIONS = [
    { label: '7D', value: '7' },
    { label: '30D', value: '30' },
    { label: '3M', value: '90' },
    { label: '1Y', value: '365' },
];

export const StatsScreen = ({ navigation }: any) => {
    const { getToken } = useAuth();
    const { isProUser } = useSubscription();
    const api = createApiService(getToken);

    const [graphData, setGraphData] = useState<any>(null);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRange, setSelectedRange] = useState('30');
    const [monthOffset, setMonthOffset] = useState(0);
    const [insights, setInsights] = useState<any>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    // Fade-in for scroll content after load
    const contentOpacity = useRef(new Animated.Value(0)).current;

    const fadeIn = () =>
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // ── Data fetching ──────────────────────────────────────────
    const fetchGraphStats = async () => {
        try {
            const data = await api.getStats('365');
            setGraphData(data);
        } catch (e) { console.error('Failed to fetch graph stats:', e); }
    };

    const fetchSummaryStats = async () => {
        setIsStatsLoading(true);
        try {
            const data = await api.getStats(selectedRange);
            setSummaryData(data);
        } catch (e) { console.error('Failed to fetch summary stats:', e); }
        finally { setIsStatsLoading(false); }
    };

    const fetchInsights = async () => {
        setInsightsLoading(true);
        try {
            const data = await api.getHealthInsights();
            setInsights(data);
        } catch (e) { console.error('Failed to fetch insights:', e); }
        finally { setInsightsLoading(false); }
    };

    const loadAll = async () => {
        if (!graphData) setLoading(true);
        await Promise.all([fetchGraphStats(), fetchSummaryStats(), fetchInsights()]);
        setLoading(false);
        fadeIn();
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchGraphStats(), fetchSummaryStats(), fetchInsights()]);
        setRefreshing(false);
    }, [selectedRange]);

    useFocusEffect(useCallback(() => { loadAll(); }, []));
    useEffect(() => { fetchSummaryStats(); }, [selectedRange]);

    // ── Chart data ─────────────────────────────────────────────
    const chartData = useMemo(() => {
        if (!graphData?.history?.health) return [];
        const healthData = graphData.history.health;
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - monthOffset);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const log = healthData.find((h: any) => {
                const hd = new Date(h.date);
                return hd.getDate() === dayNum && hd.getMonth() === m && hd.getFullYear() === y;
            });
            return {
                day: String(dayNum),
                pain: log?.pain_level ?? 0,
                fatigue: log?.fatigue_level ?? 0,
                hasData: !!log,
                isToday: monthOffset === 0 && dayNum === new Date().getDate(),
            };
        });
    }, [graphData, monthOffset]);

    const hasData = chartData.some(d => d.hasData);
    const summary = summaryData?.summary || {};

    // Current month label for chart header
    const monthLabel = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - monthOffset);
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }, [monthOffset]);

    return (
        <ScreenLayout edges={['top']} useGradient>

            {/* ── Header ── */}
            <View style={styles.header}>
                <BackButton style={styles.backBtn} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Insights</Text>
                    <Text style={styles.headerSub}>Your health at a glance</Text>
                </View>
            </View>

            {/* ── Range selector ── */}
            <View style={styles.rangeContainer}>
                <View style={styles.rangeSelector}>
                    {RANGE_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.rangeBtn, selectedRange === opt.value && styles.rangeBtnActive]}
                            onPress={() => setSelectedRange(opt.value)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.rangeText, selectedRange === opt.value && styles.rangeTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <StatsContentSkeleton />
            ) : (
                <Animated.ScrollView
                    style={{ opacity: contentOpacity }}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Stats grid ── */}
                    <View style={styles.statsGrid}>
                        <StatCard label="Tasks Done" value={summary.totalTasks || 0} icon="checkmark-circle" color={colors.accent} isLoading={isStatsLoading} suffix={summary.completionRate ? ` (${summary.completionRate}%)` : ''} />
                        <StatCard label="Streak" value={summary.streak || 0} icon="flame" color={'#FF9500'} isLoading={isStatsLoading} suffix="d" />
                        <StatCard label="Calm Days" value={summary.calmDays || 0} icon="leaf" color={colors.success} isLoading={isStatsLoading} suffix="" />
                        <StatCard label="High Pain Days" value={summary.painDays || 0} icon="alert-circle" color={colors.error} isLoading={isStatsLoading} suffix="" />
                    </View>

                    {/* ── Health Trends chart card ── */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={styles.chartTitle}>Health Trends</Text>
                                <Text style={styles.chartSubtitle}>{monthLabel}</Text>
                            </View>

                            {/* Month navigation */}
                            <View style={styles.navArrows}>
                                <TouchableOpacity
                                    style={styles.arrowBtn}
                                    onPress={() => setMonthOffset(m => m + 1)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="chevron-back" size={18} color={colors.accentDark} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.arrowBtn, monthOffset === 0 && styles.arrowBtnDisabled]}
                                    onPress={() => setMonthOffset(m => Math.max(0, m - 1))}
                                    disabled={monthOffset === 0}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="chevron-forward" size={18} color={colors.accentDark} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Chart legend */}
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                                <Text style={styles.legendLabel}>Pain</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                                <Text style={styles.legendLabel}>Fatigue</Text>
                            </View>
                        </View>

                        {hasData ? (
                            <View style={styles.chartContainer}>
                                <HealthTrendsChart data={chartData} />
                            </View>
                        ) : (
                            <View style={styles.noDataChart}>
                                <View style={styles.emptyIconCircle}>
                                    <Ionicons name="analytics-outline" size={32} color={colors.border} />
                                </View>
                                <Text style={styles.noDataText}>No records this month</Text>
                                <Text style={styles.noDataHint}>Log your vitals to see trends here.</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Health Intelligence ── */}
                    <View style={styles.insightSection}>
                        <View style={styles.insightHeader}>
                            <View style={styles.insightIconWrap}>
                                <Ionicons name="bulb" size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.insightTitle}>Health Intelligence</Text>
                            {insightsLoading && (
                                <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 'auto' }} />
                            )}
                        </View>

                        {insightsLoading ? (
                            <View style={styles.insightLoading}>
                                <Text style={styles.insightLoadingText}>Analyzing your health data…</Text>
                            </View>
                        ) : insights?.insights?.length > 0 ? (
                            insights.insights.map((item: any, idx: number) => (
                                <HealthInsightCard
                                    key={idx}
                                    title={item.title}
                                    insight={item.insight}
                                    type={item.type}
                                />
                            ))
                        ) : (
                            <View style={styles.insightEmpty}>
                                <Ionicons name="document-text-outline" size={28} color={colors.border} />
                                <Text style={styles.insightEmptyText}>
                                    {insights?.message || 'Log food and health data for at least 5 days to unlock AI insights.'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Premium upgrade card ── */}
                    {!isProUser && (
                        <TouchableOpacity
                            style={styles.premiumCard}
                            onPress={() => navigation.navigate('Premium')}
                            activeOpacity={0.88}
                        >
                            <View style={styles.premiumLeft}>
                                <View style={styles.premiumIconWrap}>
                                    <Ionicons name="sparkles" size={20} color={colors.surface} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.premiumTitle}>Unlock Deep Insights</Text>
                                    <Text style={styles.premiumSubtitle}>Find patterns between sleep, activity, and pain.</Text>
                                </View>
                            </View>
                            <View style={styles.premiumBadge}>
                                <Text style={styles.premiumBtnText}>Go Pro</Text>
                                <Ionicons name="arrow-forward" size={13} color={colors.surface} />
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 60 }} />
                </Animated.ScrollView>
            )}
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        paddingBottom: spacing.s,
        gap: spacing.s,
    },
    backBtn: { marginRight: spacing.xs },
    headerTitle: {
        ...typography.h3,
        color: colors.text,
    },
    headerSub: {
        ...typography.caption,
        color: colors.textLight,
        marginTop: 1,
    },

    // ── Range selector ──
    rangeContainer: {
        paddingHorizontal: spacing.l,
        marginBottom: spacing.l,
    },
    rangeSelector: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.m,
        padding: spacing.xs,
    },
    rangeBtn: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.s,
    },
    rangeBtnActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    rangeText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    rangeTextActive: {
        color: colors.accent,
        fontWeight: '700',
    },

    scrollContent: {
        paddingHorizontal: spacing.l,
    },

    // ── Stats grid ──
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },

    // ── Chart card ──
    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    chartTitle: {
        ...typography.bodyBold,
        color: colors.text,
    },
    chartSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    navArrows: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    arrowBtn: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.s,
        backgroundColor: colors.accentSoft2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowBtnDisabled: {
        opacity: 0.3,
    },
    chartLegend: {
        flexDirection: 'row',
        gap: spacing.m,
        marginBottom: spacing.m,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 11,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: spacing.s,
    },
    noDataChart: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.s,
    },
    emptyIconCircle: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surfaceSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noDataText: {
        ...typography.bodyBold,
        color: colors.textSecondary,
    },
    noDataHint: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
    },

    // ── Insights section ──
    insightSection: {
        marginBottom: spacing.l,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginBottom: spacing.m,
    },
    insightIconWrap: {
        width: 28,
        height: 28,
        borderRadius: borderRadius.s,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightTitle: {
        ...typography.bodyBold,
        color: colors.text,
    },
    insightLoading: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    insightLoadingText: {
        ...typography.caption,
        color: colors.textLight,
        fontStyle: 'italic',
    },
    insightEmpty: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
        gap: spacing.s,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.l,
    },
    insightEmptyText: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 18,
    },

    // ── Premium card ──
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.text,
        padding: spacing.l,
        borderRadius: borderRadius.l,
        gap: spacing.m,
    },
    premiumLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    premiumIconWrap: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.s,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        ...typography.bodyBold,
        color: colors.surface,
    },
    premiumSubtitle: {
        ...typography.caption,
        color: colors.surface,
        opacity: 0.65,
        marginTop: 2,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.round,
        gap: spacing.xs,
    },
    premiumBtnText: {
        ...typography.caption,
        color: colors.surface,
        fontWeight: '700',
    },
});