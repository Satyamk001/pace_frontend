import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, Switch, ScrollView,
  Animated, Dimensions, TouchableWithoutFeedback, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const UNITS = ['piece', 'grams', 'cup', 'bowl', 'plate', 'tbsp', 'tsp', 'slice', 'ml', 'serving'];

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    quantity: string;
    unit: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    saveToTemplate: boolean;
  }) => void;
  onEstimateCalories: (name: string, quantity: string, unit: string) => Promise<{ 
    calories: number; 
    protein: number;
    fat: number;
    carbs: number;
    confidence: string;
  }>;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  visible, onClose, onSave, onEstimateCalories,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('piece');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [saveToTemplate, setSaveToTemplate] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [confidence, setConfidence] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [qtyFocused, setQtyFocused] = useState(false);
  const [calFocused, setCalFocused] = useState(false);
  const [proteinFocused, setProteinFocused] = useState(false);
  const [fatFocused, setFatFocused] = useState(false);
  const [carbsFocused, setCarbsFocused] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
    }
  }, [visible]);

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => { reset(); onClose(); });
  };

  const reset = () => {
    setName(''); setQuantity('1'); setUnit('piece');
    setCalories(''); setProtein(''); setFat(''); setCarbs('');
    setSaveToTemplate(false);
    setEstimating(false); setConfidence('');
  };

  const handleEstimate = async () => {
    if (!name.trim()) return;
    setEstimating(true);
    try {
      const result = await onEstimateCalories(name, quantity, unit);
      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setFat(String(result.fat));
      setCarbs(String(result.carbs));
      setConfidence(result.confidence);
    } catch (e: any) {
      console.error('Failed to estimate:', e);
      Alert.alert('AI Unavailable', e.message || 'An error occurred while estimating with AI. Please try again later.');
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ 
      name: name.trim(), 
      quantity, 
      unit, 
      calories: parseInt(calories) || 0, 
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      saveToTemplate 
    });
    reset();
  };

  const confidenceBadgeColor = () => {
    if (!confidence) return colors.border;
    const lower = confidence.toLowerCase();
    if (lower === 'high') return '#4CAF50';
    if (lower === 'medium') return colors.primary;
    return colors.textLight;
  };

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={animateClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
            {/* Drag handle */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Add Food</Text>
                <Text style={styles.subtitle}>Track what you ate</Text>
              </View>
              <TouchableOpacity onPress={animateClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── Food Name ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Food Name</Text>
                <View style={[styles.inputWrap, nameFocused && styles.inputWrapFocused]}>
                  <Ionicons name="fast-food-outline" size={18} color={nameFocused ? colors.primary : colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Oatmeal, Rice, Apple"
                    placeholderTextColor={colors.textLight}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>
              </View>

              {/* ── Quantity + Unit row ── */}
              <View style={styles.rowGroup}>
                {/* Quantity */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Quantity</Text>
                  <View style={[styles.inputWrap, qtyFocused && styles.inputWrapFocused]}>
                    <TextInput
                      style={[styles.input, { textAlign: 'center', fontWeight: '700' }]}
                      placeholder="1"
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                      onFocus={() => setQtyFocused(true)}
                      onBlur={() => setQtyFocused(false)}
                    />
                  </View>
                </View>

                {/* Stepper */}
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setQuantity(q => String(Math.max(0.5, parseFloat(q || '1') - 0.5)))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="remove" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setQuantity(q => String(parseFloat(q || '1') + 0.5))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Unit chips ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitScroll}>
                  {UNITS.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitChip, unit === u && styles.unitChipActive]}
                      onPress={() => setUnit(u)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* ── AI Estimate button ── */}
              <TouchableOpacity
                style={[styles.estimateBtn, !name.trim() && styles.estimateBtnDisabled]}
                onPress={handleEstimate}
                disabled={!name.trim() || estimating}
                activeOpacity={0.75}
              >
                <View style={styles.estimateIconWrap}>
                  {estimating
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="sparkles" size={16} color="#fff" />
                  }
                </View>
                <Text style={styles.estimateBtnText}>
                  {estimating ? 'Estimating calories…' : 'Estimate with AI'}
                </Text>
                {!estimating && <Ionicons name="arrow-forward" size={16} color={colors.primary} />}
              </TouchableOpacity>

              {/* ── Calories ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Calories</Text>
                <View style={styles.calorieRow}>
                  <View style={[styles.inputWrap, { flex: 1 }, calFocused && styles.inputWrapFocused]}>
                    <TextInput
                      style={[styles.input, { fontWeight: '700', fontSize: 18 }]}
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                      value={calories}
                      onChangeText={setCalories}
                      onFocus={() => setCalFocused(true)}
                      onBlur={() => setCalFocused(false)}
                    />
                  </View>
                  <View style={styles.kcalBadge}>
                    <Text style={styles.kcalText}>kcal</Text>
                  </View>
                </View>

                {confidence ? (
                  <View style={styles.confidenceRow}>
                    <View style={[styles.confidenceDot, { backgroundColor: confidenceBadgeColor() }]} />
                    <Text style={styles.confidenceText}>AI confidence: <Text style={{ fontWeight: '600', color: confidenceBadgeColor() }}>{confidence}</Text></Text>
                  </View>
                ) : null}
              </View>

              {/* ── Macros ── */}
              <View style={styles.macroGrid}>
                {/* Protein */}
                <View style={styles.macroGroup}>
                  <Text style={styles.label}>Protein (g)</Text>
                  <View style={[styles.inputWrap, proteinFocused && styles.inputWrapFocused, styles.macroInputWrap]}>
                    <TextInput
                      style={[styles.input, { fontWeight: '700', textAlign: 'center' }]}
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                      value={protein}
                      onChangeText={setProtein}
                      onFocus={() => setProteinFocused(true)}
                      onBlur={() => setProteinFocused(false)}
                    />
                  </View>
                </View>

                {/* Fat */}
                <View style={styles.macroGroup}>
                  <Text style={styles.label}>Fat (g)</Text>
                  <View style={[styles.inputWrap, fatFocused && styles.inputWrapFocused, styles.macroInputWrap]}>
                    <TextInput
                      style={[styles.input, { fontWeight: '700', textAlign: 'center' }]}
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                      value={fat}
                      onChangeText={setFat}
                      onFocus={() => setFatFocused(true)}
                      onBlur={() => setFatFocused(false)}
                    />
                  </View>
                </View>

                {/* Carbs */}
                <View style={styles.macroGroup}>
                  <Text style={styles.label}>Carbs (g)</Text>
                  <View style={[styles.inputWrap, carbsFocused && styles.inputWrapFocused, styles.macroInputWrap]}>
                    <TextInput
                      style={[styles.input, { fontWeight: '700', textAlign: 'center' }]}
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                      value={carbs}
                      onChangeText={setCarbs}
                      onFocus={() => setCarbsFocused(true)}
                      onBlur={() => setCarbsFocused(false)}
                    />
                  </View>
                </View>
              </View>

              {/* ── Save to My Foods toggle ── */}
              <View style={styles.switchCard}>
                <View style={styles.switchIconWrap}>
                  <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Save to My Foods</Text>
                  <Text style={styles.switchDesc}>Appears in your food library</Text>
                </View>
                <Switch
                  value={saveToTemplate}
                  onValueChange={setSaveToTemplate}
                  trackColor={{ false: colors.border, true: colors.accentSoft }}
                  thumbColor={saveToTemplate ? colors.primary : '#fff'}
                />
              </View>
            </ScrollView>

            {/* ── Footer actions ── */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={animateClose} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrap: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.l,
    borderTopRightRadius: borderRadius.l,
    paddingTop: spacing.s,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    maxHeight: '90%',
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingBottom: spacing.m,
    gap: spacing.m,
  },

  // ── Field group ──
  fieldGroup: {
    gap: spacing.xs,
  },
  rowGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.s,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Input ──
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    minHeight: 48,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputIcon: {
    marginRight: spacing.s,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },

  // ── Stepper ──
  stepperWrap: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: 2,
  },
  stepperBtn: {
    width: 36,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Unit chips ──
  unitScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  unitChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // ── AI Estimate ──
  estimateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.m,
    borderWidth: 1.5,
    borderColor: colors.primary + '35',
    backgroundColor: colors.primary + '10',
    gap: spacing.s,
  },
  estimateBtnDisabled: {
    opacity: 0.45,
  },
  estimateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.s,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  estimateBtnText: {
    ...typography.bodyBold,
    color: colors.primary,
    flex: 1,
  },

  // ── Calories ──
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  kcalBadge: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  kcalText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  confidenceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.textLight,
    fontStyle: 'italic',
  },

  // ── Macros ──
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  macroGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  macroInputWrap: {
    paddingHorizontal: spacing.s,
    minHeight: 44,
  },

  // ── Save to My Foods ──
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.m,
  },
  switchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.s,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  switchDesc: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },

  // ── Footer ──
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.round,
    ...shadows.glow,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveText: {
    ...typography.button,
    color: '#fff',
  },
});