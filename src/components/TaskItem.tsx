import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
    title: string;
    isCompleted: boolean;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    progress?: number;
    onToggle: () => void;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const TaskItem = ({ title, isCompleted, energyLevel, progress = 0, onToggle, onPress, onLongPress }: TaskItemProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(opacityAnim, {
            toValue: isCompleted ? 0.6 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isCompleted]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getEnergyColor = () => {
        switch (energyLevel) {
            case 'HIGH': return '#FFE0E0';
            case 'LOW': return '#E0F0E0';
            default: return '#F0F0F0';
        }
    };

    return (
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
                style={styles.container} 
                onPress={onPress || onToggle}
                onLongPress={onLongPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                {/* Checkbox */}
                <TouchableOpacity onPress={onToggle} style={styles.checkbox} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Ionicons 
                        name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                        size={26} 
                        color={isCompleted ? colors.secondary : colors.textLight} 
                    />
                </TouchableOpacity>

                {/* Task Info */}
                <View style={styles.taskInfo}>
                    <Text style={[
                        styles.title, 
                        isCompleted && styles.completedTitle
                    ]} numberOfLines={1}>
                        {title}
                    </Text>
                    
                    {/* Progress bar */}
                    {progress > 0 && progress < 100 && (
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                    )}
                </View>

                {/* Energy Tag */}
                <View style={[styles.energyBadge, { backgroundColor: getEnergyColor() }]}>
                    <Text style={styles.energyText}>
                        {energyLevel === 'LOW' ? '🌿' : energyLevel === 'HIGH' ? '🔥' : '⚡'}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.m,
        marginBottom: spacing.s,
        borderRadius: borderRadius.m,
        ...shadows.soft,
    },
    checkbox: {
        marginRight: spacing.m,
    },
    taskInfo: {
        flex: 1,
    },
    title: {
        ...typography.body,
        color: colors.text,
    },
    completedTitle: {
        textDecorationLine: 'line-through',
        color: colors.textLight,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginTop: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.secondary,
        borderRadius: 2,
    },
    energyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: spacing.s,
    },
    energyText: {
        fontSize: 14,
    }
});
