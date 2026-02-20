import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { MyDateTimePicker } from '../components/ui/MyDateTimePicker';


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
    const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(todo.energy_level || 'MEDIUM');
    const [progress, setProgress] = useState(todo.progress || 0);
    const [isCompleted, setIsCompleted] = useState(todo.is_completed || false);
    
    // Restore missing state
    const [dueDate, setDueDate] = useState<Date>(todo.due_date ? new Date(todo.due_date) : new Date());
    
    // Check if time is set (simple heuristic: not 00:00:00)
    const [hasTime, setHasTime] = useState(() => {
        if (!todo.due_date) return false;
        const d = new Date(todo.due_date);
        return d.getHours() !== 0 || d.getMinutes() !== 0;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
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
        if (hasTime && dueDate < now) {
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
                isCompleted: completed,
                dueDate: dueDate.toISOString(),
            });

            // Reschedule notification dynamically based on updated state
            if (completed) {
                // If now completed, no need for notification
                // Note: To be perfect, we should have a `cancelTodoNotification` but rescheduleAll isn't ideal for single edits. 
                // For now, if we have time, we either overwrite the old system schedule or ignore. 
                // We'll just call scheduleTodo, which inherently won't schedule if completed.
            } else if (hasTime) {
                // Mock shaping the object so scheduleTodo can read it properly
                const mockTodo = {
                  ...todo,
                  title,
                  is_completed: completed,
                  due_date: dueDate.toISOString(),
                };
                await NotificationService.scheduleTodo(mockTodo);
            }

            navigation.goBack();
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

            <View style={{flex: 1}}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    
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

                    {/* Progress */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Progress</Text>
                        <View style={styles.progressSection}>
                            <Text style={styles.progressValue}>{progress}%</Text>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                value={progress}
                                onValueChange={(v) => {
                                    const stepped = Math.round(v / 5) * 5;
                                    setProgress(stepped);
                                    if (stepped === 100) setIsCompleted(true);
                                    if (stepped < 100 && isCompleted) setIsCompleted(false);
                                }}
                                minimumValue={0}
                                maximumValue={100}
                                step={5}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.border}
                                thumbTintColor={colors.primary}
                            />
                        </View>
                    </View>

                    {/* Schedule Section */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Schedule</Text>
                        <View style={styles.scheduleRow}>
                            {/* Date Chip */}
                            <TouchableOpacity 
                                style={styles.scheduleChip}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                <Text style={styles.scheduleText}>
                                    {dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            {/* Time Chip */}
                            <TouchableOpacity 
                                style={[styles.scheduleChip, hasTime && styles.activeChip]}
                                onPress={() => setShowTimePicker(true)}
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

                        <CustomDatePicker
                            visible={showDatePicker}
                            initialDate={dueDate}
                            minDate={todayStr}
                            onClose={() => setShowDatePicker(false)}
                            onConfirm={(date) => {
                                const newDate = new Date(date);
                                if (hasTime) {
                                    newDate.setHours(dueDate.getHours(), dueDate.getMinutes());
                                } else {
                                    newDate.setHours(0, 0, 0, 0);
                                }
                                setDueDate(newDate);
                                setShowDatePicker(false);
                            }}
                            title="Set Due Date"
                        />

                        {showTimePicker && (
                            <MyDateTimePicker
                                value={dueDate}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowTimePicker(Platform.OS === 'ios');
                                    if (selectedDate) {
                                        const newDate = new Date(dueDate);
                                        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                                        setDueDate(newDate);
                                        setHasTime(true);
                                    }
                                    if (Platform.OS !== 'ios') {
                                        setShowTimePicker(false);
                                    }
                                }}
                            />
                        )}
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
            </View>
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: borderRadius.s,
        borderWidth: 1,
        borderColor: colors.border,
    },
    undoBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },
    inputGroup: {
        marginBottom: spacing.l,
    },
    label: {
        ...typography.caption,
        marginBottom: spacing.s,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        fontSize: 16,
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
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
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
        paddingVertical: 10,
        paddingHorizontal: 16,
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
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    energyBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    energyText: {
        fontSize: 14,
    },
    footer: {
        padding: spacing.l,
        backgroundColor: colors.background,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        ...shadows.glow,
    },
    saveBtnText: {
        color: colors.buttonPrimaryText,
        fontWeight: 'bold',
        fontSize: 18,
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
        fontWeight: '500',
    }
});
