import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_PHRASES } from '../constants';

interface HealthBannerProps {
    status: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY';
    mood?: string;
    onPressAction?: () => void;
}

// Mood-based styling config
// Mood-based styling config
const MOOD_CONFIG: Record<string, { icon: string; bg: string; accent: string }> = {
    GREAT: { icon: 'happy-outline', bg: colors.mood.great + '40', accent: colors.mood.great }, // 25% opacity for bg
    GOOD:  { icon: 'leaf-outline', bg: colors.mood.good + '40', accent: colors.mood.good },
    OKAY:  { icon: 'partly-sunny-outline', bg: colors.mood.okay + '40', accent: colors.mood.okay },
    LOW:   { icon: 'battery-dead-outline', bg: colors.mood.low + '40', accent: colors.mood.low },
    PAIN:  { icon: 'medkit-outline', bg: colors.mood.pain + '40', accent: colors.mood.pain },
};

export const HealthBanner = ({ status, mood, onPressAction }: HealthBannerProps) => {
    const getConfig = () => {
        // If mood is selected, use mood-based config + phrases
        if (mood && MOOD_PHRASES[mood] && MOOD_CONFIG[mood]) {
            return {
                icon: MOOD_CONFIG[mood].icon,
                title: MOOD_PHRASES[mood].title,
                message: MOOD_PHRASES[mood].subtitle,
                bg: MOOD_CONFIG[mood].bg,
                accent: MOOD_CONFIG[mood].accent,
            };
        }

        // Fallback to health status config
        switch (status) {
            case 'FLARE_UP':
                return {
                    icon: 'medical-outline',
                    title: 'Take it slow today.',
                    message: 'Your health comes first. Tasks have been adjusted.',
                    bg: colors.error + '25', // Soft red bg
                    accent: colors.error // Red accent
                };
            case 'LOW_ENERGY':
                return {
                    icon: 'battery-dead-outline',
                    title: 'Low energy detected.',
                    message: 'Focus on small wins. It\u2019s okay to rest.',
                    bg: colors.warning + '25', // Soft orange bg
                    accent: colors.warning // Orange accent
                };
            default:
                return {
                    icon: 'sparkles-outline',
                    title: 'You\u2019re doing great!',
                    message: 'Ready to tackle the day? Pace yourself.',
                    bg: colors.success + '25', // Soft green bg
                    accent: colors.success // Green accent
                };
        }
    };

    const config = getConfig();

    return (
        <View style={styles.glassContainer}>
            {/* Background Layer with opacity */}
            <View style={[styles.bgLayer, { backgroundColor: config.bg }]} />
            
            <View style={styles.contentRow}>
                <View style={[styles.iconContainer, { backgroundColor: config.accent }]}>
                    <Ionicons name={config.icon as any} size={22} color="#FFF" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{config.title}</Text>
                    <Text style={styles.message}>{config.message}</Text>
                </View>
                {onPressAction && (
                    <TouchableOpacity style={styles.actionBtn} onPress={onPressAction}>
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    glassContainer: {
        marginHorizontal: spacing.l,
        marginBottom: spacing.m,
        borderRadius: borderRadius.l,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 80,
        justifyContent: 'center'
    },
    bgLayer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6, // Glassy transparency
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 16, // Squircle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
        ...shadows.soft
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.bodyBold,
        fontSize: 15,
        color: colors.text,
    },
    message: {
        ...typography.caption,
        color: colors.textSecondary, // Softer text
        marginTop: 2,
        lineHeight: 18
    },
    actionBtn: {
        padding: spacing.s,
    }
});
