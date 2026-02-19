import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius, layout } from '../theme';
import { createApiService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MoodSelector } from '../components/MoodSelector';
import { HealthBanner } from '../components/HealthBanner';
import { TaskItem } from '../components/TaskItem';
import { MascotCorner } from '../components/MascotCorner';
import { CompletionModal } from '../components/CompletionModal';
import { TaskListSkeleton } from '../components/ui/SkeletonLoader';
import { useMoodTheme } from '../context/MoodContext';
import { ScreenLayout } from '../components/ui/ScreenLayout';

export const HomeScreen = ({ navigation }: any) => {
  const { getToken, signOut } = useAuth();
  const api = createApiService(getToken);

  const [todos, setTodos] = useState<any[]>([]);
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  
  // Completion Modal State
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<any>(null);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todosData, logData] = await Promise.all([
        api.getTodos(today),
        api.getDailyLog(today)
      ]);
      setTodos(todosData);
      setDailyLog(logData);
      // Restore mood from DB
      if (logData?.mood) {
        setSelectedMood(logData.mood);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );



  const handleDeleteTodo = async (id: string) => {
      try {
          await api.deleteTodo(id);
          setCompletionModalVisible(false);
          fetchData();
      } catch (e) {
          console.error('Delete failed:', e);
      }
  };

  const handleRescheduleTodo = async (id: string, newDate: string) => {
      try {
          await api.updateTodoDetails(id, { dueDate: newDate });
          setCompletionModalVisible(false);
          fetchData();
      } catch (e) {
          console.error('Reschedule failed:', e);
      }
  };

  // Sync with Global Context
  const { setMood, moodColor } = useMoodTheme();

  // On Mount: If mood exists in log, sync to context
  useEffect(() => {
     if (dailyLog?.mood) {
         setMood(dailyLog.mood); // Sync loaded mood to global context
     }
  }, [dailyLog, setMood]);

  const handleMoodSelect = async (moodId: string) => {
      setSelectedMood(moodId);
      setMood(moodId); // Update global theme instantly
      try {
          const today = new Date().toISOString().split('T')[0];
          await api.logDay(today, undefined, moodId);
      } catch (e) {
          console.error('Failed to save mood:', e);
      }
  };

  const isFlareUp = dailyLog?.day_type === 'FLARE_UP';
  const isLowEnergy = dailyLog?.day_type === 'LOW_ENERGY';

  const getSortedTodos = () => {
    let sorted = [...todos];
    if (isFlareUp || isLowEnergy) {
        // Smart Sort: Low Energy first, High Energy last
        const energyOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2 };
        sorted.sort((a, b) => {
            const energyA = energyOrder[a.energy_level as keyof typeof energyOrder] ?? 1;
            const energyB = energyOrder[b.energy_level as keyof typeof energyOrder] ?? 1;
            return energyA - energyB;
        });
    } else {
         // Default: Incomplete first
         sorted.sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1));
    }
    return sorted;
  };

  const sortedTodos = getSortedTodos();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6)  return { text: "Good Night",     sub: "Rest well, recharge your mind.",          icon: "moon" as const,         iconColor: colors.primary };
    if (hour < 12) return { text: "Good Morning",   sub: "A fresh start awaits you today!",         icon: "sunny" as const,        iconColor: colors.warning };
    if (hour < 17) return { text: "Good Afternoon",  sub: "Keep going, you're doing great!",        icon: "partly-sunny" as const, iconColor: colors.accent };
    if (hour < 21) return { text: "Good Evening",    sub: "Wind down and reflect on your day.",     icon: "moon" as const,         iconColor: colors.primary };
    return                 { text: "Good Night",     sub: "Rest well, recharge your mind.",          icon: "moon" as const,         iconColor: colors.primary };
  };

  const greeting = getGreeting();

  return (
      <ScreenLayout edges={['top']}>
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
            <View style={styles.headerContainer}>
                {/* Greeting */}
                <View style={styles.greetingIconWrap}>
                    <Ionicons name={greeting.icon} size={24} color={greeting.iconColor} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.greeting}>{greeting.text}</Text>
                    <Text style={styles.subGreeting}>{greeting.sub}</Text>
                </View>
                
                {/* Add Button */}
                <TouchableOpacity onPress={() => navigation.navigate('AddTask')} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color={colors.surface} />
                </TouchableOpacity>
            </View>

            <View style={{ marginBottom: spacing.l }}>
                <MoodSelector onSelectMood={handleMoodSelect} selectedMood={selectedMood} />
            </View>

            <HealthBanner 
                status={dailyLog?.day_type || 'NORMAL'}
                mood={selectedMood}
                onPressAction={() => navigation.navigate('HealthCheckIn')}
            />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Plan</Text>
            </View>
        </View>

        {/* Scrollable Task List */}
        <ScrollView 
            contentContainerStyle={styles.taskListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {loading ? (
            <TaskListSkeleton count={5} />
            ) : sortedTodos.length === 0 ? (
            <View style={styles.emptyState}>
                <Ionicons name="leaf-outline" size={32} color={colors.palette.mint} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>Current cleared. Time to breathe.</Text>
            </View>
            ) : (
            sortedTodos.map((todo, index) => (
                <TaskItem 
                    key={todo.id}
                    index={index}
                    title={todo.title}
                    isCompleted={todo.is_completed}
                    energyLevel={todo.energy_level}
                    progress={todo.progress}
                    startTime={todo.due_date ? new Date(todo.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined}
                    onPress={() => {
                        if (todo.is_completed) {
                            navigation.navigate('TaskDetail', { todo });
                        } else {
                            setToggleTarget(todo);
                            setCompletionModalVisible(true);
                        }
                    }}
                    onToggle={() => {
                        setToggleTarget(todo);
                        setCompletionModalVisible(true);
                    }}
                />
            ))
            )}
            <View style={{height: 100}} />
        </ScrollView>

      {/* Completion Modal */}
      <CompletionModal
        visible={completionModalVisible}
        onClose={() => setCompletionModalVisible(false)}
        todo={toggleTarget}
        onConfirm={async (progress: number) => {
            if (!toggleTarget) return;
            const isCompleted = progress === 100;
            setTodos(prev => prev.map(t => 
                t.id === toggleTarget.id ? {...t, progress, is_completed: isCompleted} : t
            ));
            try {
                await api.updateTodoDetails(toggleTarget.id, { progress, isCompleted });
                fetchData();
            } catch (e) {
                console.error(e);
            }
        }}
        onDelete={handleDeleteTodo}
        onReschedule={handleRescheduleTodo}
        initialProgress={toggleTarget?.progress || 0}
        title={toggleTarget?.title}
      />

      <MascotCorner mood="HAPPY" onPress={() => console.log("Mascot clicked!")} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background handled by ScreenLayout
  },
  fixedHeader: {
    paddingTop: spacing.m,
    backgroundColor: colors.background, // Make transparent for gradient
  },
  taskListContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
    flexGrow: 1,
    paddingBottom: spacing.l, // Add bottom padding for better scroll experience
  },
  headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.m,
      gap: spacing.m,
  },
  greetingIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.surface, // Solid clean surface
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.soft,
  },
  greeting: {
      ...typography.header,
      color: colors.text,
      fontSize: 24,
  },
  subGreeting: {
      ...typography.caption,
      color: colors.textPrimary,
      marginTop: 2,
      opacity: 0.8
  },
  addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.glow
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.s,
      marginTop: spacing.xs,
  },
  sectionTitle: {
      ...typography.subheader,
      color: colors.text,
      fontSize: 18
  },
  emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.l,
  },
  emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      fontStyle: 'italic',
  },
});
