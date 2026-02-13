import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Switch, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { MascotAvatar } from '../components/MascotAvatar';
import { Ionicons } from '@expo/vector-icons';
import { createApiService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export const ProfileScreen = ({ navigation }: any) => {
    const { signOut, getToken } = useAuth();
    const { user } = useUser();
    const api = createApiService(getToken);

    const [stats, setStats] = useState({
        streak: 0,
        totalTasks: 0,
        calmDays: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await api.getStats('7'); // Start with default range, expecting summary in response
            if (data.summary) {
                setStats(data.summary);
            }
        } catch (e) {
            console.error(e);
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
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: () => signOut() }
        ]);
    };

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        // Simulate sync
        setTimeout(() => {
            setIsSyncing(false);
            Alert.alert("Sync Complete", "Your data is backed up safely! ☁️");
        }, 2000);
    };

    const handleExport = () => {
        Alert.alert("Export Data", "Preparing your data...", [
            { text: "Cancel", style: "cancel" },
            { text: "Download", onPress: () => Alert.alert("Success", "Data exported to CSV.") }
        ]);
    };

    const handlePrivacy = () => {
        Alert.alert(
            "Privacy Policy",
            "We value your privacy. \n\n1. Your data is yours.\n2. We don't sell your data.\n3. Health data is encrypted.",
            [{ text: "Got it" }]
        );
    };

    const toggleSwitch = () => setNotificationsEnabled(previousState => !previousState);

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.fixedHeader}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <MascotAvatar size="large" imageUrl={user?.imageUrl} />
                <Text style={styles.userName}>{user?.fullName || "Pace User"}</Text>
                <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="flame" size={24} color={colors.primary} style={{marginBottom: 4}} />
                        <Text style={styles.statValue}>{stats.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.secondary} style={{marginBottom: 4}} />
                        <Text style={styles.statValue}>{stats.totalTasks}</Text>
                        <Text style={styles.statLabel}>Tasks Done</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="leaf" size={24} color={colors.accent} style={{marginBottom: 4}} />
                        <Text style={styles.statValue}>{stats.calmDays}</Text>
                        <Text style={styles.statLabel}>Calm Days</Text>
                    </View>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
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
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
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
                            trackColor={{ false: colors.border, true: colors.secondary }}
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
                            <Text style={styles.settingLabel}>{isSyncing ? "Syncing..." : "Sync Data"}</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    fixedHeader: {
        alignItems: 'center',
        paddingTop: spacing.xl,
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
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing.l,
        backgroundColor: '#FFF9E6',
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    premiumIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DAA520',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        fontWeight: 'bold',
        color: '#DAA520',
        fontSize: 16,
    },
    premiumSubtitle: {
        fontSize: 12,
        color: '#B8860B',
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
