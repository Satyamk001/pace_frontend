import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, KeyboardAvoidingView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';

import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomDialog } from '../components/ui/CustomDialog';
import { NotificationService } from '../services/NotificationService';
import { BackButton } from '../components/ui/BackButton';
import { MedicineFormCard } from '../components/ui/MedicineFormCard';
import { MedicineCard } from '../components/ui/MedicineCard';
import { EmptyState } from '../components/ui/EmptyState';

export const MedicineScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const api = createApiService(getToken);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('DAILY');
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [times, setTimes] = useState<string[]>([]);

    // Dialog
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', actions: [] as any[] });

    const today = new Date().toISOString().split('T')[0];

    // ── Stats derived from today's schedule ──
    const takenCount = medicines.reduce((acc, med) => {
        const allTaken = (med.times || []).every((t: string) =>
            schedule.find(s => s.medicine_id === med.id && s.time.slice(0, 5) === t.slice(0, 5))
        );
        return allTaken && med.times?.length ? acc + 1 : acc;
    }, 0);
    const totalCount = medicines.length;
    const progress = totalCount ? takenCount / totalCount : 0;

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const meds = await api.getMedicines();
            setMedicines(meds || []);
            const history = await api.getIntakeHistory(today);
            setSchedule(history || []);
            for (const med of meds || []) {
                await NotificationService.scheduleMedicine(med);
            }
        } catch (_) { }
    };

    const showDialog = (title: string, message: string, actions?: any[]) => {
        setDialogConfig({ title, message, actions: actions || [] });
        setDialogVisible(true);
    };

    const handleAddTime = (_: any, date?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedTime(date);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            if (!times.includes(timeStr)) setTimes([...times, timeStr].sort());
        }
    };

    const handleTakeMedicine = async (medicineId: string, time: string) => {
        const isTaken = schedule.find(
            s => s.medicine_id === medicineId && s.time.slice(0, 5) === time.slice(0, 5)
        );
        try {
            if (isTaken) {
                await api.deleteMedicineIntake({ medicineId, date: today, time });
            } else {
                await api.logMedicineIntake({ medicineId, date: today, time, status: 'TAKEN' } as any);
            }
            loadData();
        } catch (_) {
            showDialog('Error', 'Failed to update status');
        }
    };

    const handleEdit = (med: any) => {
        setName(med.name); setDosage(med.dosage);
        setFrequency(med.frequency || 'DAILY');
        setTimes(med.times || []);
        setEditingId(med.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        showDialog('Delete Medicine', 'Are you sure you want to delete this medicine?', [
            { text: 'Cancel', style: 'cancel', onPress: () => setDialogVisible(false) },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.deleteMedicine(id);
                        const med = medicines.find((m: any) => m.id === id);
                        await NotificationService.cancelMedicine(id, med?.times || []);
                        loadData(); setDialogVisible(false);
                    } catch (_) { showDialog('Error', 'Failed to delete'); }
                },
            },
        ]);
    };

    const handleSaveMedicine = async () => {
        if (!name || times.length === 0) {
            showDialog('Incomplete', 'Name and at least one time are required');
            return;
        }
        const newMed = { name, dosage, frequency, times };
        try {
            if (editingId) {
                const updated = await api.updateMedicine(editingId, newMed);
                await NotificationService.scheduleMedicine(updated || { id: editingId, ...newMed });
            } else {
                const saved = await api.addMedicine(newMed);
                await NotificationService.scheduleMedicine(saved || newMed);
            }
            await loadData(); resetForm();
        } catch (e: any) {
            showDialog('Error', `Failed to save: ${e.message || 'Unknown error'}`);
        }
    };

    const resetForm = () => {
        setShowForm(false); setName(''); setDosage('');
        setTimes([]); setEditingId(null);
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <BackButton style={styles.backButton} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Medicine Schedule</Text>
                    <Text style={styles.subtitle}>
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Daily progress card ── */}
                    {totalCount > 0 && (
                        <View style={styles.progressCard}>
                            <View style={styles.progressTop}>
                                <View>
                                    <Text style={styles.progressTitle}>Today's Progress</Text>
                                    <Text style={styles.progressSub}>
                                        <Text style={styles.progressEaten}>{takenCount}</Text>
                                        {' of '}{totalCount} medicines taken
                                    </Text>
                                </View>
                                <View style={[
                                    styles.progressBadge,
                                    progress === 1 && styles.progressBadgeDone,
                                ]}>
                                    <Ionicons
                                        name={progress === 1 ? 'checkmark-circle' : 'time-outline'}
                                        size={14}
                                        color={progress === 1 ? colors.success : colors.primary}
                                    />
                                    <Text style={[
                                        styles.progressBadgeText,
                                        progress === 1 && { color: colors.success },
                                    ]}>
                                        {Math.round(progress * 100)}%
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
                            </View>
                        </View>
                    )}

                    {/* ── Add Medicine button ── */}
                    {!showForm && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => { setEditingId(null); setName(''); setDosage(''); setTimes([]); setShowForm(true); }}
                            activeOpacity={0.85}
                        >
                            <View style={styles.addIconWrap}>
                                <Ionicons name="add" size={20} color="#fff" />
                            </View>
                            <Text style={styles.addButtonText}>Add Medicine</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}

                    {/* ── Form ── */}
                    {showForm && (
                        <MedicineFormCard
                            editingId={editingId}
                            name={name} setName={setName}
                            dosage={dosage} setDosage={setDosage}
                            times={times}
                            onRemoveTime={(t) => setTimes(times.filter(x => x !== t))}
                            onAddTimeClick={() => setShowTimePicker(true)}
                            onCancel={() => { setShowForm(false); setEditingId(null); }}
                            onSave={handleSaveMedicine}
                        />
                    )}

                    {/* ── Time picker (native) ── */}
                    {showTimePicker && (
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            is24Hour={true}
                            display="default"
                            onChange={handleAddTime}
                        />
                    )}

                    {/* ── Today's Schedule section ── */}
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionIconWrap}>
                            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        {totalCount > 0 && (
                            <View style={styles.sectionBadge}>
                                <Text style={styles.sectionBadgeText}>{totalCount}</Text>
                            </View>
                        )}
                    </View>

                    {medicines.length > 0 ? (
                        <View style={styles.list}>
                            {medicines.map(med => (
                                <MedicineCard
                                    key={med.id}
                                    med={med}
                                    schedule={schedule}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onTakeMedicine={handleTakeMedicine}
                                />
                            ))}
                        </View>
                    ) : (
                        <EmptyState
                            icon="medkit-outline"
                            title="No medicines added"
                            message="Add your medicines to start tracking your daily schedule."
                        />
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomDialog
                visible={dialogVisible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                actions={dialogConfig.actions}
                onClose={() => setDialogVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        paddingBottom: spacing.s,
        gap: spacing.s,
    },
    backButton: { marginRight: spacing.xs },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textLight,
        marginTop: 1,
    },

    content: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.s,
    },

    // ── Progress card ──
    progressCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.s,
    },
    progressTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    progressSub: {
        ...typography.caption,
        color: colors.textLight,
        marginTop: 2,
    },
    progressEaten: {
        fontWeight: '700',
        color: colors.primary,
    },
    progressBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: borderRadius.round,
        backgroundColor: colors.primary + '15',
    },
    progressBadgeDone: {
        backgroundColor: colors.success + '18',
    },
    progressBadgeText: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.primary,
        fontSize: 12,
    },
    progressTrack: {
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: 6,
        backgroundColor: colors.primary,
        borderRadius: 3,
    },

    // ── Add button ──
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        marginBottom: spacing.l,
        gap: spacing.m,
    },
    addIconWrap: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.s,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        ...typography.bodyBold,
        color: colors.text,
    },

    // ── Section header ──
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginBottom: spacing.m,
    },
    sectionIconWrap: {
        width: 26,
        height: 26,
        borderRadius: borderRadius.s,
        backgroundColor: colors.primary + '18',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        ...typography.bodyBold,
        color: colors.text,
        flex: 1,
    },
    sectionBadge: {
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        backgroundColor: colors.primary + '18',
        borderRadius: borderRadius.round,
    },
    sectionBadgeText: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.primary,
        fontSize: 12,
    },

    list: {
        gap: spacing.s,
    },
});