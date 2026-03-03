import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {colors, fonts, borderRadius, spacing, typography} from '../../theme';

interface FoodLogItemProps {
    name: string;
    quantity: string;
    time: string;
    calories: number;
}

export const FoodLogItem: React.FC<FoodLogItemProps> = ({ name, quantity, time, calories }) => {
    return (
        <View style={styles.logItem}>
            <View style={styles.logMeta}>
                <Text style={styles.logName}>{name}</Text>
                <Text style={styles.logQty}>{quantity} • {time}</Text>
            </View>
            <Text style={styles.logCal}>{calories} kcal</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    logItem: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logMeta: {
        flex: 1,
    },
    logName: {
        ...fonts.bodyBold,
        color: colors.text,
    },
    logQty: {
        ...fonts.caption,
        color: colors.textLight,
        marginTop: 2,
    },
    logCal: {
        ...fonts.h3,
        color: colors.primary,
    },
});
