import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
    Dimensions, Platform, ActivityIndicator,
    FlatList, Animated,
} from 'react-native';
import { KeyboardAwareLayout } from '../components/ui/KeyboardAwareLayout';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { LineChart } from 'react-native-chart-kit';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';

const SCREEN_WIDTH = Dimensions.get('window').width;

const RANGE_OPTIONS = [
    { label: '30D', value: '30D' },
    { label: 'This Month', value: 'MONTH' },
    { label: 'This Year', value: 'YEAR' },
];

// ── History row ──────────────────────────────────────────────
const HistoryItem = React.memo(({ item, prevItem, index }: { item: any; prevItem: any; index: number }) => {
    const delta = prevItem ? parseFloat(item.weight) - parseFloat(prevItem.weight) : null;
    const isGain = delta !== null && delta > 0;
    const isLoss = delta !== null && delta < 0;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 260,
            delay: Math.min(index * 35, 300),
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.historyItem, { opacity: fadeAnim }]}>
            {/* Left: dot + date */}
            <View style={styles.historyLeft}>
                <View style={[
                    styles.historyDot,
                    isGain && styles.historyDotGain,
                    isLoss && styles.historyDotLoss,
                ]} />
                <View>
                    <Text style={styles.historyDate}>
                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    {delta !== null && delta !== 0 && (
                        <View style={styles.deltaRow}>
                            <Ionicons
                                name={isGain ? 'arrow-up' : 'arrow-down'}
                                size={10}
                                color={isGain ? colors.error : colors.success}
                            />
                            <Text style={[styles.deltaText, { color: isGain ? colors.error : colors.success }]}>
                                {Math.abs(delta).toFixed(1)} kg from prev
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Right: value badge */}
            <View style={[
                styles.weightBadge,
                isGain && styles.weightBadgeGain,
                isLoss && styles.weightBadgeLoss,
            ]}>
                <Text style={[
                    styles.historyValue,
                    isGain && { color: colors.error },
                    isLoss && { color: colors.success },
                ]}>
                    {parseFloat(item.weight).toFixed(1)}
                </Text>
                <Text style={styles.historyUnit}>kg</Text>
            </View>
        </Animated.View>
    );
});

