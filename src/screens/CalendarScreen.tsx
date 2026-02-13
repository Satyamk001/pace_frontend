import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Animated } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScheduleCard } from '../components/ScheduleCard';
import { ScheduleListSkeleton } from '../components/ui/SkeletonLoader';
import { MascotCorner } from '../components/MascotCorner';
import { Calendar, DateData } from 'react-native-calendars';
import { getLocalDateKey } from '../utils/dateUtils';
import { CompletionModal } from '../components/CompletionModal';
import { ProgressChart } from 'react-native-chart-kit';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const screenWidth = Dimensions.get('window').width;

export const CalendarScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);
  
  // Animation Value
  const scrollY = useRef(new Animated.Value(0)).current;

  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Completion Modal State
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Data State
  const [dayTasks, setDayTasks] = useState<any[]>([]);
  const [dayLog, setDayLog] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [calendarStats, setCalendarStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Week View Specific
  const [weekStartDate, setWeekStartDate] = useState(new Date());

  // Initialize Week
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday
    setWeekStartDate(start);
  }, []);

  // Reset scroll when view mode changes
  useEffect(() => {
      scrollY.setValue(0);
  }, [viewMode]);

  // Interpolations
  const calendarHeight = scrollY.interpolate({
      inputRange: [0, 100], // Scroll distance to full collapse
      outputRange: [360, 0], // Initial height -> Collapsed
      extrapolate: 'clamp'
  });
  
  const calendarOpacity = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0],
      extrapolate: 'clamp'
  });

  const fetchCalendarStats = async () => {
      try {
          const stats = await api.getCalendarData();
          setCalendarStats(stats);
      } catch (e) {
          console.error(e);
      }
  };

  const fetchDayDetails = async (date: Date) => {
      setLoading(true);
      try {
          const dateStr = getLocalDateKey(date);
          
          // Fetch all daily data in parallel
          const [tasks, log, metrics] = await Promise.all([
              api.getTodos(dateStr),
              api.getDailyLog(dateStr).catch(() => null), // Graceful fail
              api.getHealthMetrics(dateStr).catch(() => null) // Graceful fail
          ]);

          const sortedTasks = tasks.sort((a: any, b: any) => {
              if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              return 0;
          });

          setDayTasks(sortedTasks);
          setDayLog(log);
          setHealthMetrics(metrics);

      } catch (e) {
          console.error('Error fetching day details:', e);
      } finally {
          setLoading(false);
      }
  };

  // Toggle handler — opens the completion modal
  const handleToggleTask = (task: any) => {
      setSelectedTask(task);
      setCompletionModalVisible(true);
  };

  // Confirm handler — updates progress and completion status
  const handleCompletionConfirm = async (progress: number) => {
      if (!selectedTask) return;
      
      const isCompleted = progress === 100;
      
      // Optimistic Update
      setDayTasks((prev: any[]) => prev.map((t: any) => 
          t.id === selectedTask.id ? { ...t, progress, is_completed: isCompleted } : t
      ));

      try {
          await api.updateTodoDetails(selectedTask.id, { 
              progress, 
              isCompleted 
          });
          fetchCalendarStats();
      } catch (e) {
          console.error(e);
      }
  };

  // Delete handler
  const handleDeleteTask = async (id: string) => {
      try {
          // Optimistic update
          setDayTasks(prev => prev.filter(t => t.id !== id));
          setCompletionModalVisible(false); // Close modal immediately
          
          await api.deleteTodo(id);
          fetchCalendarStats(); // Refresh monthly dots
      } catch (e) {
          console.error("Delete failed:", e);
          // Revert if needed or show alert (omitted for brevity)
      }
  };

  const loadAllData = async () => {
      setRefreshing(true);
      await Promise.all([fetchCalendarStats(), fetchDayDetails(selectedDate)]);
      setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // Refetch tasks when the selected date changes (week day tap, month day tap, etc.)
  useEffect(() => {
      fetchDayDetails(selectedDate);
  }, [selectedDate]);

  const changeWeek = (direction: 'PREV' | 'NEXT') => {
      const newStart = new Date(weekStartDate);
      newStart.setDate(newStart.getDate() + (direction === 'NEXT' ? 7 : -7));
      setWeekStartDate(newStart);
  };

  const onMonthDayPress = (day: DateData) => {
      const localDate = new Date(day.timestamp + new Date().getTimezoneOffset() * 60 * 1000);
      const today = new Date();
      // Reset time for accurate comparison
      today.setHours(23, 59, 59, 999);
      
      if (localDate > today) return;

      setSelectedDate(localDate);
      fetchDayDetails(localDate);
  };

  const renderWeekView = () => {
      const weekDates = [];
      for(let i=0; i<7; i++) {
          const d = new Date(weekStartDate);
          d.setDate(weekStartDate.getDate() + i);
          weekDates.push(d);
      }

      return (
          <View style={styles.weekContainer}>
             <View style={styles.weekHeader}>
                 <TouchableOpacity onPress={() => changeWeek('PREV')}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                 </TouchableOpacity>
                 <Text style={styles.monthTitle}>
                     {weekStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                 </Text>
                 <TouchableOpacity onPress={() => changeWeek('NEXT')}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                 </TouchableOpacity>
             </View>

             <View style={styles.weekRow}>
                 {weekDates.map((date, index) => {
                     const isSelected = date.toDateString() === selectedDate.toDateString();
                     const isToday = date.toDateString() === new Date().toDateString();
                     
                     return (
                         <TouchableOpacity 
                            key={index} 
                            style={[
                                styles.dateItem,
                                isSelected && styles.selectedDateItem,
                                isToday && !isSelected && styles.todayDateItem
                            ]}
                            onPress={() => {
                                const today = new Date();
                                today.setHours(23, 59, 59, 999);
                                if (date <= today) {
                                    setSelectedDate(date);
                                }
                            }}
                         >
                             <Text style={[styles.dayName, isSelected && styles.selectedDayName]}>
                                 {DAYS[date.getDay()]}
                             </Text>
                             <Text style={[styles.dayNum, isSelected && styles.selectedDayNum]}>
                                 {date.getDate()}
                             </Text>
                         </TouchableOpacity>
                     );
                 })}
             </View>
          </View>
      );
  };

  // Prepare marked dates for Month View
  const markedDates: any = {};
  Object.keys(calendarStats).forEach(dateStr => {
      const stat = calendarStats[dateStr];
      const isPainHigh = stat.pain_level >= 7;
      
      markedDates[dateStr] = {
          customStyles: {
              container: {
                  backgroundColor: isPainHigh ? '#FFEBEE' : undefined,
                  borderWidth: stat.completion_percent === 100 ? 1 : 0,
                  borderColor: colors.secondary
              },
              text: {
                  color: isPainHigh ? colors.error : colors.text
              }
          }
      };
  });
  const selectedStr = getLocalDateKey(selectedDate);
  markedDates[selectedStr] = {
      ...markedDates[selectedStr],
      selected: true,
      selectedColor: colors.primary
  };

  // Helper to check if date is past (strictly before today)
  const isPastDate = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      return selected < today;
  };

  // Calculate stats for summary card
  const completedTasks = dayTasks.filter(t => t.is_completed).length;
  const progressPercent = dayTasks.length > 0 ? (completedTasks / dayTasks.length) : 0;
  
  const moodEmoji = dayLog?.mood ? dayLog.mood.split(' ')[0] : '—'; // Assume "😊 Happy" format
  const moodText = dayLog?.mood ? dayLog.mood.split(' ').slice(1).join(' ') : 'No Data';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
          <View style={{ width: 40 }} />
          <View style={styles.viewToggle}>
              <TouchableOpacity onPress={() => setViewMode('WEEK')}>
                  <Text style={[styles.toggleText, viewMode === 'WEEK' && styles.toggleTextActive]}>Week</Text>
              </TouchableOpacity>
              <Text style={{color: colors.border}}>|</Text>
              <TouchableOpacity onPress={() => setViewMode('MONTH')}>
                  <Text style={[styles.toggleText, viewMode === 'MONTH' && styles.toggleTextActive]}>Month</Text>
              </TouchableOpacity>
          </View>
          
          {/* Hide Add Button for past dates */}
          {!isPastDate() ? (
            <TouchableOpacity onPress={() => navigation.navigate('AddTask', { initialDate: selectedDate.toISOString() })}>
               <View style={styles.addBtn}>
                   <Ionicons name="add" size={24} color={colors.text} />
               </View>
            </TouchableOpacity>
          ) : (
            <View style={{width: 40}} /> // Placeholder to keep spacing
          )}
      </View>

      {viewMode === 'MONTH' ? (
          <Animated.View style={{ height: calendarHeight, opacity: calendarOpacity, overflow: 'hidden' }}>
              <Calendar
                current={selectedStr}
                onDayPress={onMonthDayPress}
                markingType={'custom'}
                markedDates={markedDates}
                maxDate={new Date().toISOString().split('T')[0]} 
                monthFormat={'MMMM yyyy'}
                theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.background,
                    textSectionTitleColor: colors.textLight,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.secondary,
                    dayTextColor: colors.text,
                    textDisabledColor: '#d9e1e8',
                    arrowColor: colors.primary,
                    disabledArrowColor: '#d9e1e8',
                    monthTextColor: colors.text,
                    indicatorColor: colors.primary,
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '400',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 12
                }}
              />
              <View style={styles.legend}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <View style={[styles.dot, {backgroundColor: '#FFEBEE', width: 12, height: 12, borderRadius: 2}]} />
                      <Text style={styles.legendText}>High Pain</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <View style={[styles.dot, {borderColor: colors.secondary, borderWidth: 1, backgroundColor: 'transparent', width: 12, height: 12, borderRadius: 2}]} />
                      <Text style={styles.legendText}>All Tasks Done</Text>
                  </View>
              </View>
          </Animated.View>
      ) : (
          renderWeekView()
      )}

      {/* Shared Timeline / Task List Area */}
      <View style={styles.timelineContainer}>
        <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
            </Text>
        </View>

        <Animated.ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAllData} />}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        >
            {/* Daily Overview Card */}
            {(dayLog || healthMetrics || dayTasks.length > 0) && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        {/* Circular Progress (Tasks) */}
                        <View style={styles.progressContainer}>
                            <ProgressChart
                                data={{
                                    labels: ["Done"],
                                    data: [progressPercent]
                                }}
                                width={100}
                                height={100}
                                strokeWidth={8}
                                radius={36}
                                chartConfig={{
                                    backgroundGradientFrom: colors.surface,
                                    backgroundGradientTo: colors.surface,
                                    color: (opacity = 1) => `rgba(132, 112, 255, ${opacity})`, // colors.primary
                                    labelColor: (opacity = 1) => colors.text,
                                }}
                                hideLegend={true}
                            />
                            <View style={styles.progressTextContainer}>
                                <Text style={styles.progressPercent}>{Math.round(progressPercent * 100)}%</Text>
                            </View>
                            <Text style={styles.progressLabel}>Tasks</Text>
                        </View>

                        {/* Health Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Mood</Text>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{fontSize: 20, marginRight: 4}}>{moodEmoji}</Text>
                                    <Text style={styles.statValue}>{moodText}</Text>
                                </View>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Pain</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.barFill, { width: `${(healthMetrics?.pain_level || 0) * 10}%`, backgroundColor: (healthMetrics?.pain_level || 0) > 6 ? colors.error : colors.primary }]} />
                                </View>
                                <Text style={styles.statValueNum}>{healthMetrics?.pain_level ?? '-'}/10</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Fatigue</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.barFill, { width: `${(healthMetrics?.fatigue_level || 0) * 10}%`, backgroundColor: colors.accent }]} />
                                </View>
                                <Text style={styles.statValueNum}>{healthMetrics?.fatigue_level ?? '-'}/10</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Notes Section */}
                    {healthMetrics?.notes && (
                        <View style={styles.notesSection}>
                            <Text style={styles.notesLabel}>Notes:</Text>
                            <Text style={styles.notesText} numberOfLines={2}>{healthMetrics.notes}</Text>
                        </View>
                    )}
                </View>
            )}

            {loading ? (
                <ScheduleListSkeleton count={3} />
            ) : dayTasks.length > 0 ? (
                dayTasks.map((task) => (
                    <ScheduleCard 
                        key={task.id}
                        title={task.title}
                        startTime={task.due_date ? new Date(task.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Anytime"}
                        type={task.energy_level === 'HIGH' ? 'TASK' : task.energy_level === 'LOW' ? 'BREAK' : 'MEETING'}
                        color={task.energy_level === 'HIGH' ? '#ffccbc' : task.energy_level === 'LOW' ? '#c8e6c9' : '#ffe0b2'}
                        isCompleted={task.is_completed}
                        progress={task.progress}
                        onPress={() => navigation.navigate('TaskDetail', { todo: task })}
                        onToggle={() => handleToggleTask(task)}
                    />
                ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tasks planned for this day.</Text>
                </View>
            )}
            <View style={{height: 100}} />
        </Animated.ScrollView>
      </View>

      <MascotCorner mood="Working" />
      
      {/* Completion Modal */}
      <CompletionModal
        visible={completionModalVisible}
        onClose={() => setCompletionModalVisible(false)}
        onConfirm={handleCompletionConfirm}
        onDelete={handleDeleteTask}
        initialProgress={selectedTask?.progress || 0}
        title={selectedTask?.title}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    marginBottom: spacing.m,
  },
  viewToggle: {
      flexDirection: 'row',
      gap: spacing.m,
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 20,
      ...shadows.soft
  },
  toggleText: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600'
  },
  toggleTextActive: {
      color: colors.primary,
      fontWeight: 'bold'
  },
  addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.soft,
  },
  calendarContainer: { // Note: Unused now in render, but keeping for safely
      flex: 1,
      marginTop: spacing.m
  },
  legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.l,
      marginTop: spacing.l,
      padding: spacing.m
  },
  legendText: {
      ...typography.caption,
      color: colors.textLight
  },
  weekContainer: {
      marginBottom: spacing.m
  },
  weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.m
  },
  monthTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text
  },
  weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.l
  },
  dateItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 64,
      borderRadius: 22,
      backgroundColor: colors.surface
  },
  selectedDateItem: {
      backgroundColor: colors.glowPurple,
      ...shadows.glow
  },
  todayDateItem: {
      borderWidth: 1,
      borderColor: colors.secondary
  },
  dayName: {
      fontSize: 12,
      color: colors.textLight,
      marginBottom: 4
  },
  selectedDayName: {
      color: 'white',
      fontWeight: '600'
  },
  dayNum: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text
  },
  selectedDayNum: {
      color: 'white'
  },
  timelineContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: spacing.l,
      ...shadows.soft,
      marginHorizontal: 0,
  },
  timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.l
  },
  timelineTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text
  },
  painBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12
  },
  painText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold'
  },
  scrollView: {
      flex: 1
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 40
  },
  emptyText: {
      color: colors.textLight,
      fontStyle: 'italic'
  },
  dot: {
      // Helper for legend
  },
  summaryCard: {
      backgroundColor: colors.background, // Contrast against white surface
      borderRadius: borderRadius.l,
      padding: spacing.m,
      marginHorizontal: spacing.l,
      marginBottom: spacing.l,
      borderWidth: 1,
      borderColor: colors.border,
  },
  summaryTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  progressContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginRight: spacing.m,
  },
  progressTextContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
  },
  progressPercent: {
      fontWeight: 'bold',
      color: colors.text,
      fontSize: 14,
  },
  progressLabel: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: -8,
  },
  statsGrid: {
      flex: 1,
      gap: 8,
  },
  statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  statLabel: {
      fontSize: 12,
      color: colors.textLight,
      fontWeight: '500',
      width: 50,
  },
  statValue: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '600',
  },
  barContainer: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginHorizontal: 8,
      overflow: 'hidden',
  },
  barFill: {
      height: '100%',
      borderRadius: 3,
  },
  statValueNum: {
      fontSize: 10,
      color: colors.text,
      width: 25,
      textAlign: 'right',
  },
  notesSection: {
      marginTop: spacing.m,
      paddingTop: spacing.s,
      borderTopWidth: 1,
      borderTopColor: colors.border,
  },
  notesLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.textLight,
      marginBottom: 2,
  },
  notesText: {
      fontSize: 12,
      color: colors.text,
      fontStyle: 'italic',
  }
});
