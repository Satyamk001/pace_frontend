import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, LayoutChangeEvent, Dimensions } from 'react-native';
import { colors, shadows, borderRadius } from '../../theme';

interface AnimatedSliderProps {
    value: number; // 0 to 100
    onValueChange: (val: number) => void;
    width?: number;
}

export const AnimatedSlider = ({ value, onValueChange, width = 300 }: AnimatedSliderProps) => {
    const [sliderWidth, setSliderWidth] = useState(width);
    const panX = useRef(new Animated.Value(0)).current;

    // Convert percentage value to position
    useEffect(() => {
        const position = (value / 100) * sliderWidth;
        panX.setValue(position);
    }, [value, sliderWidth]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Optional: Scale up thumb on press
            },
            onPanResponderMove: (_, gestureState) => {
                let newX = gestureState.dx + (value / 100) * sliderWidth;
                if (newX < 0) newX = 0;
                if (newX > sliderWidth) newX = sliderWidth;
                
                panX.setValue(newX);
                const newValue = Math.round((newX / sliderWidth) * 100);
                onValueChange(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                // Finalize value
                let newX = gestureState.dx + (value / 100) * sliderWidth;
                if (newX < 0) newX = 0;
                if (newX > sliderWidth) newX = sliderWidth;
                const newValue = Math.round((newX / sliderWidth) * 100);
                onValueChange(newValue);
            }
        })
    ).current;

    // Direct touch on track
    const handleLayout = (e: LayoutChangeEvent) => {
        setSliderWidth(e.nativeEvent.layout.width);
    };

    return (
        <View style={styles.container} onLayout={handleLayout}>
            <View style={styles.track}>
                <Animated.View 
                    style={[
                        styles.fill, 
                        { width: panX.interpolate({
                            inputRange: [0, sliderWidth],
                            outputRange: [0, sliderWidth], // or just '0%' to '100%' if we mapped it 0-1
                            extrapolate: 'clamp'
                        }) }
                    ]} 
                />
            </View>
            <Animated.View 
                {...panResponder.panHandlers}
                style={[
                    styles.thumb,
                    { transform: [{ translateX: panX }] }
                ]}
            >
                {/* Optional: Grip lines or inner circle */}
                <View style={styles.innerThumb} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: 'center',
        width: '100%',
    },
    track: {
        height: 8,
        backgroundColor: colors.surface, // or darker shade
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border
    },
    fill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    thumb: {
        position: 'absolute',
        left: -12, // Half width to center
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        ...shadows.soft,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    innerThumb: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary
    }
});
