import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { createApiService } from '../services/api';

import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { NeonBackground } from '../components/ui/NeonBackground';
import { LinearGradient } from 'expo-linear-gradient';

export const PremiumScreen = ({ navigation }: any) => {
    const { getToken } = useAuth();
    const api = createApiService(getToken);
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const order = await api.createOrder(9900); // ₹99
            
            Alert.alert(
                "Mock Payment",
                "Proceed with mock payment?",
                [
                    { text: "Cancel", style: "cancel", onPress: () => setLoading(false) },
                    {
                        text: "Pay ₹99",
                        onPress: async () => {
                            try {
                                await api.verifyPayment({
                                    razorpay_order_id: order.id,
                                    razorpay_payment_id: 'pay_mock_' + Date.now(),
                                    razorpay_signature: 'mock_signature'
                                });
                                Alert.alert("Success", "Welcome to PACE Pro!");
                                navigation.goBack();
                            } catch (verifyError) {
                                console.error(verifyError);
                                Alert.alert("Error", "Payment verification failed");
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to initiate subscription");
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <ScreenLayout edges={['top']} useGradient={false}>
            <NeonBackground />
            
            <View style={styles.container}>
                <View style={styles.navBar}>
                    <BackButton />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={styles.proBadge}>
                            <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                        <Text style={styles.title}>Elevate Your PACE</Text>
                        <Text style={styles.subtitle}>Transform your health journey with advanced insights and unlimited tracking.</Text>
                    </View>

                    <View style={styles.cardContainer}>
                        <LinearGradient
                            colors={[colors.surface + 'CC', colors.surface + '88']}
                            style={styles.card}
                        >
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>Monthly Access</Text>
                                <View style={styles.bestValueBadge}>
                                    <Text style={styles.bestValueText}>POPULAR</Text>
                                </View>
                            </View>

                            <View style={styles.priceContainer}>
                                <Text style={styles.currency}>₹</Text>
                                <Text style={styles.price}>99</Text>
                                <Text style={styles.period}>/month</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.features}>
                                <FeatureRow text="Unlimited History Tracking" />
                                <FeatureRow text="Advanced Bio-metric Charts" />
                                <FeatureRow text="Daily Health Insights" />
                                <FeatureRow text="Personalized Mascot Energy" />
                                <FeatureRow text="Early Access to Features" />
                            </View>
                        </LinearGradient>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
                    <TouchableOpacity 
                        onPress={handleSubscribe} 
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.subscribeBtn}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.subscribeText}>Upgrade Now</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.disclaimer}>Cancel anytime. Secure checkout via Razorpay.</Text>
                </View>
            </View>
        </ScreenLayout>
    );
};

const FeatureRow = ({ text }: { text: string }) => (
    <View style={styles.featureRow}>
        <View style={styles.checkIndicator}>
            <Ionicons name="checkmark" size={12} color={colors.surface} />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navBar: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        height: 60,
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: spacing.l,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginTop: spacing.m,
        marginBottom: spacing.xl,
    },
    proBadge: {
        backgroundColor: colors.accent + '20',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.accent + '40',
    },
    proBadgeText: {
        ...typography.caption,
        color: colors.accent,
        fontWeight: '900',
        letterSpacing: 2,
    },
    title: {
        ...typography.h1,
        fontSize: 32,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.s,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.l,
        lineHeight: 22,
    },
    cardContainer: {
        ...Platform.select({
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.1,
                shadowRadius: 30,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    card: {
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border + '30',
        overflow: 'hidden',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    planName: {
        ...typography.bodyBold,
        color: colors.textSecondary,
        letterSpacing: 1,
    },
    bestValueBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.s,
    },
    bestValueText: {
        ...typography.caption,
        fontSize: 10,
        color: colors.surface,
        fontWeight: '900',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing.l,
    },
    currency: {
        ...typography.h2,
        color: colors.text,
        fontSize: 24,
        marginRight: 2,
    },
    price: {
        ...typography.h1,
        fontSize: 56,
        color: colors.primary,
        fontWeight: '900',
    },
    period: {
        ...typography.body,
        color: colors.textLight,
        marginLeft: spacing.xs,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: colors.border + '20',
        marginBottom: spacing.l,
    },
    features: {
        gap: spacing.m,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    checkIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        ...typography.body,
        color: colors.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        backgroundColor: colors.background + 'F0',
        borderTopWidth: 1,
        borderTopColor: colors.border + '10',
    },
    subscribeBtn: {
        width: '100%',
        height: 56,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.s,
    },
    subscribeText: {
        ...typography.button,
        color: colors.surface,
        fontSize: 18,
        fontWeight: '700',
    },
    disclaimer: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
});
