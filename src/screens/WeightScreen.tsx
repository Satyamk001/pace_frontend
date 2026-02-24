import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useOffline } from '../context/OfflineContext';
import { LineChart } from 'react-native-chart-kit';

export const WeightScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const { isOffline } = useOffline();
    const api = createApiService(getToken);

    const [weight, setWeight] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // Get last 30 days
            const endDate = today;
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const data = await api.getWeightHistory(startDate, endDate);
            setHistory(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!weight || isNaN(parseFloat(weight))) {
            Alert.alert('Invalid Input', 'Please enter a valid weight');
            return;
        }

        const payload = {
            date: today,
            weight: parseFloat(weight)
        };

        try {
            await api.logWeight(payload);
            if (!isOffline) fetchHistory();
            setWeight('');
        } catch (error) {
            Alert.alert('Error', 'Failed to log weight');
        }
    };

    // Prepare Chart Data
    const chartLabels = history.map(h => new Date(h.date).getDate().toString()); // Just days
    const chartData = history.map(h => parseFloat(h.weight));

    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Weight Tracker</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Input Card */}
                <View style={styles.inputCard}>
                    <Text style={styles.label}>Log Today's Weight (kg)</Text>
                    <View style={styles.inputRow}>
                        <TextInput 
                            style={styles.input} 
                            placeholder="0.0" 
                            keyboardType="decimal-pad"
                            value={weight}
                            onChangeText={setWeight}
                        />
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Ionicons name="checkmark" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Chart */}
                {history.length > 1 ? (
                    <View style={styles.chartCard}>
                         <Text style={styles.chartTitle}>Last 30 Days Trend</Text>
                         <LineChart
                            data={{
                                labels: chartLabels,
                                datasets: [{ data: chartData }]
                            }}
                            width={Dimensions.get('window').width - 48} // from react-native
                            height={220}
                            yAxisSuffix="kg"
                            chartConfig={{
                                backgroundColor: colors.surface,
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(69, 183, 209, ${opacity})`,
                                labelColor: (opacity = 1) => colors.textLight,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "4",
                                    strokeWidth: "2",
                                    stroke: "#45B7D1"
                                }
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                         <Text style={{color: colors.textLight}}>Log at least 2 entries to see the trend graph.</Text>
                    </View>
                )}

                {/* History List */}
                <View style={styles.historyList}>
                     <Text style={styles.sectionHeader}>History</Text>
                     {history.slice().reverse().map((item, index) => (
                         <View key={index} style={styles.historyItem}>
                             <Text style={styles.historyDate}>{new Date(item.date).toDateString()}</Text>
                             <Text style={styles.historyValue}>{item.weight} kg</Text>
                         </View>
                     ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    backButton: { marginRight: spacing.md },
    title: { ...fonts.h2, color: colors.text },
    content: { padding: spacing.lg },
    inputCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    label: { ...fonts.caption, color: colors.textLight, marginBottom: spacing.md },
    inputRow: { flexDirection: 'row', gap: spacing.md },
    input: {
        flex: 1,
        backgroundColor: colors.inputBackground,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
    },
    chartCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    chartTitle: {
        ...fonts.h3,
        marginBottom: spacing.md,
        width: '100%',
        textAlign: 'left'
    },
    emptyCard: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    historyList: {
        gap: spacing.sm,
    },
    sectionHeader: { ...fonts.h3, marginBottom: spacing.sm },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        ...shadows.soft,
    },
    historyDate: { ...fonts.body, color: colors.text },
    historyValue: { ...fonts.bodyBold, color: colors.primary },
});
