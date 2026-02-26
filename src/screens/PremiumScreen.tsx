import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { createApiService } from '../services/api';

import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';

export const PremiumScreen = ({ navigation }: any) => {
    const { getToken } = useAuth();
    const api = createApiService(getToken);
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // 1. Create Order
            const order = await api.createOrder(9900); // ₹99
            console.log('Order created:', order);

            // 2. Simulate Razorpay Payment (Since we are in Expo Go)
            // In a real app, we would open Razorpay Checkout here.
            Alert.alert(
                "Mock Payment",
                "Proceed with mock payment?",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => setLoading(false)
                    },
                    {
                        text: "Pay ₹99",
                        onPress: async () => {
                            try {
                                // 3. Verify Payment (Mock simulation)
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
        <ScreenLayout edges={['top']}>
            <View style={{flex: 1}}>
                <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.header}>
                        <View style={{ position: 'absolute', left: 20, top: spacing.m, zIndex: 10 }}>
                             <BackButton />
                        </View>
                        <Text style={styles.title}>Upgrade to Pro</Text>
                        <Text style={styles.subtitle}>Unlock the full potential of your pace.</Text>
                    </View>
    
                    <View style={styles.card}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.price}>99</Text>
                            <Text style={styles.period}>/month</Text>
                        </View>
                        <View style={styles.divider} />
                        
                        <View style={styles.features}>
                            <FeatureRow text="Unlimited History (vs 7 days)" />
                            <FeatureRow text="Advanced Health Charts" />
                            <FeatureRow text="Calendar Insights" />
                            <FeatureRow text="Support Independent Development ❤️" />
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
                    <TouchableOpacity 
                        style={styles.subscribeBtn} 
                        onPress={handleSubscribe} 
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.subscribeText}>Subscribe Now</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.disclaimer}>Cancel anytime. Secure payment via Razorpay.</Text>
                </View>
            </View>
        </ScreenLayout>
    );
};

const FeatureRow = ({ text }: { text: string }) => (
    <View style={styles.featureRow}>
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background handled by ScreenLayout
    },
    header: {
        padding: spacing.xl,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    title: {
        ...typography.header,
        color: colors.primary,
        fontSize: 32,
        marginBottom: spacing.s,
    },
    subtitle: {
        ...typography.body,
        color: colors.textLight,
        textAlign: 'center',
    },
    card: {
        margin: spacing.l,
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        ...shadows.medium,
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing.l,
    },
    currency: {
        ...typography.subheader,
        fontSize: 24,
        color: colors.text,
        marginRight: 4,
    },
    price: {
        ...typography.header,
        fontSize: 48,
        color: colors.primary,
    },
    period: {
        ...typography.body,
        color: colors.textLight,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: colors.border,
        marginBottom: spacing.l,
    },
    features: {
        width: '100%',
        gap: spacing.m,
        marginBottom: spacing.xl,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    featureText: {
        ...typography.body,
        fontSize: 16,
    },
    subscribeBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    subscribeText: {
        ...typography.subheader,
        color: colors.buttonPrimaryText,
        fontSize: 18,
    },
    disclaimer: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
    },
    footer: {
        padding: spacing.l,
        backgroundColor: colors.background,
    }
});
