import React, { useRef } from 'react';
import { Pressable, Animated, PressableProps, Platform, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ScalePressableProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;
    haptic?: boolean;
}

export const ScalePressable = ({ 
    children, 
    style, 
    scaleTo = 0.96, 
    haptic = true,
    onPress,
    ...props 
}: ScalePressableProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (haptic && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Animated.spring(scaleAnim, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={style}
            {...props}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
