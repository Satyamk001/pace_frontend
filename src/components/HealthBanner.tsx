import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {colors, spacing, borderRadius, typography, moderateScale} from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_PHRASES } from '../constants';

interface HealthBannerProps {
    status: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY';
    mood?: string;
    onPressAction?: () => void;
}

// Mood-based styling config
const MOOD_CONFIG: Record<string, { icon: string; bg: string; accent: string }> = {
    GREAT: { icon: 'happy-outline', bg: colors.mood.moderate + '40', accent: colors.mood.moderate }, // 25% opacity for bg
    GOOD:  { icon: 'leaf-outline', bg: colors.mood.elevated + '40', accent: colors.mood.elevated },
    OKAY:  { icon: 'partly-sunny-outline', bg: colors.mood.moderate + '40', accent: colors.mood.moderate },
    LOW:   { icon: 'battery-dead-outline', bg: colors.mood.elevated + '40', accent: colors.mood.elevated },
    PAIN:  { icon: 'medkit-outline', bg: colors.mood.severe + '40', accent: colors.mood.severe },
};

// Creative Focus Pills Mapping
const FOCUS_PILLS: Record<string, string[]> = {
    GREAT: ['Deep Work', 'HIIT', 'Socialize'],
    GOOD: ['Productivity', 'Walk', 'Connect'],
    OKAY: ['Pace', 'Stretch', 'Listen'],
    LOW: ['Self-Care', 'Hydrate', 'Soft Music'],
    PAIN: ['Rest', 'Meditation', 'Cozy Up'],
    FLARE_UP: ['Absolute Rest', 'Pace', 'Heat Pad'],
    LOW_ENERGY: ['Focus Small', 'Snack', 'Breathe'],
    NORMAL: ['Daily Goals', 'Stay Steady', 'Move'],
};

export const HealthBanner = ({ status, mood, onPressAction }: HealthBannerProps) => {
    const getConfig = () => {
        // If mood is selected, use mood-based config + phrases
        if (mood && MOOD_PHRASES[mood] && MOOD_CONFIG[mood]) {
            return {
                id: mood,
                icon: MOOD_CONFIG[mood].icon,
                title: MOOD_PHRASES[mood].title,
                bg: MOOD_CONFIG[mood].bg,
                accent: MOOD_CONFIG[mood].accent,
            };
        }

        // Fallback to health status config
        switch (status) {
            case 'FLARE_UP':
                return {
                    id: 'FLARE_UP',
                    icon: 'medical-outline',
                    title: 'Take it slow today.',
                    bg: colors.error + '25', // Soft red bg
                    accent: colors.error // Red accent
                };
            case 'LOW_ENERGY':
                return {
                    id: 'LOW_ENERGY',
                    icon: 'battery-dead-outline',
                    title: 'Low energy detected.',
                    bg: colors.warning + '25', // Soft orange bg
                    accent: colors.warning // Orange accent
                };
            default:
                return {
                    id: 'NORMAL',
                    icon: 'sparkles-outline',
                    title: 'You\u2019re doing great!',
                    bg: colors.success + '25', // Soft green bg
                    accent: colors.success // Green accent
                };
        }
    };

    const config = getConfig();
    const pills = FOCUS_PILLS[config.id] || FOCUS_PILLS.NORMAL;

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
                    <View style={styles.pillContainer}>
                        {pills.map((pill, idx) => (
                            <View key={idx} style={[styles.pill, { borderColor: config.accent + '30' }]}>
                                <Text style={[styles.pillText, { color: config.accent }]}>{pill}</Text>
                            </View>
                        ))}
                    </View>
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
        height: 94,
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
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.bodyBold,
        fontSize: moderateScale(15),
        color: colors.text,
        marginBottom: 4,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: colors.surface + '80',
    },
    pillText: {
        ...typography.caption,
        fontSize: moderateScale(10),
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionBtn: {
        padding: spacing.s,
    }
});
