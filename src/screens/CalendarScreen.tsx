import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Animated, PanResponder } from 'react-native';
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
import { ScreenLayout } from '../components/ui/ScreenLayout';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const screenWidth = Dimensions.get('window').width;
const CALENDAR_HEIGHT = 330;
const COLLAPSED_HEIGHT = 0; // The actual calendar view collapses to 0, week view stays

export const CalendarScreen = ({ navigation }: any) => {
  const { getToken } = useAuth();
  const api = createApiService(getToken);
  
  // Animation Value for Manual Control
  const calendarHeightAnim = useRef(new Animated.Value(CALENDAR_HEIGHT)).current;
  const isExpanded = useRef(true);

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

  // Reset when view mode changes
  useEffect(() => {
    if (viewMode === 'MONTH') {
        calendarHeightAnim.setValue(CALENDAR_HEIGHT);
        isExpanded.current = true;
    }
  }, [viewMode]);

  const collapseCalendar = () => {
      if (!isExpanded.current) return;
      Animated.timing(calendarHeightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false
      }).start(() => {
          isExpanded.current = false;
      });
  };

  const expandCalendar = () => {
      if (isExpanded.current) return;
      Animated.timing(calendarHeightAnim, {
          toValue: CALENDAR_HEIGHT,
          duration: 300,
          useNativeDriver: false
      }).start(() => {
          isExpanded.current = true;
      });
  };

  // Pan Responder for the Slider Handle
  const handlePanResponder = useRef(
      PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderMove: (_, gestureState) => {
              // Calculate new height based on gesture
              let newHeight = isExpanded.current 
                  ? CALENDAR_HEIGHT + gestureState.dy 
                  : gestureState.dy;
              
              // Clamp
              if (newHeight > CALENDAR_HEIGHT) newHeight = CALENDAR_HEIGHT;
              if (newHeight < 0) newHeight = 0;
              
              calendarHeightAnim.setValue(newHeight);
          },
          onPanResponderRelease: (_, gestureState) => {
              // Snap logic
              if (isExpanded.current) {
                  // If dragged up significantly, collapse
                  if (gestureState.dy < -50) collapseCalendar();
                  else expandCalendar(); // Snap back
              } else {
                  // If pulled down significantly, expand
                  if (gestureState.dy > 50) expandCalendar();
                  else collapseCalendar(); // Snap back
              }
          }
      })
  ).current;


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
      
      // Also update week start if selected date is out of current week view range
      // (Simple check: is selected date before start or after start+6?)
      // Actually, for better UX in month view tap, we might want to let the month view drive this.
      // But for Week View consistency:
      const s = new Date(selectedDate);
      s.setDate(s.getDate() - s.getDay());
      // Only update if significantly different to avoiding loops (comparing time)
      if (Math.abs(s.getTime() - weekStartDate.getTime()) > 24 * 60 * 60 * 1000 * 2) {
         setWeekStartDate(s);
      }
  }, [selectedDate]);

  const changeWeek = (direction: 'PREV' | 'NEXT') => {
      setWeekStartDate(prevDate => {
          const newStart = new Date(prevDate);
          newStart.setDate(newStart.getDate() + (direction === 'NEXT' ? 7 : -7));
          return newStart;
      });
  };

  // Pan Responder for Week Swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20; // Horizontal swipe only
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          changeWeek('PREV');
        } else if (gestureState.dx < -50) {
          changeWeek('NEXT');
        }
      },
    })
  ).current;

  const onMonthDayPress = (day: DateData) => {
      const localDate = new Date(day.timestamp + new Date().getTimezoneOffset() * 60 * 1000);
      // Removed future check to allow planning
      setSelectedDate(localDate);
  };

  const renderWeekView = () => {
      const weekDates = [];
      for(let i=0; i<7; i++) {
          const d = new Date(weekStartDate);
          d.setDate(weekStartDate.getDate() + i);
          weekDates.push(d);
      }

      return (
          <View style={styles.weekContainer} {...panResponder.panHandlers}>
             <View style={styles.weekHeader}>
                 <Text style={styles.monthTitle}>
                     {weekStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                 </Text>
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
                                // Removed future check
                                setSelectedDate(date);
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


  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = (event: any) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      
      // If scrolling down significantly and calendar is open, collapse it
      if (currentOffset > 20 && currentOffset > lastScrollY + 5 && isExpanded.current && viewMode === 'MONTH') {
          collapseCalendar();
      }
      setLastScrollY(currentOffset);
  };
 
// ... existing fetch functions restored above ...

  // Opacity interpolation based on the manual height
  const calendarOpacity = calendarHeightAnim.interpolate({
      inputRange: [0, CALENDAR_HEIGHT * 0.5, CALENDAR_HEIGHT],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp'
  });

  // Legend height interpolation — collapses to 0 when calendar collapses
  const legendHeight = calendarHeightAnim.interpolate({
      inputRange: [0, CALENDAR_HEIGHT * 0.5, CALENDAR_HEIGHT],
      outputRange: [0, 0, 40],
      extrapolate: 'clamp'
  });

  // Calculate stats for summary card
  const completedTasks = dayTasks.filter(t => t.is_completed).length;
  const progressPercent = dayTasks.length > 0 ? (completedTasks / dayTasks.length) : 0;
  
  const moodEmoji = dayLog?.mood ? dayLog.mood.split(' ')[0] : '—'; // Assume "😊 Happy" format
  const moodText = dayLog?.mood ? dayLog.mood.split(' ').slice(1).join(' ') : 'No Data';

  // Prepare marked dates for Month View
  const markedDates: any = useMemo(() => {
    const marks: any = {};
    Object.keys(calendarStats).forEach(dateStr => {
        const stat = calendarStats[dateStr];
        
        const painLevel = Number(stat.pain_level); 
        const isPainHigh = !isNaN(painLevel) && painLevel > 5;
        const isAllDone = stat.completion_percent === 100;

        if (!isPainHigh && !isAllDone) return; // Skip days with nothing to mark

          marks[dateStr] = {
              customStyles: {
                  container: {
                      backgroundColor: isPainHigh ? colors.mood.pain : undefined,
                      borderWidth: isAllDone ? 1 : 0,
                      borderColor: isAllDone ? colors.accent : undefined,
                  },
                  text: {
                      color: isPainHigh ? '#ffffff' : colors.text,
                      fontWeight: isPainHigh ? 'bold' : 'normal'
                  }
              }
          };
      });
      const selectedStr = getLocalDateKey(selectedDate);
      marks[selectedStr] = {
          ...marks[selectedStr],
          customStyles: {
            ...marks[selectedStr]?.customStyles,
             container: {
                 ...marks[selectedStr]?.customStyles?.container,
                 backgroundColor: colors.primary,
                 borderColor: colors.primary,
                 borderWidth: 0,
             },
             text: {
              color: colors.buttonPrimaryText,
                 fontWeight: 'bold'
             }
          }
      };
      return marks;
  }, [calendarStats, selectedDate]);


  // Helper to check if date is past (strictly before today)
  const isPastDate = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      return selected < today;
  };

  return (
    <ScreenLayout edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {/* ... header content ... */}
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
            <View style={{width: 40}} /> 
          )}
      </View>

      {/* Shared Timeline / Task List Area */}
       <View style={styles.timelineContainer}> 
           {/* Collapsible Month View */}
           {viewMode === 'MONTH' ? (
                <View>
                    <Animated.View style={{ height: calendarHeightAnim, opacity: calendarOpacity, overflow: 'hidden' }}>
                        <Calendar
                            current={getLocalDateKey(selectedDate)}
                            onDayPress={onMonthDayPress}
                            enableSwipeMonths={true}
                            hideArrows={true}
                            markingType={'custom'}
                            markedDates={markedDates}
                            // maxDate removed to allow future planning
                            monthFormat={'MMMM yyyy'}
                            theme={{
                                backgroundColor: colors.background,
                                calendarBackground: colors.background,
                                textSectionTitleColor: colors.textLight,
                                selectedDayBackgroundColor: colors.primary,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: colors.accent,
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
                    </Animated.View>

                    {/* Legend — collapses in height and fades with calendar */}
                    <Animated.View style={[styles.legend, { opacity: calendarOpacity, height: legendHeight, overflow: 'hidden' }]} pointerEvents="none">
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            <View style={[styles.dot, {backgroundColor: colors.mood.pain, width: 12, height: 12, borderRadius: 2}]} />
                            <Text style={styles.legendText}>High Pain</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            <View style={[styles.dot, {borderColor: colors.accent, borderWidth: 1, backgroundColor: 'transparent', width: 12, height: 12, borderRadius: 2}]} />
                            <Text style={styles.legendText}>All Tasks Done</Text>
                        </View>
                    </Animated.View>

                    {/* Pull Handle — always visible so user can expand/collapse */}
                    <View {...handlePanResponder.panHandlers} style={styles.sliderHandleContainer}>
                        <View style={styles.sliderHandle} />
                    </View>
                </View>
           ) : (
               renderWeekView()
           )}

        {/* Timeline Header (Date Title) */}
        <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
            </Text>
        </View>

        <Animated.ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAllData} />}
            onScroll={handleScroll}
            scrollEventThrottle={16}
        >
            {/* Daily Overview Card */}
            {Boolean(dayLog || healthMetrics || dayTasks.length > 0) && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        {/* Circular Progress (Tasks) */}
                        <View style={styles.progressContainer}>
                            <ProgressChart
                                data={{
                                    labels: ["Done"],
                                    data: [progressPercent || 0]
                                }}
                                width={100}
                                height={100}
                                strokeWidth={8}
                                radius={36}
                                chartConfig={{
                                    backgroundGradientFrom: colors.surface,
                                    backgroundGradientTo: colors.surface,
                                    color: (opacity = 1) => `rgba(124, 132, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => colors.text,
                                }}
                                hideLegend={true}
                            />
                            <View style={styles.progressTextContainer}>
                                <Text style={styles.progressPercent}>{Math.round((progressPercent || 0) * 100)}%</Text>
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
                                    <View style={[styles.barFill, { width: `${(healthMetrics?.fatigue_level || 0) * 10}%`, backgroundColor: colors.info }]} />
                                </View>
                                <Text style={styles.statValueNum}>{healthMetrics?.fatigue_level ?? '-'}/10</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Notes Section */}
                    {healthMetrics?.notes ? (
                        <View style={styles.notesSection}>
                            <Text style={styles.notesLabel}>Notes:</Text>
                            <Text style={styles.notesText} numberOfLines={2}>{healthMetrics.notes}</Text>
                        </View>
                    ) : null}
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
                        color={task.energy_level === 'HIGH' ? colors.mood.low : task.energy_level === 'LOW' ? colors.mood.great : colors.mood.okay}
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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background and safe area handled by ScreenLayout
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
    paddingTop: spacing.m,
  },
  viewToggle: {
      flexDirection: 'row',
      gap: spacing.m,
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
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
      borderWidth: 1,
      borderColor: colors.border,
  },
  calendarContainer: { 
      flex: 1,
    //   marginTop: spacing.xs
  },
  legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.l,
      marginTop: spacing.xs,
      padding: spacing.xs
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
      justifyContent: 'center', // Centered title
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
      width: 48, // Slightly wider
      height: 70, // Slightly taller
      borderRadius: 16, // Squircle-ish
      backgroundColor: 'transparent',
      marginBottom: 8
  },
  selectedDateItem: {
      backgroundColor: colors.primary,
      ...shadows.glow,
      transform: [{ scale: 1.05 }],
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 'auto'
  },
  todayDateItem: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary
  },
  dayName: {
      fontSize: 12,
      color: colors.textLight,
      marginBottom: 4
  },
  selectedDayName: {
      color: colors.buttonPrimaryText,
      fontWeight: '600'
  },
  dayNum: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text
  },
  selectedDayNum: {
      color: colors.buttonPrimaryText
  },
  timelineContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: spacing.s,
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
      color: colors.buttonPrimaryText,
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
  dot: {},
  summaryCard: {
      backgroundColor: colors.l1,
      borderRadius: borderRadius.l,
      padding: spacing.l,
      marginHorizontal: spacing.l,
      marginBottom: spacing.l,
      ...shadows.level1,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.03)',
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
      color: colors.textLight,
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
  },
  sliderHandleContainer: {
      alignItems: 'center',
      paddingVertical: 8,
      backgroundColor: 'transparent',
  },
  sliderHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#E0E0E0',
  }
});
