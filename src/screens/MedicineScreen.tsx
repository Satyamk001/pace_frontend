import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';
import { useOffline } from '../context/OfflineContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomDialog } from '../components/ui/CustomDialog';
import { NotificationService } from '../services/NotificationService';

export const MedicineScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const { isOffline } = useOffline();
    const api = createApiService(getToken);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [medicines, setMedicines] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]); // Today's intake
    const [showForm, setShowForm] = useState(false);
    
    // Form Inputs
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('DAILY');
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [times, setTimes] = useState<string[]>([]);
    
    // Dialog State
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', actions: [] as any[] });

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const meds = await api.getMedicines();
            setMedicines(meds || []);
            const history = await api.getIntakeHistory(today);
            setSchedule(history || []);
        } catch (error) {
            // silent catch
        }
    };

    const showDialog = (title: string, message: string, actions?: any[]) => {
        setDialogConfig({ title, message, actions: actions || [] });
        setDialogVisible(true);
    };

    const handleAddTime = (event: any, date?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedTime(date);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            if (!times.includes(timeStr)) {
                setTimes([...times, timeStr].sort());
            } 
        }
    };

    const handleTakeMedicine = async (medicineId: string, time: string) => {
        // Toggle Logic
        const isTaken = schedule.find(s => s.medicine_id === medicineId && s.time.slice(0,5) === time.slice(0,5));

        const payload = {
            medicineId,
            date: today,
            time,
            status: 'TAKEN'
        };

        try {
            if (isOffline) {
                if (isTaken) {
                     showDialog('Offline', 'Untaking unavailable offline yet.');
                } else {
                    await api.logMedicineIntake(payload as any);
                    showDialog('Offline', 'Marked as taken locally.');
                }
            } else {
                if (isTaken) {
                    await api.deleteMedicineIntake({ medicineId, date: today, time });
                } else {
                    await api.logMedicineIntake(payload as any);
                }
                loadData(); 
            }
        } catch (error) {
             showDialog('Error', 'Failed to update status');
        }
    };

    const handleEdit = (med: any) => {
        setName(med.name);
        setDosage(med.dosage);
        setFrequency(med.frequency || 'DAILY');
        setTimes(med.times || []);
        setEditingId(med.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        showDialog('Delete', 'Are you sure you want to delete this medicine?', [
            { text: 'Cancel', style: 'cancel', onPress: () => setDialogVisible(false) },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        if (isOffline) {
                             showDialog('Offline', 'Cannot delete while offline.');
                        } else {
                            await api.deleteMedicine(id);
                            loadData();
                            setDialogVisible(false);
                        }
                    } catch (error) {
                         showDialog('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const handleSaveMedicine = async () => {
        if (!name || times.length === 0) {
            showDialog('Incomplete', 'Name and at least one time required');
            return;
        }

        const newMed = {
            name,
            dosage,
            frequency,
            times
        };

        try {
            if (isOffline) {
                if (editingId) {
                     showDialog('Offline', 'Editing not supported offline yet.');
                } else {
                    await api.addMedicine(newMed);
                    showDialog('Offline', 'Medicine saved locally.');
                    resetForm();
                }
            } else {
                if (editingId) {
                    const updatedMed = await api.updateMedicine(editingId, newMed);
                    // For now, to keep it simple, we just schedule the updated ones.
                    // A full reschedule might require fetching all again.
                    await NotificationService.scheduleMedicine(updatedMed || { id: editingId, ...newMed });
                } else {
                    const savedMed = await api.addMedicine(newMed);
                    await NotificationService.scheduleMedicine(savedMed || newMed);
                }
                
                await loadData();
                resetForm();
            }
        } catch (error: any) {
            showDialog('Error', `Failed to save: ${error.message || 'Unknown error'}`);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setName('');
        setDosage('');
        setTimes([]);
        setEditingId(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Medicine Schedule</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Add New Button */}
                {!showForm && (
                    <TouchableOpacity style={styles.addButton} onPress={() => {
                        setEditingId(null);
                        setName('');
                        setDosage('');
                        setTimes([]);
                        setShowForm(true);
                    }}>
                        <Ionicons name="add" size={24} color="#FFF" />
                        <Text style={styles.addButtonText}>Add Medicine</Text>
                    </TouchableOpacity>
                )}

                {/* Form */}
                {showForm && (
                     <View style={styles.formCard}>
                        <Text style={styles.formTitle}>{editingId ? 'Edit Medicine' : 'New Medicine'}</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Medicine Name" 
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput 
                            style={styles.input} 
                            placeholder="Dosage (e.g. 1 pill)" 
                            value={dosage}
                            onChangeText={setDosage}
                        />
                        
                        <Text style={styles.label}>Schedule Times</Text>
                        <View style={styles.timeList}>
                            {times.map((t, i) => (
                                <View key={i} style={styles.timeChip}>
                                    <Text style={styles.timeChipText}>{t}</Text>
                                    <TouchableOpacity onPress={() => setTimes(times.filter(x => x !== t))}>
                                        <Ionicons name="close-circle" size={16} color={colors.textLight} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                             <TouchableOpacity style={styles.timeAddBtn} onPress={() => setShowTimePicker(true)}>
                                <Ionicons name="time" size={20} color={colors.primary} />
                                <Text style={{color: colors.primary, marginLeft: 4}}>Add Time</Text>
                             </TouchableOpacity>
                        </View>
                        
                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={handleAddTime}
                            />
                        )}

                        <View style={styles.formActions}>
                            <TouchableOpacity onPress={() => { setShowForm(false); setEditingId(null); }}>
                                <Text style={{ color: colors.textLight }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedicine}>
                                <Text style={styles.saveButtonText}>{editingId ? 'Update' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                     </View>
                )}

                {/* Schedule List */}
                <Text style={styles.sectionHeader}>Today's Schedule</Text>
                
                {medicines.map((med) => (
                    <View key={med.id} style={styles.medCard}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <View>
                                <Text style={styles.medName}>{med.name} <Text style={styles.medDosage}>{med.dosage}</Text></Text>
                                <Text style={styles.medFreq}>{med.frequency}</Text>
                            </View>
                            <View style={{flexDirection: 'row', gap: 12}}>
                                <TouchableOpacity onPress={() => handleEdit(med)}>
                                    <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(med.id)}>
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Render pills for each time */}
                        <View style={styles.timeRow}>
                            {med.times && med.times.map((time: string) => {
                                // Check if taken
                                const isTaken = schedule.find(s => s.medicine_id === med.id && s.time.slice(0,5) === time.slice(0,5)); // slice to match HH:MM
                                
                                return (
                                    <TouchableOpacity 
                                        key={time} 
                                        style={[styles.timeSlot, isTaken && styles.timeSlotTaken]}
                                        onPress={() => handleTakeMedicine(med.id, time)}
                                    >
                                        <Text style={[styles.timeText, isTaken && styles.timeTextTaken]}>{time}</Text>
                                        {isTaken && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

            </ScrollView>
            
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    backButton: { marginRight: spacing.md },
    title: { ...fonts.h2, color: colors.text },
    content: { padding: spacing.lg },
    addButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.round,
        marginBottom: spacing.lg,
    },
    addButtonText: { ...fonts.button, color: '#FFF', marginLeft: spacing.xs },
    formCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    formTitle: { ...fonts.h3, marginBottom: spacing.md },
    input: {
        backgroundColor: colors.inputBackground,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    label: { ...fonts.caption, color: colors.textLight, marginBottom: spacing.xs },
    timeList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    timeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSoft,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timeChipText: { marginRight: 4, ...fonts.caption },
    timeAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.round,
    },
    saveButtonText: { ...fonts.button, color: '#FFF' },
    sectionHeader: { ...fonts.h3, marginBottom: spacing.md, color: colors.text },
    medCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        ...shadows.soft,
    },
    medName: { ...fonts.bodyBold, fontSize: 16 },
    medDosage: { fontWeight: '400', color: colors.textLight, fontSize: 14 },
    medFreq: { ...fonts.caption, color: colors.textLight, marginBottom: spacing.md },
    timeRow: { flexDirection: 'row', gap: spacing.sm },
    timeSlot: {
        borderWidth: 1,
        borderColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: borderRadius.round,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    timeSlotTaken: {
        backgroundColor: colors.primary,
    },
    timeText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 12,
    },
    timeTextTaken: {
        color: '#FFF'
    }
});
