import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAuth } from '@clerk/clerk-expo';
import {colors, spacing, typography, borderRadius} from '../theme';
import { createApiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScheduleListSkeleton } from '../components/ui/SkeletonLoader';
import AnimatedReanimated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { getLocalDateKey } from '../utils/dateUtils';
import { ProgressChart } from 'react-native-chart-kit';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { NotificationService } from '../services/NotificationService';

import { CalendarScheduleCard } from '../components/CalendarScheduleCard';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const { width: screenWidth } = Dimensions.get('window');
const CALENDAR_HEIGHT = 355;
// CalendarScreen
// ─────────────────────────────────────────────────────────

export const CalendarScreen = ({ route, navigation }: any) => {
    const { getToken } = useAuth();

    const api = createApiService(getToken);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [dayTasks, setDayTasks] = useState<any[]>([]);
    const [dayLog, setDayLog] = useState<any>(null);
    const [healthMetrics, setHealthMetrics] = useState<any>(null);
    const [calendarStats, setCalendarStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [weekStartDate, setWeekStartDate] = useState(new Date());
    const [lastScrollY, setLastScrollY] = useState(0);

    // ─── Init
    useEffect(() => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        setWeekStartDate(start);
    }, []);

    // ─── Handle Returns from Edit Screen
    useEffect(() => {
        if (route.params?.updatedTaskDate) {
            const newDate = new Date(route.params.updatedTaskDate);
            setSelectedDate(newDate);
            
            // Re-align the week slider to include the new date
            const start = new Date(newDate);
            start.setDate(newDate.getDate() - newDate.getDay());
            setWeekStartDate(start);

            // Clear param to prevent looping on future mount
            navigation.setParams({ updatedTaskDate: undefined });
        }
    }, [route.params?.updatedTaskDate]);


    // ─── Data fetching (logic unchanged)
    const fetchCalendarStats = async () => {
        try { setCalendarStats(await api.getCalendarData()); }
        catch (e) { console.error(e); }
    };

    const fetchDayDetails = async (date: Date) => {
        if (dayTasks.length === 0) setLoading(true);
        try {
            const dateStr = getLocalDateKey(date);
            const [tasks, log, metrics] = await Promise.all([
                api.getTodos(dateStr),
                api.getDailyLog(dateStr).catch(() => null),
                api.getHealthMetrics(dateStr).catch(() => null),
            ]);
            setDayTasks(tasks.sort((a: any, b: any) =>
                a.due_date && b.due_date
                    ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : 0));
            setDayLog(log);
            setHealthMetrics(metrics);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleToggleTask = async (task: any) => { 
        setSelectedTask(task); 
        const isCompleted = !task.is_completed;
        const progress = isCompleted ? 100 : 0;
        
        setDayTasks(prev => prev.map(t =>
            t.id === task.id
                ? { ...t, progress, is_completed: isCompleted } : t));
                
        try {
            const updated = await api.updateTodoDetails(task.id, { progress, isCompleted });
            if (updated) {
                if (isCompleted) {
                    // FIX Bug 6: cancel notification when task is completed
                    await NotificationService.cancelTodo(task.id);
                } else if (updated.due_date) {
                    // Reschedule when marking back as incomplete
                    await NotificationService.scheduleTodo(updated);
                }
            }
            fetchCalendarStats();
        } catch (e) { console.error(e); }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            setDayTasks(prev => prev.filter(t => t.id !== id));
            await api.deleteTodo(id);
            fetchCalendarStats();
        } catch (e) { console.error(e); }
    };

    const loadAllData = async () => {
        setRefreshing(true);
        await Promise.all([fetchCalendarStats(), fetchDayDetails(selectedDate)]);
        setRefreshing(false);
    };

    useFocusEffect(useCallback(() => { loadAllData(); }, []));

    useEffect(() => {
        fetchDayDetails(selectedDate);
        const s = new Date(selectedDate);
        s.setDate(s.getDate() - s.getDay());
        if (Math.abs(s.getTime() - weekStartDate.getTime()) > 2 * 24 * 60 * 60 * 1000) setWeekStartDate(s);
    }, [selectedDate]);

    const changeWeek = (dir: 'PREV' | 'NEXT') =>
        setWeekStartDate(prev => {
            const next = new Date(prev);
            next.setDate(next.getDate() + (dir === 'NEXT' ? 7 : -7));
            return next;
        });


    // ── WEEK-only swipe handler (NOT used for month — calendar handles its own swipe)
    const onWeekSwipe = (event: any) => {
        const { translationX, state } = event.nativeEvent;
        if (state === 5) {
            if (translationX > 50) changeWeek('PREV');
            else if (translationX < -50) changeWeek('NEXT');
        }
    };


    // ─── Derived
    const completedTasks = dayTasks.filter(t => t.is_completed).length;
    const progressPercent = dayTasks.length > 0 ? completedTasks / dayTasks.length : 0;

    const getMoodDetails = (moodKey: string) => {
        const map: Record<string, any> = {
            GREAT: { icon: 'happy-outline', color: colors.mood.great, label: 'Great' },
            GOOD: { icon: 'leaf-outline', color: colors.mood.good, label: 'Good' },
            OKAY: { icon: 'partly-sunny-outline', color: colors.mood.okay, label: 'Okay' },
            LOW: { icon: 'battery-dead-outline', color: colors.mood.low, label: 'Low' },
            PAIN: { icon: 'medkit-outline', color: colors.mood.pain, label: 'Pain' },
        };
        if (moodKey?.includes(' ')) {
            const label = moodKey.split(' ').slice(1).join(' ');
            return Object.values(map).find(m => m.label.toUpperCase() === label.toUpperCase()) ||
                { icon: 'help-circle-outline', color: colors.textLight, label };
        }
        return map[moodKey] || { icon: 'remove-circle-outline', color: colors.textLight, label: 'No Data' };
    };

    const moodDetails = dayLog?.mood
        ? getMoodDetails(dayLog.mood)
        : { icon: 'remove-circle-outline', color: colors.textLight, label: 'No Data' };

    const markedDates: any = useMemo(() => {
        const marks: any = {};
        Object.keys(calendarStats).forEach(dateStr => {
            const stat = calendarStats[dateStr];
            const painLevel = Number(stat.pain_level);
            const isPainHigh = !isNaN(painLevel) && painLevel > 5;
            const isAllDone = stat.completion_percent === 100;
            if (!isPainHigh && !isAllDone) return;
            marks[dateStr] = {
                customStyles: {
                    container: {
                        backgroundColor: isPainHigh ? colors.mood.pain : undefined,
                        borderWidth: isAllDone ? 1 : 0,
                        borderColor: isAllDone ? colors.accent : undefined,
                    },
                    text: { color: isPainHigh ? '#fff' : colors.text, fontWeight: isPainHigh ? 'bold' : 'normal' },
                },
            };
        });
        const sel = getLocalDateKey(selectedDate);
        marks[sel] = {
            ...marks[sel],
            customStyles: {
                container: { backgroundColor: colors.primary, borderWidth: 0 },
                text: { color: '#FFF', fontWeight: 'bold' },
            },
        };
        return marks;
    }, [calendarStats, selectedDate]);

    const isPastDate = () => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const sel = new Date(selectedDate); sel.setHours(0, 0, 0, 0);
        return sel < today;
    };



    // ─── Week View
    const renderWeekView = () => {
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStartDate);
            d.setDate(weekStartDate.getDate() + i);
            return d;
        });

        return (
            <View style={styles.weekContainer}>
                <View style={styles.weekNavRow}>
                    <TouchableOpacity onPress={() => changeWeek('PREV')} style={styles.navArrow}>
                        <Ionicons name="chevron-back" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.weekMonthTitle}>
                        {weekStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeWeek('NEXT')} style={styles.navArrow}>
                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekRow}>
                    {weekDates.map((date, i) => {
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <TouchableOpacity
                                key={i}
                                style={[styles.dayChip, isSelected && styles.dayChipSelected, isToday && !isSelected && styles.dayChipToday]}
                                onPress={() => setSelectedDate(date)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dayChipLabel, isSelected && styles.dayChipLabelSelected]}>
                                    {DAYS[date.getDay()]}
                                </Text>
                                <Text style={[styles.dayChipNum, isSelected && styles.dayChipNumSelected]}>
                                    {date.getDate()}
                                </Text>
                                {isToday && <View style={[styles.todayDot, isSelected && { backgroundColor: colors.surface }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };



    // ─── Summary Card
    const renderSummaryCard = () => {
        const hasData = dayLog || healthMetrics || dayTasks.length > 0;
        if (!hasData) return null;
        const painLevel = healthMetrics?.pain_level;
        const fatigueLevel = healthMetrics?.fatigue_level;

        return (
            <View style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                    <View style={styles.ringWrapper}>
                        <ProgressChart
                            data={{ data: [progressPercent] }}
                            width={80} height={80} strokeWidth={8} radius={28}
                            chartConfig={{
                                backgroundGradientFromOpacity: 0,
                                backgroundGradientToOpacity: 0,
                                color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                                labelColor: () => colors.text,
                            }}
                            style={{ backgroundColor: 'transparent' }}
                            hideLegend
                        />
                        <View style={styles.ringLabel}>
                            <Text style={styles.ringPercent}>{Math.round(progressPercent * 100)}%</Text>
                        </View>
                    </View>

                    <View style={styles.statsCol}>
                        <View style={styles.statItem}>
                            <Ionicons name={moodDetails.icon as any} size={14} color={moodDetails.color} />
                            <Text style={[styles.statChipText, { color: moodDetails.color }]}>{moodDetails.label}</Text>
                        </View>
                        {painLevel != null && (
                            <View style={styles.statItem}>
                                <Ionicons name="fitness-outline" size={14} color={painLevel > 6 ? colors.error : colors.textSecondary} />
                                <Text style={styles.statLabel}>Pain</Text>
                                <View style={styles.miniBar}>
                                    <View style={[styles.miniBarFill, { width: `${(painLevel / 10) * 100}%` as any, backgroundColor: painLevel > 6 ? colors.error : colors.mood.pain }]} />
                                </View>
                                <Text style={styles.statNum}>{painLevel}/10</Text>
                            </View>
                        )}
                        {fatigueLevel != null && (
                            <View style={styles.statItem}>
                                <Ionicons name="battery-half-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.statLabel}>Fatigue</Text>
                                <View style={styles.miniBar}>
                                    <View style={[styles.miniBarFill, { width: `${(fatigueLevel / 10) * 100}%` as any, backgroundColor: colors.mood.low }]} />
                                </View>
                                <Text style={styles.statNum}>{fatigueLevel}/10</Text>
                            </View>
                        )}
                       
                    </View>
                </View>

                {Boolean(healthMetrics?.notes) && (
                    <View style={styles.notesRow}>
                        <Ionicons name="document-text-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.notesText} numberOfLines={2}>{healthMetrics.notes}</Text>
                    </View>
                )}
            </View>
        );
    };

    // ─── Render
    return (
        <ScreenLayout edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Schedule</Text>
                <View style={styles.headerRight}>
                    {!isPastDate() ? (
                        <TouchableOpacity style={styles.addBtn}
                            onPress={() => navigation.navigate('AddTask', { initialDate: selectedDate.toISOString() })}>
                            <Ionicons name="add" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.addBtn, { opacity: 0.3 }]}>
                            <Ionicons name="add" size={22} color={colors.textSecondary} />
                        </View>
                    )}
                </View>
            </View>

            <PanGestureHandler onHandlerStateChange={onWeekSwipe}>
                <View>{renderWeekView()}</View>
            </PanGestureHandler>

            {/* Task Sheet */}
            <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                    <View>
                        <Text style={styles.sheetDate}>
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                        {dayTasks.length > 0 && (
                            <Text style={styles.sheetSubtitle}>{completedTasks} of {dayTasks.length} completed</Text>
                        )}
                    </View>
                    {healthMetrics?.pain_level > 6 && (
                        <View style={styles.painBadge}>
                            <Ionicons name="warning-outline" size={12} color="#fff" />
                            <Text style={styles.painBadgeText}>High Pain</Text>
                        </View>
                    )}
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAllData} tintColor={colors.primary} />}
                    contentContainerStyle={styles.scrollContent}
                >
                    {renderSummaryCard()}

                    {loading ? (
                        <ScheduleListSkeleton />
                    ) : dayTasks.length > 0 ? (
                        <View style={styles.taskList}>
                            {dayTasks.map((task) => (
                                <CalendarScheduleCard
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
                            ))}
                            <View style={{ height: 80 }} />
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
                            </View>
                            <Text style={styles.emptyTitle}>Nothing planned</Text>
                            <Text style={styles.emptySubtitle}>
                                {isPastDate() ? 'No tasks were scheduled for this day.' : 'Tap + to add your first task.'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </ScreenLayout>
    );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.m,
        paddingBottom: spacing.s,
    },
    headerTitle: {
        ...typography.h2,

        color: colors.text,
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: colors.l2,
        borderRadius: borderRadius.round,
        padding: 3,
    },
    toggleBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
        borderRadius: borderRadius.round,
    },
    toggleBtnActive: {
        backgroundColor: colors.surface,
    },
    toggleText: {
        ...typography.caption,

        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: colors.primary,
    },
    addBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.accentSoft,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Month calendar wrapper — card-style background
    // ── Month calendar card
    calendarWrapper: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border + '70',
        overflow: 'scroll',
        paddingHorizontal: 6,
        paddingBottom: spacing.sm,
    },
    calendarInner: {
        paddingTop: spacing.xs,
    },
    calArrowBtn: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.m,
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Legend
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.l,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 9,
        height: 9,
        borderRadius: borderRadius.s,
    },
    legendText: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    // ── Drag handle
    dragHandle: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    dragPill: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
    },

    // ── Week strip
    weekContainer: {
        paddingBottom: spacing.s,
        paddingHorizontal: spacing.s,
    },
    weekNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        marginBottom: spacing.m,
    },
    weekMonthTitle: {
        ...typography.body,

        color: colors.text,
        letterSpacing: -0.2,
    },
    navArrow: {
        padding: 6,
        borderRadius: borderRadius.m,
        backgroundColor: colors.accentSoft,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xs,
    },
    dayChip: {
        alignItems: 'center',
        justifyContent: 'center',
        width: (screenWidth - spacing.xs * 2 - 16) / 7,
        height: 68,
        borderRadius: borderRadius.md,
        backgroundColor: 'transparent',
        gap: spacing.xs,
    },
    dayChipSelected: {
        backgroundColor: colors.primary,
    },
    dayChipToday: {
        backgroundColor: colors.accentSoft,
    },
    dayChipLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    dayChipLabelSelected: { color: 'rgba(255,255,255,0.8)' },
    dayChipNum: {
        fontSize: 17,
        color: colors.text,
    },
    dayChipNumSelected: { color: '#FFF' },
    todayDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },

    // ── Task sheet
    sheet: {
        flex: 1,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: spacing.xs,
        overflow: 'hidden',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.m,
        paddingBottom: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '60',
    },
    sheetDate: {
        fontSize: 17,
        color: colors.text,
        letterSpacing: -0.3,
    },
    sheetSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    painBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.error,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
        borderRadius: borderRadius.round,
    },
    painBadgeText: {
        // ...typography.caption,
    color: '#FFF',
        

    },
    scrollContent: {
        paddingTop: spacing.m,
        paddingBottom: spacing.xxl,
    },

    // ── Summary card
    summaryCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.m,
        backgroundColor: colors.l2,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '60',
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    ringWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringLabel: {
        position: 'absolute',
        alignItems: 'center',
    },
    ringPercent: {
        ...typography.caption,

        color: colors.text,
    },
    statsCol: {
        flex: 1,
        gap: spacing.sm,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statChipText: {
        ...typography.caption,

    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        width: 45,
    },
    miniBar: {
        flex: 1,
        height: 5,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    miniBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    statNum: {
        ...typography.caption,
        color: colors.text,
        width: 28,
        textAlign: 'right',
    },
    notesRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: spacing.s,
        paddingTop: spacing.s,
        borderTopWidth: 1,
        borderTopColor: colors.border + '60',
    },
    notesText: {
        flex: 1,
        ...typography.caption,
        color: colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 18,
    },

    // ── Task list / cards
    taskList: {
        paddingHorizontal: spacing.lg,
        letterSpacing: 0.3,
    },
    cardRow: {
        flexDirection: 'row',
        marginBottom: spacing.m,
    },
    cardTimeCol: {
        width: 52,
        alignItems: 'center',
        paddingTop: 2,
        marginRight: spacing.sm,
    },
    cardTime: {
        ...typography.caption,

        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cardTimeline: {
        flex: 1,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: borderRadius.s,
        backgroundColor: colors.border,
        borderWidth: 2,
        borderColor: colors.surface,
        zIndex: 2,
    },
    timelineDotDone: {
        backgroundColor: colors.accent,
        borderColor: colors.accentSoft,
    },
    timelineConnector: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        marginTop: spacing.xs,
        borderRadius: 1,
        opacity: 0.5,
    },
    timelineConnectorDone: {
        backgroundColor: colors.accent,
        opacity: 0.3,
    },
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border + '80',
        overflow: 'hidden',
    },
    cardDone: {
        borderColor: colors.border + '40',
        backgroundColor: colors.surfaceSoft,
    },
    cardAccentStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: borderRadius.m,
        borderBottomLeftRadius: borderRadius.m,
        zIndex: 1,
    },
    cardInner: {
        padding: spacing.m,
        paddingLeft: spacing.m + 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.s,
        marginBottom: 6,
    },
    cardTitle: {
        flex: 1,
        ...typography.body,

        color: colors.text,
        lineHeight: 21,
        letterSpacing: -0.2,
    },
    cardTitleDone: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    checkBtn: { marginTop: 2 },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleDone: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    cardFeedback: {
        ...typography.caption,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: spacing.sm,
        lineHeight: 17,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    energyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
        backgroundColor: 'transparent',
        borderWidth: 1,
        gap: spacing.xs,
    },
    energyLabel: {
        ...typography.caption,

        textTransform: 'capitalize',
        color: colors.textPrimary,
    },
    missedChip: {
        backgroundColor: colors.warning + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
    },
    missedText: {
        ...typography.caption,

        color: colors.warning,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    progressPill: {
        flex: 1,
        height: 16,
        backgroundColor: colors.l2,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        minWidth: 60,
        maxWidth: 80,
    },
    progressFill: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        backgroundColor: colors.accent + '40',
        borderRadius: borderRadius.round,
    },
    progressPct: {
        fontSize: 9,
        color: colors.accent,
        zIndex: 1,
    },

    // ── Empty state
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing.xxl,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.l2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
    },
    emptyTitle: {
        ...typography.body,

        color: colors.text,
        marginBottom: 6,
    },
    emptySubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});