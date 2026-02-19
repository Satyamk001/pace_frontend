import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius, typography, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ui/ProgressBar';

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
    
    const accentColor = color; 
    
    // Soft tint for completed state instead of grey opacity
    const containerStyle = isCompleted 
        ? { backgroundColor: colors.palette.mint + '15', borderColor: 'transparent' } // Soft Mint tint
        : { backgroundColor: colors.surface };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {/* 1. Time Label (Above Card) */}
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>
                    {startTime}
                    {endTime ? ` - ${endTime}` : ''}
                </Text>
            </View>

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

                {/* Bottom Row: Energy Badge + Progress */}
                <View style={styles.footerRow}>
                    {/* Energy Badge */}
                    <View style={[styles.energyBadge, { backgroundColor: accentColor + '20' }]}>
                        <Ionicons name="flash" size={10} color={accentColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.energyText, { color: accentColor }]}>
                            {type === 'MEETING' ? 'Mid Energy' : type === 'BREAK' ? 'Recharge' : 'High Energy'}
                        </Text>
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
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.l, // Increased spacing
        paddingHorizontal: spacing.l,
    },
    timeRow: {
        marginBottom: 6,
        paddingLeft: 4, // Align visually with card curve
    },
    timeText: {
        ...typography.caption,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 24, // 24px radius
        padding: spacing.m,
        ...shadows.soft, // Stronger soft shadow
        shadowOpacity: 0.08, // Custom tweak for "slightly stronger"
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
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
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    energyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    energyText: {
        // fontFamily: typography.fontFamily, // Removed non-existent property
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    miniProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600',
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

