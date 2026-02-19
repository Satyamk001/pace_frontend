import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomSlider } from '../components/ui/CustomSlider';
import { MoodSelector } from '../components/MoodSelector';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';

export const HealthCheckInScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);

  const [pain, setPain] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [mood, setMood] = useState('GOOD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
      fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
      try {
          const today = new Date().toISOString().split('T')[0];
          const [log, metrics] = await Promise.all([
              api.getDailyLog(today).catch(() => null),
              api.getHealthMetrics(today).catch(() => null) // Returns null if 404
          ]);

          if (log && log.mood) setMood(log.mood);
          if (metrics) {
              setPain(metrics.pain_level || 0);
              setFatigue(metrics.fatigue_level || 0);
              setNotes(metrics.notes || '');
              setIsUpdate(true);
          }
      } catch (e) {
          console.log("No existing data for today or error fetching", e);
      } finally {
          setFetching(false);
      }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Log Mood
        await api.logDay(today, undefined, mood);

        // Log Metrics
        await api.logHealthMetrics({
            date: today,
            painLevel: Math.round(pain),
            fatigueLevel: Math.round(fatigue),
            mood,
            notes
        });
        
        navigation.goBack();
    } catch (error) {
        console.error(error);
        alert('Failed to log health');
    } finally {
        setLoading(false);
    }
  };

  if (fetching) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
          </View>
      );
  }

  const insets = useSafeAreaInsets();

  return (
    <ScreenLayout edges={['top']}>
        <View style={{flex: 1}}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <BackButton style={styles.backBtn} />
                    <Text style={styles.headerTitle}>{isUpdate ? 'Update Check-in' : 'Check-in'}</Text>
                    <View style={{width: 24}} /> 
                </View>

                <Text style={styles.title}>How do you feel?</Text>
                <Text style={styles.subtitle}>Be honest. No judgment here.</Text>

                <CustomSlider 
                    label="Pain Level" 
                    value={pain} 
                    onValueChange={setPain} 
                    color={colors.chart.pain}
                    max={10}
                    step={0.1} 
                />
                
                <CustomSlider 
                    label="Fatigue Level" 
                    value={fatigue} 
                    onValueChange={setFatigue} 
                    color={colors.chart.fatigue}
                    max={10}
                    step={0.1}
                />
                
                <Text style={styles.label}>Mood</Text>
                <View style={{ marginBottom: spacing.l }}>
                    <MoodSelector selectedMood={mood} onSelectMood={setMood} />
                </View>

                <Text style={styles.label}>Notes</Text>
                <TextInput 
                    style={styles.input} 
                    multiline 
                    placeholder="Anything else?" 
                    value={notes} 
                    onChangeText={setNotes} 
                    placeholderTextColor={colors.textLight}
                />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{isUpdate ? 'Update' : 'Save Check-in'}</Text>}
                </TouchableOpacity>
            </View>
        </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background and padding handled by ScreenLayout but we keep padding info
    padding: spacing.l,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.l,
      paddingTop: spacing.m,
  },
  backBtn: {
      padding: 8,
      marginLeft: -8,
  },
  headerTitle: {
      ...typography.subheader,
      color: colors.text,
  },
  title: {
    ...typography.header,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    color: colors.textLight,
  },
  selectorContainer: {
    marginBottom: spacing.xl,
  },
  selectorLabel: {
    ...typography.subheader,
    fontSize: 18,
    color: colors.text,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.s,
  },
  moodBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  moodBtnActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    transform: [{scale: 1.05}]
  },
  moodText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  label: {
    ...typography.subheader,
    marginBottom: spacing.s,
    fontSize: 18,
  },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: borderRadius.l,
    alignItems: 'center',
    ...shadows.soft,
  },
  saveBtnText: {
    ...typography.subheader,
    color: colors.buttonPrimaryText,
    fontSize: 18,
  },
  footer: {
      padding: spacing.l,
      backgroundColor: colors.background, 
  }
});
