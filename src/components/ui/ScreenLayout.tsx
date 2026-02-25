import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '../../theme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  useGradient?: boolean | 'hero';
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export const ScreenLayout = ({ 
  children, 
  style, 
  useGradient = false,
  edges = ['top', 'left', 'right']
}: ScreenLayoutProps) => {
  const insets = useSafeAreaInsets();

  const containerStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  if (useGradient) {
    // If the useGradient is strictly 'hero', we fade from Surface to Background (vertical)
    // If true/default, we use the diagonal Global Depth (Parchment Layer)
    const isHero = useGradient === 'hero';
    const gradientColors = isHero ? colors.gradients.surface : colors.gradients.background;
    
    return (
      <View style={[styles.container, containerStyle, style]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={gradientColors as unknown as readonly [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
          start={isHero ? { x: 0.5, y: 0 } : { x: 0, y: 0 }}
          end={isHero ? { x: 0.5, y: 1 } : { x: 1, y: 1 }}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, containerStyle, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
