import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius, layout } from '../theme';
import { createApiService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MoodSelector } from '../components/MoodSelector';
import { HealthBanner } from '../components/HealthBanner';
import { TaskItem } from '../components/TaskItem';
import { TaskListSkeleton } from '../components/ui/SkeletonLoader';
import { useMoodTheme } from '../context/MoodContext';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { NotificationService } from '../services/NotificationService';

export const HomeScreen = ({ navigation }: any) => {
  const { getToken, signOut } = useAuth();
  const api = createApiService(getToken);

  const [todos, setTodos] = useState<any[]>([]);
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UPCOMING' | 'MISSED' | 'DONE'>('ALL');

  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  


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
          fetchData();
      } catch (e) {
          console.error('Delete failed:', e);
      }
  };

  const handleRescheduleTodo = async (id: string, newDate: string) => {
      try {
          const updatedTodo = await api.updateTodoDetails(id, { dueDate: newDate });
          
          if (updatedTodo && updatedTodo.due_date && !updatedTodo.is_completed) {
            const hasTime = new Date(updatedTodo.due_date).getHours() !== 0 || new Date(updatedTodo.due_date).getMinutes() !== 0;
            if (hasTime) {
                await NotificationService.scheduleTodo(updatedTodo);
            }
          }
          
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
    // 1) Pre-filter based on the active tab
    const now = new Date();
    let filtered = todos.filter(t => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'DONE') return t.is_completed || t.progress === 100;
        
        const isDone = t.is_completed || t.progress === 100;
        if (isDone) return false; // Both UPCOMING and MISSED only show incomplete tasks

        const dueDate = t.due_date ? new Date(t.due_date) : null;
        if (!dueDate) return activeFilter === 'UPCOMING'; // Tasks with no time are always "upcoming" for the day

        const isOverdue = dueDate < now;
        if (activeFilter === 'MISSED') return isOverdue;
        if (activeFilter === 'UPCOMING') return !isOverdue;
        
        return true;
    });

    // 2) Sort
    if (isFlareUp || isLowEnergy) {
        // Smart Sort: Low Energy first, High Energy last
        const energyOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2 };
        filtered.sort((a, b) => {
            const energyA = energyOrder[a.energy_level as keyof typeof energyOrder] ?? 1;
            const energyB = energyOrder[b.energy_level as keyof typeof energyOrder] ?? 1;
            return energyA - energyB;
        });
    } else {
         // Default: Incomplete first
         filtered.sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1));
    }
    return filtered;
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
      <ScreenLayout edges={['top']} useGradient="hero">
        {/* Fixed Header / Health Hub Mat */}
        <LinearGradient 
            colors={colors.gradients.background as unknown as readonly [string, string, ...string[]]}
            style={styles.fixedHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
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

            <View style={{ marginBottom: spacing.s }}>
                <MoodSelector onSelectMood={handleMoodSelect} selectedMood={selectedMood} />
            </View>

            <HealthBanner 
                status={dailyLog?.day_type || 'NORMAL'}
                mood={selectedMood}
                onPressAction={() => navigation.navigate('HealthCheckIn')}
            />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tasks</Text>
                {/* Filters Row */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={{ flex: 1, marginLeft: spacing.s }}
                    contentContainerStyle={styles.filterRow}
                >
                    {(['ALL', 'UPCOMING', 'MISSED', 'DONE'] as const).map(filter => {
                        // Calculate count for this specific filter
                        let count = 0;
                        const now = new Date();
                        if (filter === 'ALL') {
                            count = todos.length;
                        } else {
                            count = todos.filter(t => {
                                const isDone = t.is_completed || t.progress === 100;
                                if (filter === 'DONE') return isDone;
                                if (isDone) return false;
                        
                                const dueDate = t.due_date ? new Date(t.due_date) : null;
                                if (!dueDate) return filter === 'UPCOMING';
                                
                                const isOverdue = dueDate < now;
                                if (filter === 'MISSED') return isOverdue;
                                if (filter === 'UPCOMING') return !isOverdue;
                                return false;
                            }).length;
                        }

                        const isActive = activeFilter === filter;
                        
                        return (
                        <TouchableOpacity 
                            key={filter} 
                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                            onPress={() => setActiveFilter(filter)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                {filter.charAt(0) + filter.slice(1).toLowerCase()}
                            </Text>
                            <View style={[styles.filterCountCircle, isActive && styles.filterCountCircleActive]}>
                                <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                                    {count < 10 ? `0${count}` : count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </LinearGradient>

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
                    dueDate={todo.due_date}
                    feedback={todo.feedback}
                    onPress={() => navigation.navigate('TaskDetail', { todo })}
                    onToggle={async () => {
                        const newCompletedState = !todo.is_completed;
                        const newProgress = newCompletedState ? 100 : 0;
                        setTodos(prev => prev.map(t => 
                            t.id === todo.id ? {...t, progress: newProgress, is_completed: newCompletedState} : t
                        ));
                        try {
                            await api.updateTodoDetails(todo.id, { progress: newProgress, isCompleted: newCompletedState });
                            fetchData();
                        } catch (e) {
                            console.error(e);
                        }
                    }}
                    onDelete={() => handleDeleteTodo(todo.id)}
                />
            ))
            )}
            <View style={{height: 100}} />
        </ScrollView>



      
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
  filterRow: {
      paddingRight: 0,
      gap: 6,
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'flex-end',
  },
  filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 4,
      height: 30,
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
  },
  filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...shadows.soft,
  },
  filterText: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textPrimary,
      marginRight: 6,
  },
  filterTextActive: {
      color: colors.surface,
  },
  filterCountCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
  },
  filterCountCircleActive: {
      // Background remains surface (white) even when active
  },
  filterCountText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
  },
  filterCountTextActive: {
      color: colors.primary,
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
