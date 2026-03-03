import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { MyDateTimePicker } from '../components/ui/MyDateTimePicker';
import { AnimatedSlider } from './ui/AnimatedSlider';
import { getLocalDateKey } from '../utils/dateUtils';

interface TaskActionModalProps {
    visible: boolean;
    onClose: () => void;
    todo: any;
    onUpdate: (id: string, updates: any) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}



export const TaskActionModal = ({ visible, onClose, todo, onUpdate, onDelete }: TaskActionModalProps) => {
    const [mode, setMode] = useState<'MENU' | 'EDIT' | 'FEEDBACK'>('MENU');
    const [editTitle, setEditTitle] = useState(todo?.title || '');
    const [editEnergy, setEditEnergy] = useState(todo?.energy_level || 'MEDIUM');
    const [editProgress, setEditProgress] = useState(todo?.progress || 0);
    const [feedback, setFeedback] = useState(todo?.feedback || '');
    const [editDueDate, setEditDueDate] = useState<Date>(new Date());
    
    // Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Tomorrow's date string for minDate restriction
    const tomorrowStr = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    })();

    // Reset state when modal opens/closes or todo changes
    useEffect(() => {
        if (visible && todo) {
            setMode('MENU');
            setEditTitle(todo.title);
            setEditEnergy(todo.energy_level);
            setEditProgress(todo.progress || 0);
            setFeedback(todo.feedback || '');
            if (todo.due_date) {
                setEditDueDate(new Date(todo.due_date));
            } else {
                setEditDueDate(new Date());
            }
        }
    }, [visible, todo]);



