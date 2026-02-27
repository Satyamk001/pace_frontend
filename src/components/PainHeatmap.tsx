import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type HeatmapMode = 'pain' | 'fatigue';

interface PainHeatmapProps {
    year: number;
    calendarData: Record<string, { mood?: string; day_type?: string; pain_level?: number; fatigue_level?: number }>;
    onYearChange?: (year: number) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns a color for a 0–10 numeric level based on mode. */
const getLevelColor = (level: number | null | undefined, mode: HeatmapMode, isOutsideYear: boolean): string => {
    if (isOutsideYear) return 'transparent';
    if (level == null || level <= 0) return colors.surfaceSoft;

    if (mode === 'pain') {
        if (level >= 7) return colors.mood.pain;
        if (level >= 4) return colors.mood.low;
        return colors.mood.okay;
    }
    // fatigue — blue-ish palette
    if (level >= 7) return '#5B21B6'; // deep purple
    if (level >= 4) return '#7C3AED'; // medium purple
    return '#A78BFA';                  // light purple
};

export const PainHeatmap = ({ year, calendarData, onYearChange }: PainHeatmapProps) => {
    const [mode, setMode] = useState<HeatmapMode>('pain');

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

                const dateStr = currentDate.toISOString().split('T')[0];
                const data = calendarData[dateStr];
                const isOutsideYear = currentDate.getFullYear() !== year;

                const value = mode === 'pain' ? (data?.pain_level ?? null) : (data?.fatigue_level ?? null);
                const color = getLevelColor(value, mode, isOutsideYear);

                week.push({ date: dateStr, color, value });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeksArr.push(week);
            weekIndex++;
        }
        return { weeks: weeksArr, monthLabels: monthLab };
    }, [year, calendarData, mode]);

    return (
        <View style={styles.container}>
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
                                         <View
                                            key={dIndex}
                                            style={[styles.node, { backgroundColor: day.color }]}
                                         >
                                            {day.value != null && day.value > 0 && (
                                                <Text style={styles.nodeText}>{day.value}</Text>
                                            )}
                                         </View>
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
        fontSize: 16,
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
        fontSize: 10,
        position: 'absolute',
    },
    scrollContent: {
        paddingRight: spacing.l,
    },
    grid: {
        flexDirection: 'row',
        gap: 4,
    },
    weekColumn: {
        gap: 4,
    },
    node: {
        width: 16,
        height: 16,
        borderRadius: 3,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    nodeText: {
        fontSize: 8,
        fontWeight: '700' as const,
        color: '#fff',
        lineHeight: 10,
    },
    // Footer: toggle + scale
    footer: {
        marginTop: spacing.m,
        gap: 10,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 8,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: colors.surfaceSoft,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleBtnActive: {
        backgroundColor: colors.mood.pain,
        borderColor: colors.mood.pain,
    },
    toggleBtnActiveFatigue: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: '#fff',
    },
    scaleRow: {
        flexDirection: 'row',
        gap: 4,
    },
    scaleNode: {
        width: 22,
        height: 22,
        borderRadius: 4,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    scaleNodeText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: '#fff',
    },
});
