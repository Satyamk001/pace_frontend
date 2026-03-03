import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import {colors, typography, spacing, borderRadius} from '../theme';
import { createApiService } from '../services/api';
import { HealthTrendsChart } from '../components/HealthTrendsChart';
import { useFocusEffect } from '@react-navigation/native';
import { StatsContentSkeleton } from '../components/ui/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { useSubscription } from '../context/SubscriptionContext';

import { BackButton } from '../components/ui/BackButton';
import { StatCard } from '../components/ui/StatCard';

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


    const fetchGraphStats = async () => {
        try {
            const data = await api.getStats('365');
            setGraphData(data);
        } catch (e) {
            console.error('Failed to fetch graph stats:', e);
        }
    };

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

    const loadAll = async () => {
        if (!graphData) setLoading(true);
        await Promise.all([fetchGraphStats(), fetchSummaryStats()]);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchGraphStats(), fetchSummaryStats()]);
        setRefreshing(false);
    }, [selectedRange]);

    useFocusEffect(useCallback(() => { loadAll(); }, []));

    useEffect(() => { fetchSummaryStats(); }, [selectedRange]);

    const chartData = useMemo(() => {
        if (!graphData?.history?.health) return [];
        const healthData = graphData.history.health;
        
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - monthOffset);
        
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        // Generate array of days for the target month
        const result = Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            
            const log = healthData.find((h: any) => {
                const hd = new Date(h.date);
                return hd.getDate() === dayNum && hd.getMonth() === targetMonth && hd.getFullYear() === targetYear;
            });

            return {
                day: String(dayNum),
                pain: log?.pain_level ?? 0,
                fatigue: log?.fatigue_level ?? 0,
                hasData: !!log,
                isToday: monthOffset === 0 && dayNum === new Date().getDate()
            };
        });

        return result;
    }, [graphData, monthOffset]);

    const hasData = chartData.some(d => d.hasData);
    const summary = summaryData?.summary || {};



    return (
        <ScreenLayout edges={['top']} useGradient>
            <View style={styles.header}>
                <BackButton style={styles.backBtn} />
                <Text style={styles.headerTitle}>Insights</Text>
            </View>

            <View style={styles.rangeContainer}>
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
            </View>

            {loading ? (
                <StatsContentSkeleton />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Primary Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard label="Tasks Done" value={summary.totalTasks || 0} icon="checkmark-circle" color={colors.accent} isLoading={isStatsLoading} suffix={summary.completionRate ? ` (${summary.completionRate}%)` : ''} />
                        <StatCard label="Current Streak" value={summary.streak || 0} icon="flame" color={'#FF9500'} suffix="d" isLoading={isStatsLoading} />
                        <StatCard label="Calm Days" value={summary.calmDays || 0} icon="leaf" color={colors.success} isLoading={isStatsLoading} suffix="" />
                        <StatCard label="High Pain Days" value={summary.painDays || 0} icon="alert-circle" color={colors.error} isLoading={isStatsLoading} suffix="" />
                    </View>

                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={styles.chartTitle}>Health Trends</Text>
                                <Text style={styles.chartSubtitle}>
                                    {(() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() - monthOffset);
                                        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                                    })()}
                                </Text>
                            </View>
                            <View style={styles.navArrows}>
                                <TouchableOpacity 
                                    onPress={() => setMonthOffset(m => m + 1)} 
                                    style={styles.arrowBtn}
                                >
                                    <Ionicons name="chevron-back" size={24} color={colors.accentDark} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setMonthOffset(m => Math.max(0, m - 1))} 
                                    style={[styles.arrowBtn, monthOffset === 0 && { opacity: 0.3 }]}
                                    disabled={monthOffset === 0}
                                >
                                    <Ionicons name="chevron-forward" size={24} color={colors.accentDark} />
                                </TouchableOpacity>
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
                                <Text style={styles.noDataText}>No records found</Text>
                                <Text style={styles.noDataHint}>Log your vitals to see trends here.</Text>
                            </View>
                        )}
                    </View>

                    {/* Premium Upgrade */}
                    {!isProUser && (
                        <TouchableOpacity
                            style={styles.premiumCard}
                            onPress={() => navigation.navigate('Premium')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.premiumContent}>
                                <Text style={styles.premiumTitle}>Unlock Deep Insights</Text>
                                <Text style={styles.premiumSubtitle}>Find patterns between sleep, activity, and pain.</Text>
                            </View>
                            <View style={styles.premiumBadge}>
                                <Ionicons name="sparkles" size={16} color={colors.surface} />
                                <Text style={styles.premiumBtnText}>Pro</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        paddingBottom: spacing.s,
    },
    backBtn: {
        marginRight: spacing.s,
    },
    headerTitle: {
        ...typography.h2,
        ...typography.h2,
        color: colors.text,
    },
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
    },
    rangeText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    rangeTextActive: {
        color: colors.accent,
    },
    scrollContent: {
        paddingHorizontal: spacing.l,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },

    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.border + '20',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.l,
    },
    chartTitle: {
        ...typography.bodyBold,
        ...typography.body,
        color: colors.text,
    },
    chartSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    navArrows: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    arrowBtn: {
        padding: spacing.xs,
        // backgroundColor: colors.surface,
        // borderRadius: borderRadius.round,
        borderRadius: borderRadius.m,
        backgroundColor: colors.accentSoft,
        color: colors.accent ,
    },
    monthNav: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    navBtn: {
        padding: 6,
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.s,
    },
    navBtnDisabled: {
        opacity: 0.3,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: spacing.s,
    },
    noDataChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIconCircle: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surfaceSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.s,
    },
    noDataText: {
        ...typography.bodyBold,
        color: colors.textSecondary,
    },
    noDataHint: {
        ...typography.caption,
        color: colors.textLight,
    },
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.text, // Dark mode aesthetic for premium
        padding: spacing.l,
        borderRadius: borderRadius.l,
    },
    premiumContent: {
        flex: 1,
    },
    premiumTitle: {
        ...typography.bodyBold,
        ...typography.body,
    color: colors.surface,
        
    },
    premiumSubtitle: {
        ...typography.caption,
        color: colors.surface,
        opacity: 0.7,
        marginTop: 2,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.s,
        paddingVertical: 6,
        borderRadius: borderRadius.l,
        gap: spacing.xs,
    },
    premiumBtnText: {
        ...typography.caption,
    color: colors.surface,
        
    },
});