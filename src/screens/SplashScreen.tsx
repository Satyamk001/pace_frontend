import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.1)).current; // Start very small
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation Sequence
    Animated.sequence([
      // 1. Logo Fade In & Scale Up dramatically
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1.5, // Scale to 1.5x (Large)
          friction: 5,
          tension: 20,
          useNativeDriver: true,
        }),
      ]),
      // 2. Hold
      Animated.delay(1200),
      // 3. Fade Out Everything
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.centerContent}>
        <Animated.Image
          source={require('../../assets/splash-icon.png')}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  logo: {
    width: 350, // Base size
    height: 350,
  },
});
