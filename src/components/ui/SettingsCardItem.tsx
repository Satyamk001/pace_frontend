import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, spacing } from '../../theme';

interface SettingsCardItemProps {
    icon: any;
    label: string;
    sub?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    iconColor?: string;
    labelColor?: string;
}

export const SettingsCardItem: React.FC<SettingsCardItemProps> = ({
    icon, label, sub, right, onPress, disabled, iconColor, labelColor,
}) => {
    const tint = iconColor || colors.accentDark;
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            disabled={disabled || !onPress}
            activeOpacity={onPress ? 0.75 : 1}
        >
            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: tint + '18' }]}>
                <Ionicons name={icon} size={22} color={tint} />
            </View>

            {/* Text block */}
            <View style={styles.textCol}>
                <Text style={[styles.label, labelColor ? { color: labelColor } : null]}>{label}</Text>
                {sub ? <Text style={styles.sub}>{sub}</Text> : null}
            </View>

            {/* Right slot: custom node OR default chevron arrow */}
            {right ? (
                <View style={styles.rightSlot}>{right}</View>
            ) : onPress ? (
                <View style={[styles.arrowBubble, { backgroundColor: tint + '12' }]}>
                    <Ionicons name="chevron-forward" size={14} color={tint} />
                </View>
            ) : null}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border + '60',
        ...shadows.soft,
        gap: spacing.m,
        marginBottom: spacing.s,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    textCol: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    sub: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '400',
    },
    rightSlot: {
        flexShrink: 0,
    },
    arrowBubble: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});
