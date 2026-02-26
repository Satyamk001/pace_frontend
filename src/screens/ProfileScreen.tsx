import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    RefreshControl, Switch, ActivityIndicator, Animated
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius, layout } from '../theme';
import { MascotAvatar } from '../components/MascotAvatar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createApiService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileSkeleton, ProfileSettingsSkeleton, SkeletonBox } from '../components/ui/SkeletonLoader';
import { CustomDialog } from '../components/ui/CustomDialog';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { NotificationService } from '../services/NotificationService';
import { ExportHelper } from '../utils/ExportHelper';
import { useSubscription } from '../context/SubscriptionContext';
import { PainHeatmap } from '../components/PainHeatmap';
import { PremiumUpsellCard } from '../components/ui/PremiumUpsellCard';
import { SettingsCardItem } from '../components/ui/SettingsCardItem';

export const ProfileScreen = ({ navigation }: any) => {
    const { signOut, getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const api = createApiService(getToken);
    const { isProUser } = useSubscription();

    const [calendarStats, setCalendarStats] = useState<any>({});
    const [heatmapYear, setHeatmapYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{
        visible: boolean; title: string; message?: string; actions?: any[];
    }>({ visible: false, title: '' });

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, visible: false }));

    const fetchStats = async () => {
        try {
            const calendar = await api.getCalendarData();
            setCalendarStats(calendar || {});
        } catch (e) {
            console.error('Error in fetchStats:', e);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, []);

    useFocusEffect(useCallback(() => { fetchStats(); loadNotificationState(); }, []));

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);


    const loadNotificationState = async () => {
        const isEnabled = await NotificationService.getNotificationsEnabled();
        setNotificationsEnabled(isEnabled);
    };

    const handleSignOut = () => {
        setDialogConfig({
            visible: true, title: "Sign Out",
            message: "Are you sure you want to sign out?",
            actions: [
                { text: "Cancel", style: "cancel", onPress: closeDialog },
                { text: "Sign Out", style: "destructive", onPress: () => { closeDialog(); signOut(); } }
            ]
        });
    };



    const handleExport = () => {
        if (!isProUser) { navigation.navigate('Premium'); return; }
        setDialogConfig({
            visible: true, title: "Export Data", message: "Choose your preferred export format:",
            actions: [
                { text: "Cancel", style: "cancel", onPress: closeDialog },
                { text: "Export CSV", onPress: async () => { closeDialog(); await ExportHelper.exportToCSV(); } },
                { text: "Export PDF", onPress: async () => { closeDialog(); await ExportHelper.exportToPDF(); } }
            ]
        });
    };

    const handlePrivacy = () => {
        setDialogConfig({
            visible: true, title: "Privacy Policy",
            message: "We value your privacy. \n\n1. Your data is yours.\n2. We don't sell your data.\n3. Health data is encrypted.",
            actions: [{ text: "Got it", onPress: closeDialog }]
        });
    };

    const toggleSwitch = async () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        await NotificationService.setNotificationsEnabled(newValue);
    };

    if (!isLoaded) return <ProfileSkeleton />;

    // ─── Setting rows config ───────────────────────────────────────────────────
    const settingRows = [
        {
            key: 'notifications',
            icon: 'notifications-outline' as const,
            label: 'Notifications',
            right: (
                <View style={{ transform: [{ scale: 0.8 }] }}>
                    <Switch
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.surface}
                        ios_backgroundColor={colors.border}
                        onValueChange={toggleSwitch}
                        value={notificationsEnabled}
                    />
                </View>
            ),
            onPress: undefined,
        },

        {
            key: 'privacy',
            icon: 'shield-checkmark-outline' as const,
            label: 'Privacy Policy',
            right: <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />,
            onPress: handlePrivacy,
        },
        {
            key: 'export',
            icon: 'download-outline' as const,
            label: 'Export Data',
            right: <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />,
            onPress: handleExport,
        },
        {
            key: 'signout',
            icon: 'log-out-outline' as const,
            label: 'Sign Out',
            onPress: handleSignOut,
            iconColor: colors.error,
            labelColor: colors.error,
        },
    ];



    return (
        <ScreenLayout edges={['top']} useGradient="hero">
            <CustomDialog
                visible={dialogConfig.visible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                actions={dialogConfig.actions}
                onClose={closeDialog}
            />

            {/* ── FIXED HEADER ────────────────────────────────────────────── */}
            <View style={styles.headerContainer}>

                {/* Profile Identity Row */}
                <View style={styles.profileRow}>
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        <MascotAvatar size="medium" imageUrl={user?.imageUrl} shape="square" />
                        {isProUser && (
                            <View style={styles.proBadge}>
                                <MaterialCommunityIcons name="crown" size={10} color="#FFF" />
                            </View>
                        )}
                    </View>

                    {/* Identity Info */}
                    <View style={styles.identityCol}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{user?.fullName || 'Pace User'}</Text>
                            
                        </View>
                        <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>
                    </View>

                   
                </View>
            </View>

            {/* ── SCROLLABLE CONTENT ──────────────────────────────────────── */}
            {loading ? <ProfileSettingsSkeleton /> : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >

                    {/* Heatmap */}
                    <PainHeatmap 
                        year={heatmapYear}
                        calendarData={calendarStats}
                        onYearChange={setHeatmapYear}
                    />

                    {/* Premium upsell */}
                    {!isProUser && (
                        <PremiumUpsellCard onPress={() => navigation.navigate('Premium')} />
                    )}

                    {/* Settings card layer - Refactored to Grid */}
                    <View style={styles.settingsGrid}>
                        {settingRows.map((row: any, i) => (
                            <SettingsCardItem 
                                key={row.key}
                                icon={row.icon}
                                label={row.label}
                                sub={row.sub}
                                right={row.right}
                                onPress={row.onPress}
                                disabled={row.disabled}
                                iconColor={row.iconColor}
                                labelColor={row.labelColor}
                            />
                        ))}
                    </View>



                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </ScreenLayout>
    );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

    // ── Header ──────────────────────────────────────────────────────────────
    headerContainer: {
        paddingTop: spacing.s,
        paddingBottom: spacing.m,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
    },

    // ── Profile Row ─────────────────────────────────────────────────────────
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.screenPadding,
    },
    avatarWrap: {
        position: 'relative',
        marginRight: spacing.m,
    },
    proBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.premium,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },

    // ── Identity ─────────────────────────────────────────────────────────────
    identityCol: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.4,
    },
    proTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.premium + '18',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        borderColor: colors.premium + '40',
    },
    proTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.premium,
        letterSpacing: 0.6,
    },
    userEmail: {
        ...typography.caption,
        marginTop: 2,
    },
    ellipsisBtn: {
        padding: spacing.s,
    },

    // ── Scroll content ───────────────────────────────────────────────────────
    scrollContent: {
        paddingTop: spacing.l,
        paddingHorizontal: layout.screenPadding,
    },

    settingsGrid: {
        flexDirection: 'column',
        marginBottom: spacing.m,
    },


});