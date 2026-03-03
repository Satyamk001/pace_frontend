import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import {colors, typography, spacing, borderRadius} from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { DateTimeModal } from '../components/DateTimeModal';


import { CustomDialog } from '../components/ui/CustomDialog';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { EnergySelector } from '../components/EnergySelector';
import { NotificationService } from '../services/NotificationService';


export const TaskDetailScreen = ({ route, navigation }: any) => {
    const { todo } = route.params;
    const { getToken } = useAuth();
    const api = createApiService(getToken);
    const insets = useSafeAreaInsets();

    const [title, setTitle] = useState(todo.title);
    const [description, setDescription] = useState(todo.description || '');
    const [feedback, setFeedback] = useState(todo.feedback || '');
    const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(todo.energy_level || 'MEDIUM');
    const [progress, setProgress] = useState(todo.progress || 0);
    const [isCompleted, setIsCompleted] = useState(todo.is_completed || false);
    const [barWidth, setBarWidth] = useState(1); // Default to 1 to avoid div by zero
    
    // Restore missing state
    const [dueDate, setDueDate] = useState<Date>(todo.due_date ? new Date(todo.due_date) : new Date());
    
    // Check if time is set (simple heuristic: not 00:00:00)
    const [hasTime, setHasTime] = useState(() => {
        if (!todo.due_date) return false;
        const d = new Date(todo.due_date);
        return d.getHours() !== 0 || d.getMinutes() !== 0;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [repeatType, setRepeatType] = useState<string>(todo.repeat_type || 'NONE');
    const todayStr = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();

    const [dialogConfig, setDialogConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        actions?: any[];
    }>({ visible: false, title: '' });

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, visible: false }));

    const handleSave = async () => {
        const now = new Date();
        const initialDate = todo.due_date ? new Date(todo.due_date) : new Date(0);
        const isTimeChanged = dueDate.getTime() !== initialDate.getTime();

        if (hasTime && dueDate < now && isTimeChanged) {
            setDialogConfig({
                visible: true,
                title: "Invalid Time",
                message: "Please select a time in the future.",
                actions: [{ text: "OK", onPress: closeDialog }]
            });
            return;
        }

        setIsSaving(true);
        try {
            const completed = progress === 100 ? true : isCompleted;
            const updatedTodo = await api.updateTodoDetails(todo.id, {
                title,
                description,
                energyLevel,
                progress,
                feedback,
                isCompleted: completed,
                dueDate: dueDate.toISOString(),
                repeatType,
            });

            // FIX Bug 3: cancel stale notification when task is completed
            if (completed) {
                await NotificationService.cancelTodo(todo.id);
            } else if (hasTime) {
                // FIX Bug 2: include repeat_type from current state (not stale todo prop)
                const mockTodo = {
                  ...todo,
                  title,
                  is_completed: completed,
                  due_date: dueDate.toISOString(),
                  repeat_type: repeatType,
                };
                await NotificationService.scheduleTodo(mockTodo);
            }

            // Return to previous screen but merge params if it's Calendar so it snaps to the newly saved date
            navigation.navigate('MainTabs', {
                screen: 'Calendar',
                params: { updatedTaskDate: dueDate.toISOString() },
            });
        } catch (e) {
            console.error(e);
            setDialogConfig({
                visible: true,
                title: "Error",
                message: "Failed to update task.",
                actions: [{ text: "OK", onPress: closeDialog }]
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        setDialogConfig({
            visible: true,
            title: "Delete Task",
            message: "Are you sure you want to delete this task?",
            actions: [
                { text: "Cancel", style: "cancel", onPress: closeDialog },
                { text: "Delete", style: "destructive", onPress: confirmDelete }
            ]
        });
    };

    const confirmDelete = async () => {
        closeDialog();
        try {
            await api.deleteTodo(todo.id);
            navigation.goBack();
        } catch (e) {
            console.error('Delete failed:', e);
            setDialogConfig({
                visible: true,
                title: "Error",
                message: "Failed to delete task.",
                actions: [{ text: "OK", onPress: closeDialog }]
            });
        }
    };

    const handleMarkNotDone = () => {
        setIsCompleted(false);
        setProgress(0);
    };

    return (
        <ScreenLayout edges={['top']}>
            <CustomDialog 
                visible={dialogConfig.visible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                actions={dialogConfig.actions}
                onClose={closeDialog}
            />
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>Edit Task</Text>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
                <ScrollView 
                    contentContainerStyle={styles.content} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled" 
                >
                    
                    {/* Status badge */}
                    {isCompleted && (
                        <View style={styles.statusBanner}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                            <Text style={styles.statusText}>Task Completed</Text>
                            <TouchableOpacity style={styles.undoBtn} onPress={handleMarkNotDone}>
                                <Text style={styles.undoBtnText}>Mark Not Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Title */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Task Title</Text>
                        <TextInput 
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="What needs to be done?"
                            placeholderTextColor={colors.textLight}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add details..."
                            placeholderTextColor={colors.textLight}
                            multiline
                        />
                    </View>

                    {/* Notes / Feedback */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]}
                            value={feedback}
                            onChangeText={setFeedback}
                            placeholder="Any context or feedback?"
                            placeholderTextColor={colors.textLight}
                            multiline
                        />
                    </View>

                    {/* Progress */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Progress</Text>
                        <View style={styles.progressSection}>
                            <Text style={[styles.progressValue, { color: (() => {
                                if (progress < 20) return colors.mood.pain;
                                if (progress < 40) return colors.mood.low;
                                if (progress < 60) return colors.mood.okay;
                                if (progress < 80) return colors.mood.good;
                                return colors.mood.great;
                            })() }]}>{progress}%</Text>
                            
                            <PanGestureHandler
                                onGestureEvent={(e) => {
                                    const x = e.nativeEvent.x;
                                    let newProg = Math.round((x / barWidth) * 100);
                                    newProg = Math.max(0, Math.min(100, newProg));
                                    newProg = Math.round(newProg / 5) * 5; // Step by 5
                                    
                                    if (newProg !== progress) {
                                        setProgress(newProg);
                                        if (newProg === 100) setIsCompleted(true);
                                        if (newProg < 100 && isCompleted) setIsCompleted(false);
                                    }
                                }}
                            >
                                <View 
                                    style={styles.customSliderTrack}
                                    onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
                                >
                                    <View 
                                        style={[
                                            styles.customSliderFill, 
                                            { 
                                                width: `${progress}%`,
                                                backgroundColor: (() => {
                                                    if (progress < 20) return colors.mood.pain;
                                                    if (progress < 40) return colors.mood.low;
                                                    if (progress < 60) return colors.mood.okay;
                                                    if (progress < 80) return colors.mood.good;
                                                    return colors.mood.great;
                                                })()
                                            }
                                        ]} 
                                    />
                                    {/* Thumb */}
                                    <View style={[styles.customSliderThumb, { left: `${progress}%` }]} />
                                </View>
                            </PanGestureHandler>
                        </View>
                    </View>

                    {/* Schedule Section */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Schedule</Text>
                        <View style={styles.scheduleRow}>
                            <TouchableOpacity 
                                style={styles.scheduleChip}
                                onPress={() => setShowDateTimePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                <Text style={styles.scheduleText}>
                                    {dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.scheduleChip, hasTime && styles.activeChip]}
                                onPress={() => setShowDateTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={18} color={hasTime ? colors.primary : colors.textLight} />
                                <Text style={[styles.scheduleText, hasTime && { color: colors.primary }]}>
                                    {hasTime 
                                        ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                        : 'All Day'}
                                </Text>
                            </TouchableOpacity>
                            
                            {/* Clear Time */}
                            {hasTime && (
                                <TouchableOpacity onPress={() => {
                                    const d = new Date(dueDate);
                                    d.setHours(0, 0, 0, 0);
                                    setDueDate(d);
                                    setHasTime(false);
                                }}>
                                    <Ionicons name="close-circle" size={20} color={colors.textLight} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <DateTimeModal 
                            visible={showDateTimePicker}
                            onClose={() => setShowDateTimePicker(false)}
                            initialDate={dueDate}
                            initialRepeatType={repeatType}
                            onSave={(date, rType) => {
                                setDueDate(date);
                                setRepeatType(rType);
                                
                                // check if time is explicitly set to 00:00 (which we treat as no-time if derived from DatePicker)
                                // We'll simplify and say if user used the modal, time *is* set unless they clear it manually
                                setHasTime(true);
                            }}
                        />
                    </View>





                    {/* Energy Level */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Energy Required</Text>
                        <EnergySelector value={energyLevel} onChange={setEnergyLevel} />
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                        <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background and padding handled by ScreenLayout
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        marginBottom: spacing.l,
        paddingTop: spacing.m,
    },
    headerTitle: {
        ...typography.subheader,
        color: colors.text,
    },
    content: {
        paddingHorizontal: spacing.l,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accentSoft,
        padding: spacing.m,
        borderRadius: borderRadius.m,
        marginBottom: spacing.l,
        gap: spacing.s,
    },
    statusText: {
        flex: 1,
        ...typography.bodyBold,
        color: colors.primary,
    },
    undoBtn: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.s,
        paddingVertical: 6,
        borderRadius: borderRadius.s,
        borderWidth: 1,
        borderColor: colors.border,
    },
    undoBtnText: {
        ...typography.caption,

        color: colors.primary,
    },
    inputGroup: {
        marginBottom: spacing.l,
    },
    label: {
        ...typography.caption,
        marginBottom: spacing.s,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        ...typography.body,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    progressSection: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        padding: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.m,
    },
    progressValue: {
        ...typography.h1,

    },
    customSliderTrack: {
        width: '100%',
        height: 12,
        backgroundColor: colors.border + '60',
        borderRadius: borderRadius.s,
        justifyContent: 'center',
        marginVertical: spacing.md,
    },
    customSliderFill: {
        height: '100%',
        borderRadius: borderRadius.s,
    },
    customSliderThumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: borderRadius.m,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.textPrimary,
        marginLeft: -12, // Offset to center thumb on the value
    },
    energyRow: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    // Schedule Styles
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        flexWrap: 'wrap',
    },
    scheduleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeChip: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10', // 6% tint
    },
    scheduleText: {
        ...typography.body,

        color: colors.text,
    },
    energyBtn: {
        flex: 1,
        paddingVertical: spacing.s,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    energyText: {
        ...typography.body,
    },
    footer: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    saveBtnText: {
        ...typography.subheader,
    color: colors.buttonPrimaryText,
        
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.m,
        gap: spacing.m,
    },
    dateText: {
        ...typography.body,
        color: colors.text,
    }
});
