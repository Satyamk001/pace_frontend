import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { MyDateTimePicker } from '../components/ui/MyDateTimePicker';
import { CustomDialog } from '../components/ui/CustomDialog';
import { Ionicons } from '@expo/vector-icons';

import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { EnergySelector } from '../components/EnergySelector';
import { NotificationService } from '../services/NotificationService';

export const AddTaskScreen = ({ navigation, route }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [feedback, setFeedback] = useState('');
  const [energy, setEnergy] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  
  // Date/Time State
  const initialDate = route.params?.initialDate ? new Date(route.params.initialDate) : new Date();
  const [dueDate, setDueDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasTime, setHasTime] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate());
    return d.toISOString().split('T')[0];
  })();

  const handleTimePress = () => {
      if (!hasTime) {
          setHasTime(true);
          setShowTimePicker(true);
      } else {
          setShowTimePicker(true);
      }
  };

  const handleClearTime = () => {
      setHasTime(false);
      const d = new Date(dueDate);
      d.setHours(0, 0, 0, 0);
      setDueDate(d);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const newTodo = await api.createTodo(title, energy, dueDate.toISOString(), feedback.trim() || undefined);
      if (hasTime) {
         await NotificationService.scheduleTodo(newTodo);
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout edges={['top']}>
       <CustomDialog 
        visible={dialogVisible} 
        title="Error" 
        message="Failed to create task. Please try again." 
        onClose={() => setDialogVisible(false)} 
      />

       <View style={styles.header}>
            <BackButton />
            <Text style={styles.headerTitle}>New Task</Text>
            <View style={{ width: 40 }} /> 
        </View>

       <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
       >
         <View style={styles.contentContainer}>
             <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* Title Input */}
                <TextInput
                    style={styles.input}
                    placeholder="What's on your mind?"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                    placeholderTextColor={colors.textLight}
                    multiline
                />





                {/* Section: Energy Level */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Energy Level</Text>
                    <EnergySelector value={energy} onChange={setEnergy} />
                </View>

                {/* Section: Schedule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Schedule</Text>
                    <View style={styles.pillRow}>
                            <TouchableOpacity style={styles.datePill} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar-clear-outline" size={18} color={colors.text} />
                                <Text style={styles.datePillText}>
                                {dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                            style={[styles.datePill, hasTime && { backgroundColor: colors.lavender, borderColor: colors.accent }]}
                            onPress={handleTimePress}
                            >
                                <Ionicons name="time-outline" size={18} color={hasTime ? colors.primary : colors.text} />
                                <Text style={[styles.datePillText, hasTime && { color: colors.primary, fontWeight: '600' }]}>
                                    {hasTime
                                        ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'All Day'}
                                </Text>
                                {hasTime && (
                                    <TouchableOpacity onPress={handleClearTime} style={{ marginLeft: 4 }}>
                                        <Ionicons name="close-circle" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                    </View>
                </View>

                {/* Section: Notes/Feedback */}
                <View style={[styles.section, { marginBottom: 30 }]}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <TextInput
                        style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="Any additional details or context?"
                        value={feedback}
                        onChangeText={setFeedback}
                        placeholderTextColor={colors.textLight}
                        multiline
                    />
                </View>

             </ScrollView>

             {/* Footer Button */}
             <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
                <TouchableOpacity 
                    style={[styles.primaryBtn, (!title.trim() || loading) && styles.disabledBtn]}
                    onPress={handleCreate}
                    disabled={!title.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.primaryBtnText}>Add Gently</Text>
                    )}
                </TouchableOpacity>
             </View>
         </View>
       </KeyboardAvoidingView>

       {/* Pickers */}
       <CustomDatePicker
            visible={showDatePicker}
        initialDate={dueDate}
        minDate={minDate}
            onClose={() => setShowDatePicker(false)}
            onConfirm={(date) => {
                const d = new Date(date);
                if (hasTime) {
                    d.setHours(dueDate.getHours(), dueDate.getMinutes());
                }
                setDueDate(d);
                setShowDatePicker(false);
            }}
            title="Set Due Date"
        />

        {showTimePicker && (
            <MyDateTimePicker
                value={dueDate}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                        setDueDate(selectedDate);
                        setHasTime(true);
                    }
                }}
            />
        )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background handled by ScreenLayout
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.l,
      paddingTop: spacing.m,
      paddingBottom: spacing.m,
  },
  headerTitle: {
      ...typography.subheader,
      color: colors.text, 
      fontSize: 18,
  },

  contentContainer: {
      flex: 1,
      justifyContent: 'space-between', 
  },
  scrollContent: {
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.xxl,
  },
  input: {
      ...typography.header,
      fontSize: 32,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: spacing.xl,
      marginTop: spacing.s,
  },
  section: {
      marginBottom: spacing.xl,
      gap: spacing.s,
  },
  sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 12,
      fontWeight: '600',
  },
  pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
  },
  pill: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24, 
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
  },
  pillSelected: {
      backgroundColor: colors.lavender, 
      borderColor: colors.accent,
  },
  pillText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
  },
  pillTextSelected: {
      color: colors.text,
  },
  datePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 24,
      backgroundColor: colors.l2,
      borderWidth: 1,
      borderColor: 'transparent',
  },
  datePillText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
  },
  footer: {
      padding: spacing.l,
      backgroundColor: colors.background, 
  },
  primaryBtn: {
      backgroundColor: colors.primary,
      height: 56, 
      borderRadius: 28, 
      justifyContent: 'center',
      alignItems: 'center',
      // ...shadows.soft, // Removed for cleaner flat look
  },
  primaryBtnText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
  disabledBtn: {
      backgroundColor: colors.buttonDisabledBg,
  }
});
