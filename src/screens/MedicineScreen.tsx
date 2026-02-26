import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
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

export const MedicineScreen = () => {
    const navigation = useNavigation();
    const { getToken } = useAuth();
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
            if (isTaken) {
                await api.deleteMedicineIntake({ medicineId, date: today, time });
            } else {
                await api.logMedicineIntake(payload as any);
            }
            loadData(); 
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
                        await api.deleteMedicine(id);
                        
                        // Cancel only this medicine's notifications
                        const med = medicines.find((m: any) => m.id === id);
                        await NotificationService.cancelMedicine(id, med?.times || []);
                        
                        loadData();
                        setDialogVisible(false);
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
            if (editingId) {
                const updatedMed = await api.updateMedicine(editingId, newMed);
                await NotificationService.scheduleMedicine(updatedMed || { id: editingId, ...newMed });
            } else {
                const savedMed = await api.addMedicine(newMed);
                await NotificationService.scheduleMedicine(savedMed || newMed);
            }
            
            await loadData();
            resetForm();
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
                <BackButton style={styles.backButton} />
                <Text style={styles.title}>Medicine Schedule</Text>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
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

                {/* Schedule List */}
                <Text style={styles.sectionHeader}>Today's Schedule</Text>
                
                {showTimePicker && (
                    <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleAddTime}
                    />
                )}
                
                {medicines.map((med) => (
                    <MedicineCard 
                        key={med.id}
                        med={med}
                        schedule={schedule}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTakeMedicine={handleTakeMedicine}
                    />
                ))}

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
    sectionHeader: { ...fonts.h3, marginBottom: spacing.md, color: colors.text },

});
