import React, { useRef, useEffect } from 'react';
import { Animated, Platform, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

interface KeyboardAwareLayoutProps extends ViewProps {
    style?: StyleProp<ViewStyle>;
}

export const KeyboardAwareLayout: React.FC<KeyboardAwareLayoutProps> = ({ children, style, ...props }) => {
    const keyboardHeight = useKeyboardHeight();
    const insets = useSafeAreaInsets();
    const paddingBottomAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // When keyboard is visible, compensate by adding bottom padding minus the safe area inset,
        // so we don't accidentally double pad the bottom spacing when the keyboard retracts/displays.
        let targetPadding = keyboardHeight > 0
            ? Math.max(0, keyboardHeight - (Platform.OS === 'ios' ? insets.bottom : 0))
            : 0;

        Animated.timing(paddingBottomAnim, {
            toValue: targetPadding,
            duration: Platform.OS === 'ios' ? 250 : 150,
            useNativeDriver: false, // Layout animations cannot use useNativeDriver
        }).start();
    }, [keyboardHeight, insets.bottom]);

    return (
        <Animated.View style={[styles.container, style, { paddingBottom: paddingBottomAnim }]} {...props}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
