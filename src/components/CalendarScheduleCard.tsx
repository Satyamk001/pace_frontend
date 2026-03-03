import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import {colors, typography, borderRadius, spacing} from '../theme';
import { Ionicons } from '@expo/vector-icons';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface CalendarScheduleCardProps {
    title: string;
    dueDate: string;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    isCompleted: boolean;
    progress?: number;
    feedback?: string;
    onPress: () => void;
    onToggle: () => void;
}

export const CalendarScheduleCard = ({
    title, dueDate, energyLevel, isCompleted,
    progress = 0, feedback, onPress, onToggle,
}: CalendarScheduleCardProps) => {
    const scale = useSharedValue(1);

    const ENERGY_MAP = {
        LOW: { icon: 'leaf-outline', color: colors.mood.mild, label: 'Low Energy' },
        MEDIUM: { icon: 'sunny-outline', color: colors.mood.elevated, label: 'Med Energy' },
        HIGH: { icon: 'flame-outline', color: colors.mood.severe, label: 'High Energy' },
    };
    const energy = ENERGY_MAP[energyLevel as keyof typeof ENERGY_MAP] || ENERGY_MAP.MEDIUM;

    const getFormattedDate = () => {
        if (!dueDate) return { timeText: '', isWarning: false };
        const date = new Date(dueDate);
        const isOverdue = date < new Date() && !isCompleted;
        return {
            timeText: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isWarning: isOverdue,
        };
    };

    const dateInfo = getFormattedDate();
    const isFullyDone = isCompleted || progress === 100;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.cardRow}>
            <View style={styles.cardTimeCol}>
                <Text style={[styles.cardTime, dateInfo.isWarning && { color: colors.warning }]}>
                    {dateInfo.timeText}
                </Text>
                <View style={styles.cardTimeline}>
                    <View style={[styles.timelineDot, isFullyDone && styles.timelineDotDone]} />
                    <View style={[styles.timelineConnector, isFullyDone && styles.timelineConnectorDone]} />
                </View>
            </View>

            <AnimatedReanimated.View style={[styles.card, isFullyDone && styles.cardDone, animatedStyle]}>
                <Pressable
                    onPress={onPress}
                    onPressIn={() => (scale.value = withSpring(0.975))}
                    onPressOut={() => (scale.value = withSpring(1))}
                    style={{ flex: 1 }}
                >
                    <View style={styles.cardInner}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, isFullyDone && styles.cardTitleDone]} numberOfLines={2}>
                                {title}
                            </Text>
                            <TouchableOpacity 
                                onPress={onToggle} 
                                style={styles.checkBtn}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <View style={[styles.checkCircle, isFullyDone && styles.checkCircleDone]}>
                                    {isFullyDone && <Ionicons name="checkmark" size={13} color={colors.surface} />}
                                </View>
                            </TouchableOpacity>
                        </View>

                        {Boolean(feedback) && (
                            <Text style={styles.cardFeedback} numberOfLines={1}>{feedback}</Text>
                        )}

                        <View style={styles.cardFooter}>
                            <View style={[styles.energyChip, { borderColor: energy.color }]}>
                                <Text style={styles.energyLabel}>{energy.label}</Text>
                            </View>
                            {dateInfo.isWarning && (
                                <View style={[styles.energyChip, { borderColor: colors.warning }]}>
                                    <Text style={[styles.energyLabel, { color: colors.warning }]}>Missed</Text>
                                </View>
                            )}
                            {progress > 0 && progress < 100 && !isFullyDone && (
                                <View style={styles.progressPill}>
                                    <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                                    <Text style={styles.progressPct}>{progress}%</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Pressable>
            </AnimatedReanimated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardRow: {
        flexDirection: 'row',
        marginBottom: spacing.m,
    },
    cardTimeCol: {
        width: 60,
        alignItems: 'center',
        marginRight: spacing.m,
    },
    cardTime: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    cardTimeline: {
        flex: 1,
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: borderRadius.round,
        backgroundColor: colors.border,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    timelineDotDone: {
        backgroundColor: colors.primary,
        borderColor: colors.surface,
    },
    timelineConnector: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        opacity: 0.5,
        marginVertical: spacing.xs,
    },
    timelineConnectorDone: {
        backgroundColor: colors.primary,
        opacity: 0.3,
    },
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 120,
    },
    cardDone: {
        backgroundColor: colors.surfaceSoft,
        borderColor: colors.border,
    },
    cardInner: {
        flex: 1,
        padding: spacing.m,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        ...typography.bodyBold,
        color: colors.text,
        flex: 1,
    },
    cardTitleDone: {
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    checkBtn: {
        marginLeft: spacing.s,
        marginTop: 2,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: borderRadius.round,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleDone: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    cardFeedback: {
        ...typography.caption,
        color: colors.textLight,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.m,
        gap: spacing.sm,
    },
    energyChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        borderWidth: 1,
    },
    energyLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    progressPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
        height: 20,
        paddingRight: spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
    },
    progressPct: {
        ...typography.caption,
        color: colors.text,
        marginLeft: spacing.sm,
        zIndex: 1,
    },
});
