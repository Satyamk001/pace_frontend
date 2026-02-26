import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, fonts, borderRadius, shadows, spacing } from '../../theme';

interface FoodFormCardProps {
    name: string;
    setName: (name: string) => void;
    calories: string;
    setCalories: (calories: string) => void;
    quantity: string;
    setQuantity: (quantity: string) => void;
    onCancel: () => void;
    onSave: () => void;
}

export const FoodFormCard: React.FC<FoodFormCardProps> = ({ 
    name, setName, 
    calories, setCalories, 
    quantity, setQuantity, 
    onCancel, onSave 
}) => {
    return (
        <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Meal</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Food Name (e.g., Oatmeal)" 
                value={name}
                onChangeText={setName}
            />
            <View style={styles.row}>
                <TextInput 
                    style={[styles.input, { flex: 1, marginRight: spacing.sm }]} 
                    placeholder="Calories" 
                    keyboardType="numeric"
                    value={calories}
                    onChangeText={setCalories}
                />
                 <TextInput 
                    style={[styles.input, { flex: 1 }]} 
                    placeholder="Qty (e.g., 1 bowl)" 
                    value={quantity}
                    onChangeText={setQuantity}
                />
            </View>
            <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
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
        ...shadows.soft,
    },
    formTitle: {
        ...fonts.h3,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: colors.inputBackground,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...fonts.body,
    },
    row: {
        flexDirection: 'row',
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    cancelButton: {
        padding: spacing.sm,
    },
    cancelButtonText: {
        ...fonts.button,
        color: colors.textLight,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.round,
    },
    saveButtonText: {
        ...fonts.button,
        color: '#FFF',
    },
});
