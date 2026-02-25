import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

/**
 * Calm Tech Stack Transition
 * Slides up from the bottom, stacking over the previous screen to maintain context.
 */
export const standardSlide: NativeStackNavigationOptions = {
    animation: 'slide_from_bottom',
    presentation: 'modal', // Native iOS card stack presentation (preserves previous header slightly in background)
    animationDuration: 400, // Deliberate, fluid timing
    gestureEnabled: true,
    gestureDirection: 'vertical',
    // Android matching
    ...(Platform.OS === 'android' && {
        animation: 'slide_from_bottom',
    }),
};

/**
 * Modal Transition
 * Slides up from the bottom for creation flows.
 */
export const modalSlide: NativeStackNavigationOptions = {
    presentation: 'modal',
    animation: 'slide_from_bottom',
    gestureEnabled: true,
    gestureDirection: 'vertical',
};

/**
 * Transparent Modal (for overlays)
 */
export const transparentModal: NativeStackNavigationOptions = {
    presentation: 'transparentModal',
    animation: 'fade',
    headerShown: false,
};

/**
 * Fade Transition
 * Useful for switching contexts without directionality.
 */
export const fadeTransition: NativeStackNavigationOptions = {
    animation: 'fade',
    animationDuration: 200,
};
