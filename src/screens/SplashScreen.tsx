import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence,
  withSpring,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Logo Animation: Fade in and spring scale
    logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Text Animation: Staggered reveal
    textOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    textTranslateY.value = withDelay(800, withSpring(0, { damping: 15 }));

    // Exit Animation
    containerOpacity.value = withDelay(2500, withTiming(0, { 
      duration: 600, 
      easing: Easing.inOut(Easing.quad) 
    }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={[colors.background, colors.surfaceSoft]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <Animated.Image
          source={require('../../assets/appLogo.png')}
          style={[styles.logo, logoStyle]}
          resizeMode="contain"
        />
        
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Animated.Text style={styles.brandTitle}>PACE</Animated.Text>
          <Animated.Text style={styles.tagline}>Your Health, At Your Rhythm.</Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: spacing.l,
    // Add a light shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  textContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    ...typography.h1,
    fontSize: 42,
    letterSpacing: 8,
    color: colors.primary,
    fontWeight: '900',
  },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 1,
    opacity: 0.7,
  },
});
