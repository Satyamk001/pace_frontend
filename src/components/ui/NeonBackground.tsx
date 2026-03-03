import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { colors } from '../../theme';

const { width, height } = Dimensions.get('window');

interface BlobProps {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  duration: number;
  delay?: number;
}

const AnimatedBlob = ({ color, size, initialX, initialY, duration, delay = 0 }: BlobProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 100 - 50, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 100 - 50, {
          duration: duration * 1.2,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.3, {
          duration: duration * 0.8,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.25, {
          duration: duration * 1.5,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
          left: initialX,
          top: initialY,
          // Blur effect is computationally expensive, using a fallback for web if needed
          // but react-native-reanimated handles it well on native.
          // In some environments, we might use a pre-rendered blurred image if perf is an issue.
        },
        animatedStyle,
      ]}
    />
  );
};

export const NeonBackground = () => {
  const logoScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withRepeat(
      withTiming(1.05, {
        duration: 15000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: 0.03,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dynamic Background Logo Silhouette */}
      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../../../assets/appLogo.png')}
          style={[styles.backgroundLogo, logoStyle]}
          resizeMode="contain"
          tintColor={colors.palette.lavender}
        />
      </View>

      {/* Subtle Lavender Glow (Top Left) */}
      <AnimatedBlob 
        color={colors.palette.lavender} 
        size={width * 0.8} 
        initialX={-width * 0.2} 
        initialY={-height * 0.1} 
        duration={8000} 
      />
      
      {/* Subtle Olive Glow (Bottom Rightish) */}
      <AnimatedBlob 
        color={colors.palette.olive} 
        size={width * 0.9} 
        initialX={width * 0.3} 
        initialY={height * 0.4} 
        duration={10000} 
        delay={1000}
      />

      {/* Another Lavender Glow (Centerish) */}
      <AnimatedBlob 
        color={colors.palette.lavenderLight} 
        size={width * 0.6} 
        initialX={width * 0.1} 
        initialY={height * 0.7} 
        duration={12000} 
        delay={2000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    // Apply heavy blur for neon effect
    // Note: 'blurRadius' is only supported on Image components in RM, 
    // for View we might need to use shadows or a different approach for true blur.
    // However, on Web and some RN versions, shadow can simulate this.
    ...Platform.select({
      ios: {
        shadowColor: 'black', // Doesn't matter, just need the shadow props
        shadowOpacity: 0.1,
        shadowRadius: 100,
      },
      android: {
        elevation: 0,
      },
    }),
    // Using opacity + size + color to simulate the glow if blur is hard to achieve purely with View
    // In a real app, we might use react-native-skia or an expo-blur View
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundLogo: {
    width: width * 1.5,
    height: width * 1.5,
    opacity: 0.05,
  },
});
