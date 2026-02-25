import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    FlatList,
    LayoutAnimation,
    Platform,
    UIManager,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DateTimeModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (date: Date, repeatType: string) => void;
    initialDate?: Date;
    initialRepeatType?: string;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const DRUM_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const DateTimeModal = ({ visible, onClose, onSave, initialDate, initialRepeatType }: DateTimeModalProps) => {
    const [activeTab, setActiveTab] = useState<'DATE' | 'TIME'>('DATE');
    const [isPickerVisible, setIsPickerVisible] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
    const [selectedHour, setSelectedHour] = useState<number>(initialDate ? initialDate.getHours() : 9);
    const [selectedMinute, setSelectedMinute] = useState<number>(initialDate ? initialDate.getMinutes() : 0);
    const [repeatType, setRepeatType] = useState<string>(initialRepeatType || 'NONE');
    const [isRepeatExpanded, setIsRepeatExpanded] = useState(false);

    // Animation state
    const [showModal, setShowModal] = useState(visible);
    const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            setSelectedDate(initialDate || new Date());
            setSelectedHour(initialDate ? initialDate.getHours() : 9);
            setSelectedMinute(initialDate ? initialDate.getMinutes() : 0);
            setRepeatType(initialRepeatType || 'NONE');
            setIsRepeatExpanded(false);
            setActiveTab('DATE');
            setIsPickerVisible(true);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    bounciness: 4,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: Dimensions.get('window').height,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setShowModal(false);
            });
        }
    }, [visible, initialDate, initialRepeatType]);

    const togglePicker = (tab: 'DATE' | 'TIME') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (activeTab === tab && isPickerVisible) {
            setIsPickerVisible(false);
        } else {
            setActiveTab(tab);
            setIsPickerVisible(true);
        }
    };

    const handleSave = () => {
        const finalDate = new Date(selectedDate);
        finalDate.setHours(selectedHour, selectedMinute, 0, 0);

        // Validation: Prevent scheduling in the past if it's today
        const now = new Date();
        const isToday = now.setHours(0,0,0,0) === new Date(selectedDate).setHours(0,0,0,0);
        
        if (isToday) {
            const timeToSave = new Date();
            timeToSave.setHours(selectedHour, selectedMinute, 0, 0);
            if (timeToSave.getTime() < new Date().getTime()) {
                Alert.alert("Invalid Time", "You cannot schedule a task in the past for today.");
                return;
            }
        }

        onSave(finalDate, repeatType);
        onClose();
    };

    const formatTime = (hour: number, minute: number) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const getRepeatLabel = (type: string) => {
        const labels: Record<string, string> = {
            'DAILY': 'Every day',
            'WEEKLY': 'Every week',
            'MONTHLY': 'Every month',
            'YEARLY': 'Every year',
            'NONE': 'Do not repeat'
        };
        return labels[type] || labels['NONE'];
    };

    const REPEAT_OPTIONS = [
        { label: 'Do not repeat', value: 'NONE' },
        { label: 'Every 1 day', value: 'DAILY' },
        { label: 'Every 1 week', value: 'WEEKLY' },
        { label: 'Every 1 month', value: 'MONTHLY' },
        { label: 'Every 1 year', value: 'YEARLY' },
    ];

    const generateDrumData = (max: number) => Array.from({ length: max }, (_, i) => i);

    const TimeDrumColumn = ({ data, selectedVal, onSelect }: { data: number[], selectedVal: number, onSelect: (val: number) => void }) => (
        <View style={{ height: DRUM_HEIGHT, width: 70 }}>
            <FlatList
                data={data}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                decelerationRate="fast"
                initialScrollIndex={selectedVal}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
                })}
                contentContainerStyle={{ paddingVertical: (DRUM_HEIGHT - ITEM_HEIGHT) / 2 }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (data[index] !== undefined) {
                        onSelect(data[index]);
                    }
                }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[DrumStyles.itemWrap, { height: ITEM_HEIGHT }]}
                        activeOpacity={0.7}
                        onPress={() => onSelect(item)}
                    >
                        <Text style={[DrumStyles.itemText, selectedVal === item && DrumStyles.itemTextActive]}>
                            {item.toString().padStart(2, '0')}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    return (
        <Modal visible={showModal} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.containerWrapper}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                </Animated.View>

                <Animated.View style={[styles.modalContainer, { transform: [{ translateY }] }]}>
                    <View style={styles.dragIndicator} />

                    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Schedule</Text>
                            <View style={styles.headerRight}>
                                <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
                                    <Text style={styles.saveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.chipsRow}>
                            <View style={{ flex: 1, marginRight: spacing.s }}>
                                <Text style={styles.chipLabel}>Date</Text>
                                <TouchableOpacity
                                    style={[styles.chip, activeTab === 'DATE' && isPickerVisible && styles.chipActive]}
                                    onPress={() => togglePicker('DATE')}
                                >
                                    <Ionicons name="calendar-outline" size={18} color={activeTab === 'DATE' && isPickerVisible ? colors.primary : colors.textSecondary} />
                                    <Text style={[styles.chipText, activeTab === 'DATE' && isPickerVisible && styles.chipTextActive]}>
                                        {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 0.7 }}>
                                <Text style={styles.chipLabel}>Time</Text>
                                <TouchableOpacity
                                    style={[styles.chip, activeTab === 'TIME' && isPickerVisible && styles.chipActive]}
                                    onPress={() => togglePicker('TIME')}
                                >
                                    <Ionicons name="time-outline" size={18} color={activeTab === 'TIME' && isPickerVisible ? colors.primary : colors.textSecondary} />
                                    <Text style={[styles.chipText, activeTab === 'TIME' && isPickerVisible && styles.chipTextActive]}>
                                        {formatTime(selectedHour, selectedMinute)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isPickerVisible && (
                            <View style={styles.dynamicPanel}>
                                {activeTab === 'DATE' ? (
                                    <Calendar
                                        current={selectedDate.toISOString().split('T')[0]}
                                        onDayPress={(day) => {
                                            setSelectedDate(new Date(day.timestamp));
                                            setTimeout(() => {
                                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                setIsPickerVisible(false);
                                            }, 300);
                                        }}
                                        monthFormat={'MMMM yyyy'}
                                        markedDates={{ [selectedDate.toISOString().split('T')[0]]: { selected: true, selectedColor: colors.primary } }}
                                        theme={{
                                            calendarBackground: 'transparent',
                                            selectedDayBackgroundColor: colors.primary,
                                            selectedDayTextColor: colors.surface,
                                            todayTextColor: colors.primary,
                                            dayTextColor: colors.text,
                                            textDisabledColor: colors.border,
                                            monthTextColor: colors.text,
                                            textMonthFontWeight: '700',
                                            textDayFontSize: 14,
                                        }}
                                        style={styles.calendar}
                                    />
                                ) : (
                                    <View style={styles.timeContainer}>
                                        <View style={DrumStyles.container}>
                                            <View style={[DrumStyles.selectionBox, { height: ITEM_HEIGHT }]} />
                                            <TimeDrumColumn data={generateDrumData(24)} selectedVal={selectedHour} onSelect={setSelectedHour} />
                                            <Text style={DrumStyles.colon}>:</Text>
                                            <TimeDrumColumn data={generateDrumData(60)} selectedVal={selectedMinute} onSelect={setSelectedMinute} />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.doneBtn}
                                            onPress={() => {
                                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                setIsPickerVisible(false);
                                            }}
                                        >
                                            <Text style={styles.doneBtnText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.repeatSection}>
                            <Text style={styles.repeatLabel}>Repeat</Text>
                            {!isRepeatExpanded ? (
                                <TouchableOpacity
                                    style={styles.repeatSummaryBox}
                                    onPress={() => setIsRepeatExpanded(true)}
                                >
                                    <Ionicons name="sync-outline" size={18} color={colors.primary} />
                                    <Text style={styles.repeatSummaryText}>{getRepeatLabel(repeatType)}</Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.repeatExpandedBox}>
                                    {REPEAT_OPTIONS.map((opt, idx) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[styles.repeatRadioRow, idx < REPEAT_OPTIONS.length - 1 && styles.repeatBorder]}
                                            onPress={() => {
                                                setRepeatType(opt.value);
                                                setIsRepeatExpanded(false);
                                            }}
                                        >
                                            <View style={[styles.radioBorder, repeatType === opt.value && styles.radioBorderActive]}>
                                                {repeatType === opt.value && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[styles.radioText, repeatType === opt.value && styles.radioTextActive]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const DrumStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: DRUM_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        paddingHorizontal: spacing.xl,
    },
    selectionBox: {
        position: 'absolute',
        left: spacing.m,
        right: spacing.m,
        borderWidth: 1,
        borderColor: colors.primary + '40',
        borderStyle: 'dashed',
        borderRadius: borderRadius.m,
        backgroundColor: colors.accentSoft + '50',
        zIndex: -1,
    },
    itemWrap: { justifyContent: 'center', alignItems: 'center' },
    itemText: { ...typography.bodyBold, color: colors.border, fontSize: 20 },
    itemTextActive: { color: colors.primary, fontSize: 26 },
    colon: { ...typography.h2, color: colors.text, marginHorizontal: spacing.s, paddingBottom: 4 }
});

const styles = StyleSheet.create({
    containerWrapper: { flex: 1, justifyContent: 'flex-end' },
    overlay: { backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: spacing.l, paddingTop: spacing.m, ...shadows.medium, maxHeight: '85%' },
    dragIndicator: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.m },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l },
    headerTitle: { ...typography.h3 },
    headerRight: { flexDirection: 'row', gap: spacing.s },
    headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    cancelText: { ...typography.bodyBold, color: colors.primary },
    saveText: { ...typography.bodyBold, color: colors.textSecondary },
    chipsRow: { flexDirection: 'row', marginBottom: spacing.m },
    chipLabel: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginLeft: 4 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.m, borderRadius: borderRadius.m, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, gap: spacing.s },
    chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.primary },
    chipText: { ...typography.bodyBold, fontSize: 14, color: colors.textPrimary },
    chipTextActive: { color: colors.primary },
    dynamicPanel: { minHeight: 280, justifyContent: 'center', marginBottom: spacing.m },
    calendar: { borderRadius: borderRadius.m, overflow: 'hidden' },
    timeContainer: { alignItems: 'center' },
    doneBtn: { marginTop: spacing.m, paddingVertical: 8, paddingHorizontal: 24, backgroundColor: colors.accentSoft, borderRadius: borderRadius.round },
    doneBtnText: { ...typography.bodyBold, color: colors.primary, fontSize: 14 },
    repeatSection: { marginTop: spacing.s },
    repeatLabel: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.s, marginLeft: 4 },
    repeatSummaryBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSoft, padding: spacing.m, borderRadius: borderRadius.m, gap: spacing.s },
    repeatSummaryText: { ...typography.bodyBold, fontSize: 14, color: colors.primary },
    repeatExpandedBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.m, paddingHorizontal: spacing.m, ...shadows.soft },
    repeatRadioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.m, gap: spacing.m },
    repeatBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    radioBorder: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    radioBorderActive: { borderColor: colors.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    radioText: { ...typography.body, fontSize: 15 },
    radioTextActive: { ...typography.bodyBold, color: colors.primary }
});