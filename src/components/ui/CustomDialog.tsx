import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';

interface DialogAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  actions?: DialogAction[];
  onClose?: () => void; // Optional explicit close handler if needed outside actions
}

const { width } = Dimensions.get('window');

export const CustomDialog = ({ visible, title, message, actions = [], onClose }: CustomDialogProps) => {
  if (!visible) return null;

  // Default to a single "OK" button if no actions provided
  const dialogActions = actions.length > 0 ? actions : [{ text: 'OK', onPress: onClose, style: 'default' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actionsContainer}>
            {dialogActions.map((action, index) => {
              const isDestructive = action.style === 'destructive';
              const isCancel = action.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    isDestructive && styles.destructiveButton,
                    isCancel && styles.cancelButton,
                  ]}
                  onPress={() => {
                    if (action.onPress) action.onPress();
                    if (onClose && !action.onPress) onClose(); // Fallback close
                  }}
                >
                  <Text style={[
                      styles.actionText, 
                      isDestructive && styles.destructiveText,
                      isCancel && styles.cancelText
                  ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: width * 0.85,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.l,
    ...shadows.medium,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: spacing.l,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.m,
    flexWrap: 'wrap', // Allow wrapping if many buttons
  },
  actionButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
    minWidth: 80,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: colors.error + '1A',
  },
  cancelButton: {
    // Transparent or light gray if needed
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  destructiveText: {
    color: colors.error,
  },
  cancelText: {
      color: colors.textLight
  }
});
