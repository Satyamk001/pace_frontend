import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface FoodActionMenuProps {
  visible: boolean;
  foodName: string;
  isFavorite: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}

export const FoodActionMenu: React.FC<FoodActionMenuProps> = ({
  visible, foodName, isFavorite, onClose, onFavorite, onDelete,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 240,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      scaleAnim.setValue(0.96);
    }
  }, [visible]);

  const animateClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 210,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      callback?.();
    });
  };

  const handleFavorite = () => animateClose(onFavorite);
  const handleDelete = () => animateClose(onDelete);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => animateClose()}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
          styles.sheetWrapper,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }
        ]}>
          {/* Actions Group */}
          <View style={styles.actionsGroup}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.dragPill} />
              <Text style={styles.title} numberOfLines={1}>{foodName}</Text>
            </View>

            <View style={styles.divider} />

            {/* Favorite */}
            <TouchableOpacity style={styles.action} onPress={handleFavorite} activeOpacity={0.65}>
              <View style={[
                styles.iconWrap,
                isFavorite ? styles.iconWrapFav : styles.iconWrapDefault
              ]}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? '#fff' : colors.textSecondary}
                />
              </View>
              <Text style={styles.actionText}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} style={styles.chevron} />
            </TouchableOpacity>

            <View style={styles.innerDivider} />

            {/* Delete */}
            <TouchableOpacity style={styles.action} onPress={handleDelete} activeOpacity={0.65}>
              <View style={styles.iconWrapDelete}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </View>
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} style={styles.chevron} />
            </TouchableOpacity>
          </View>

          {/* Cancel — separate pill */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => animateClose()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  sheetWrapper: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xl,
    gap: spacing.s,
  },

  actionsGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },

  header: {
    alignItems: 'center',
    paddingTop: spacing.s,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.l,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  innerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.l + 44, // aligns past the icon
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.l,
    gap: spacing.m,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapDefault: {
    backgroundColor: colors.surfaceSoft,
  },
  iconWrapFav: {
    backgroundColor: colors.error,
  },
  iconWrapDelete: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0EE',
  },

  actionText: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  deleteText: {
    color: colors.error,
  },

  chevron: {
    marginLeft: 'auto' as any,
  },

  // Cancel pill — separate card
  cancelBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 16,
  },
});