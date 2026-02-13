import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { AnimatedSlider } from '../components/ui/AnimatedSlider';
import { MyDateTimePicker } from '../components/ui/MyDateTimePicker';
import { toLocalISOString } from '../utils/dateUtils';

export const TaskDetailScreen = ({ route, navigation }: any) => {
    const { todo } = route.params;
    const { getToken } = useAuth();
    const api = createApiService(getToken);

    const [title, setTitle] = useState(todo.title);
    const [description, setDescription] = useState(todo.description || '');
    const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(todo.energy_level || 'MEDIUM');
    const [progress, setProgress] = useState(todo.progress || 0);
    const [isCompleted, setIsCompleted] = useState(todo.is_completed || false);
    const [dueDate, setDueDate] = useState<Date>(todo.due_date ? new Date(todo.due_date) : new Date());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const completed = progress === 100 ? true : isCompleted;
            await api.updateTodoDetails(todo.id, {
                title,
                description,
                energyLevel,
                progress,
                isCompleted: completed,
                dueDate: toLocalISOString(dueDate),
            });
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to update task.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await api.deleteTodo(todo.id);
                            navigation.goBack();
                        } catch (e) {
                            console.error('Delete failed:', e);
                            Alert.alert("Error", "Failed to delete task.");
                        }
                    }
                }
            ]
        );
    };

    const handleMarkNotDone = () => {
        setIsCompleted(false);
        setProgress(0);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Task</Text>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Status badge */}
                {isCompleted && (
                    <View style={styles.statusBanner}>
                        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
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
                        <AnimatedSlider 
                            value={progress}
                            onValueChange={(val: number) => {
                                setProgress(val);
                                if (val === 100) setIsCompleted(true);
                                if (val < 100 && isCompleted) setIsCompleted(false);
                            }}
                            width={260}
                        />
                    </View>
                </View>

                {/* Due Date */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Due Date</Text>
                    <MyDateTimePicker
                        value={dueDate}
                        onChange={(_event: any, selectedDate?: Date) => {
                            if (selectedDate) setDueDate(selectedDate);
                        }}
                        mode="date"
                    />
                </View>

                {/* Energy Level */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Energy Required</Text>
                    <View style={styles.energyRow}>
                        {['LOW', 'MEDIUM', 'HIGH'].map((level) => {
                            const isSelected = energyLevel === level;
                            let bg = colors.surface;
                            let border = colors.border;
                            let text = colors.textLight;
                            let iconName = 'battery-charging-outline';

                            if (level === 'LOW') { 
                                iconName = 'leaf-outline';
                                if(isSelected) { bg = '#E0F0E0'; border = '#4CAF50'; text = '#2E7D32'; }
                            }
                            if (level === 'MEDIUM') { 
                                iconName = 'partly-sunny-outline';
                                if(isSelected) { bg = '#FFF4E6'; border = '#FF9800'; text = '#EF6C00'; }
                            }
                            if (level === 'HIGH') { 
                                iconName = 'flame-outline';
                                if(isSelected) { bg = '#FFE0E0'; border = '#F44336'; text = '#C62828'; }
                            }

                            return (
                                <TouchableOpacity 
                                    key={level}
                                    style={[styles.energyBtn, { backgroundColor: bg, borderColor: border }]}
                                    onPress={() => setEnergyLevel(level as any)}
                                >
                                    <Ionicons name={iconName as any} size={18} color={text} style={{ marginBottom: 4 }} />
                                    <Text style={[styles.energyText, { color: text, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                                        {level === 'LOW' ? 'Light' : level === 'MEDIUM' ? 'Medium' : 'Heavy'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                    <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        marginBottom: spacing.l,
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
        backgroundColor: '#E8F5E9',
        padding: spacing.m,
        borderRadius: borderRadius.m,
        marginBottom: spacing.l,
        gap: spacing.s,
    },
    statusText: {
        flex: 1,
        ...typography.bodyBold,
        color: '#2E7D32',
    },
    undoBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: borderRadius.s,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    undoBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2E7D32',
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
        ...shadows.soft,
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
        ...shadows.soft,
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
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        ...shadows.glow,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    }
});
