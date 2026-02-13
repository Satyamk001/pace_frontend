import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius, typography, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface ScheduleCardProps {
    title: string;
    startTime: string; // "10:00"
    endTime?: string; // "10:15"
    type?: 'MEETING' | 'TASK' | 'BREAK' | 'OTHER';
    color?: string;
    isCompleted?: boolean;
    progress?: number; // 0-100
    onPress?: () => void;
    onToggle?: () => void; // New prop for completion toggle
}

export const ScheduleCard = ({ 
    title, 
    startTime, 
    endTime, 
    type = 'TASK', 
    color = colors.primary,
    isCompleted,
    progress = 0,
    onPress,
    onToggle
}: ScheduleCardProps) => {
    
    // Dynamic background based on progress (0-100)
    const getProgressColor = (p: number) => {
        if (p >= 76) return colors.success;    // #c7ce50 — Yellow-green (almost done)
        if (p >= 51) return colors.success1;   // #83f884 — Bright green
        if (p >= 26) return colors.success2;   // #99e29a — Medium green
        if (p > 0)   return colors.success3;   // #beddbd — Light green (just started)
        return colors.surface;                 // Default surface for 0%
    };

    const backgroundColor = getProgressColor(progress);
    const isDark = progress === 0; // surface color needs dark text
    const textColor = isDark ? colors.text : '#2D2D2D';
    const subTextColor = isDark ? colors.textLight : 'rgba(45,45,45,0.6)';

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {/* Time Column & Timeline Line */}
            <View style={styles.timeColumn}>
                <Text style={styles.startTime}>{startTime}</Text>
                <View style={styles.timelineLine} />
                {endTime && <Text style={styles.endTime}>{endTime}</Text>}
            </View>

            {/* Card Content */}
            <View style={[styles.card, { backgroundColor }]}>
                <View style={styles.headerRow}>
                    <View style={styles.badge}>
                         <Text style={[styles.badgeText, { color: backgroundColor }]}>
                             {type === 'MEETING' ? 'Mid' : type === 'BREAK' ? 'Low' : 'High'}
                         </Text>
                    </View>
                    
                    {/* Completion Toggle */}
                    <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
                        <Ionicons 
                            name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                            size={24} 
                            color={textColor} 
                        />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.title, { color: textColor }, isCompleted && styles.completedText]} numberOfLines={2}>
                    {title}
                </Text>
                
                {/* Progress Bar Section - Always visible now */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: textColor }]} />
                    </View>
                    <Text style={[styles.progressText, { color: subTextColor }]}>{progress}%</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: spacing.m,
        paddingHorizontal: spacing.l,
    },
    timeColumn: {
        width: 60,
        alignItems: 'center', 
        marginRight: spacing.s
    },
    startTime: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4
    },
    endTime: {
        ...typography.caption,
        color: colors.textLight,
        marginTop: 4,
    },
    timelineLine: {
        flex: 1,
        width: 1,
        backgroundColor: colors.border,
        marginVertical: 4
    },
    card: {
        flex: 1,
        borderRadius: 24,
        padding: spacing.l,
        ...shadows.soft,
        minHeight: 120,
        justifyContent: 'space-between'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s
    },
    badge: {
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkbox: {
        padding: 4
    },
    title: {
        ...typography.subheader,
        fontSize: 18,
        marginBottom: spacing.m,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    progressBarTrack: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.2)', // Semi-transparent black for depth
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600'
    }
});

