import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    FadeInDown, 
    ZoomIn,
    ZoomOut,
    Layout
} from 'react-native-reanimated';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
    title: string;
    isCompleted: boolean;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    progress?: number;
    startTime?: string;
    endTime?: string;
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
    startTime,
    endTime,
    index = 0,
    onToggle, 
    onPress, 
    onLongPress 
}: TaskItemProps) => {
    const scale = useSharedValue(1);

    // Soft tint for completed state
    const containerStyle = isCompleted 
        ? { backgroundColor: colors.palette.mint + '20', borderColor: 'transparent' } 
        : { backgroundColor: colors.surface };

    const getEnergyColor = () => {
        switch (energyLevel) {
            case 'HIGH': return colors.mood.pain;   // Soft red
            case 'LOW':  return colors.mood.great;  // Soft mint
            default:     return colors.mood.okay;   // Warm yellow
        }
    };

    const accentColor = getEnergyColor();

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 10 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12 });
    };

    // Swipe Action
    const renderRightActions = (progress: any, dragX: any) => {
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
        // Ideally we'd close it back, but let's leave it for the state update to handle re-render or explicit ref use
    };

    return (
        <Animated.View 
            entering={FadeInDown.delay(index * 100).springify()} 
            layout={Layout.springify()}
            style={{ marginBottom: spacing.l }}
        >
            <Swipeable
                renderRightActions={!isCompleted ? renderRightActions : undefined}
                onSwipeableOpen={!isCompleted ? onSwipeableOpen : undefined}
                containerStyle={{ overflow: 'visible' }} // Ensure shadow isn't clipped
            >
                <Animated.View style={animatedStyle}>
                    <TouchableOpacity 
                        activeOpacity={1} // Handled by Reanimated
                        onPress={onPress || onToggle}
                        onLongPress={onLongPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        style={{ paddingHorizontal: spacing.l }}
                    >
                        {/* 1. Time Label (Conditional) */}
                        {(startTime || endTime) && (
                            <View style={styles.timeRow}>
                                <Text style={styles.timeText}>
                                    {startTime}
                                    {endTime ? ` - ${endTime}` : ''}
                                </Text>
                            </View>
                        )}

                        {/* 2. Card Content */}
                        <View style={[styles.card, containerStyle]}>
                            
                            {/* Header: Title + Checkbox */}
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, isCompleted && styles.completedTitle]} numberOfLines={2}>
                                    {title}
                                </Text>
                                
                                <TouchableOpacity 
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            if (!isCompleted) {
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                            } else {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            }
                                        }
                                        onToggle();
                                    }} 
                                    style={styles.checkbox}
                                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                >
                                    {isCompleted ? (
                                        <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                                            <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                                        </Animated.View>
                                    ) : (
                                        <Ionicons name="ellipse-outline" size={26} color={colors.textLight} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Footer: Energy Badge + Progress */}
                            <View style={styles.footerRow}>
                                <View style={[styles.energyBadge, { backgroundColor: accentColor + '15' }]}>
                                    <Ionicons name="flash" size={10} color={accentColor} style={{ marginRight: 4 }} />
                                    <Text style={[styles.energyText, { color: accentColor }]}>
                                        {energyLevel === 'MEDIUM' ? 'Mid Energy' : energyLevel === 'LOW' ? 'Recharge' : 'High Energy'}
                                    </Text>
                                </View>

                                {/* Progress Bar */}
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
                </Animated.View>
            </Swipeable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    timeRow: {
        marginBottom: 6,
        paddingLeft: 4, 
    },
    timeText: {
        ...typography.caption,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 24,
        padding: spacing.m,
        ...shadows.soft,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
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
        fontSize: 17,
        color: colors.text,
        flex: 1,
        lineHeight: 24,
    },
    completedTitle: {
        color: colors.textSecondary,
        textDecorationLine: 'none',
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
        ...shadows.soft
    }
});
