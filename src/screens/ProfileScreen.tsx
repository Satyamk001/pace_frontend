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
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { useOffline } from '../context/OfflineContext';
import { ExportHelper } from '../utils/ExportHelper';
import { useSubscription } from '../context/SubscriptionContext';
import { PainHeatmap } from '../components/PainHeatmap';

export const ProfileScreen = ({ navigation }: any) => {
    const { signOut, getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const api = createApiService(getToken);
    const { syncAllData, lastSynced } = useOffline();
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
            const [allTodos, calendar] = await Promise.all([api.getTodos(), api.getCalendarData()]);
            await StorageService.syncTodos(allTodos);
            await StorageService.syncCalendar(calendar);
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
    const [isSyncing, setIsSyncing] = useState(false);

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

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncAllData();
            setDialogConfig({ visible: true, title: "Sync Complete", message: "Your data is backed up safely.", actions: [{ text: "OK", onPress: closeDialog }] });
        } catch (e) {
            setDialogConfig({ visible: true, title: "Sync Failed", message: "Please check your network and try again.", actions: [{ text: "OK", onPress: closeDialog }] });
        } finally { setIsSyncing(false); }
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
            key: 'sync',
            icon: (isSyncing ? 'sync' : 'sync-outline') as any,
            label: isSyncing ? 'Syncing…' : 'Sync Data',
            sub: `Last synced: ${lastSynced ? new Date(lastSynced).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'}`,
            right: isSyncing
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />,
            onPress: handleSync,
            disabled: isSyncing,
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
                        <TouchableOpacity style={styles.premiumCard} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                            <View style={styles.premiumLeft}>
                                <View style={styles.premiumIcon}>
                                    <Ionicons name="diamond" size={20} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={styles.premiumTitle}>Pace Pro</Text>
                                    <Text style={styles.premiumSubtitle}>Unlock advanced insights & themes</Text>
                                </View>
                            </View>
                            <View style={styles.premiumChevron}>
                                <Ionicons name="chevron-forward" size={14} color={colors.premium} />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Settings card layer - Refactored to Grid */}
                    <View style={styles.settingsGrid}>
                        {settingRows.map((row, i) => (
                            <TouchableOpacity
                                key={row.key}
                                style={styles.settingsCardItem}
                                onPress={row.onPress}
                                disabled={row.disabled || !row.onPress}
                                activeOpacity={row.onPress ? 0.7 : 1}
                            >
                                <View style={styles.settingTopRow}>
                                    <View style={styles.settingIconWrap}>
                                        <Ionicons name={row.icon} size={20} color={colors.accentDark} />
                                    </View>
                                    <View style={styles.settingRight}>{row.right}</View>
                                </View>
                                <View style={styles.settingTextContent}>
                                    <Text style={styles.settingLabel}>{row.label}</Text>
                                    {row.sub && <Text style={styles.settingSub}>{row.sub}</Text>}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Sign out */}
                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.75}>
                        <Ionicons name="log-out-outline" size={17} color={colors.error} style={{ marginRight: 6 }} />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>

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

    // ── Premium card ─────────────────────────────────────────────────────────
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.premium + '12',
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.premium + '35',
    },
    premiumLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    premiumIcon: {
        width: 42,
        height: 42,
        borderRadius: borderRadius.m,
        backgroundColor: colors.premium,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.soft,
    },
    premiumTitle: {
        fontWeight: '700',
        color: colors.premium,
        fontSize: 15,
        letterSpacing: -0.2,
    },
    premiumSubtitle: {
        fontSize: 12,
        color: colors.premium,
        opacity: 0.75,
        marginTop: 2,
    },
    premiumChevron: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.premium + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Settings Grid ─────────────────────────────────────────────────────────
    settingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },
    settingsCardItem: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg || 24, // Assuming 24px per specs
        padding: spacing.m,
        marginBottom: spacing.m,
        ...shadows.soft,
    },
    settingTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    settingIconWrap: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.round,
        backgroundColor: colors.surfaceSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingTextContent: {
        marginTop: spacing.xs,
    },
    settingLabel: {
        ...typography.bodyBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    settingSub: {
        ...typography.caption,
        fontSize: 12,
        color: colors.textSecondary,
    },
    settingRight: {
        // Keeps switches/chevrons vertically aligned with the icon
    },

    // ── Sign out ──────────────────────────────────────────────────────────────
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.m,
        marginTop: spacing.xs,
    },
    signOutText: {
        color: colors.error,
        fontWeight: '600',
        fontSize: 15,
    },
});