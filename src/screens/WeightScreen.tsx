import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {colors, typography, spacing, borderRadius} from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';

import { LineChart } from 'react-native-chart-kit';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';

import { SkeletonBox } from '../components/ui/SkeletonLoader';
import { StatCard } from '../components/ui/StatCard';

const RANGE_OPTIONS = [
    { label: '30D', value: '30D' },
    { label: 'This Month', value: 'MONTH' },
    { label: 'This Year', value: 'YEAR' },
];

export const WeightScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const api = createApiService(getToken);

    const [weight, setWeight] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState('30D');
    const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const fetchHistory = async () => {
        if (history.length === 0) setLoading(true);
        try {
            let startDateStr = '';
            
            if (selectedRange === '30D') {
                startDateStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else if (selectedRange === 'MONTH') {
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                startDateStr = firstDayOfMonth.toISOString().split('T')[0];
            } else if (selectedRange === 'YEAR') {
                const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                startDateStr = firstDayOfYear.toISOString().split('T')[0];
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

    // Refetch when range changes or screen focuses
    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [selectedRange])
    );

    const handleSave = async () => {
        if (!weight || isNaN(parseFloat(weight))) {
            Alert.alert('Invalid Input', 'Please enter a valid weight');
            return;
        }

        const payload = {
            date: todayStr,
            weight: parseFloat(weight)
        };

        try {
            await api.logWeight(payload);
            fetchHistory();
            setWeight('');
        } catch (error) {
            Alert.alert('Error', 'Failed to log weight');
        }
    };


    // Prepare Chart Data — plot each day individually for accurate trend
    const chartConfig = useMemo(() => {
        if (history.length < 2) return null;
        
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (selectedRange === 'YEAR') {
            // Group by month for yearly view
            const monthMap = new Map<string, { sum: number; count: number }>();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            sorted.forEach(h => {
                const key = monthNames[new Date(h.date).getMonth()];
                const entry = monthMap.get(key) || { sum: 0, count: 0 };
                entry.sum += parseFloat(h.weight);
                entry.count += 1;
                monthMap.set(key, entry);
            });
            const labels = Array.from(monthMap.keys());
            const data = Array.from(monthMap.values()).map(v => v.sum / v.count);
            if (data.length < 2) {
                return { labels: [labels[0], labels[0]], data: [data[0], data[0]] };
            }
            return { labels, data };
        }

        // 30D / MONTH — plot each day individually
        const data = sorted.map(h => parseFloat(h.weight));
        
        // Smart label sampling: show ~6 labels max to prevent overlap
        const maxLabels = 6;
        const step = Math.max(1, Math.floor(sorted.length / maxLabels));
        const labels = sorted.map((h, i) => {
            if (i === 0 || i === sorted.length - 1 || i % step === 0) {
                const d = new Date(h.date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }
            return '';
        });

        return { labels, data };
    }, [history, selectedRange]);



    return (
        <ScreenLayout edges={['top']} useGradient>
             <View style={styles.header}>
                <BackButton style={{ marginRight: spacing.s }} />
                <Text style={styles.headerTitle}>Body Weight</Text>
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

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                    {/* Primary Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard label="Lowest" value={stats.min} icon="arrow-down" color={colors.success} isLoading={loading} suffix="" />
                        <StatCard label="Highest" value={stats.max} icon="arrow-up" color={colors.error} isLoading={loading} suffix="" />
                        <StatCard label="Average" value={stats.avg} icon="analytics" color={colors.accent} isLoading={loading} suffix="" />
                        <View style={{ width: '48%', backgroundColor: 'transparent', borderWidth: 0 }} />
                    </View>

                    {/* Chart */}
                    <View style={styles.chartCard}>
                         <View style={styles.chartHeader}>
                             <Text style={styles.chartTitle}>Trend</Text>
                         </View>
                         
                         {loading ? (
                             <View style={styles.loadingContainer}>
                                 <ActivityIndicator size="large" color={colors.accent} />
                             </View>
                         ) : chartConfig ? (
                             <View style={styles.chartContainer}>
                                 <LineChart
                                    data={{
                                        labels: chartConfig.labels,
                                        datasets: [{ data: chartConfig.data }]
                                    }}
                                    width={Dimensions.get('window').width - 80} // Fix: Account for screen + card padding
                                    height={220}
                                    yAxisSuffix=""
                                    chartConfig={{
                                        backgroundColor: colors.surface,
                                        backgroundGradientFrom: colors.surface,
                                        backgroundGradientTo: colors.surface,
                                        decimalPlaces: 1,
                                        color: (opacity = 1) => colors.accent,
                                        labelColor: (opacity = 1) => colors.textSecondary,
                                        strokeWidth: 3,
                                        propsForDots: {
                                            r: "4",
                                            strokeWidth: "2",
                                            stroke: colors.accent,
                                        },
                                        propsForBackgroundLines: {
                                            strokeDasharray: '5, 5',
                                            strokeWidth: 1,
                                            stroke: colors.border
                                        },
                                        paddingRight: spacing.sm,
                                        fillShadowGradientFrom: colors.accent,
                                        fillShadowGradientTo: colors.accent,
                                        fillShadowGradientFromOpacity: 0.2,
                                        fillShadowGradientToOpacity: 0,
                                    }}
                                    bezier
                                    withInnerLines={false}
                                    withOuterLines={true}
                                    style={{
                                        marginVertical: spacing.sm,
                                        borderRadius: borderRadius.md,
                                        marginLeft: -30, // Tighten left gap
                                    }}
                                />
                             </View>
                         ) : (
                             <View style={styles.emptyCard}>
                                 <View style={styles.emptyIconCircle}>
                                     <Ionicons name="scale-outline" size={32} color={colors.border} />
                                 </View>
                                 <Text style={styles.noDataText}>Not enough data</Text>
                                 <Text style={styles.noDataHint}>Log at least 2 entries to see your trend graph.</Text>
                             </View>
                         )}
                    </View>

                    {/* Input Log Section */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputSectionTitle}>Log Weight</Text>
                        <View style={styles.inputCard}>
                            <View style={styles.inputRow}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="e.g. 70.5"
                                    placeholderTextColor={colors.textLight}
                                    keyboardType="decimal-pad"
                                    value={weight}
                                    onChangeText={setWeight}
                                />
                                <Text style={styles.unitText}>kg</Text>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Ionicons name="checkmark" size={24} color={colors.surface} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* History List */}
                    <View style={styles.historyList}>
                         <Text style={styles.sectionHeader}>Log History</Text>
                         {history.slice().reverse().map((item, index, arr) => {
                             const prevItem = arr[index + 1]; // previous day (older, since reversed)
                             const delta = prevItem ? parseFloat(item.weight) - parseFloat(prevItem.weight) : null;
                             return (
                                 <View key={item.id || index} style={styles.historyItem}>
                                     <View style={styles.historyDateRow}>
                                        <View style={styles.historyDot} />
                                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                                     </View>
                                     <View style={styles.historyRight}>
                                         {delta !== null && delta !== 0 && (
                                             <View style={[styles.deltaBadge, { backgroundColor: delta > 0 ? colors.error + '15' : colors.success + '15' }]}>
                                                 <Ionicons
                                                     name={delta > 0 ? 'arrow-up' : 'arrow-down'}
                                                     size={11}
                                                     color={delta > 0 ? colors.error : colors.success}
                                                 />
                                                 <Text style={[styles.deltaText, { color: delta > 0 ? colors.error : colors.success }]}>
                                                     {Math.abs(delta).toFixed(1)}
                                                 </Text>
                                             </View>
                                         )}
                                         <Text style={styles.historyValue}>{parseFloat(item.weight).toFixed(1)} <Text style={styles.historyUnit}>kg</Text></Text>
                                     </View>
                                 </View>
                             );
                         })}
                    </View>

                    <View style={{height: 100}} />

                </ScrollView>
            </KeyboardAvoidingView>
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
    content: { 
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
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCard: {
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
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        marginTop: spacing.xs
    },
    inputSection: {
        marginBottom: spacing.xl,
    },
    inputSectionTitle: {
        ...typography.bodyBold,
        color: colors.text,
        marginBottom: spacing.s,
        marginLeft: spacing.xs,
    },
    inputCard: {
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border + '20',
    },
    inputRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: spacing.m,
    },
    input: {
        flex: 1,
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        ...typography.subheader,

        color: colors.text,
    },
    unitText: {
        ...typography.bodyBold,
        color: colors.textSecondary,
        marginRight: spacing.xs,
    },
    saveButton: {
        backgroundColor: colors.accent,
        width: 50,
        height: 50,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyList: {
        gap: spacing.s,
    },
    sectionHeader: { 
        ...typography.bodyBold,
        color: colors.text,
        marginBottom: spacing.s,
        marginLeft: spacing.xs,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border + '20',
    },
    historyDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    historyDot: {
        width: 8,
        height: 8,
        borderRadius: borderRadius.s,
        backgroundColor: colors.accent,
    },
    historyDate: { 
        ...typography.body, 
        color: colors.text,
    },
    historyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    deltaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
    },
    deltaText: {
        ...typography.caption,

    },
    historyValue: { 
        ...typography.bodyBold, 
        ...typography.subheader,
    color: colors.primary,
        
    },
    historyUnit: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '400' as const,
    },
});

