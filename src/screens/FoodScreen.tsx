import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius, typography} from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';

import { BackButton } from '../components/ui/BackButton';
import { FoodSummaryCard } from '../components/ui/FoodSummaryCard';
import { FoodFormCard } from '../components/ui/FoodFormCard';
import { FoodLogItem } from '../components/ui/FoodLogItem';
import { EmptyState } from '../components/ui/EmptyState';

export const FoodScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} />}
                keyboardShouldPersistTaps="handled" 
            >
                {/* Summary Card */}
                <FoodSummaryCard totalCalories={totalCalories} />

                {/* Add Button */}
                {!showForm && (
                     <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                        <Ionicons name="add" size={24} color="#FFF" />
                        <Text style={styles.addButtonText}>Add Food</Text>
                    </TouchableOpacity>
                )}

                {/* Form */}
                {showForm && (
                    <FoodFormCard 
                        name={name} setName={setName}
                        calories={calories} setCalories={setCalories}
                        quantity={quantity} setQuantity={setQuantity}
                        onCancel={() => setShowForm(false)}
                        onSave={handleAddFood}
                    />
                )}

                {/* List */}
                <View style={styles.list}>
                    {logs.map((item, index) => (
                        <FoodLogItem 
                            key={item.id || item.tempId || index}
                            name={item.name}
                            quantity={item.quantity}
                            time={item.time}
                            calories={item.calories}
                        />
                    ))}
                    {logs.length === 0 && !loading && (
                        <EmptyState 
                            icon="restaurant-outline" 
                            title="No meals logged" 
                            message="No meals logged today. Add what you ate to track your calories." 
                        />
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
    addButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.round,
        marginBottom: spacing.lg,
    },
    addButtonText: {
        ...fonts.button,
        color: '#FFF',
        marginLeft: spacing.xs,
    },
    list: {
        gap: spacing.md,
    },

    emptyText: {
        textAlign: 'center',
        color: colors.textLight,
        marginTop: spacing.xl,
    }

});