// ...

    const handleSaveEdit = async () => {
        await onUpdate(todo.id, { 
            title: editTitle, 
            energyLevel: editEnergy,
            progress: editProgress,
            dueDate: editDueDate.toISOString() 
        });
        setMode('MENU');
        onClose();
    };

    const showMode = (currentMode: 'date' | 'time') => {
        if (currentMode === 'date') setShowDatePicker(true);
        else setShowTimePicker(true);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || editDueDate;
        setShowTimePicker(Platform.OS === 'ios');
        setEditDueDate(currentDate);
    };

    const handleSaveFeedback = async () => {
        await onUpdate(todo.id, { feedback });
        setMode('MENU');
        onClose();
    };

    const handleMoveToTomorrow = async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = getLocalDateKey(tomorrow);
        
        await onUpdate(todo.id, { dueDate: dateStr });
        Alert.alert("Moved", "Task moved to tomorrow.");
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Task",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        await onDelete(todo.id);
                        onClose();
                    }
                }
            ]
        );
    };

    if (!todo) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView 
                    contentContainerStyle={styles.overlay} 
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {mode === 'MENU' ? 'Task Options' : mode === 'EDIT' ? 'Edit Task' : 'Add Note'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {mode === 'MENU' && (
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => setMode('EDIT')}>
                                <Ionicons name="pencil-outline" size={20} color={colors.text} />
                                <Text style={styles.menuText}>Edit Task</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.menuItem} onPress={() => setMode('FEEDBACK')}>
                                <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                                <Text style={styles.menuText}>{todo.feedback ? 'Edit Note' : 'Add Note/Feedback'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={handleMoveToTomorrow}>
                                <Ionicons name="calendar-outline" size={20} color={colors.text} />
                                <Text style={styles.menuText}>Move to Tomorrow</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={20} color={colors.error} />
                                <Text style={[styles.menuText, { color: colors.error }]}>Delete Task</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {mode === 'EDIT' && (
                        <View style={styles.formContainer}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput 
                                style={styles.input} 
                                value={editTitle} 
                                onChangeText={setEditTitle} 
                            />
                            
                            <Text style={styles.label}>Energy Required</Text>
                            <View style={styles.energyRow}>
                                {['LOW', 'MEDIUM', 'HIGH'].map((level) => {
                                    let iconName = 'battery-charging-outline';
                                    if (level === 'LOW') iconName = 'leaf-outline';
                                    if (level === 'MEDIUM') iconName = 'partly-sunny-outline';
                                    if (level === 'HIGH') iconName = 'flame-outline';

                                    return (
                                        <TouchableOpacity 
                                            key={level}
                                            style={[
                                                styles.energyChip, 
                                                editEnergy === level && styles.energyChipActive,
                                                editEnergy === level && { backgroundColor: level === 'HIGH' ? '#FFE0E0' : level === 'LOW' ? '#E0F0E0' : '#F0F0F0' }
                                            ]}
                                            onPress={() => setEditEnergy(level)}
                                        >
                                            <Ionicons 
                                                name={iconName as any} 
                                                size={16} 
                                                color={editEnergy === level ? colors.text : colors.textLight} 
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={[styles.energyText, editEnergy === level && { fontWeight: 'bold' }]}>
                                                {level}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.label}>Progress: {editProgress}%</Text>
                            <AnimatedSlider 
                                value={editProgress} 
                                onValueChange={setEditProgress} 
                            />

                            <Text style={styles.label}>Due Date & Time</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => showMode('date')}>
                                    <Ionicons name="calendar-outline" size={20} color={colors.text} />
                                    <Text style={styles.dateText}>{editDueDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.dateBtn, { borderColor: colors.border }]} // Always allow picking time
                                    onPress={() => showMode('time')}
                                >
                                    <Ionicons name="time-outline" size={20} color={colors.text} />
                                    <Text style={[styles.dateText]}>
                                        {editDueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showTimePicker && (
                                <MyDateTimePicker
                                    value={editDueDate}
                                    mode="time"
                                    is24Hour={true}
                                    onChange={onTimeChange}
                                />
                            )}

                            {/* Custom calendar date picker — future dates only */}
                            <CustomDatePicker
                                visible={showDatePicker}
                                initialDate={editDueDate}
                                minDate={tomorrowStr}
                                title="Reschedule Task"
                                onClose={() => setShowDatePicker(false)}
                                onConfirm={(date) => {
                                    setEditDueDate(prev => {
                                        const updated = new Date(date);
                                        updated.setHours(prev.getHours(), prev.getMinutes());
                                        return updated;
                                    });
                                    setShowDatePicker(false);
                                }}
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.tomorrowBtn} onPress={handleMoveToTomorrow}>
                                <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.text} />
                                <Text style={styles.tomorrowText}>Move to Tomorrow</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {mode === 'FEEDBACK' && (
                        <View style={styles.formContainer}>
                            <Text style={styles.label}>How did this task go?</Text>
                            <TextInput 
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                                value={feedback} 
                                onChangeText={setFeedback}
                                multiline
                                placeholder="E.g., Took longer than expected because of brain fog..."
                            />
                             <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFeedback}>
                                <Text style={styles.saveBtnText}>Save Note</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flexGrow: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: spacing.l
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.l,
        ...shadows.medium
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l
    },
    title: {
        ...typography.subheader,
        color: colors.text
    },
    menuContainer: {
        gap: spacing.s
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.m
    },
    menuText: {
        ...typography.body,
        fontSize: 16
    },
    formContainer: {
        gap: spacing.m
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.background
    },
    energyRow: {
        flexDirection: 'row',
        gap: spacing.m
    },
    energyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface
    },
    energyChipActive: {
        borderColor: colors.primary,
        borderWidth: 2
    },
    energyText: {
        fontSize: 12,
        color: colors.text
    },
    saveBtn: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        marginTop: spacing.m
    },
    saveBtnText: {
        ...typography.subheader,
        color: colors.buttonPrimaryText,
        fontSize: 16
    },
    tomorrowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.m,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
        marginTop: spacing.xs
    },
    tomorrowText: {
        ...typography.body,
        fontWeight: '600'
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border
    },
    dateText: {
        fontSize: 14,
        color: colors.text
    }
});
