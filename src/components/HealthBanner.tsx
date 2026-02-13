import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_PHRASES } from '../constants';

interface HealthBannerProps {
    status: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY';
    mood?: string;
    onPressAction?: () => void;
}

// Mood-based styling config
const MOOD_CONFIG: Record<string, { icon: string; bg: string; accent: string }> = {
    GREAT: { icon: 'happy-outline', bg: '#E8F5E9', accent: '#81C784' },
    GOOD:  { icon: 'leaf-outline', bg: '#E8EAF6', accent: '#9FA8DA' },
    OKAY:  { icon: 'partly-sunny-outline', bg: '#FFF9C4', accent: '#FFD54F' },
    LOW:   { icon: 'battery-dead-outline', bg: '#FFF3E0', accent: '#FFAB91' },
    PAIN:  { icon: 'medkit-outline', bg: '#FFE5E5', accent: '#FF9AA2' },
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
                    bg: '#FFE5E5',
                    accent: '#FF9AA2'
                };
            case 'LOW_ENERGY':
                return {
                    icon: 'battery-dead-outline',
                    title: 'Low energy detected.',
                    message: 'Focus on small wins. It\u2019s okay to rest.',
                    bg: '#FFF4E6',
                    accent: '#FFDAC1'
                };
            default:
                return {
                    icon: 'sparkles-outline',
                    title: 'You\u2019re doing great!',
                    message: 'Ready to tackle the day? Pace yourself.',
                    bg: '#E8F5E9',
                    accent: '#A5D6A7'
                };
        }
    };

    const config = getConfig();

    return (
        <View style={[styles.container, { backgroundColor: config.bg }]}>
            <View style={[styles.iconContainer, { backgroundColor: config.accent }]}>
                <Ionicons name={config.icon as any} size={24} color="#FFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.message}>{config.message}</Text>
            </View>
            {onPressAction && (
                 <TouchableOpacity style={styles.actionBtn} onPress={onPressAction}>
                     <Ionicons name="options-outline" size={20} color={colors.textLight} />
                 </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderRadius: borderRadius.l,
        marginHorizontal: spacing.l,
        marginBottom: spacing.l,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.bodyBold,
        color: colors.text,
    },
    message: {
        ...typography.caption,
        color: colors.text,
        marginTop: 2,
    },
    actionBtn: {
        padding: spacing.s,
    }
});
