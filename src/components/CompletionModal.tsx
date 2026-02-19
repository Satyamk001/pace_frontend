import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert, Platform, Animated, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MyDateTimePicker } from './ui/MyDateTimePicker';
import { CustomDialog } from './ui/CustomDialog';
import { CustomDatePicker } from './ui/CustomDatePicker';
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
    const [showReschedulePanel, setShowReschedulePanel] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState(new Date());
    const [rescheduleHasTime, setRescheduleHasTime] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setProgress(initialProgress === 0 ? 100 : initialProgress);
            setShowReschedulePanel(false);
            setShowDatePicker(false);
            setShowTimePicker(false);
            setRescheduleHasTime(false);
            // Default: tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            setRescheduleDate(tomorrow);
        }
    }, [visible, initialProgress]);



    const handleDelete = () => {
        if (!todo || !onDelete) return;
        setDeleteDialogVisible(true);
    };



    const handleReschedule = () => {
        setShowReschedulePanel(true);
    };

    const handleConfirmReschedule = () => {
        if (!todo || !onReschedule) return;
        onReschedule(todo.id, toLocalISOString(rescheduleDate));
        animateOut(onClose);
    };



    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            // Wait a frame for Modal to mount
            requestAnimationFrame(() => {
                Animated.parallel([
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 90,
                        mass: 1,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    })
                ]).start();
            });
        } else {
            // This block handles external visible=false updates if any
            // unlikely to be hit if we handle all closes via animateOut, but good for safety
             if (!isVisible) return; 
             // logic handled in animateOut mostly
        }
    }, [visible]);

    const animateOut = (callback: () => void) => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: screenHeight,
                useNativeDriver: true,
                damping: 20,
                stiffness: 90,
                overshootClamping: true
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            setIsVisible(false);
            callback();
        });
    };

    const handleClose = () => {
        animateOut(onClose);
    };

    const handleConfirm = () => {
        animateOut(() => onConfirm(progress));
    };

    const confirmDelete = () => {
        if (todo && onDelete) {
            onDelete(todo.id);
            animateOut(onClose);
        }
        setDeleteDialogVisible(false);
    };

    const handleDateConfirm = () => {
        if (!todo || !onReschedule) return;
        onReschedule(todo.id, toLocalISOString(rescheduleDate));
        setShowDatePicker(false);
        animateOut(onClose);
    };

    return (
        <Modal 
            visible={isVisible} 
            transparent 
            animationType="none" 
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            {/* Layer 1: full-screen dim — absoluteFill, pointer events NONE so it never blocks touches */}
            <Animated.View
                pointerEvents="none"
                style={[styles.backdrop, { opacity: fadeAnim }]}
            />

            {/* Layer 2: flex column for layout — dismiss area (flex:1) + sheet */}
            <View style={styles.modalRoot}>
                {/* Tappable area above sheet — dismisses modal */}
                <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={handleClose}
                    activeOpacity={1}
                />

                {/* Sheet slides up from bottom */}
                <Animated.View 
                    style={[
                        styles.container, 
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                <CustomDialog 
                    visible={deleteDialogVisible}
                    title="Delete Task"
                    message="Are you sure you want to delete this task?"
                    actions={[
                        { text: "Cancel", style: "cancel", onPress: () => setDeleteDialogVisible(false) },
                        { text: "Delete", style: "destructive", onPress: confirmDelete }
                    ]}
                />

                    <View style={styles.header}>
                        <Text style={styles.title}>Update Progress</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {title && <Text style={styles.taskTitle} numberOfLines={1}>{title}</Text>}

                    <Text style={styles.question}>How much of this task is done?</Text>
                    
                    <View style={styles.sliderContainer}>
                        <Text style={styles.progressText}>{progress}%</Text>
                        <Slider
                            style={{ width: '100%', height: 48 }}
                            value={progress}
                            onValueChange={(v) => setProgress(Math.round(v / 5) * 5)}
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.primary}
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

                    {/* Reschedule panel — Google Calendar style */}
                    {showReschedulePanel && (
                        <View style={styles.reschedulePanel}>
                            <Text style={styles.reschedulePanelTitle}>Reschedule Task</Text>

                            {/* Date + Time chips in a row */}
                            <View style={styles.rescheduleChips}>
                                {/* Date chip */}
                                <TouchableOpacity
                                    style={styles.rescheduleChip}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                                    <Text style={styles.rescheduleChipText}>
                                        {rescheduleDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Text>
                                </TouchableOpacity>

                                {/* Time chip */}
                                <TouchableOpacity
                                    style={[
                                        styles.rescheduleChip,
                                        rescheduleHasTime && { borderColor: colors.primary, backgroundColor: colors.primary + '12' }
                                    ]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={16} color={rescheduleHasTime ? colors.primary : colors.textLight} />
                                    <Text style={[styles.rescheduleChipText, rescheduleHasTime && { color: colors.primary }]}>
                                        {rescheduleHasTime
                                            ? rescheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : 'All Day'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Clear time */}
                                {rescheduleHasTime && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setRescheduleHasTime(false);
                                            const d = new Date(rescheduleDate);
                                            d.setHours(0, 0, 0, 0);
                                            setRescheduleDate(d);
                                        }}
                                        style={{ padding: 4 }}
                                    >
                                        <Ionicons name="close-circle" size={18} color={colors.textLight} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Confirm/Cancel */}
                            <View style={styles.rescheduleActions}>
                                <TouchableOpacity
                                    style={styles.rescheduleCancelBtn}
                                    onPress={() => setShowReschedulePanel(false)}
                                >
                                    <Text style={styles.rescheduleCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.rescheduleConfirmBtn}
                                    onPress={handleConfirmReschedule}
                                >
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                    <Text style={styles.rescheduleConfirmText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Date picker modal */}
                            <CustomDatePicker
                                visible={showDatePicker}
                                initialDate={rescheduleDate}
                                minDate={(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    return d.toISOString().split('T')[0];
                                })()}
                                onClose={() => setShowDatePicker(false)}
                                onConfirm={(date) => {
                                    const d = new Date(date);
                                    if (rescheduleHasTime) {
                                        d.setHours(rescheduleDate.getHours(), rescheduleDate.getMinutes());
                                    }
                                    setRescheduleDate(d);
                                    setShowDatePicker(false);
                                }}
                                title="Pick Date"
                            />

                            {/* Native time picker */}
                            {showTimePicker && (
                                <MyDateTimePicker
                                    value={rescheduleDate}
                                    mode="time"
                                    is24Hour={false}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowTimePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setRescheduleDate(selectedDate);
                                            setRescheduleHasTime(true);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalRoot: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject, // Covers full screen including behind the sheet
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: colors.l1, // Surface on top of overlay
        borderTopLeftRadius: 32, // More rounded specific to sheet
        borderTopRightRadius: 32,
        padding: spacing.l,
        paddingBottom: 40,
        ...shadows.level3, // Highest elevation
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
        color: colors.buttonPrimaryText,
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
        backgroundColor: colors.accent,
        paddingVertical: 10,
        paddingHorizontal: spacing.l,
        borderRadius: borderRadius.m,
    },
    dateConfirmText: {
        color: colors.buttonPrimaryText,
        fontWeight: 'bold',
    },
    // ── Reschedule panel ──────────────────────────────────────
    reschedulePanel: {
        marginTop: spacing.m,
        padding: spacing.m,
        backgroundColor: colors.background,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.m,
    },
    reschedulePanelTitle: {
        ...typography.bodyBold,
        color: colors.text,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    rescheduleChips: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        flexWrap: 'wrap',
    },
    rescheduleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    rescheduleChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    rescheduleActions: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    rescheduleCancelBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    rescheduleCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textLight,
    },
    rescheduleConfirmBtn: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.m,
        backgroundColor: colors.primary,
    },
    rescheduleConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
