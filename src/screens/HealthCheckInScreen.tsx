import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {colors, typography, spacing, borderRadius} from '../theme';
import { createApiService } from '../services/api';
import { CustomSlider } from '../components/ui/CustomSlider';
import { MoodSelector } from '../components/MoodSelector';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { getLocalDateKey } from '../utils/dateUtils';

export const HealthCheckInScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);

  const [pain, setPain] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [mood, setMood] = useState('GOOD');
  const [notes, setNotes] = useState('');
  const [painkillerCount, setPainkillerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const today = getLocalDateKey(new Date());
      const [log, metrics] = await Promise.all([
        api.getDailyLog(today).catch(() => null),
        api.getHealthMetrics(today).catch(() => null)
      ]);

      if (log && log.mood) setMood(log.mood);
      if (metrics) {
        setPain(metrics.pain_level || 0);
        setFatigue(metrics.fatigue_level || 0);
        setNotes(metrics.notes || '');
        setPainkillerCount(metrics.painkiller_count || 0);
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
      const today = getLocalDateKey(new Date());

      await api.logDay(today, undefined, mood);
      await api.logHealthMetrics({
        date: today,
        painLevel: Math.round(pain),
        fatigueLevel: Math.round(fatigue),
        mood,
        notes,
        painkillerCount,
      });

      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to log health');
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  if (fetching) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenLayout edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.headerTitle}>{isUpdate ? 'Update Check-in' : 'Check-in'}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>How do you feel?</Text>
            <Text style={styles.subtitle}>Be honest. No judgment here.</Text>
          </View>

          {/* Vitals Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vitals</Text>
            <View style={styles.sliderContainer}>
              <CustomSlider
                label="Pain Level"
                value={pain}
                onValueChange={setPain}
                color={colors.chart.primary}
                max={10}
                step={0.1}
              />
            </View>
            <CustomSlider
              label="Fatigue Level"
              value={fatigue}
              onValueChange={setFatigue}
              color={colors.chart.secondary}
              max={10}
              step={0.1}
            />
          </View>

          {/* Mood Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mood</Text>
            <MoodSelector selectedMood={mood} onSelectMood={setMood} />
          </View>

          {/* Medication Card */}
          <View style={[styles.card, styles.rowCard]}>
            <Text style={styles.cardTitleInline}>Painkillers Taken</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setPainkillerCount(c => Math.max(0, c - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>

              <Text style={styles.stepperValue}>{painkillerCount}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setPainkillerCount(c => c + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Any specific symptoms or triggers?"
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={colors.textLight}
            />
          </View>

        </ScrollView>

        {/* Sticky Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={colors.buttonPrimaryText} />
            ) : (
              <Text style={styles.saveBtnText}>{isUpdate ? 'Update Check-in' : 'Save Check-in'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.l,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  headerTitle: {
    ...typography.subheader,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  titleContainer: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Card System
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
  },
  cardTitleInline: {
    ...typography.h3,
    flex: 1,
  },
  sliderContainer: {
    marginBottom: spacing.l,
  },

  // Stepper UI
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: borderRadius.round,
    padding: spacing.xs,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...typography.h3,
    color: colors.text,
    minWidth: 44,
    textAlign: 'center',
  },

  // Input fields
  input: {
    ...typography.body,
    backgroundColor: colors.inputBackground,
    padding: spacing.m,
    borderRadius: borderRadius.s,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },

  // Footer & Buttons
  footer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    ...{} /* removed shadow */, // Elevated shadow for CTA
  },
  saveBtnText: {
    ...typography.button,
  },
});