import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Switch, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius, layout } from '../theme';
import { MascotAvatar } from '../components/MascotAvatar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createApiService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileSkeleton, ProfileSettingsSkeleton, SkeletonBox } from '../components/ui/SkeletonLoader';
import { CustomDialog } from '../components/ui/CustomDialog';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { useOffline } from '../context/OfflineContext';
import { ExportHelper } from '../utils/ExportHelper';
import { useSubscription } from '../context/SubscriptionContext';

export const ProfileScreen = ({ navigation }: any) => {
    const { signOut, getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const api = createApiService(getToken);
    const { syncAllData, lastSynced } = useOffline();
    const { isProUser } = useSubscription();

    const [stats, setStats] = useState({
        streak: 0,
        totalTasks: 0,
        calmDays: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Dialog State
    const [dialogConfig, setDialogConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        actions?: any[];
    }>({ visible: false, title: '' });

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, visible: false }));

    const fetchStats = async () => {
        try {
            // First fetch and cache raw data for offline support and 7-day rolling calculations
            const [allTodos, calendar] = await Promise.all([
                api.getTodos(), // fetches all historically
                api.getCalendarData() // fetches historical calendar mapping
            ]);

            await StorageService.syncTodos(allTodos);
            await StorageService.syncCalendar(calendar);

            // Calculate locally scoped 7-day stats as requested (Feature 1)
            const localStats = await StorageService.calculate7DayStats();
            setStats(localStats);
        } catch (e) {
            console.error('Error in fetchStats:', e);
            // Fallback to locally cached stats if network is unavailable
            const localStats = await StorageService.calculate7DayStats();
            setStats(localStats);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const handleSignOut = () => {
        setDialogConfig({
            visible: true,
            title: "Sign Out",
            message: "Are you sure you want to sign out?",
            actions: [
                { text: "Cancel", style: "cancel", onPress: closeDialog },
                { text: "Sign Out", style: "destructive", onPress: () => { closeDialog(); signOut(); } }
            ]
        });
    };

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
            loadNotificationState();
        }, [])
    );

    const loadNotificationState = async () => {
        const isEnabled = await NotificationService.getNotificationsEnabled();
        setNotificationsEnabled(isEnabled);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncAllData();
            setDialogConfig({
                visible: true,
                title: "Sync Complete",
                message: "Your data is backed up safely.",
                actions: [{ text: "OK", onPress: closeDialog }]
            });
        } catch (e) {
            setDialogConfig({
                visible: true,
                title: "Sync Failed",
                message: "Please check your network and try again.",
                actions: [{ text: "OK", onPress: closeDialog }]
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExport = () => {
        if (!isProUser) {
            navigation.navigate('Premium');
            return;
        }

        setDialogConfig({
            visible: true,
            title: "Export Data",
            message: "Choose your preferred export format:",
            actions: [
                { text: "Cancel", style: "cancel", onPress: closeDialog },
                { text: "Export CSV", onPress: async () => {
                    closeDialog();
                    await ExportHelper.exportToCSV();
                }},
                { text: "Export PDF", onPress: async () => {
                    closeDialog();
                    await ExportHelper.exportToPDF();
                }}
            ]
        });
    };

    const handlePrivacy = () => {
        setDialogConfig({
            visible: true,
            title: "Privacy Policy",
            message: "We value your privacy. \n\n1. Your data is yours.\n2. We don't sell your data.\n3. Health data is encrypted.",
            actions: [{ text: "Got it", onPress: closeDialog }]
        });
    };

    const toggleSwitch = async () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        await NotificationService.setNotificationsEnabled(newValue);
    };

    if (!isLoaded) {
        return <ProfileSkeleton />;
    }

    return (
        <ScreenLayout edges={['top']}>
            <CustomDialog 
                visible={dialogConfig.visible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                actions={dialogConfig.actions}
                onClose={closeDialog}
            />
            {/* Fixed Header */}
            <View style={styles.fixedHeader}>
                <View style={styles.headerTopRow}>
                    <BackButton style={styles.backBtn} />
                </View>
                <MascotAvatar size="large" imageUrl={user?.imageUrl} />
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.m }}>
                    <Text style={[styles.userName, { marginTop: 0 }]}>{user?.fullName || "Pace User"}</Text>
                    {isProUser && (
                        <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            backgroundColor: '#FFFBF0', 
                            paddingHorizontal: 6, 
                            paddingVertical: 2, 
                            borderRadius: 12, 
                            marginLeft: 8, 
                            borderWidth: 1, 
                            borderColor: colors.warning + '40' 
                        }}>
                            <MaterialCommunityIcons name="crown" size={12} color={colors.warning} style={{ marginRight: 2 }} />
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.warning }}>PRO</Text>
                        </View>
                    )}
                </View>
                
                <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>


                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="flame" size={24} color={colors.primary} style={{marginBottom: 4}} />
                        {loading ? (
                             <SkeletonBox width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} /> 
                        ) : (
                             <Text style={styles.statValue}>{stats.streak}</Text>
                        )}
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.accent} style={{marginBottom: 4}} />
                        {loading ? (
                             <SkeletonBox width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} /> 
                        ) : (
                             <Text style={styles.statValue}>{stats.totalTasks}</Text>
                        )}
                        <Text style={styles.statLabel}>Tasks Done</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="leaf" size={24} color={colors.accent} style={{marginBottom: 4}} />
                        {loading ? (
                             <SkeletonBox width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} /> 
                        ) : (
                             <Text style={styles.statValue}>{stats.calmDays}</Text>
                        )}
                        <Text style={styles.statLabel}>Calm Days</Text>
                    </View>
                </View>
                <Text style={styles.statsSubLabel}>* Last 7 days</Text>
            </View>

            {/* Scrollable Content */}
            {loading ? (
                <ProfileSettingsSkeleton />
            ) : (
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
            {!isProUser && (
                <TouchableOpacity 
                    style={styles.premiumCard}
                    onPress={() => navigation.navigate('Premium')}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.m}}>
                        <View style={styles.premiumIcon}>
                            <Ionicons name="diamond" size={24} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.premiumTitle}>Pace Pro</Text>
                            <Text style={styles.premiumSubtitle}>Unlock advanced insights & themes.</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#DAA520" />
                </TouchableOpacity>
            )}
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}></Text>
                <View style={styles.settingsList}>
                    
                    {/* Notifications Toggle */}
                    <View style={[styles.settingItem, { borderBottomWidth: 1 }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.m}}>
                            <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                            </View>
                            <Text style={styles.settingLabel}>Notifications</Text>
                        </View>
                        <Switch
                            trackColor={{ false: colors.border, true: colors.accent }}
                            thumbColor={colors.surface}
                            ios_backgroundColor={colors.border}
                            onValueChange={toggleSwitch}
                            value={notificationsEnabled}
                        />
                    </View>

                    {/* Sync Data */}
                    <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 1 }]} onPress={handleSync} disabled={isSyncing}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.m}}>
                            <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                                <Ionicons name={isSyncing ? "sync" : "sync-outline"} size={20} color={colors.text} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>{isSyncing ? "Syncing..." : "Sync Data"}</Text>
                                <Text style={[styles.settingLabel, { fontSize: 12, color: colors.textLight, marginTop: 2, fontWeight: 'normal' }]}>
                                    Last synced: {lastSynced ? new Date(lastSynced).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                    }) : 'Never'}
                                </Text>
                            </View>
                        </View>
                        {isSyncing ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                    </TouchableOpacity>

                    {/* Privacy Policy */}
                    <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 1 }]} onPress={handlePrivacy}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.m}}>
                            <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
                            </View>
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                    </TouchableOpacity>

                    {/* Export Data */}
                    <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={handleExport}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.m}}>
                            <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                                <Ionicons name="download-outline" size={20} color={colors.text} />
                            </View>
                            <Text style={styles.settingLabel}>Export Data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                    </TouchableOpacity>

                </View>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{height: 100}} />
            </ScrollView>
            )}
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background handled by ScreenLayout
    },
    fixedHeader: {
        alignItems: 'center',
        paddingTop: spacing.m,
        paddingBottom: spacing.m,
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...shadows.soft,
    },
    headerTopRow: {
        width: '100%',
        paddingHorizontal: spacing.l,
        marginBottom: spacing.m,
        alignItems: 'flex-start',
    },
    backBtn: {
        padding: 8,
    },
    userName: {
        ...typography.subheader,
        marginTop: spacing.m,
    },
    userEmail: {
        ...typography.caption,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        marginTop: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
    },
    statsSubLabel: {
        fontSize: 10,
        color: colors.textLight,
        marginTop: spacing.s,
        fontStyle: 'italic',
        opacity: 0.7,
    },
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing.l,
        backgroundColor: '#FFFBF0', // Soft gold tint
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        marginTop: spacing.l,
        borderWidth: 1,
        borderColor: colors.premium + '40',
    },
    premiumIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.premium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        fontWeight: 'bold',
        color: colors.premium,
        fontSize: 16,
    },
    premiumSubtitle: {
        fontSize: 12,
        color: colors.premium,
        opacity: 0.8,
    },
    section: {
        paddingHorizontal: spacing.l,
        marginBottom: spacing.l,
    },
    sectionTitle: {
        ...typography.bodyBold,
        marginBottom: spacing.s,
        color: colors.textLight,
    },
    settingsList: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        ...shadows.soft,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        ...typography.body,
        fontWeight: '500',
    },
    signOutBtn: {
        marginHorizontal: spacing.l,
        padding: spacing.m,
        alignItems: 'center',
    },
    signOutText: {
        color: colors.error,
        fontWeight: 'bold',
    }
});
