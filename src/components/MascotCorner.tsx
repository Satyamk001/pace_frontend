import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {colors, typography, spacing, borderRadius} from '../theme';

interface MascotCornerProps {
  mood?: 'HAPPY' | 'SLEEPY' | 'Working';
  onPress?: () => void;
}

export const MascotCorner = ({ mood = 'HAPPY', onPress }: MascotCornerProps) => {
  // Using a placeholder emoji or simple shape until we have real assets
  const getMascot = () => {
      switch(mood) {
          case 'SLEEPY': return '💤';
          case 'Working': return '👓';
          default: return '✨';
      }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.bubble}>
         <Text style={styles.mascot}>🐰</Text>
         <View style={styles.moodBadge}>
             <Text style={styles.moodIcon}>{getMascot()}</Text>
         </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  bubble: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  mascot: {
      ...typography.h1,
  },
  moodBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.accent,
      width: 24,
      height: 24,
      borderRadius: borderRadius.m,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'white',
  },
  moodIcon: {
      ...typography.caption,
  }
});
