import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
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
        ? { backgroundColor: colors.palette.mint + '15' } 
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
        scale.value = withSpring(0.98, { damping: 10 });
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
                containerStyle={{ overflow: 'visible' }}
            >
                <Animated.View style={animatedStyle}>
                    <Pressable
                        onPress={onPress || onToggle}
                        onLongPress={onLongPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        android_ripple={{ color: colors.l3, borderless: false }}
                        style={({ pressed }) => [
                            styles.card,
                            containerStyle,
                            // iOS press feedback
                            Platform.OS === 'ios' && pressed && { opacity: 0.9 }
                        ]}
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

                        {/* Header: Title + Checkbox */}
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, isCompleted && styles.completedTitle]} numberOfLines={2}>
                                {title}
                            </Text>
                            
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation(); // Prevent card press
                                    if (Platform.OS !== 'web') {
                                        if (!isCompleted) {
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        } else {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                    }
                                    onToggle();
                                }} 
                                style={({ pressed }) => [
                                    styles.checkbox,
                                    { opacity: pressed ? 0.7 : 1 }
                                ]}
                                hitSlop={16}
                            >
                                {isCompleted ? (
                                    <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                                        <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                                    </Animated.View>
                                ) : (
                                    <Ionicons name="ellipse-outline" size={26} color={colors.textLight} />
                                )}
                            </Pressable>
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
                    </Pressable>
                </Animated.View>
            </Swipeable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20, // Slightly cleaner radius
        padding: spacing.m,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
                shadowColor: '#000', // Ensure shadow color helps elevation on some versions
            },
            web: {
                boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
            }
        }),
        marginHorizontal: 2, // Prevent horizontal clipping of shadow
        marginBottom: 2, // Prevent bottom clipping
    },
    timeRow: {
        marginBottom: 8, // More breathing room
    },
    timeText: {
        ...typography.caption,
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.m, // Increased spacing
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
        textDecorationLine: 'none', // Removed strikethrough for cleaner look
        opacity: 0.7
    },
    checkbox: {
        marginTop: 0, // Aligned with text top
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
        paddingVertical: 5,
        borderRadius: 10,
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
        // Simple shadow for action button
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    }
});
