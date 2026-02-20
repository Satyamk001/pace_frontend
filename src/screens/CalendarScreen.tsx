import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Animated, PanResponder } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useAuth } from '@clerk/clerk-expo';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { createApiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScheduleListSkeleton } from '../components/ui/SkeletonLoader';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';

interface ScheduleCardProps {
    title: string;
    dueDate: string;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    isCompleted: boolean;
    progress?: number;
    feedback?: string;
    onPress: () => void;
    onToggle: () => void;
}

const ScheduleCard = ({ title, dueDate, energyLevel, isCompleted, progress = 0, feedback, onPress, onToggle }: ScheduleCardProps) => {
    const scale = useSharedValue(1);

    const getEnergyStyles = () => {
        switch (energyLevel) {
            case 'LOW': return { bg: colors.mood.great + '1A', text: colors.mood.great };
            case 'MEDIUM': return { bg: colors.mood.okay + '1A', text: colors.mood.okay };
            case 'HIGH': return { bg: colors.mood.pain + '1A', text: colors.mood.pain };
            default: return { bg: colors.mood.okay + '1A', text: colors.mood.okay };
        }
    };
    const energyStyle = getEnergyStyles();

    const getFormattedDate = () => {
        if (!dueDate) return { timeText: '', isWarning: false };
        const date = new Date(dueDate);
        const now = new Date();
        const isOverdue = date < now && !isCompleted;
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return { timeText: timeString, isWarning: isOverdue };
    };
    const dateInfo = getFormattedDate();

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const isFullyDone = isCompleted || progress === 100;

    return (
        <AnimatedReanimated.View style={[styles.timelineItem, animatedStyle]}>
            
            {/* LEFT COLUMN: Time & Node */}
            <View style={styles.timelineLeftColumn}>
                <Text style={[styles.timelineTimeText, dateInfo.isWarning && { color: colors.warning }]}>
                    {dateInfo.timeText}
                </Text>
                
                <View style={styles.timelineNodeContainer}>
                    <View style={[styles.timelineLine, isFullyDone && styles.timelineLineCompleted]} />
                    <View style={[
                        styles.timelineNode,
                        isFullyDone ? styles.timelineNodeCompleted : 
                        (dateInfo.isWarning ? styles.timelineNodeMissed : styles.timelineNodeUpcoming)
                    ]}>
                        {isFullyDone && <Ionicons name="checkmark" size={10} color={colors.surface} />}
                    </View>
                </View>
            </View>

            {/* RIGHT COLUMN: Task Card */}
             <Pressable
                onPress={onPress}
                onPressIn={() => scale.value = withSpring(0.98)}
                onPressOut={() => scale.value = withSpring(1)}
                style={[
                    styles.timelineRightColumn,
                    isFullyDone && styles.timelineRightColumnCompleted
                ]}
            >
                {isFullyDone && <View style={styles.completedAccentStrip} />}
                
                {/* TOP ROW */}
                <View style={styles.cardTopRow}>
                    <Text style={[styles.cardTitle, isFullyDone && styles.completedTitle]} numberOfLines={1}>
                        {title}
                    </Text>
                    <View style={styles.cardStatusContainer}>
                        {dateInfo.isWarning && <Text style={styles.missedLabel}>Missed</Text>}
                        <Pressable onPress={onToggle} hitSlop={16}>
                            {isFullyDone ? (
                                <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                            ) : (
                                <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* MIDDLE ROW */}
                {feedback ? (
                    <View style={styles.cardMiddleRow}>
                        <Text style={styles.feedbackText} numberOfLines={1}>{feedback}</Text>
                    </View>
                ) : null}

                {/* BOTTOM ROW */}
                <View style={styles.cardBottomRow}>
                    <View style={[styles.energyBadge, { backgroundColor: energyStyle.bg }]}>
                        <Text style={[styles.energyText, { color: energyStyle.text }]}>{energyLevel}</Text>
                    </View>
                    
                    {progress > 0 && progress < 100 && !isFullyDone && (
                        <View style={styles.miniProgressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                            </View>
                        </View>
                    )}
                </View>
            </Pressable>
        </AnimatedReanimated.View>
    );
};
import { Calendar, DateData } from 'react-native-calendars';
import { getLocalDateKey } from '../utils/dateUtils';
import { CompletionModal } from '../components/CompletionModal';
import { ProgressChart } from 'react-native-chart-kit';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { NotificationService } from '../services/NotificationService';

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
          // Send to API
          const updatedTodo = await api.updateTodoDetails(selectedTask.id, { 
              progress, 
              isCompleted 
          });
          
          if (updatedTodo && !isCompleted && updatedTodo.due_date) {
            // Restore notification if it was un-completed directly from the calendar list
            const hasTime = new Date(updatedTodo.due_date).getHours() !== 0 || new Date(updatedTodo.due_date).getMinutes() !== 0;
            if (hasTime) {
                await NotificationService.scheduleTodo(updatedTodo);
            }
          }

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

  // State for Month View navigation (independent of selectedDate)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Sync currentMonth when switching views or selecting a date from other sources
  useEffect(() => {
     setCurrentMonth(new Date(selectedDate));
  }, [viewMode]); // Only sync on view entry, not every selectedDate change (optional, but consistent)

    const onSwipeEvent = (event: any) => {
        const { translationX, state } = event.nativeEvent;
        // 5 corresponds to State.ACTIVE, but we can just use the end of gesture instead:
        if (state === 5) { // State.END
            if (translationX > 50) {
                // Swipe Right (Previous)
                if (viewMode === 'WEEK') {
                    changeWeek('PREV');
                } else {
                    setCurrentMonth(prev => {
                        const newDate = new Date(prev);
                        newDate.setMonth(newDate.getMonth() - 1);
                        return newDate;
                    });
                }
            } else if (translationX < -50) {
                // Swipe Left (Next)
                if (viewMode === 'WEEK') {
                    changeWeek('NEXT');
                } else {
                    setCurrentMonth(prev => {
                        const newDate = new Date(prev);
                        newDate.setMonth(newDate.getMonth() + 1);
                        return newDate;
                    });
                }
            }
        }
    };

  const onMonthDayPress = (day: DateData) => {
      const localDate = new Date(day.timestamp + new Date().getTimezoneOffset() * 60 * 1000);
      setSelectedDate(localDate);
      setCurrentMonth(localDate); // Sync view
  };

  const renderWeekView = () => {
      const weekDates = [];
      for(let i=0; i<7; i++) {
          const d = new Date(weekStartDate);
          d.setDate(weekStartDate.getDate() + i);
          weekDates.push(d);
      }

      return (
          <PanGestureHandler onHandlerStateChange={onSwipeEvent} activeOffsetX={[-20, 20]}>
              <View style={styles.weekContainer}>
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
          </PanGestureHandler>
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
  
  // Mood Mapping
  const getMoodDetails = (moodKey: string) => {
      // Map mood keys to Icon name + Color + Label
      const map: Record<string, { icon: string; color: string; label: string }> = {
          'GREAT': { icon: 'happy-outline', color: colors.mood.great, label: 'Great' },
          'GOOD': { icon: 'leaf-outline', color: colors.mood.good, label: 'Good' },
          'OKAY': { icon: 'partly-sunny-outline', color: colors.mood.okay, label: 'Okay' },
          'LOW': { icon: 'battery-dead-outline', color: colors.mood.low, label: 'Low' },
          'PAIN': { icon: 'medkit-outline', color: colors.mood.pain, label: 'Pain' }
      };

      // Handle legacy format "😊 Happy" by trying to extract label
      if (moodKey.includes(' ')) {
           const extractedLabel = moodKey.split(' ').slice(1).join(' ');
           // Try to find a match by label (case-insensitive)
           const found = Object.values(map).find((m) => m.label.toUpperCase() === extractedLabel.toUpperCase());
           if (found) return found;
           // Fallback if label doesn't match known moods
           return { icon: 'help-circle-outline', color: colors.textLight, label: extractedLabel };
      }
      return map[moodKey] || { icon: 'help-circle-outline', color: colors.textLight, label: 'No Data' };
  };

  const { icon: moodIcon, color: moodColor, label: moodLabel } = dayLog?.mood 
      ? getMoodDetails(dayLog.mood) 
      : { icon: 'remove-circle-outline', color: colors.textLight, label: 'No Data' };

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
                <PanGestureHandler onHandlerStateChange={onSwipeEvent} activeOffsetX={[-20, 20]}>
                    <View>
                        <Animated.View style={{ height: calendarHeightAnim, opacity: calendarOpacity, overflow: 'hidden' }}>
                            <Calendar
                                current={getLocalDateKey(currentMonth)}
                                onDayPress={onMonthDayPress}
                                onMonthChange={(month: any) => {
                                    const newDate = new Date(month.timestamp + new Date().getTimezoneOffset() * 60 * 1000); // Standardize timezone
                                    setCurrentMonth(newDate);
                                }}
                                enableSwipeMonths={false} // We handle swipe manually
                                hideArrows={false}
                                renderArrow={(direction: 'left' | 'right') => (
                                    <Ionicons 
                                        name={direction === 'left' ? "chevron-back" : "chevron-forward"} 
                                        size={24} 
                                        color={colors.primary} 
                                    />
                                )}
                                markingType={'custom'}
                                markedDates={markedDates}
                                monthFormat={'MMMM yyyy'}
                                theme={{
                                    // backgroundColor: colors.background, // Match screen background for cleaner look (no "muddy" blocks)
                                    // calendarBackground: colors.background,
                                    textSectionTitleColor: colors.textLight,
                                    selectedDayBackgroundColor: colors.primary,
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: colors.accent,
                                    dayTextColor: colors.text,
                                    textDisabledColor: '#E0E0E0', 
                                    arrowColor: colors.primary,
                                    disabledArrowColor: '#E0E0E0',
                                    monthTextColor: colors.text,
                                    indicatorColor: colors.primary,
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: '700', // Bolder title
                                    textDayHeaderFontWeight: '500',
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
                </PanGestureHandler>
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
                                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
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
                                    <Ionicons name={moodIcon as any} size={20} color={moodColor} style={{marginRight: 4}} />
                                    <Text style={styles.statValue}>{moodLabel}</Text>
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
                        dueDate={task.due_date}
                        energyLevel={task.energy_level}
                        isCompleted={task.is_completed}
                        progress={task.progress}
                        feedback={task.feedback}
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
    marginBottom: spacing.l, // Reduced from spacing.xs
    paddingTop: spacing.m,
    paddingBottom: spacing.xs // Add slight padding inside header instead of margin
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
      paddingTop: spacing.l, // Increased padding to look better with 0 margin
      marginTop: -spacing.s, // Pull it up slightly to overlap
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
  },
  // --- NEW FLAT / TONAL SCHEDULE CARD STYLES ---
  timelineItem: {
      flexDirection: 'row',
      marginBottom: spacing.m,
      marginHorizontal: spacing.l,
  },
  timelineLeftColumn: {
      width: 60,
      alignItems: 'center',
      marginRight: spacing.s,
  },
  timelineTimeText: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textLight,
      marginBottom: spacing.s,
      textAlign: 'center',
  },
  timelineNodeContainer: {
      alignItems: 'center',
      flex: 1,
      width: 20,
  },
  timelineLine: {
      position: 'absolute',
      top: 0,
      bottom: -spacing.m,
      width: 2,
      backgroundColor: colors.border,
      zIndex: 1,
  },
  timelineLineCompleted: {
      opacity: 0.3,
  },
  timelineNode: {
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      zIndex: 2,
      marginTop: 2,
  },
  timelineNodeUpcoming: {
      borderWidth: 2,
      borderColor: colors.border,
  },
  timelineNodeCompleted: {
      backgroundColor: colors.accent,
  },
  timelineNodeMissed: {
      backgroundColor: colors.warning,
      borderWidth: 0,
  },
  timelineRightColumn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.m,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: colors.border + '80', // Subtle 50% opacity border
      elevation: 0,
      shadowOpacity: 0,
      overflow: 'hidden',
  },
  timelineRightColumnCompleted: {
      borderColor: colors.border + '40', // even more subtle border when done
  },
  completedAccentStrip: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: colors.accent,
  },
  cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
  },
  cardStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
  },
  missedLabel: {
      ...typography.caption,
      color: colors.warning,
      fontWeight: 'bold',
  },
  cardMiddleRow: {
      marginBottom: spacing.sm,
  },
  cardTitle: {
      ...typography.h3,
      color: colors.text,
      fontSize: 16,
      flex: 1, // ensure it shrinks instead of overlapping
  },
  completedTitle: {
      opacity: 0.85,
      textDecorationLine: 'line-through',
  },
  feedbackText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      fontStyle: 'italic',
  },
  cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  energyBadge: {
      borderRadius: borderRadius.round,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
  },
  energyText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
  },
  miniProgressContainer: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'center',
  },
  progressBarBg: {
      width: 60, // Fixed small width for the mini progress indicator
      height: 4,
      backgroundColor: colors.l2,
      borderRadius: borderRadius.round,
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: borderRadius.round,
  }
});
