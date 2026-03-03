import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {colors, borderRadius, typography, spacing} from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ui/ProgressBar';
import { ScalePressable } from './ui/ScalePressable';

interface ScheduleCardProps {
    title: string;
    startTime?: string;
    endTime?: string;
    dueDate?: string;
    type?: 'MEETING' | 'TASK' | 'BREAK' | 'OTHER';
    color?: string;
    energyLevel?: string;
    isCompleted?: boolean;
    progress?: number; // 0-100
    onPress?: () => void;
    onToggle?: () => void; // New prop for completion toggle
}

export const ScheduleCard = ({ 
    title, 
    startTime, 
    endTime, 
    dueDate,
    type = 'TASK', 
    color = colors.primary,
    energyLevel,
    isCompleted,
    progress = 0,
    onPress,
    onToggle
}: ScheduleCardProps) => {
    
    const accentColor = color; 
    
    // Soft tint for completed state instead of grey opacity
    // FIXED: Removed shadow and border for completed items to avoid "muddy" look
    const containerStyle = isCompleted 
        ? { 
            backgroundColor: colors.palette.lavenderLight + '15', 
            borderColor: 'transparent',
            borderWidth: 0,
          } 
        : { backgroundColor: colors.surface };

    const getEnergyConfig = () => {
        switch (energyLevel) {
            case 'LOW': return { color: colors.mood.moderate, icon: 'leaf-outline' as const };
            case 'MEDIUM': return { color: colors.mood.elevated, icon: 'sunny-outline' as const };
            case 'HIGH': return { color: colors.mood.severe, icon: 'flame-outline' as const };
            default: return { color: accentColor, icon: 'flash-outline' as const };
        }
    };
    const energy = getEnergyConfig();

    const getFormattedDate = () => {
        if (!dueDate && !startTime) return null;
        if (dueDate) {
            const date = new Date(dueDate);
            const now = new Date();
            const isOverdue = date < now && !isCompleted;
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { text: timeString, isWarning: isOverdue };
        }
        return { text: startTime, isWarning: false };
    };
    const dateInfo = getFormattedDate();

    return (
        <ScalePressable style={styles.container} onPress={onPress}>
            {/* 2. Card Content */}
            <View style={[styles.card, containerStyle]}>
                
                {/* Top Row: Title + Checkbox */}
                <View style={styles.headerRow}>
                    <Text style={[styles.title, isCompleted && styles.completedTitle]} numberOfLines={2}>
                        {title}
                    </Text>
                    
                    <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
                        <Ionicons 
                            name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                            size={24} 
                            color={isCompleted ? colors.success : colors.textLight} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Bottom Row: Chips + Progress */}
                <View style={styles.metaRow}>
                    <View style={styles.chipsRow}>
                        {/* Time Chip */}
                        {dateInfo && (
                            <View style={[
                                styles.metaChip,
                                { borderColor: dateInfo.isWarning ? colors.mood.severe : colors.border }
                            ]}>
                                <Ionicons
                                    name="time-outline"
                                    size={12}
                                    color={colors.textPrimary}
                                />
                                <Text style={styles.metaText}>
                                    {dateInfo.text}
                                </Text>
                            </View>
                        )}
                        
                        {/* Energy Chip */}
                        <View style={[styles.metaChip, { borderColor: energy.color }]}>
                            <Ionicons name={energy.icon} size={12} color={colors.textPrimary} />
                            <Text style={styles.metaText}>
                                {energyLevel ? energyLevel.toLowerCase() : type.toLowerCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Progress Bar (if active) */}
                    {progress > 0 && !isCompleted && (
                        <View style={styles.miniProgress}>
                            <Text style={styles.progressText}>{progress}%</Text>
                            <View style={[styles.progressBarBG]}>
                                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </ScalePressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.l, // Increased spacing
        paddingHorizontal: spacing.l,
    },
    card: {
        borderRadius: borderRadius.l, 
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '30',
        backgroundColor: colors.surface,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
        gap: spacing.m
    },
    title: {
        ...typography.bodyBold,
        fontSize: 17, // Larger hierarchy
        color: colors.text,
        flex: 1,
        lineHeight: 24,
    },
    completedTitle: {
        color: colors.textSecondary,
        textDecorationLine: 'none', // Removed strikethrough for cleaner look, handled by tint
        opacity: 0.8
    },
    checkbox: {
        marginTop: 2
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    chipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
        backgroundColor: 'transparent',
        borderWidth: 1,
        gap: spacing.xs,
    },
    metaText: {
        ...typography.caption,
        ...typography.caption,

        textTransform: 'capitalize',
        color: colors.textPrimary,
    },
    miniProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    progressText: {
        ...typography.caption,

        color: colors.textLight,
    },
    progressBarBG: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    }
});

