import React, { useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, {
    FadeInDown,
    ZoomIn,
    ZoomOut,
    Layout,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withSpring
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
    title: string;
    isCompleted: boolean;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    progress?: number;
    feedback?: string;
    dueDate?: string;
    repeatType?: string;
    index?: number;
    onToggle: () => void;
    onPress?: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
}

export const TaskItem = ({
    title,
    isCompleted,
    energyLevel,
    progress = 0,
    feedback,
    dueDate,
    repeatType,
    index = 0,
    onToggle,
    onPress,
    onLongPress,
    onDelete
}: TaskItemProps) => {

    const isFullyDone = isCompleted || progress === 100;

    const getEnergyConfig = () => {
        switch (energyLevel) {
            case 'LOW': return { color: colors.mood.great, icon: 'leaf-outline' as const };
            case 'MEDIUM': return { color: colors.mood.okay, icon: 'sunny-outline' as const };
            case 'HIGH': return { color: colors.mood.pain, icon: 'flame-outline' as const };
            default: return { color: colors.mood.okay, icon: 'sunny-outline' as const };
        }
    };
    const energy = getEnergyConfig();

    const getFormattedDate = () => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        const now = new Date();
        const isOverdue = date < now && !isCompleted;
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { text: timeString, isWarning: isOverdue };
    };
    const dateInfo = getFormattedDate();

    // --- ANIMATIONS ---
    const completionScale = useSharedValue(1);
    const completionOpacity = useSharedValue(1);

    React.useEffect(() => {
        if (isFullyDone) {
            completionScale.value = withSequence(withSpring(0.98), withSpring(1));
            completionOpacity.value = withTiming(0.6, { duration: 400 });
        } else {
            completionScale.value = withSpring(1);
            completionOpacity.value = withTiming(1, { duration: 300 });
        }
    }, [isFullyDone]);

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: completionScale.value }],
        opacity: completionOpacity.value,
    }));

    const swipeableRef = useRef<Swipeable>(null);
    const renderRightActions = () => (
        <View style={styles.rightActionContainer}>
            <TouchableOpacity
                onPress={() => { swipeableRef.current?.close(); onDelete?.(); }}
                style={styles.deleteAction}
            >
                <Ionicons name="trash-outline" size={20} color={colors.surface} />
            </TouchableOpacity>
        </View>
    );

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).duration(400)}
            layout={Layout.springify().damping(15)}
        >
            <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} friction={2}>
                <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
                    <TouchableOpacity
                        onPress={onPress || onToggle}
                        activeOpacity={0.8}
                        style={[styles.card, isFullyDone && styles.cardCompleted]}
                    >
                        {/* LEFT TOGGLE AREA */}
                        <TouchableOpacity onPress={onToggle} style={styles.checkArea}>
                            {isFullyDone ? (
                                <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                </Animated.View>
                            ) : (
                                <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                            )}
                        </TouchableOpacity>

                        {/* CONTENT AREA */}
                        <View style={styles.contentArea}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.title, isFullyDone && styles.completedTitle]} numberOfLines={1}>
                                    {title}
                                </Text>
                                {repeatType && repeatType !== 'NONE' && (
                                    <Ionicons name="repeat" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                                )}
                            </View>

                            <View style={styles.metaRow}>
                                {/* TIME CHIP */}
                                <View style={[
                                    styles.metaChip,
                                    { borderColor: dateInfo?.isWarning ? colors.mood.pain : colors.border }
                                ]}>
                                    <Ionicons
                                        name="time-outline"
                                        size={12}
                                        color={colors.textPrimary}
                                    />
                                    <Text style={styles.metaText}>
                                        {dateInfo?.text}
                                    </Text>
                                </View>

                                {/* ENERGY CHIP */}
                                <View style={[styles.metaChip, { borderColor: energy.color }]}>
                                    {/* <Ionicons name={energy.icon} size={12} color={colors.textPrimary} /> */}
                                    <Text style={styles.metaText}>
                                        {energyLevel.toLowerCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* SUBTLE PROGRESS INDICATOR */}
                        {progress > 0 && progress < 100 && !isFullyDone && (
                            <View style={styles.progressRing}>
                                <Text style={styles.progressText}>{progress}%</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </Swipeable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: spacing.s,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '30',
        elevation: 0,
        shadowOpacity: 0,
    },
    cardCompleted: {
        backgroundColor: colors.background,
        borderColor: colors.accent,
        borderStyle: 'dashed',
        shadowOpacity: 0,
        elevation: 0,
    },
    checkArea: {
        paddingRight: spacing.m,
    },
    contentArea: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        ...typography.bodyBold,
        fontSize: 15,
        color: colors.text,
    },
    completedTitle: {
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        gap: 4,
    },
    metaText: {
        ...typography.caption,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
        color: colors.textPrimary,
    },
    progressRing: {
        paddingLeft: spacing.s,
    },
    progressText: {
        ...typography.caption,
        fontSize: 10,
        fontWeight: '800',
        color: colors.primary,
    },
    rightActionContainer: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: spacing.m,
    },
    deleteAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.mood.pain,
        justifyContent: 'center',
        alignItems: 'center',
    }
});