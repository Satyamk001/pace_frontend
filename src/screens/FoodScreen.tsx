import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useOffline } from '../context/OfflineContext';
import { BackButton } from '../components/ui/BackButton';

export const FoodScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const { isOffline } = useOffline();
    const api = createApiService(getToken);

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [quantity, setQuantity] = useState('');
    const [showForm, setShowForm] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            // Need to implement getFoodLogs in api.ts
             const data = await api.getDailyFoodLog(today);
             setLogs(data || []);
        } catch (error) {
            console.error('Failed to fetch food logs', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddFood = async () => {
        if (!name || !calories) {
            Alert.alert('Missing Fields', 'Please enter food name and calories.');
            return;
        }

        const newLog = {
            date: today,
            name,
            calories: parseInt(calories),
            quantity,
            time: new Date().toLocaleTimeString(),
            tempId: Date.now().toString() // For optimistic UI
        };

        // Optimistic Update
        setLogs(prev => [...prev, newLog]);
        setShowForm(false);
        setName('');
        setCalories('');
        setQuantity('');

        try {
            await api.logFood(newLog);
            fetchLogs(); 
        } catch (error) {
            console.error('Failed to log food', error);
            Alert.alert('Error', 'Failed to save food log');
        }
    };

    const totalCalories = logs.reduce((sum, item) => sum + (item.calories || 0), 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton style={styles.backButton} />
                <Text style={styles.title}>Food & Calories</Text>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} />}
                keyboardShouldPersistTaps="handled" 
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Calories Today</Text>
                    <Text style={styles.summaryValue}>{totalCalories} <Text style={styles.unit}>kcal</Text></Text>
                </View>

                {/* Add Button */}
                {!showForm && (
                     <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                        <Ionicons name="add" size={24} color="#FFF" />
                        <Text style={styles.addButtonText}>Add Food</Text>
                    </TouchableOpacity>
                )}

                {/* Form */}
                {showForm && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Add Meal</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Food Name (e.g., Oatmeal)" 
                            value={name}
                            onChangeText={setName}
                        />
                        <View style={styles.row}>
                            <TextInput 
                                style={[styles.input, { flex: 1, marginRight: spacing.sm }]} 
                                placeholder="Calories" 
                                keyboardType="numeric"
                                value={calories}
                                onChangeText={setCalories}
                            />
                             <TextInput 
                                style={[styles.input, { flex: 1 }]} 
                                placeholder="Qty (e.g., 1 bowl)" 
                                value={quantity}
                                onChangeText={setQuantity}
                            />
                        </View>
                        <View style={styles.formActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleAddFood}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* List */}
                <View style={styles.list}>
                    {logs.map((item, index) => (
                        <View key={item.id || item.tempId || index} style={styles.logItem}>
                            <View style={styles.logMeta}>
                                <Text style={styles.logName}>{item.name}</Text>
                                <Text style={styles.logQty}>{item.quantity} • {item.time}</Text>
                            </View>
                            <Text style={styles.logCal}>{item.calories} kcal</Text>
                        </View>
                    ))}
                    {logs.length === 0 && !loading && (
                        <Text style={styles.emptyText}>No meals logged today.</Text>
                    )}
                </View>

            </ScrollView>
            </KeyboardAvoidingView>
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
    backButton: {
        marginRight: spacing.md,
    },
    title: {
        ...fonts.h2,
        color: colors.text,
    },
    content: {
        padding: spacing.lg,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    summaryLabel: {
        ...fonts.caption,
        color: colors.textLight,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryValue: {
        ...fonts.h1,
        fontSize: 48,
        color: colors.primary,
    },
    unit: {
        fontSize: 20,
        color: colors.textLight,
        fontWeight: '400',
    },
    addButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.round,
        marginBottom: spacing.lg,
        ...shadows.medium,
    },
    addButtonText: {
        ...fonts.button,
        color: '#FFF',
        marginLeft: spacing.xs,
    },
    formCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    formTitle: {
        ...fonts.h3,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: colors.inputBackground,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...fonts.body,
    },
    row: {
        flexDirection: 'row',
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    cancelButton: {
        padding: spacing.sm,
    },
    cancelButtonText: {
        ...fonts.button,
        color: colors.textLight,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.round,
    },
    saveButtonText: {
        ...fonts.button,
        color: '#FFF',
    },
    list: {
        gap: spacing.md,
    },
    logItem: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.soft,
    },
    logMeta: {
        flex: 1,
    },
    logName: {
        ...fonts.bodyBold,
        color: colors.text,
    },
    logQty: {
        ...fonts.caption,
        color: colors.textLight,
        marginTop: 2,
    },
    logCal: {
        ...fonts.h3,
        color: colors.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textLight,
        marginTop: spacing.xl,
    }

});
