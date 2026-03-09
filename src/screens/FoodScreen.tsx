import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';

import { BackButton } from '../components/ui/BackButton';
import { FoodSummaryCard } from '../components/ui/FoodSummaryCard';
import { FoodTemplateItem } from '../components/ui/FoodTemplateItem';
import { AddFoodModal } from '../components/ui/AddFoodModal';
import { FoodActionMenu } from '../components/ui/FoodActionMenu';
import { EmptyState } from '../components/ui/EmptyState';

interface DailyEntry {
  id: string;
  template_id: string | null;
  name: string;
  quantity: string;
  unit: string;
  calories: number;
  is_eaten: boolean;
  is_adhoc: boolean;
}

// ── Skeleton loader for list items ──────────────────────────
const SkeletonItem = () => {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View style={[styles.skeletonItem, { opacity }]}>
      <View style={styles.skeletonIcon} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '55%' }]} />
      </View>
      <View style={styles.skeletonBadge} />
    </Animated.View>
  );
};

// ── Section header ───────────────────────────────────────────
const SectionHeader = ({
  icon, label, color, count,
}: { icon: any; label: string; color: string; count: number }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIconWrap, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={15} color={color} />
    </View>
    <Text style={styles.sectionTitle}>{label}</Text>
    <View style={[styles.sectionBadge, { backgroundColor: color + '18' }]}>
      <Text style={[styles.sectionBadgeText, { color }]}>{count}</Text>
    </View>
  </View>
);

// ── Main screen ──────────────────────────────────────────────
export const FoodScreen = () => {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const api = createApiService(getToken);

  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  const fabScale = React.useRef(new Animated.Value(0)).current;
  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [])
  );

  // Pop FAB in once data loads
  useEffect(() => {
    if (!loading) {
      Animated.spring(fabScale, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const fetchEntries = async () => {
    try {
      const data = await api.getDailyFoodEntries(today);
      setEntries(data || []);
    } catch (error) {
      console.error('Failed to fetch food entries', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggle = async (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_eaten: !e.is_eaten } : e));
    try {
      await api.toggleFoodEaten(id);
    } catch (error) {
      console.error('Failed to toggle food:', error);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, is_eaten: !e.is_eaten } : e));
    }
  };

  const handleAddFood = async (data: {
    name: string; quantity: string; unit: string;
    calories: number; saveToTemplate: boolean;
  }) => {
    setShowAddModal(false);
    try {
      await api.addAdhocFoodEntry({ date: today, ...data });
      fetchEntries();
    } catch (error) {
      console.error('Failed to add food:', error);
    }
  };

  const handleEstimateCalories = async (name: string, quantity: string, unit: string) =>
    await api.estimateCalories(name, quantity, unit);

  const handleItemPress = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) setSelectedEntry(entry);
  };

  const handleFavorite = async () => {
    if (!selectedEntry) return;
    try {
      if (selectedEntry.template_id) {
        await api.deleteFoodTemplate(selectedEntry.template_id);
        setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, template_id: null } : e));
      } else {
        const template = await api.addFoodTemplate({
          name: selectedEntry.name,
          defaultQuantity: selectedEntry.quantity,
          unit: selectedEntry.unit,
          calories: selectedEntry.calories,
        });
        setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, template_id: template.id } : e));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    const id = selectedEntry.id;
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await api.deleteDailyFoodEntry(id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      fetchEntries();
    }
  };

  const templateEntries = entries.filter(e => !e.is_adhoc);
  const adhocEntries = entries.filter(e => e.is_adhoc);
  const eatenEntries = entries.filter(e => e.is_eaten);
  const totalCalories = eatenEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

  // Progress ratio (0–1)
  const progress = entries.length ? eatenEntries.length / entries.length : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Food & Diet</Text>
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchEntries(); }}
              tintColor={colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary card ── */}
          <FoodSummaryCard
            totalCalories={totalCalories}
            eatenCount={eatenEntries.length}
            totalCount={entries.length}
          />

          {/* ── Daily progress bar ── */}
          {entries.length > 0 && (
            <View style={styles.progressCard}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Today's progress</Text>
                <Text style={styles.progressFraction}>
                  <Text style={styles.progressEaten}>{eatenEntries.length}</Text>
                  {' / '}{entries.length} items
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
              </View>
            </View>
          )}

          {/* ── Skeleton while loading ── */}
          {loading && (
            <View style={styles.section}>
              {[0, 1, 2].map(i => <SkeletonItem key={i} />)}
            </View>
          )}

          {/* ── My Foods ── */}
          {!loading && templateEntries.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                icon="bookmark-outline"
                label="My Foods"
                color={colors.primary}
                count={templateEntries.length}
              />
              <View style={styles.list}>
                {templateEntries.map(item => (
                  <FoodTemplateItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    quantity={item.quantity}
                    unit={item.unit}
                    calories={item.calories}
                    isEaten={item.is_eaten}
                    onToggle={handleToggle}
                    onPress={handleItemPress}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Extra Items ── */}
          {!loading && adhocEntries.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                icon="add-circle-outline"
                label="Extra Items"
                color={colors.accentDark}
                count={adhocEntries.length}
              />
              <View style={styles.list}>
                {adhocEntries.map(item => (
                  <FoodTemplateItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    quantity={item.quantity}
                    unit={item.unit}
                    calories={item.calories}
                    isEaten={item.is_eaten}
                    isAdhoc
                    onToggle={handleToggle}
                    onPress={handleItemPress}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Empty state ── */}
          {!loading && entries.length === 0 && (
            <EmptyState
              icon="restaurant-outline"
              title="No foods yet"
              message="Add your regular foods to build your daily checklist. They'll appear here every day."
            />
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── FAB ── */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Modals ── */}
      <AddFoodModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddFood}
        onEstimateCalories={handleEstimateCalories}
      />
      <FoodActionMenu
        visible={!!selectedEntry}
        foodName={selectedEntry?.name || ''}
        isFavorite={!!selectedEntry?.template_id}
        onClose={() => setSelectedEntry(null)}
        onFavorite={handleFavorite}
        onDelete={handleDeleteEntry}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    gap: spacing.s,
  },
  backButton: {
    marginRight: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    lineHeight: undefined,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 1,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Scroll content ──
  content: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
  },

  // ── Progress bar ──
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  progressFraction: {
    ...typography.caption,
    color: colors.textLight,
  },
  progressEaten: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // ── Section ──
  section: {
    marginBottom: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  sectionBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  list: {
    gap: spacing.s,
  },

  // ── Skeleton ──
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.s,
    backgroundColor: colors.border,
  },
  skeletonLine: {
    height: 12,
    width: '75%',
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  skeletonBadge: {
    width: 48,
    height: 24,
    borderRadius: borderRadius.round,
    backgroundColor: colors.border,
  },

  // ── FAB ──
  fabWrap: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.l,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});