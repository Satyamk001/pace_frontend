import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import {colors, typography, spacing, borderRadius} from '../theme';
import { Ionicons } from '@expo/vector-icons';

type HeatmapMode = 'pain' | 'fatigue';

interface DayData {
    mood?: string;
    day_type?: string;
    pain_level?: number;
    fatigue_level?: number;
    painkiller_count?: number;
    notes?: string;
    total_tasks?: number;
    completion_percent?: number;
    total_calories?: number;
    total_protein?: number;
    total_fat?: number;
    total_carbs?: number;
}

interface PainHeatmapProps {
    year: number;
    calendarData: Record<string, DayData>;
    onYearChange?: (year: number) => void;
    onEditCheckIn?: (date: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MOOD_EMOJI: Record<string, string> = {
    GREAT: '😄', GOOD: '🙂', OKAY: '😐', LOW: '😔', BAD: '😢',
};
const DAY_TYPE_LABEL: Record<string, string> = {
    NORMAL: 'Normal day', FLARE_UP: '🔥 Flare-up', LOW_ENERGY: '⚡ Low energy',
};

/** Returns a color for a 0–10 numeric level based on mode. */
const getLevelColor = (level: number | null | undefined, mode: HeatmapMode, isOutsideYear: boolean): string => {
    if (isOutsideYear) return 'transparent';
    if (level == null || level <= 0) return colors.surfaceSoft;

    if (mode === 'pain') {
        if (level >= 7) return '#FF0000';
        else if (level >= 4) return '#ff3300ff';
        else return '#ff8800ff';
    }
    if (level >= 7) return '#FF0000';
    else if (level >= 4) return '#ff3300ff';
    else return '#ff8800ff';
};

// ─── Day Detail Modal ────────────────────────────────────────────────────────

interface DayDetailModalProps {
    visible: boolean;
    date: string | null;
    data: DayData | null;
    onClose: () => void;
    onEditCheckIn?: (date: string) => void;
}

const DayDetailModal = ({ visible, date, data, onClose, onEditCheckIn }: DayDetailModalProps) => {
    if (!date) return null;
    const displayData = data || {};

    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const formatted = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const hasData = displayData.pain_level != null || displayData.fatigue_level != null || displayData.mood || displayData.total_calories != null;

    const StatCard = ({ icon, label, value, fullWidth = false }: { icon: string; label: string; value: string; fullWidth?: boolean }) => (
        <View style={[modalStyles.statCard, fullWidth && { width: '100%' }]}>
            <View style={modalStyles.statCardHeader}>
                <Ionicons name={icon as any} size={16} color={colors.primary} />
                <Text style={modalStyles.statLabel}>{label}</Text>
            </View>
            <Text style={modalStyles.statValue}>{value}</Text>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={modalStyles.overlay} onPress={onClose}>
                <Pressable style={modalStyles.sheet} onPress={() => {}}>
                    {/* Handle */}
                    <View style={modalStyles.handle} />

                    {/* Date header */}
                    <Text style={modalStyles.dateText}>{formatted}</Text>

                    {displayData.day_type && (
                        <View style={modalStyles.dayTypePill}>
                            <Text style={modalStyles.dayTypeText}>{DAY_TYPE_LABEL[displayData.day_type] ?? displayData.day_type}</Text>
                        </View>
                    )}

                    {!hasData ? (
                        <View style={modalStyles.emptyState}>
                            <Ionicons name="clipboard-outline" size={36} color={colors.border} />
                            <Text style={modalStyles.emptyText}>No health check-in recorded for this day.</Text>
                        </View>
                    ) : (
                        <View style={modalStyles.statsContainer}>
                            <View style={modalStyles.statsGrid}>
                                {displayData.mood != null && (
                                    <StatCard
                                        icon="happy-outline"
                                        label="Mood"
                                        value={`${MOOD_EMOJI[displayData.mood] ?? ''} ${displayData.mood}`}
                                    />
                                )}
                                {displayData.pain_level != null && (
                                    <StatCard
                                        icon="fitness-outline"
                                        label="Pain"
                                        value={`${displayData.pain_level}/10`}
                                    />
                                )}
                                {displayData.fatigue_level != null && (
                                    <StatCard
                                        icon="battery-half-outline"
                                        label="Fatigue"
                                        value={`${displayData.fatigue_level}/10`}
                                    />
                                )}
                                {(displayData.painkiller_count != null && displayData.painkiller_count > 0) && (
                                    <StatCard
                                        icon="medical-outline"
                                        label="Pills"
                                        value={`${displayData.painkiller_count}`}
                                    />
                                )}
                                {(displayData.total_calories != null && displayData.total_calories > 0) && (
                                    <>
                                        <StatCard
                                            icon="flame-outline"
                                            label="Calories"
                                            value={`${displayData.total_calories} kcal`}
                                        />
                                        {(displayData.total_protein != null && displayData.total_protein > 0) && (
                                            <StatCard icon="restaurant-outline" label="Protein" value={`${displayData.total_protein}g`} />
                                        )}
                                        {(displayData.total_fat != null && displayData.total_fat > 0) && (
                                            <StatCard icon="fast-food-outline" label="Fat" value={`${displayData.total_fat}g`} />
                                        )}
                                        {(displayData.total_carbs != null && displayData.total_carbs > 0) && (
                                            <StatCard icon="nutrition-outline" label="Carbs" value={`${displayData.total_carbs}g`} />
                                        )}
                                    </>
                                )}
                            </View>

                            {displayData.total_tasks != null && displayData.total_tasks > 0 && (
                                <View style={modalStyles.taskCard}>
                                    <View style={modalStyles.taskCardHeader}>
                                        <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.success} />
                                        <Text style={modalStyles.taskCardTitle}>Daily Tasks</Text>
                                    </View>
                                    <View style={modalStyles.taskProgressBg}>
                                        <View style={[modalStyles.taskProgressFill, { width: `${displayData.completion_percent ?? 0}%` }]} />
                                    </View>
                                    <Text style={modalStyles.taskCardSubtitle}>
                                        {displayData.completion_percent ?? 0}% completed ({displayData.total_tasks} total)
                                    </Text>
                                </View>
                            )}

                            {displayData.notes ? (
                                <View style={modalStyles.notesCard}>
                                    <View style={modalStyles.notesCardHeader}>
                                        <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                                        <Text style={modalStyles.notesCardTitle}>Notes</Text>
                                    </View>
                                    <Text style={modalStyles.notesText}>
                                      {typeof displayData.notes === 'string' 
                                        ? displayData.notes 
                                        : Object.entries(displayData.notes).map(([t, n]) => `${t}: ${n}`).join('\n')}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    )}

                    {onEditCheckIn && (
                        <TouchableOpacity
                            style={modalStyles.editBtn}
                            onPress={() => { onClose(); onEditCheckIn(date); }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                            <Text style={modalStyles.editBtnText}>{hasData ? 'Edit Check-in' : 'Add Check-in'}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={modalStyles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

// ─── PainHeatmap ─────────────────────────────────────────────────────────────

export const PainHeatmap = ({ year, calendarData, onYearChange, onEditCheckIn }: PainHeatmapProps) => {
    const [mode, setMode] = useState<HeatmapMode>('pain');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleDayPress = (date: string, isOutside: boolean) => {
        if (isOutside) return;
        const data = calendarData[date];
        if (!data && !isToday(date) && !onEditCheckIn) return; // nothing to show for empty days
        setSelectedDate(date);
        setModalVisible(true);
    };

    const isToday = (date: string) => {
        const now = new Date();
        const y = String(now.getFullYear());
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return date === `${y}-${m}-${d}`;
    };

    const { weeks, monthLabels } = useMemo(() => {
        const weeksArr: any[][] = [];
        const monthLab: { label: string; index: number }[] = [];

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        let currentDate = new Date(startDate);
        const dayOfWeek = currentDate.getDay();
        const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        currentDate.setDate(diff);

        let currentMonth = -1;
        let weekIndex = 0;

        while (currentDate <= endDate || currentDate.getDay() !== 1) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                if (currentDate.getMonth() !== currentMonth && currentDate.getFullYear() === year) {
                    currentMonth = currentDate.getMonth();
                    monthLab.push({ label: MONTHS[currentMonth], index: weekIndex });
                }

                // Use local date key — avoids UTC-shift on IST
                const yy = currentDate.getFullYear();
                const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                const dd = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${yy}-${mm}-${dd}`;

                const data = calendarData[dateStr];
                const isOutsideYear = currentDate.getFullYear() !== year;

                const value = mode === 'pain' ? (data?.pain_level ?? null) : (data?.fatigue_level ?? null);
                const color = getLevelColor(value, mode, isOutsideYear);
                const hasData = !!data;

                week.push({ date: dateStr, color, value, hasData, isOutsideYear });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeksArr.push(week);
            weekIndex++;
        }
        return { weeks: weeksArr, monthLabels: monthLab };
    }, [year, calendarData, mode]);

    return (
        <View style={styles.container}>
            <DayDetailModal
                visible={modalVisible}
                date={selectedDate}
                data={selectedDate ? (calendarData[selectedDate] ?? null) : null}
                onClose={() => setModalVisible(false)}
                onEditCheckIn={onEditCheckIn}
            />

             <View style={styles.header}>
                 <Text style={styles.title}>{mode === 'pain' ? 'Pain' : 'Fatigue'} Tracker</Text>
                 <View style={styles.yearSelector}>
                     <Ionicons
                         name="chevron-back"
                         size={18}
                         color={colors.textSecondary}
                         onPress={() => onYearChange?.(year - 1)}
                         suppressHighlighting
                     />
                     <Text style={styles.subtitle}>{year}</Text>
                     <Ionicons
                         name="chevron-forward"
                         size={18}
                         color={year < new Date().getFullYear() ? colors.textSecondary : colors.border}
                         onPress={() => {
                             if (year < new Date().getFullYear()) {
                                 onYearChange?.(year + 1);
                             }
                         }}
                         suppressHighlighting
                     />
                 </View>
             </View>

             <View style={styles.heatmapContainer}>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View>
                        {/* X-Axis Labels */}
                        <View style={styles.xAxisLabels}>
                            {monthLabels.map((m, i) => (
                                <Text key={i} style={[styles.axisText, { left: m.index * (16 + 4) }]}>
                                    {m.label}
                                </Text>
                            ))}
                        </View>

                        {/* Grid */}
                        <View style={styles.grid}>
                             {weeks.map((week, wIndex) => (
                                 <View key={wIndex} style={styles.weekColumn}>
                                     {week.map((day: any, dIndex: number) => (
                                         <TouchableOpacity
                                            key={dIndex}
                                            style={[
                                                styles.node,
                                                { backgroundColor: day.color },
                                                day.hasData && !day.isOutsideYear && styles.nodeTappable,
                                            ]}
                                            onPress={() => handleDayPress(day.date, day.isOutsideYear)}
                                            activeOpacity={day.isOutsideYear ? 1 : 0.7}
                                            disabled={day.isOutsideYear}
                                         >
                                            {day.value != null && day.value > 0 && (
                                                <Text style={styles.nodeText}>{day.value}</Text>
                                            )}
                                         </TouchableOpacity>
                                     ))}
                                 </View>
                             ))}
                        </View>
                    </View>
                 </ScrollView>
             </View>

             {/* Mode Toggle */}
             <View style={styles.footer}>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'pain' && styles.toggleBtnActive]}
                        onPress={() => setMode('pain')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="fitness-outline" size={14} color={mode === 'pain' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.toggleText, mode === 'pain' && styles.toggleTextActive]}>Pain</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'fatigue' && styles.toggleBtnActiveFatigue]}
                        onPress={() => setMode('fatigue')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="battery-half-outline" size={14} color={mode === 'fatigue' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.toggleText, mode === 'fatigue' && styles.toggleTextActive]}>Fatigue</Text>
                    </TouchableOpacity>
                </View>
             </View>
        </View>
    );
};

// ─── Heatmap Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: spacing.m,
    },
    title: {
        ...typography.bodyBold,
        ...typography.body,
    },
    subtitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginHorizontal: spacing.s,
    },
    yearSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heatmapContainer: {
        flexDirection: 'row',
    },
    xAxisLabels: {
        height: 20,
        flexDirection: 'row',
        position: 'relative',
    },
    axisText: {
        ...typography.caption,
        ...typography.caption,
        position: 'absolute',
    },
    scrollContent: {
        paddingRight: spacing.l,
    },
    grid: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    weekColumn: {
        gap: spacing.xs,
    },
    node: {
        width: 16,
        height: 16,
        borderRadius: 3,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    nodeTappable: {
        // Subtle border to hint tappability for days with data
        borderWidth: 0.5,
        borderColor: 'rgba(167, 247, 38, 0.5)',
    },
    nodeText: {
        fontSize: 8,
        fontWeight: '700' as const,
        color: '#FFF',
        lineHeight: 10,
    },
    footer: {
        marginTop: spacing.m,
        gap: spacing.sm,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.l,
        backgroundColor: colors.surfaceSoft,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleBtnActive: {
        backgroundColor: colors.mood.elevated,
        borderColor: colors.mood.elevated,
    },
    toggleBtnActiveFatigue: {
        backgroundColor: colors.mood.severe,
        borderColor: colors.mood.severe,
    },
    toggleText: {
        ...typography.caption,
        fontWeight: '600' as const,
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: '#FFF',
    },
    scaleRow: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    scaleNode: {
        width: 22,
        height: 22,
        borderRadius: borderRadius.s,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    scaleNodeText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: '#FFF',
    },
});

// ─── Modal Styles ────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        paddingBottom: spacing.xl,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.m,
    },
    dateText: {
        ...typography.bodyBold,
        fontSize: 17,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    dayTypePill: {
        alignSelf: 'flex-start',
        backgroundColor: colors.accentSoft,
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        marginBottom: spacing.m,
    },
    dayTypeText: {
        ...typography.caption,
        color: colors.primary,
    },
    statsContainer: {
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '50',
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: spacing.xs,
    },
    statLabel: {
        ...typography.caption,
        ...typography.caption,
    color: colors.textSecondary,
        

    },
    statValue: {
        ...typography.bodyBold,
        ...typography.body,
        color: colors.text,
        marginTop: 2,
    },
    taskCard: {
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '50',
    },
    taskCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.s,
    },
    taskCardTitle: {
        ...typography.bodyBold,
        ...typography.body,
        color: colors.text,
    },
    taskProgressBg: {
        height: 8,
        backgroundColor: colors.border,
        borderRadius: borderRadius.s,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    taskProgressFill: {
        height: '100%',
        backgroundColor: colors.success,
        borderRadius: borderRadius.s,
    },
    taskCardSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    notesCard: {
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '50',
    },
    notesCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: spacing.s,
    },
    notesCardTitle: {
        ...typography.bodyBold,
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notesText: {
        ...typography.body,
        color: colors.text,
        lineHeight: 22,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.s,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
        paddingVertical: spacing.m,
        borderRadius: borderRadius.l,
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.primary + '30',
        marginTop: spacing.s,
    },
    editBtnText: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    closeBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        marginTop: spacing.s,
    },
    closeBtnText: {
        ...typography.bodyBold,
        ...typography.body,
    color: '#FFF',
        
    },
});
