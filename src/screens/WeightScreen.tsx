import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useOffline } from '../context/OfflineContext';
import { LineChart } from 'react-native-chart-kit';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';

// Shared skeleton box for loading states
const SkeletonBox = ({ width, height, borderRadius = 4, style }: any) => (
    <View style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity: 0.3 }, style]} />
);

const RANGE_OPTIONS = [
    { label: '30D', value: '30D' },
    { label: 'This Month', value: 'MONTH' },
    { label: 'This Year', value: 'YEAR' },
];

export const WeightScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const { isOffline } = useOffline();
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


    // Prepare Chart Data mapping
    const chartConfig = useMemo(() => {
        if (history.length < 2) return null;
        
        let displayHistory = [...history];
        displayHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let groupedData: { label: string, sum: number, count: number }[] = [];

        if (selectedRange === 'YEAR') {
            // Group by Month
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            displayHistory.forEach(h => {
                const d = new Date(h.date);
                const label = months[d.getMonth()];
                let group = groupedData.find(g => g.label === label);
                if (!group) {
                    group = { label, sum: 0, count: 0 };
                    groupedData.push(group);
                }
                group.sum += parseFloat(h.weight);
                group.count += 1;
            });
        } else {
            // Group by 7-day chunks (1-7, 8-14, 15-21, 22+)
            displayHistory.forEach(h => {
                const d = new Date(h.date);
                const day = d.getDate();
                let label = '';
                if (day <= 7) label = '1-7';
                else if (day <= 14) label = '8-14';
                else if (day <= 21) label = '15-21';
                else label = '22+';

                let group = groupedData.find(g => g.label === label);
                if (!group) {
                    group = { label, sum: 0, count: 0 };
                    groupedData.push(group);
                }
                group.sum += parseFloat(h.weight);
                group.count += 1;
            });

            // Ensure chronological order of buckets
            const order = ['1-7', '8-14', '15-21', '22+'];
            groupedData.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
        }

        const labels = groupedData.map(g => g.label);
        const data = groupedData.map(g => g.sum / g.count);

        // If we grouped it so much that there's only 1 point, line chart breaks. 
        // Fallback to plotting the raw first/last if that happens, just to draw a line.
        if (data.length === 1 && displayHistory.length >= 2) {
             const first = displayHistory[0];
             const last = displayHistory[displayHistory.length - 1];
             return {
                 labels: [
                     selectedRange === 'YEAR' ? new Date(first.date).toLocaleDateString('en-US', { month: 'short' }) : new Date(first.date).getDate().toString(),
                     selectedRange === 'YEAR' ? new Date(last.date).toLocaleDateString('en-US', { month: 'short' }) : new Date(last.date).getDate().toString()
                 ],
                 data: [parseFloat(first.weight), parseFloat(last.weight)]
             }
        }

        return { labels, data };
    }, [history, selectedRange]);

    const StatCard = ({ label, value, color, icon }: any) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <View>
                {loading ? (
                    <SkeletonBox width={40} height={24} style={{ marginBottom: 4 }} />
                ) : (
                    <Text style={styles.statValue}>{value.toFixed(1)} <Text style={{fontSize: 12, color: colors.textSecondary}}>kg</Text></Text>
                )}
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </View>
    );

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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                    {/* Primary Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard label="Lowest" value={stats.min} icon="arrow-down" color={colors.success} />
                        <StatCard label="Highest" value={stats.max} icon="arrow-up" color={colors.error} />
                        <StatCard label="Average" value={stats.avg} icon="analytics" color={colors.accent} />
                        <View style={[styles.statCard, { backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0 }]} />
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
                                        paddingRight: 10,
                                        fillShadowGradientFrom: colors.accent,
                                        fillShadowGradientTo: colors.accent,
                                        fillShadowGradientFromOpacity: 0.2,
                                        fillShadowGradientToOpacity: 0,
                                    }}
                                    bezier
                                    withInnerLines={false}
                                    withOuterLines={true}
                                    style={{
                                        marginVertical: 8,
                                        borderRadius: 16,
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
                         {history.slice().reverse().map((item, index) => (
                             <View key={index} style={styles.historyItem}>
                                 <View style={styles.historyDateRow}>
                                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                 </View>
                                 <Text style={styles.historyValue}>{item.weight} <Text style={{fontSize: 14, color: '#999', fontWeight: 'normal'}}>kg</Text></Text>
                             </View>
                         ))}
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
        fontSize: 24,
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
        padding: 4,
    },
    rangeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.s,
    },
    rangeBtnActive: {
        backgroundColor: colors.surface,
        ...shadows.soft,
    },
    rangeText: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    rangeTextActive: {
        color: colors.accent,
        fontWeight: '700',
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
    statCard: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.soft,
        borderWidth: 1,
        borderColor: colors.border + '20',
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statValue: {
        ...typography.h3,
        fontSize: 18,
        color: colors.text,
    },
    statLabel: {
        ...typography.caption,
        fontSize: 11,
        color: colors.textSecondary,
    },
    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        ...shadows.soft,
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
        fontSize: 16,
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
        borderRadius: 30,
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
        paddingHorizontal: 30,
        marginTop: 4
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
        ...shadows.soft,
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
        fontSize: 18,
        fontWeight: '600',
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
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.glow,
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
        ...shadows.soft,
        borderWidth: 1,
        borderColor: colors.border + '20',
    },
    historyDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historyDate: { 
        ...typography.body, 
        color: colors.text,
        fontWeight: '500', 
    },
    historyValue: { 
        ...typography.bodyBold, 
        color: colors.primary,
        fontSize: 18,
    },
});

