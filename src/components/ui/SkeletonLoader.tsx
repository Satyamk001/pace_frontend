import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Reusable Shimmer Box (sweep shimmer animation) ---
interface SkeletonBoxProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const SkeletonBox = ({ width, height, borderRadius: br = 8, style }: SkeletonBoxProps) => {
    const shimmerX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerX, {
                toValue: SCREEN_WIDTH,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius: br,
                    backgroundColor: colors.border,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    width: '60%',
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.35)',
                    transform: [{ translateX: shimmerX }],
                    borderRadius: br,
                }}
            />
        </View>
    );
};

// --- Task Item Skeleton (for HomeScreen) ---
export const TaskItemSkeleton = () => (
    <View style={taskStyles.container}>
        <SkeletonBox width={26} height={26} borderRadius={13} />
        <View style={taskStyles.info}>
            <SkeletonBox width="75%" height={16} borderRadius={6} />
            <SkeletonBox width="40%" height={4} borderRadius={2} style={{ marginTop: 8 }} />
        </View>
        <SkeletonBox width={32} height={24} borderRadius={12} />
    </View>
);

const taskStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.m,
        marginBottom: spacing.s,
        borderRadius: borderRadius.m,
        ...shadows.soft,
        gap: spacing.m,
    },
    info: {
        flex: 1,
    },
});

// --- Schedule Card Skeleton (for CalendarScreen, matches ScheduleCard layout) ---
export const ScheduleCardSkeleton = () => (
    <View style={scheduleStyles.container}>
        {/* Time Column */}
        <View style={scheduleStyles.timeColumn}>
            <SkeletonBox width={40} height={14} borderRadius={4} />
            <View style={scheduleStyles.timelineLine} />
        </View>

        {/* Card */}
        <View style={scheduleStyles.card}>
            {/* Header row: badge + checkbox */}
            <View style={scheduleStyles.headerRow}>
                <SkeletonBox width={50} height={22} borderRadius={12} />
                <SkeletonBox width={24} height={24} borderRadius={12} />
            </View>

            {/* Title */}
            <SkeletonBox width="70%" height={18} borderRadius={6} style={{ marginBottom: spacing.m }} />

            {/* Progress bar + percentage */}
            <View style={scheduleStyles.progressRow}>
                <View style={{ flex: 1 }}>
                    <SkeletonBox width="100%" height={6} borderRadius={3} />
                </View>
                <SkeletonBox width={28} height={12} borderRadius={4} />
            </View>
        </View>
    </View>
);

const scheduleStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: spacing.m,
        paddingHorizontal: spacing.l,
    },
    timeColumn: {
        width: 60,
        alignItems: 'center',
        marginRight: spacing.s,
    },
    timelineLine: {
        flex: 1,
        width: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    card: {
        flex: 1,
        borderRadius: 24,
        padding: spacing.l,
        backgroundColor: colors.surface,
        ...shadows.soft,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});

// --- Group Wrappers ---
export const TaskListSkeleton = ({ count = 4 }: { count?: number }) => (
    <View>
        {Array.from({ length: count }).map((_, i) => (
            <TaskItemSkeleton key={i} />
        ))}
    </View>
);

export const ScheduleListSkeleton = ({ count = 3 }: { count?: number }) => (
    <View>
        {Array.from({ length: count }).map((_, i) => (
            <ScheduleCardSkeleton key={i} />
        ))}
    </View>
);