// ── Main screen ──────────────────────────────────────────────
export const WeightScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const api = createApiService(getToken);

    const [weight, setWeight] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedRange, setSelectedRange] = useState('30D');
    const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });
    const [inputFocused, setInputFocused] = useState(false);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const fetchHistory = async () => {
        if (history.length === 0) setLoading(true);
        try {
            let startDateStr = '';
            if (selectedRange === '30D') {
                startDateStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else if (selectedRange === 'MONTH') {
                startDateStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            } else if (selectedRange === 'YEAR') {
                startDateStr = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            }
            const data = await api.getWeightHistory(startDateStr, todayStr);
            setHistory(data?.history || []);
            setStats(data?.stats || { min: 0, max: 0, avg: 0 });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchHistory(); }, [selectedRange]));

    const handleSave = async () => {
        if (!weight || isNaN(parseFloat(weight))) {
            Alert.alert('Invalid Input', 'Please enter a valid weight');
            return;
        }
        setSaving(true);
        try {
            await api.logWeight({ date: todayStr, weight: parseFloat(weight) });
            fetchHistory();
            setWeight('');
        } catch (error) {
            Alert.alert('Error', 'Failed to log weight');
        } finally {
            setSaving(false);
        }
    };

    const chartConfig = useMemo(() => {
        if (history.length < 2) return null;
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (selectedRange === 'YEAR') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthMap = new Map<string, { sum: number; count: number }>();
            sorted.forEach(h => {
                const key = monthNames[new Date(h.date).getMonth()];
                const entry = monthMap.get(key) || { sum: 0, count: 0 };
                entry.sum += parseFloat(h.weight); entry.count += 1;
                monthMap.set(key, entry);
            });
            const labels = Array.from(monthMap.keys());
            const data = Array.from(monthMap.values()).map(v => v.sum / v.count);
            if (data.length < 2) return { labels: [labels[0], labels[0]], data: [data[0], data[0]] };
            return { labels, data };
        }

        const data = sorted.map(h => parseFloat(h.weight));
        const step = Math.max(1, Math.floor(sorted.length / 6));
        const labels = sorted.map((h, i) => {
            if (i === 0 || i === sorted.length - 1 || i % step === 0) {
                const d = new Date(h.date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }
            return '';
        });
        return { labels, data };
    }, [history, selectedRange]);

    const reversedHistory = useMemo(() => [...history].reverse(), [history]);

    // ── Header rendered inside FlatList ──
    const renderHeader = () => (
        <View>
            {/* Stats row */}
            <View style={styles.statsGrid}>
                <StatCard label="Lowest" value={stats.min} icon="arrow-down" color={colors.success} isLoading={loading} suffix="" />
                <StatCard label="Highest" value={stats.max} icon="arrow-up" color={colors.error} isLoading={loading} suffix="" />
                <StatCard label="Average" value={stats.avg} icon="analytics" color={colors.accent} isLoading={loading} suffix="" />
                <View style={{ width: '48%' }} />
            </View>

            {/* Chart card */}
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Weight Trend</Text>
                    {!loading && chartConfig && (
                        <View style={styles.chartLegend}>
                            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                            <Text style={styles.legendText}>kg</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={styles.loadingText}>Loading data…</Text>
                    </View>
                ) : chartConfig ? (
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={{ labels: chartConfig.labels, datasets: [{ data: chartConfig.data }] }}
                            width={SCREEN_WIDTH - 80}
                            height={220}
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: colors.surface,
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                decimalPlaces: 1,
                                color: () => colors.accent,
                                labelColor: () => colors.textSecondary,
                                strokeWidth: 3,
                                propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
                                propsForBackgroundLines: { strokeDasharray: '5, 5', strokeWidth: 1, stroke: colors.border },
                                fillShadowGradientFrom: colors.accent,
                                fillShadowGradientTo: colors.accent,
                                fillShadowGradientFromOpacity: 0.18,
                                fillShadowGradientToOpacity: 0,
                            }}
                            bezier
                            withInnerLines={false}
                            withOuterLines={true}
                            style={{ marginVertical: spacing.sm, borderRadius: borderRadius.md, marginLeft: -30 }}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="scale-outline" size={32} color={colors.border} />
                        </View>
                        <Text style={styles.noDataText}>Not enough data</Text>
                        <Text style={styles.noDataHint}>Log at least 2 entries to see your trend graph.</Text>
                    </View>
                )}
            </View>

            {/* Log input */}
            <View style={styles.logCard}>
                <View style={styles.logCardHeader}>
                    <View style={styles.logIconWrap}>
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.logCardTitle}>Log Today's Weight</Text>
                    <Text style={styles.logCardDate}>
                        {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputWrap, inputFocused && styles.inputWrapFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 70.5"
                            placeholderTextColor={colors.textLight}
                            keyboardType="decimal-pad"
                            value={weight}
                            onChangeText={setWeight}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                        />
                        <Text style={styles.unitTag}>kg</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveButton, (!weight || saving) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!weight || saving}
                        activeOpacity={0.8}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="checkmark" size={22} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>
            </View>

            {/* History section label */}
            {history.length > 0 && (
                <View style={styles.historyHeader}>
                    <Text style={styles.historyHeaderText}>Log History</Text>
                    <View style={styles.historyCountBadge}>
                        <Text style={styles.historyCountText}>{history.length}</Text>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <ScreenLayout edges={['top']} useGradient>
            {/* Header */}
            <View style={styles.header}>
                <BackButton style={{ marginRight: spacing.s }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Body Weight</Text>
                    <Text style={styles.headerSub}>Track your progress over time</Text>
                </View>
            </View>

            {/* Range selector */}
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

            <KeyboardAwareLayout style={{ flex: 1 }}>
                <FlatList
                    data={reversedHistory}
                    renderItem={({ item, index }) => (
                        <HistoryItem item={item} prevItem={reversedHistory[index + 1]} index={index} />
                    )}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    ListHeaderComponent={renderHeader()}
                    ListEmptyComponent={
                        !loading ? (
                            <EmptyState
                                icon="scale-outline"
                                title="No weight logs yet"
                                message="Your weight history will appear here once you start logging."
                            />
                        ) : null
                    }
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    ListFooterComponent={<View style={{ height: 100 }} />}
                />
            </KeyboardAwareLayout>
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
        gap: spacing.xs,
    },
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

    content: {
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
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    chartTitle: {
        ...typography.bodyBold,
        color: colors.text,
    },
    chartLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    chartContainer: {
        alignItems: 'center',
    },
    loadingContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.s,
    },
    loadingText: {
        ...typography.caption,
        color: colors.textLight,
    },
    emptyChart: {
        height: 200,
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
        paddingHorizontal: spacing.xl,
    },

    // ── Log card ──
    logCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.m,
    },
    logCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    logIconWrap: {
        width: 30,
        height: 30,
        borderRadius: borderRadius.s,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logCardTitle: {
        ...typography.bodyBold,
        color: colors.text,
        flex: 1,
    },
    logCardDate: {
        ...typography.caption,
        color: colors.textLight,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.m,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: spacing.m,
        height: 52,
    },
    inputWrapFocused: {
        borderColor: colors.primary,
    },
    input: {
        flex: 1,
        ...typography.h3,
        color: colors.text,
        paddingVertical: 0,
    },
    unitTag: {
        ...typography.bodyBold,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    saveButton: {
        backgroundColor: colors.accent,
        width: 52,
        height: 52,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.45,
        shadowOpacity: 0,
        elevation: 0,
    },

    // ── History header ──
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginBottom: spacing.m,
    },
    historyHeaderText: {
        ...typography.bodyBold,
        color: colors.text,
        flex: 1,
    },
    historyCountBadge: {
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        backgroundColor: colors.primary + '18',
        borderRadius: borderRadius.round,
    },
    historyCountText: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.primary,
        fontSize: 12,
    },

    // ── History items ──
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        marginBottom: spacing.s,
        borderColor: colors.border,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    historyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent,
    },
    historyDotGain: {
        backgroundColor: colors.error,
    },
    historyDotLoss: {
        backgroundColor: colors.success,
    },
    historyDate: {
        ...typography.body,
        color: colors.text,
        fontSize: 14,
    },
    deltaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    deltaText: {
        ...typography.caption,
        fontSize: 11,
    },
    weightBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.s,
    },
    weightBadgeGain: {
        backgroundColor: colors.error + '10',
    },
    weightBadgeLoss: {
        backgroundColor: colors.success + '10',
    },
    historyValue: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.primary,
    },
    historyUnit: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});