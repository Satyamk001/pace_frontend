import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, spacing } from '../../theme';

interface PremiumUpsellCardProps {
    onPress: () => void;
}

export const PremiumUpsellCard: React.FC<PremiumUpsellCardProps> = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.premiumCard} onPress={onPress} activeOpacity={0.85}>
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
    );
};

const styles = StyleSheet.create({
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
});
