import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

// --- Reusable Shimmer Box ---
interface SkeletonBoxProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const SkeletonBox = ({ width, height, borderRadius: br = 8, style }: SkeletonBoxProps) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius: br,
                    backgroundColor: colors.border,
                    opacity,
                },
                style,
            ]}
        />
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
        {/* Header Title */}
        <SkeletonBox width={120} height={32} borderRadius={8} style={{ marginBottom: spacing.l, marginLeft: spacing.l }} />

        {/* Range Selector */}
        <View style={statsStyles.rangeRow}>
            <SkeletonBox width={60} height={32} borderRadius={20} />
            <SkeletonBox width={60} height={32} borderRadius={20} />
            <SkeletonBox width={60} height={32} borderRadius={20} />
        </View>

        {/* Summary Cards Grid */}
        <View style={statsStyles.cardRow}>
            <SkeletonBox width="48%" height={100} borderRadius={20} />
            <SkeletonBox width="48%" height={100} borderRadius={20} />
        </View>
        <View style={statsStyles.cardRow}>
            <SkeletonBox width="48%" height={100} borderRadius={20} />
            <SkeletonBox width="48%" height={100} borderRadius={20} />
        </View>

        {/* Wide Card */}
        <SkeletonBox width="100%" height={80} borderRadius={20} style={{ marginBottom: spacing.m }} />

        {/* Chart */}
        <SkeletonBox width="100%" height={220} borderRadius={24} />
    </View>
);

const statsStyles = StyleSheet.create({
    container: {
        paddingTop: spacing.l,
        paddingHorizontal: spacing.l,
    },
    rangeRow: {
        flexDirection: 'row',
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },
});

// --- Profile Skeleton (for ProfileScreen) ---
export const ProfileSkeleton = () => (
    <View style={profileStyles.container}>
        {/* Header Section */}
        <View style={profileStyles.header}>
            <SkeletonBox width={100} height={100} borderRadius={50} style={{ marginBottom: spacing.m }} />
            <SkeletonBox width={160} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width={120} height={16} borderRadius={6} />
            
            {/* Stats Row */}
            <View style={profileStyles.statsRow}>
                <SkeletonBox width={60} height={40} borderRadius={8} />
                <View style={{ width: 1, height: 40, backgroundColor: colors.border }} />
                <SkeletonBox width={60} height={40} borderRadius={8} />
                <View style={{ width: 1, height: 40, backgroundColor: colors.border }} />
                <SkeletonBox width={60} height={40} borderRadius={8} />
            </View>
        </View>

        {/* Premium Card */}
        <SkeletonBox width="100%" height={80} borderRadius={24} style={{ marginBottom: spacing.l }} />

        {/* Settings List */}
        <View style={profileStyles.settingsList}>
            {[1, 2, 3, 4].map((_, i) => (
                <View key={i} style={profileStyles.settingItem}>
                    <SkeletonBox width={32} height={32} borderRadius={10} />
                    <SkeletonBox width={120} height={16} borderRadius={4} style={{ marginLeft: spacing.m }} />
                </View>
            ))}
        </View>
    </View>
);

const profileStyles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.l,
        paddingBottom: spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: spacing.l,
        gap: spacing.l,
        alignItems: 'center',
    },
    settingsList: {
        borderRadius: borderRadius.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
});
