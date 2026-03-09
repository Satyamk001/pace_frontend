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
import { colors, typography, spacing, borderRadius } from '../theme';

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

/** Returns 'YYYY-MM-DD' in LOCAL time — avoids UTC date shift on IST/any offset timezone */
function toLocalDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

    // Determine if the outer ScrollView should be disabled (time drum is active)
    const isTimeDrumActive = activeTab === 'TIME' && isPickerVisible;

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
        const isToday = now.setHours(0, 0, 0, 0) === new Date(selectedDate).setHours(0, 0, 0, 0);

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

    const TimeDrumColumn = ({
        data,
        selectedVal,
        onSelect,
    }: {
        data: number[];
        selectedVal: number;
        onSelect: (val: number) => void;
    }) => (
        <View style={{ height: DRUM_HEIGHT, width: 70 }}>
            <FlatList
                data={data}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                decelerationRate="fast"
                // FIX 1: Allow this FlatList to scroll independently inside the parent ScrollView
                nestedScrollEnabled={true}
                initialScrollIndex={selectedVal}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                // FIX 2: Handle failed initialScrollIndex gracefully (avoids crashes)
                onScrollToIndexFailed={() => { }}
                contentContainerStyle={{ paddingVertical: (DRUM_HEIGHT - ITEM_HEIGHT) / 2 }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (data[index] !== undefined) {
                        onSelect(data[index]);
                    }
                }}
                // FIX 3: Also capture value on drag-end (covers slow drags that don't trigger momentum)
                onScrollEndDrag={(e) => {
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

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Schedule Task</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* FIX 4: Disable outer ScrollView scrolling while the time drum is active
                        so it doesn't steal the vertical gesture from the FlatList columns */}
                    <ScrollView
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!isTimeDrumActive}
                        contentContainerStyle={styles.scrollContent}
                    >

                        {/* Schedule Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Date & Time</Text>

                            <View style={styles.chipsRow}>
                                <TouchableOpacity
                                    style={[styles.chip, activeTab === 'DATE' && isPickerVisible && styles.chipActive]}
                                    onPress={() => togglePicker('DATE')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="calendar-outline" size={18} color={activeTab === 'DATE' && isPickerVisible ? colors.primary : colors.textPrimary} />
                                    <Text style={[styles.chipText, activeTab === 'DATE' && isPickerVisible && styles.chipTextActive]}>
                                        {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.chip, activeTab === 'TIME' && isPickerVisible && styles.chipActive]}
                                    onPress={() => togglePicker('TIME')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time-outline" size={18} color={activeTab === 'TIME' && isPickerVisible ? colors.primary : colors.textPrimary} />
                                    <Text style={[styles.chipText, activeTab === 'TIME' && isPickerVisible && styles.chipTextActive]}>
                                        {formatTime(selectedHour, selectedMinute)}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {isPickerVisible && (
                                <View style={styles.dynamicPanel}>
                                    {activeTab === 'DATE' ? (
                                        <Calendar
                                            current={toLocalDateKey(selectedDate)}
                                            onDayPress={(day) => {
                                                const [y, m, d] = day.dateString.split('-').map(Number);
                                                const localDate = new Date(y, m - 1, d);
                                                setSelectedDate(localDate);
                                                setTimeout(() => {
                                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                    setIsPickerVisible(false);
                                                }, 300);
                                            }}
                                            monthFormat={'MMMM yyyy'}
                                            markedDates={{ [toLocalDateKey(selectedDate)]: { selected: true, selectedColor: colors.primary } }}
                                            theme={{
                                                calendarBackground: 'transparent',
                                                selectedDayBackgroundColor: colors.primary,
                                                selectedDayTextColor: colors.surface,
                                                todayTextColor: colors.primary,
                                                dayTextColor: colors.text,
                                                textDisabledColor: colors.border,
                                                monthTextColor: colors.text,
                                                textMonthFontWeight: '700',
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
                        </View>

                        {/* Repeat Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Repeat</Text>

                            {!isRepeatExpanded ? (
                                <TouchableOpacity
                                    style={styles.repeatSummaryBox}
                                    onPress={() => setIsRepeatExpanded(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="sync-outline" size={18} color={colors.primary} />
                                    <Text style={styles.repeatSummaryText}>{getRepeatLabel(repeatType)}</Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={styles.chevronRight} />
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
                                            activeOpacity={0.7}
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

                    {/* Footer Save Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.8}>
                            <Text style={styles.primaryBtnText}>Save Schedule</Text>
                        </TouchableOpacity>
                    </View>

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
        backgroundColor: colors.surfaceSoft,
        borderRadius: borderRadius.m,
        zIndex: -1,
    },
    itemWrap: { justifyContent: 'center', alignItems: 'center' },
    itemText: { ...typography.h3, color: colors.textSecondary },
    itemTextActive: { ...typography.h2, color: colors.primary },
    colon: { ...typography.h2, color: colors.text, marginHorizontal: spacing.s, paddingBottom: 4 }
});

const styles = StyleSheet.create({
    containerWrapper: { flex: 1, justifyContent: 'flex-end' },
    overlay: { backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    modalContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingTop: spacing.m,
        maxHeight: '90%'
    },
    dragIndicator: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.m },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.l, marginBottom: spacing.m },
    headerTitle: { ...typography.h3, color: colors.text },
    closeBtn: { padding: spacing.xs },

    scrollContent: { paddingHorizontal: spacing.l, paddingBottom: spacing.xxl },

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
        marginBottom: spacing.m,
    },

    // Pills (Chips)
    chipsRow: { flexDirection: 'row', gap: spacing.m, marginBottom: spacing.s },
    chip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.s,
        borderRadius: borderRadius.round,
        backgroundColor: colors.surfaceSoft,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs
    },
    chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.primary },
    chipText: { ...typography.bodyBold, color: colors.textPrimary },
    chipTextActive: { color: colors.primary },

    // Dynamic Picker Area
    dynamicPanel: { minHeight: 280, justifyContent: 'center', marginTop: spacing.m },
    calendar: { borderRadius: borderRadius.m, overflow: 'hidden' },
    timeContainer: { alignItems: 'center' },
    doneBtn: { marginTop: spacing.m, paddingVertical: spacing.sm, paddingHorizontal: spacing.l, backgroundColor: colors.surfaceSoft, borderRadius: borderRadius.round },
    doneBtnText: { ...typography.bodyBold, color: colors.textPrimary },

    // Repeat Section
    repeatSummaryBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSoft, padding: spacing.m, borderRadius: borderRadius.m, gap: spacing.s },
    repeatSummaryText: { ...typography.bodyBold, color: colors.primary },
    chevronRight: { marginLeft: 'auto' },

    repeatExpandedBox: { backgroundColor: colors.surfaceSoft, borderRadius: borderRadius.m, paddingHorizontal: spacing.m },
    repeatRadioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.m, gap: spacing.m },
    repeatBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    radioBorder: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    radioBorderActive: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    radioText: { ...typography.body },
    radioTextActive: { ...typography.bodyBold, color: colors.primary },

    // Footer & Save Button
    footer: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        paddingBottom: spacing.xxl,
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
});