// --- Stats Skeleton (for StatsScreen) ---
export const StatsSkeleton = () => (
    <View style={statsStyles.container}>
        {/* Header Title Space - Removed to show real header */}
        <View style={{ height: 60 }} />

        {/* Range Selector */}
        <View style={statsStyles.rangeRow}>
            <SkeletonBox width={50} height={28} borderRadius={16} />
            <SkeletonBox width={50} height={28} borderRadius={16} />
            <SkeletonBox width={50} height={28} borderRadius={16} />
            <SkeletonBox width={50} height={28} borderRadius={16} />
        </View>

        {/* Stats Grid (2x2) */}
        <View style={statsStyles.gridContainer}>
             <View style={statsStyles.gridRow}>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
             </View>
             <View style={statsStyles.divider} />
             <View style={statsStyles.gridRow}>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
             </View>
        </View>

        {/* Chart Card */}
        <View style={statsStyles.chartCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.m}}>
                <SkeletonBox width={100} height={20} borderRadius={6} />
                <SkeletonBox width={80} height={20} borderRadius={6} />
            </View>
            <SkeletonBox width="100%" height={180} borderRadius={16} />
        </View>
    </View>
);

// --- Stats Content Skeleton (Grid + Chart only) ---
export const StatsContentSkeleton = () => (
    <View style={statsStyles.container}>
        {/* Stats Grid (2x2) */}
        <View style={statsStyles.gridContainer}>
             <View style={statsStyles.gridRow}>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
             </View>
             <View style={statsStyles.divider} />
             <View style={statsStyles.gridRow}>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
                <View style={[statsStyles.gridItem, { alignItems: 'center' }]}>
                    <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
             </View>
        </View>

        {/* Chart Card */}
        <View style={statsStyles.chartCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.m}}>
                <SkeletonBox width={100} height={20} borderRadius={6} />
                <SkeletonBox width={80} height={20} borderRadius={6} />
            </View>
            <SkeletonBox width="100%" height={180} borderRadius={16} />
        </View>
    </View>
);

const statsStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m
    },
    rangeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
        paddingHorizontal: spacing.s
    },
    gridContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        ...shadows.soft,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    gridItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        opacity: 0.5,
        marginVertical: spacing.m,
    },
    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.soft,
    }
});

// --- Profile Skeleton (for ProfileScreen) ---
export const ProfileSkeleton = () => (
    <View style={profileStyles.container}>
        {/* Spacer for Header */}
        <View style={{ height: 60 }} />

        {/* Profile Info */}
        <View style={profileStyles.profileInfo}>
            <SkeletonBox width={80} height={80} borderRadius={40} style={{ marginBottom: spacing.m }} />
            <SkeletonBox width={140} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width={180} height={16} borderRadius={6} />
        </View>

        {/* Stats Row */}
        <View style={profileStyles.statsRow}>
            {[1, 2, 3].map((_, i) => (
                <View key={i} style={profileStyles.statItem}>
                    <SkeletonBox width={40} height={24} borderRadius={6} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={50} height={12} borderRadius={4} />
                </View>
            ))}
        </View>

        {/* Settings List */}
        <View style={profileStyles.section}>
            {[1, 2, 3, 4].map((_, i) => (
                <View key={i} style={profileStyles.row}>
                    <SkeletonBox width={24} height={24} borderRadius={8} />
                    <SkeletonBox width={120} height={16} borderRadius={4} style={{ marginLeft: spacing.m }} />
                </View>
            ))}
        </View>
    </View>
);

// --- Profile Content Skeleton (Settings List) ---
export const ProfileSettingsSkeleton = () => (
    <View style={profileStyles.container}>
        {/* Premium Card */}
        <SkeletonBox width="100%" height={80} borderRadius={24} style={{ marginBottom: spacing.l }} />

        {/* Settings List */}
        <View style={profileStyles.section}>
            {[1, 2, 3, 4].map((_, i) => (
                <View key={i} style={profileStyles.row}>
                    <SkeletonBox width={24} height={24} borderRadius={8} />
                    <SkeletonBox width={120} height={16} borderRadius={4} style={{ marginLeft: spacing.m }} />
                </View>
            ))}
        </View>
    </View>
);

const profileStyles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.l
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.l
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.m
    },
    statItem: {
        alignItems: 'center',
    },
    section: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.soft,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '20', // Very light border
    }
});
