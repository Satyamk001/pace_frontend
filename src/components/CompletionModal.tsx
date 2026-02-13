import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { AnimatedSlider } from './ui/AnimatedSlider';
import { Ionicons } from '@expo/vector-icons';
import { MyDateTimePicker } from './ui/MyDateTimePicker';
import { toLocalISOString } from '../utils/dateUtils';

interface CompletionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (progress: number) => void;
    onDelete?: (id: string) => void;
    onReschedule?: (id: string, newDate: string) => void;
    todo?: any;
    initialProgress?: number;
    title?: string;
}

export const CompletionModal = ({ 
    visible, onClose, onConfirm, onDelete, onReschedule,
    todo, initialProgress = 0, title 
}: CompletionModalProps) => {
    const [progress, setProgress] = useState(initialProgress);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState(new Date());

    useEffect(() => {
        if (visible) {
            setProgress(initialProgress === 0 ? 100 : initialProgress);
            setShowDatePicker(false);
            // Set default reschedule to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setRescheduleDate(tomorrow);
        }
    }, [visible, initialProgress]);

    const handleConfirm = () => {
        onConfirm(progress);
        onClose();
    };

    const handleDelete = () => {
        if (!todo || !onDelete) return;
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                        onDelete(todo.id);
                        onClose();
                    }
                }
            ]
        );
    };

    const handleReschedule = () => {
        setShowDatePicker(true);
    };

    const handleDateConfirm = () => {
        if (!todo || !onReschedule) return;
        onReschedule(todo.id, toLocalISOString(rescheduleDate));
        setShowDatePicker(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Update Progress</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {title && <Text style={styles.taskTitle} numberOfLines={1}>{title}</Text>}

                    <Text style={styles.question}>How much of this task is done?</Text>
                    
                    <View style={styles.sliderContainer}>
                        <Text style={styles.progressText}>{progress}%</Text>
                        <AnimatedSlider 
                            value={progress} 
                            onValueChange={setProgress} 
                            width={280}
                        />
                    </View>

                    {/* Main action */}
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleConfirm}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.btnTextPrimary}>Update Progress</Text>
                    </TouchableOpacity>

                    {/* Secondary actions row */}
                    <View style={styles.secondaryActions}>
                        {onReschedule && (
                            <TouchableOpacity style={styles.btnSecondary} onPress={handleReschedule}>
                                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                <Text style={styles.btnTextSecondary}>Reschedule</Text>
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity style={styles.btnDanger} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={18} color={colors.error} />
                                <Text style={styles.btnTextDanger}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Date picker for reschedule */}
                    {showDatePicker && (
                        <View style={styles.datePickerSection}>
                            <Text style={styles.dateLabel}>Pick new date:</Text>
                            <MyDateTimePicker
                                value={rescheduleDate}
                                onChange={(_event: any, selectedDate?: Date) => {
                                    if (selectedDate) setRescheduleDate(selectedDate);
                                }}
                                mode="date"
                            />
                            <TouchableOpacity style={styles.dateConfirmBtn} onPress={handleDateConfirm}>
                                <Text style={styles.dateConfirmText}>Confirm Reschedule</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.l,
        paddingBottom: 40,
        ...shadows.medium
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m
    },
    title: {
        ...typography.subheader,
        color: colors.text
    },
    taskTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.m
    },
    question: {
        ...typography.body,
        color: colors.text,
        marginBottom: spacing.l
    },
    sliderContainer: {
        alignItems: 'center',
        gap: spacing.m,
        marginBottom: spacing.l
    },
    progressText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary
    },
    btnPrimary: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
        marginBottom: spacing.m,
    },
    btnTextPrimary: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    btnSecondary: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.background,
        padding: spacing.m,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnTextSecondary: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    btnDanger: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFF5F5',
        padding: spacing.m,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
        borderWidth: 1,
        borderColor: '#FFD5D5',
    },
    btnTextDanger: {
        color: colors.error,
        fontWeight: '600',
        fontSize: 14,
    },
    datePickerSection: {
        marginTop: spacing.m,
        padding: spacing.m,
        backgroundColor: colors.background,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        gap: spacing.m,
    },
    dateLabel: {
        ...typography.bodyBold,
        color: colors.text,
    },
    dateConfirmBtn: {
        backgroundColor: colors.secondary,
        paddingVertical: 10,
        paddingHorizontal: spacing.l,
        borderRadius: borderRadius.m,
    },
    dateConfirmText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});
