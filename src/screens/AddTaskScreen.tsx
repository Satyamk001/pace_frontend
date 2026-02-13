import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { MyDateTimePicker } from '../components/ui/MyDateTimePicker';
import { Ionicons } from '@expo/vector-icons';
import { toLocalISOString } from '../utils/dateUtils';

export const AddTaskScreen = ({ navigation, route }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);
  const [title, setTitle] = useState('');
  const [energy, setEnergy] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [loading, setLoading] = useState(false);
  
  // Date/Time State
  // Default to passed date or today
  const initialDate = route.params?.initialDate ? new Date(route.params.initialDate) : new Date();
  const [dueDate, setDueDate] = useState(initialDate);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState(false);
  const [hasTime, setHasTime] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShow(Platform.OS === 'ios');
    setDueDate(currentDate);
    // On web, our custom component handles change differently, but let's assume standard event shape or just ignore event
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShow(true);
    setMode(currentMode);
    if (currentMode === 'time') setHasTime(true);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
// ...

// ...

      // If user selected time, use full ISO. If not, maybe just date? 
      // Backend expects ISO. Let's send the full date object.
      // Ideally we'd strip time if hasTime is false, but sticking to simple ISO is safer for now.
      await api.createTodo(title, energy, hasTime ? toLocalISOString(dueDate) : undefined);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
             <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <View style={{width: 24}} /> 
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        value={title}
        onChangeText={setTitle}
        autoFocus
        placeholderTextColor={colors.textLight}
      />

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ ...typography.subheader, marginBottom: spacing.s }}>Energy Level</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
            {['LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
                <TouchableOpacity
                    key={lvl}
                    style={{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        backgroundColor: energy === lvl ? colors.secondary : colors.surface,
                        borderWidth: 1,
                        borderColor: energy === lvl ? colors.secondary : colors.border,
                    }}
                    onPress={() => setEnergy(lvl as any)}
                >
                    <Text style={{ 
                        color: energy === lvl ? colors.text : colors.textLight,
                        fontWeight: energy === lvl ? 'bold' : 'normal'
                    }}>
                        {lvl}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ ...typography.subheader, marginBottom: spacing.s }}>Schedule</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => showMode('date')}>
                  <Ionicons name="calendar-outline" size={20} color={colors.text} />
                  <Text style={styles.dateText}>{dueDate.toLocaleDateString()}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.dateBtn, hasTime && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} 
                onPress={() => showMode('time')}
              >
                  <Ionicons name="time-outline" size={20} color={hasTime ? colors.primary : colors.text} />
                  <Text style={[styles.dateText, hasTime && { color: colors.primary }]}>
                      {hasTime ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                  </Text>
              </TouchableOpacity>
          </View>
          
          {show && (
            <MyDateTimePicker
              value={dueDate}
              mode={mode}
              is24Hour={true}
              onChange={onChange}
            />
          )}
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCreate} 
        disabled={loading}
      >
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.buttonText}>Add Gently</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.l,
    paddingTop: spacing.l,
    backgroundColor: colors.background,
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
    marginBottom: spacing.l,
  },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: borderRadius.l,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  dateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: borderRadius.m,
      borderWidth: 1,
      borderColor: colors.border
  },
  dateText: {
      fontSize: 16,
      color: colors.text
  }
});
