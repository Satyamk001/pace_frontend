import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ScrollView
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {colors, typography, spacing, borderRadius} from '../theme';
import { useTasks } from '../contexts/TasksContext';
import { DateTimeModal } from '../components/DateTimeModal';
import { CustomDialog } from '../components/ui/CustomDialog';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { BackButton } from '../components/ui/BackButton';
import { EnergySelector } from '../components/EnergySelector';
import { KeyboardAwareLayout } from '../components/ui/KeyboardAwareLayout';

export const AddTaskScreen = ({ navigation, route }: any) => {
    const { getToken } = useAuth();
    const { addTask } = useTasks();
    const insets = useSafeAreaInsets();

    const [title, setTitle] = useState('');
    const [feedback, setFeedback] = useState('');
    const [energy, setEnergy] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    // Date/Time State
    const initialDate = route.params?.initialDate ? new Date(route.params.initialDate) : new Date();
    const [dueDate, setDueDate] = useState(initialDate);
    const [hasTime, setHasTime] = useState(false);
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [repeatType, setRepeatType] = useState<string>('NONE');

    const handleTimePress = () => {
        setShowDateTimePicker(true);
    };

    const handleClearTime = () => {
        setHasTime(false);
        const d = new Date(dueDate);
        d.setHours(0, 0, 0, 0);
        setDueDate(d);
    };

    const handleCreate = () => {
        if (!title.trim()) return;
        addTask(title, energy, dueDate, feedback.trim() || undefined, repeatType);
        navigation.goBack();
    };

    return (
        <ScreenLayout edges={['top']}>
            <CustomDialog
                visible={dialogVisible}
                title="Error"
                message="Failed to create task. Please try again."
                onClose={() => setDialogVisible(false)}
            />

            <KeyboardAwareLayout style={styles.flex}>
                <View style={styles.contentContainer}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Section */}
                        <View style={styles.header}>
                            <BackButton />
                            <Text style={styles.headerTitle}>New Task</Text>
                            <View style={styles.headerSpacer} />
                        </View>

                        {/* Hero Title Input */}
                        <TextInput
                            style={styles.heroInput}
                            placeholder="What's on your mind?"
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                            placeholderTextColor={colors.textLight}
                            multiline
                        />

                        {/* Energy Level Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Energy Level</Text>
                            <EnergySelector value={energy} onChange={setEnergy} />
                        </View>

                        {/* Schedule Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Schedule</Text>
                            <View style={styles.pillRow}>
                                <TouchableOpacity style={styles.datePill} onPress={() => setShowDateTimePicker(true)} activeOpacity={0.7}>
                                    <Ionicons name="calendar-clear-outline" size={18} color={colors.textPrimary} />
                                    <Text style={styles.datePillText}>
                                        {dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.datePill, hasTime && styles.datePillActive]}
                                    onPress={handleTimePress}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time-outline" size={18} color={hasTime ? colors.primary : colors.textPrimary} />
                                    <Text style={[styles.datePillText, hasTime && styles.datePillTextActive]}>
                                        {hasTime
                                            ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : 'All Day'}
                                    </Text>
                                    {hasTime && (
                                        <TouchableOpacity onPress={handleClearTime} style={styles.clearIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Ionicons name="close-circle" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Notes Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Notes</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Any additional details or context?"
                                value={feedback}
                                onChangeText={setFeedback}
                                placeholderTextColor={colors.textLight}
                                multiline
                            />
                        </View>

                    </ScrollView>

                    {/* Sticky Footer Button */}
                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.l) }]}>
                        <TouchableOpacity
                            style={[styles.primaryBtn, (!title.trim() || loading) && styles.disabledBtn]}
                            onPress={handleCreate}
                            disabled={!title.trim() || loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.buttonPrimaryText} />
                            ) : (
                                <Text style={styles.primaryBtnText}>Add Gently</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareLayout>

            {/* Pickers */}
            <DateTimeModal
                visible={showDateTimePicker}
                onClose={() => setShowDateTimePicker(false)}
                initialDate={dueDate}
                initialRepeatType={repeatType}
                onSave={(date, rType) => {
                    setDueDate(date);
                    setRepeatType(rType);
                    setHasTime(true);
                }}
            />
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    scrollContent: {
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.xxl * 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    headerTitle: {
        ...typography.subheader,
        color: colors.text,
    },
    headerSpacer: {
        width: 40,
    },

    // Hero Input
    heroInput: {
        ...typography.h2,
        color: colors.text,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: spacing.l,
    },

    // Card System
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.s,
    },

    // Pills
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    datePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.m,
        borderRadius: borderRadius.round,
        backgroundColor: colors.surfaceSoft,
        borderWidth: 1,
        borderColor: colors.border,
    },
    datePillActive: {
        backgroundColor: colors.accentSoft,
        borderColor: colors.primary,
    },
    datePillText: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    datePillTextActive: {
        color: colors.primary,
    },
    clearIcon: {
        marginLeft: spacing.xs,
    },

    // Input Field
    input: {
        ...typography.body,
        backgroundColor: colors.inputBackground,
        padding: spacing.m,
        borderRadius: borderRadius.s,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 100,
        textAlignVertical: 'top',
        color: colors.textPrimary,
    },

    // Footer & Buttons
    footer: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m,
        borderRadius: borderRadius.l,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        ...typography.button,
    },
    disabledBtn: {
        backgroundColor: colors.buttonDisabledBg,
    }
});