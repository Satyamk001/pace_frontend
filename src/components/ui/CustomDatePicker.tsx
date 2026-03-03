import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import {colors, borderRadius, spacing, typography} from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface CustomDatePickerProps {
    visible: boolean;
    initialDate?: Date;
    minDate?: string; // YYYY-MM-DD — optional lower bound (e.g. tomorrow for reschedule)
    onClose: () => void;
    onConfirm: (date: Date) => void;
    title?: string;
}

export const CustomDatePicker = ({ 
    visible, 
    initialDate = new Date(), 
    minDate,
    onClose, 
    onConfirm,
    title = "Select Date"
}: CustomDatePickerProps) => {
    // Use LOCAL date components — toISOString() shifts to UTC and can give wrong day for IST/other TZ
    const toDateStr = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const toHeaderStr = (d: Date): string =>
        d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });

    // Initialise directly — Calendar.current must always be a valid YYYY-MM-DD string
    const [selectedDate, setSelectedDate] = useState(() => toDateStr(initialDate));
    const [headerDate, setHeaderDate] = useState(() => toHeaderStr(initialDate));

    useEffect(() => {
        if (visible) {
            setSelectedDate(toDateStr(initialDate));
            setHeaderDate(toHeaderStr(initialDate));
        }
    }, [visible, initialDate]);

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString); // Already YYYY-MM-DD from the library
        const [year, month, d] = day.dateString.split('-').map(Number);
        setHeaderDate(toHeaderStr(new Date(year, month - 1, d)));
    };

    const handleConfirm = () => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        onConfirm(new Date(year, month - 1, day)); // Local midnight — no UTC shift
    };


    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>{headerDate}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar */}
                    <Calendar
                        current={selectedDate}
                        onDayPress={handleDayPress}
                        enableSwipeMonths={true}
                        hideExtraDays={true}
                        minDate={minDate}
                        monthFormat={'MMMM yyyy'}
                        hideArrows={true}
                        // markingType={'custom'}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: colors.primary }
                        }}
                        theme={{
                                                        backgroundColor: colors.background,
                                                        calendarBackground: colors.background,
                                                        textSectionTitleColor: colors.textLight,
                                                        selectedDayBackgroundColor: colors.primary,
                                                        selectedDayTextColor: '#FFF',
                                                        todayTextColor: colors.accent,
                                                        dayTextColor: colors.text,
                                                        textDisabledColor: '#d9e1e8',
                                                        arrowColor: colors.primary,
                                                        disabledArrowColor: '#d9e1e8',
                                                        monthTextColor: colors.text,
                                                        indicatorColor: colors.primary,
                                                        textDayFontWeight: '500',
                                                        textMonthFontWeight: 'bold',
                                                        textDayHeaderFontWeight: '400',
                                                        textDayFontSize: 16,
                                                        textMonthFontSize: 18,
                                                        textDayHeaderFontSize: 12
                                                    }}
                        style={styles.calendar}
                    />

                    {/* Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                            <Text style={styles.btnTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirm}>
                            <Text style={styles.btnTextConfirm}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay for focus
        justifyContent: 'center',
        padding: spacing.l,
    },
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        paddingHorizontal: spacing.s,
    },
    title: {
        ...typography.subheader,
        ...typography.body,
    color: colors.text,
        
    },
    subtitle: {
        ...typography.header,
        ...typography.h2,
    color: colors.primary,
        
        marginTop: spacing.xs,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    calendar: {
        borderRadius: borderRadius.m,
        marginBottom: spacing.l,
    },
    footer: {
        flexDirection: 'row',
        gap: spacing.m,
        paddingHorizontal: spacing.s,
    },
    btnCancel: {
        flex: 1,
        paddingVertical: spacing.s,
        alignItems: 'center',
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnTextCancel: {
        ...typography.body,
    color: colors.textLight,
        
    },
    btnConfirm: {
        flex: 1,
        paddingVertical: spacing.s,
        alignItems: 'center',
        borderRadius: borderRadius.m,
        backgroundColor: colors.primary,
    },
    btnTextConfirm: {
        ...typography.body,
    color: '#FFF',
        
    }
});
