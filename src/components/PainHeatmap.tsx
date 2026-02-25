import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface PainHeatmapProps {
    year: number;
    calendarData: Record<string, { mood?: string; day_type?: string; pain_level?: number }>;
    onYearChange?: (year: number) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

import { Ionicons } from '@expo/vector-icons';

export const PainHeatmap = ({ year, calendarData, onYearChange }: PainHeatmapProps) => {

    const { weeks, monthLabels } = useMemo(() => {
        const weeksArr: any[][] = [];
        const monthLab: { label: string; index: number }[] = [];
        
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        let currentDate = new Date(startDate);
        // Adjust to Monday
        const dayOfWeek = currentDate.getDay();
        const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        currentDate.setDate(diff);

        let currentMonth = -1;
        let weekIndex = 0;

        while (currentDate <= endDate || currentDate.getDay() !== 1) { // until next monday
            const week = [];
            for (let i = 0; i < 7; i++) {
                // If it's a new month (ignore days before start of year)
                if (currentDate.getMonth() !== currentMonth && currentDate.getFullYear() === year) {
                    currentMonth = currentDate.getMonth();
                    monthLab.push({ label: MONTHS[currentMonth], index: weekIndex });
                }

                const dateStr = currentDate.toISOString().split('T')[0];
                const data = calendarData[dateStr];
                
                // Determine color
                let color = colors.surfaceSoft; // default empty
                if (currentDate.getFullYear() !== year) {
                    color = 'transparent'; // Hide days outside the year
                } else if (data) {
                     // In the Pain Tracker context, we use the mood scale colors to represent pain
                    if (data.pain_level && data.pain_level >= 7 || data.day_type === 'FLARE_UP') {
                        color = colors.mood.pain;
                    } else if (data.pain_level && data.pain_level >= 4 || data.day_type === 'LOW_ENERGY') {
                         color = colors.mood.low;
                    } else if (data.pain_level && data.pain_level > 0) {
                         color = colors.mood.okay;
                    } else if (data.mood === 'GREAT' || data.mood === 'GOOD') {
                         color = colors.mood.great;
                    } else if (data.day_type === 'NORMAL') {
                        color = colors.surfaceSoft; // Normal days with no pain are just soft
                    }
                }
                
                week.push({ date: dateStr, color });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeksArr.push(week);
            weekIndex++;
        }
        return { weeks: weeksArr, monthLabels: monthLab };
    }, [year, calendarData]);

    return (
        <View style={styles.container}>
             <View style={styles.header}>
                 <Text style={styles.title}>Pain Frequency</Text>
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
                                <Text key={i} style={[styles.axisText, { left: m.index * (12 + 4) }]}>
                                    {m.label}
                                </Text>
                            ))}
                        </View>

                        {/* Grid */}
                        <View style={styles.grid}>
                             {weeks.map((week, wIndex) => (
                                 <View key={wIndex} style={styles.weekColumn}>
                                     {week.map((day, dIndex) => (
                                         <View 
                                            key={dIndex} 
                                            style={[styles.node, { backgroundColor: day.color }]} 
                                         />
                                     ))}
                                 </View>
                             ))}
                        </View>
                    </View>
                 </ScrollView>
             </View>

             {/* Legend */}
             <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                <View style={styles.legendSwatches}>
                    <View style={[styles.node, { backgroundColor: colors.surfaceSoft }]} />
                    <View style={[styles.node, { backgroundColor: colors.mood.okay }]} />
                    <View style={[styles.node, { backgroundColor: colors.mood.low }]} />
                    <View style={[styles.node, { backgroundColor: colors.mood.pain }]} />
                </View>
                <Text style={styles.legendText}>More</Text>
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
        width: 12,
        height: 12,
        borderRadius: 3,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.m,
        alignSelf: 'flex-start',
        gap: spacing.s,
    },
    legendSwatches: {
        flexDirection: 'row',
        gap: 4,
    },
    legendText: {
        ...typography.caption,
        fontSize: 11,
    }
});
