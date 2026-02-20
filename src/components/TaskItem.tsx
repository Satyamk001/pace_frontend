import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, { 
    FadeInDown, 
    ZoomIn,
    ZoomOut,
    Layout
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
    title: string;
    isCompleted: boolean;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    progress?: number;
    feedback?: string;
    dueDate?: string;
    index?: number;
    onToggle: () => void;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const TaskItem = ({ 
    title, 
    isCompleted, 
    energyLevel, 
    progress = 0,
    feedback,
    dueDate,
    index = 0,
    onToggle, 
    onPress, 
    onLongPress 
}: TaskItemProps) => {

    const getEnergyStyles = () => {
        switch (energyLevel) {
            case 'LOW':
                return { bg: colors.mood.great + '1A', text: colors.mood.great };
            case 'MEDIUM':
                return { bg: colors.mood.okay + '1A', text: colors.mood.okay };
            case 'HIGH':
                return { bg: colors.mood.pain + '1A', text: colors.mood.pain };
            default:
                return { bg: colors.mood.okay + '1A', text: colors.mood.okay };
        }
    };
    const energyStyle = getEnergyStyles();

    const getFormattedDate = () => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        const now = new Date();
        const isOverdue = date < now && !isCompleted;
        const isToday = date.toDateString() === now.toDateString();
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (isOverdue && !isToday) {
            return { text: `Overdue (${date.toLocaleDateString()})`, isWarning: true };
        }
        if (isToday) {
            return { text: timeString, isWarning: isOverdue };
        }
        return { text: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`, isWarning: false };
    };
    const dateInfo = getFormattedDate();

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            if (!isCompleted) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
        if (onPress) onPress();
        else onToggle();
    };

    // Swipe Action
    const renderRightActions = (progressAnimatedValue: any, dragX: any) => {
        return (
            <View style={styles.rightActionContainer}>
                 <View style={styles.rightAction}>
                    <Ionicons name="checkmark-circle" size={32} color={colors.surface} />
                 </View>
            </View>
        );
    };

    const onSwipeableOpen = () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onToggle();
    };

    const isFullyDone = isCompleted || progress === 100;

    return (
        <Animated.View 
            entering={FadeInDown.delay(index * 100).springify()} 
            layout={Layout.springify()}
            style={{ marginBottom: spacing.s }}
        >
            <Swipeable
                renderRightActions={!isCompleted ? renderRightActions : undefined}
                onSwipeableOpen={!isCompleted ? onSwipeableOpen : undefined}
                containerStyle={{ overflow: 'visible' }}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    onLongPress={onLongPress}
                    activeOpacity={0.7}
                    style={[
                        styles.card,
                        isFullyDone ? styles.cardCompleted : styles.cardPending
                    ]}
                >
                    {/* TOP ROW */}
                        <View style={styles.topRow}>
                            <Text style={[styles.timeText, dateInfo?.isWarning && { color: colors.warning }]}>
                                {dateInfo?.text || ''}
                            </Text>
                            <View style={[styles.energyBadge, { backgroundColor: energyStyle.bg }]}>
                                <Text style={[styles.energyText, { color: energyStyle.text }]}>
                                    {energyLevel}
                                </Text>
                            </View>
                        </View>

                        {/* MIDDLE ROW */}
                        <View style={styles.middleRow}>
                            <Text style={[styles.title, isFullyDone && styles.completedTitle]} numberOfLines={2}>
                                {title}
                            </Text>
                            {feedback ? (
                                <Text style={styles.feedbackText} numberOfLines={1}>
                                    {feedback}
                                </Text>
                            ) : null}
                        </View>

                        {/* BOTTOM ROW */}
                        <View style={styles.bottomRow}>
                            <View style={styles.progressContainer}>
                                {progress > 0 && progress < 100 && !isFullyDone ? (
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                                    </View>
                                ) : <View />}
                            </View>
                            
                            <View style={styles.completionIndicator}>
                                {isFullyDone ? (
                                    <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                                        <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                                    </Animated.View>
                                ) : (
                                    <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                                )}
                            </View>
                        </View>
                </TouchableOpacity>
            </Swipeable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.m,
        padding: 12, // Drastically reduced from spacing.lg (24)
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04, // Very subtle to prevent muddiness
                shadowRadius: 8,
            },
            android: {
                elevation: 1, // Minimum elevation for clean edge
                shadowColor: '#000000',
            },
            web: {
                boxShadow: `0px 2px 10px rgba(0,0,0,0.04)`,
            }
        }),
        // Ensure background renders properly behind rounded corners
        backgroundColor: colors.surface, 
        borderWidth: Platform.OS === 'android' ? 1 : 0, // Fallback crisp border on Android if elevation gets muddy
        borderColor: colors.border + '40', // 25% opacity border
        marginBottom: spacing.m, // Replace the hacky 2px margin
    },
    cardPending: {
        backgroundColor: colors.surface,
    },
    cardCompleted: {
        backgroundColor: colors.accentSoft,
        shadowOpacity: 0,
        elevation: 0,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2, // Shrink from spacing.sm
    },
    timeText: {
        ...typography.caption,
    },
    energyBadge: {
        borderRadius: borderRadius.round,
        paddingHorizontal: 6, // Shrink from spacing.s
        paddingVertical: 2, // Shrink from spacing.xs
    },
    energyText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    middleRow: {
        marginBottom: 4, // Shrink from spacing.m
    },
    title: {
        ...typography.h3,
        fontSize: 15, // Slightly smaller font
        lineHeight: 20,
        marginBottom: 2,
        color: colors.text,
    },
    completedTitle: {
        opacity: 0.6,
    },
    feedbackText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressContainer: {
        flex: 1,
        paddingRight: spacing.m,
        justifyContent: 'center',
    },
    progressBarBg: {
        height: 4, // Shrink from 6
        backgroundColor: colors.l2,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.accent,
        borderRadius: borderRadius.round,
    },
    completionIndicator: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    rightActionContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: spacing.l,
        paddingRight: spacing.l,
    },
    rightAction: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    }
});
