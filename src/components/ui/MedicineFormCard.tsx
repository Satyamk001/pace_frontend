import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {colors, fonts, borderRadius, spacing, typography} from '../../theme';

interface MedicineFormCardProps {
    editingId: string | null;
    name: string;
    setName: (name: string) => void;
    dosage: string;
    setDosage: (dosage: string) => void;
    times: string[];
    onRemoveTime: (timeToRemove: string) => void;
    onAddTimeClick: () => void;
    onCancel: () => void;
    onSave: () => void;
}

export const MedicineFormCard: React.FC<MedicineFormCardProps> = ({
    editingId, name, setName, dosage, setDosage, times,
    onRemoveTime, onAddTimeClick, onCancel, onSave
}) => {
    return (
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
                        <TouchableOpacity onPress={() => onRemoveTime(t)}>
                            <Ionicons name="close-circle" size={16} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>
                ))}
                 <TouchableOpacity style={styles.timeAddBtn} onPress={onAddTimeClick}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <Text style={{color: colors.primary, marginLeft: 4}}>Add Time</Text>
                 </TouchableOpacity>
            </View>

            <View style={styles.formActions}>
                <TouchableOpacity onPress={onCancel}>
                    <Text style={{ color: colors.textLight }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                    <Text style={styles.saveButtonText}>{editingId ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    formCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
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
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timeChipText: { marginRight: 4, ...fonts.caption },
    timeAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
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
});
