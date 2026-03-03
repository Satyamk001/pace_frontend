import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {colors, fonts, borderRadius, spacing, typography} from '../../theme';

interface MedicineCardProps {
    med: any;
    schedule: any[];
    onEdit: (med: any) => void;
    onDelete: (id: string) => void;
    onTakeMedicine: (medId: string, time: string) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ med, schedule, onEdit, onDelete, onTakeMedicine }) => {
    return (
        <View style={styles.medCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <View>
                    <Text style={styles.medName}>{med.name} <Text style={styles.medDosage}>{med.dosage}</Text></Text>
                    <Text style={styles.medFreq}>{med.frequency}</Text>
                </View>
                <View style={{flexDirection: 'row', gap: 12}}>
                    <TouchableOpacity onPress={() => onEdit(med)}>
                        <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(med.id)}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={styles.timeRow}>
                {med.times && med.times.map((time: string) => {
                    const isTaken = schedule.find(s => s.medicine_id === med.id && s.time.slice(0,5) === time.slice(0,5));
                    
                    return (
                        <TouchableOpacity 
                            key={time} 
                            style={[styles.timeSlot, isTaken && styles.timeSlotTaken]}
                            onPress={() => onTakeMedicine(med.id, time)}
                        >
                            <Text style={[styles.timeText, isTaken && styles.timeTextTaken]}>{time}</Text>
                            {isTaken && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    medCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
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
        gap: spacing.xs
    },
    timeSlotTaken: {
        backgroundColor: colors.primary,
    },
    timeText: {
        ...typography.caption,
    color: colors.primary,
        
    },
    timeTextTaken: {
        color: '#FFF'
    }
});
