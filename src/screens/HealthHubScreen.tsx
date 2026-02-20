import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { createApiService } from '../services/api';

export const HealthHubScreen = () => {
  const navigation = useNavigation<any>();
  const { getToken } = useAuth();
  const api = createApiService(getToken);

  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    calories: 0,
    medicinesTaken: 0,
    medicinesTotal: 0,
    weight: null as number | null
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchSummary = async () => {
    try {
      // 1. Food
      const foodLogs = await api.getDailyFoodLog(today);
      const totalCalories = foodLogs ? foodLogs.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) : 0;

      // 2. Medicines
      const meds = await api.getMedicines();
      const intake = await api.getIntakeHistory(today);
      
      let totalDoses = 0;
      if (meds) {
          meds.forEach((m: any) => {
              // Assuming DAILY for now, or check frequency
              if (m.frequency === 'DAILY' || !m.frequency) {
                  totalDoses += (m.times ? m.times.length : 0);
              }
          });
      }
      const takenDoses = intake ? intake.length : 0;

      // 3. Weight
      const weightHistory = await api.getWeightHistory(today, today);
      const todayWeight = (weightHistory && weightHistory.length > 0) 
          ? weightHistory[weightHistory.length - 1].weight 
          : null;

      setSummary({
        calories: totalCalories,
        medicinesTaken: takenDoses,
        medicinesTotal: totalDoses,
        weight: todayWeight
      });

    } catch (error) {
       console.error('Failed to fetch health summary', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [])
  );

  const onRefresh = async () => {
      setRefreshing(true);
      await fetchSummary();
      setRefreshing(false);
  };

  const modules = [
    {
      title: 'Food & Calories',
      icon: 'restaurant',
      color: '#FF6B6B',
      route: 'Food',
      description: 'Track meals'
    },
    {
      title: 'Medicine',
      icon: 'medkit',
      color: '#4ECDC4',
      route: 'Medicine',
      description: 'Schedule & logs'
    },
    {
      title: 'Weight',
      icon: 'scale',
      color: '#45B7D1',
      route: 'Weight',
      description: 'Track changes'
    },
    {
      title: 'Reports',
      icon: 'bar-chart',
      color: '#A06CD5',
      route: 'Reports',
      description: 'Health insights'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Hub</Text>
        <Text style={styles.subtitle}>Manage your health metrics</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Quick Summary Section */}
        <View style={styles.summarySection}>
             <Text style={styles.sectionHeader}>Today's Summary</Text>
             <View style={styles.statsRow}>
                 {/* Calories Card */}
                 <View style={styles.statCard}>
                     <Ionicons name="flame" size={24} color="#FF6B6B" style={{marginBottom: 4}} />
                     <Text style={styles.statValue}>{summary.calories}</Text>
                     <Text style={styles.statLabel}>Calories</Text>
                 </View>

                 {/* Medicine Card */}
                 <View style={styles.statCard}>
                     <Ionicons name="medkit" size={24} color="#4ECDC4" style={{marginBottom: 4}} />
                     <Text style={styles.statValue}>{summary.medicinesTaken} / {summary.medicinesTotal}</Text>
                     <Text style={styles.statLabel}>Medicines</Text>
                 </View>

                 {/* Weight Card */}
                 <View style={styles.statCard}>
                     <Ionicons name="scale" size={24} color="#45B7D1" style={{marginBottom: 4}} />
                     <Text style={styles.statValue}>{summary.weight ? `${summary.weight} kg` : '--'}</Text>
                     <Text style={styles.statLabel}>Weight</Text>
                 </View>
             </View>
        </View>

        <Text style={[styles.sectionHeader, { marginTop: spacing.xl }]}>Modules</Text>
        <View style={styles.grid}>
          {modules.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </TouchableOpacity>
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
    padding: spacing.lg,
  },
  title: {
    ...fonts.h1,
    color: colors.text,
  },
  subtitle: {
    ...fonts.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.soft,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...fonts.h3,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    ...fonts.caption,
    color: colors.textLight,
    textAlign: 'center'
  },
  summarySection: {
      marginBottom: spacing.md,
  },
  sectionHeader: {
      ...fonts.h2,
      fontSize: 18,
      marginBottom: spacing.md,
      color: colors.text
  },
  statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm
  },
  statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      ...shadows.soft
  },
  statValue: {
      ...fonts.h3,
      fontSize: 18,
      color: colors.text,
      marginBottom: 2
  },
  statLabel: {
      ...fonts.caption,
      color: colors.textLight
  }
});
