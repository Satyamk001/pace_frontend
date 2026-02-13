import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const MoodSelector = ({ value, onChange }: any) => {
    const moods = ['Happy', 'Calm', 'Tired', 'Anxious', 'Pain'];
    return (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Mood</Text>
            <View style={styles.moodRow}>
                {moods.map((m) => (
                    <TouchableOpacity 
                        key={m} 
                        style={[styles.moodBtn, value === m && styles.moodBtnActive]}
                        onPress={() => onChange(m)}
                    >
                        <Text style={[styles.moodText, value === m && { color: 'white' }]}>{m}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

export const HealthCheckInScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);

  const [pain, setPain] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [mood, setMood] = useState('Calm');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
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

  const renderSlider = (label: string, value: number, onValueChange: (val: number) => void, color: string) => (
      <View style={styles.selectorContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s}}>
              <Text style={styles.selectorLabel}>{label}</Text>
              <Text style={[styles.selectorValue, { color }]}>{Math.round(value)}/10</Text>
          </View>
          <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={value}
              onValueChange={onValueChange}
              minimumTrackTintColor={color}
              maximumTrackTintColor={colors.border}
              thumbTintColor={color}
          />
      </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header with Back Button */}
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
             <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check-in</Text>
          <View style={{width: 24}} /> 
      </View>

      <Text style={styles.title}>How do you feel?</Text>
      <Text style={styles.subtitle}>Be honest. No judgment here.</Text>

      {renderSlider("Pain Level", pain, setPain, "#FFB7B2")}
      {renderSlider("Fatigue Level", fatigue, setFatigue, "#FFDAC1")}
      
      <MoodSelector value={mood} onChange={setMood} />

      <Text style={styles.label}>Notes</Text>
      <TextInput 
        style={styles.input} 
        multiline 
        placeholder="Anything else?" 
        value={notes} 
        onChangeText={setNotes} 
        placeholderTextColor={colors.textLight}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Check-in</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
    paddingTop: spacing.l, // Reduced
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.l,
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
  selectorValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
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
    marginBottom: spacing.xl,
  },
  saveBtnText: {
    ...typography.subheader,
    color: 'white',
    fontSize: 18,
  }
});
