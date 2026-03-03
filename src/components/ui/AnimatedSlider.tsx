import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, LayoutChangeEvent } from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';

interface AnimatedSliderProps {
    value: number; // 0 to 100
    onValueChange: (val: number) => void;
}

export const AnimatedSlider = ({ value, onValueChange }: AnimatedSliderProps) => {
    const [sliderWidth, setSliderWidth] = useState(0);
    const panX = useRef(new Animated.Value(0)).current;

    // Keep latest values in refs so panResponder closure always reads fresh data
    const sliderWidthRef = useRef(0);
    const valueRef = useRef(value);
    const startXRef = useRef(0); // panX value at gesture start

    // Sync ref when value changes externally
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    // Move thumb when value or sliderWidth changes
    useEffect(() => {
        if (sliderWidth > 0) {
            const pos = (value / 100) * sliderWidth;
            panX.setValue(pos);
        }
    }, [value, sliderWidth]);

    const handleLayout = (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setSliderWidth(w);
        sliderWidthRef.current = w;
        // Reposition thumb immediately after layout
        const pos = (valueRef.current / 100) * w;
        panX.setValue(pos);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Snapshot panX at gesture start — avoids stale closure
                startXRef.current = (panX as any)._value ?? 0;
            },
            onPanResponderMove: (_, gestureState) => {
                const w = sliderWidthRef.current;
                if (w <= 0) return;

                let newX = startXRef.current + gestureState.dx;
                newX = Math.max(0, Math.min(newX, w));

                panX.setValue(newX);
                const newValue = Math.round((newX / w) * 100);
                onValueChange(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                const w = sliderWidthRef.current;
                if (w <= 0) return;

                let newX = startXRef.current + gestureState.dx;
                newX = Math.max(0, Math.min(newX, w));
                const newValue = Math.round((newX / w) * 100);
                onValueChange(newValue);
            }
        })
    ).current;

    return (
        <View style={styles.container} onLayout={handleLayout}>
            <View style={styles.track}>
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            width: panX.interpolate({
                                inputRange: [0, Math.max(1, sliderWidth)],
                                outputRange: ['0%', '100%'],
                                extrapolate: 'clamp'
                            })
                        }
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
        backgroundColor: colors.border,
        borderRadius: borderRadius.s,
        overflow: 'hidden',
        width: '100%',
    },
    fill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.s,
    },
    thumb: {
        position: 'absolute',
        left: -12,
        width: 24,
        height: 24,
        borderRadius: borderRadius.m,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    innerThumb: {
        width: 8,
        height: 8,
        borderRadius: borderRadius.s,
        backgroundColor: colors.primary,
    }
});
