import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

/**
 * Standard "Shuttle-style" Slide Transition
 * Slides in from the right with a slight scale and opacity effect on the previous screen.
 */
export const standardSlide: NativeStackNavigationOptions = {
    animation: 'slide_from_right',
    presentation: 'card', 
    animationDuration: 300, 
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    animationTypeForReplace: 'push',
    // Android specific to ensure smooth slide
    ...(Platform.OS === 'android' && {
        animation: 'slide_from_right',
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
