import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../../theme';

interface ProgressBarProps {
    /** 0–100 */
    progress: number;
    /** Track height in px. Default: 8 */
    height?: number;
    /** Track background color */
    trackColor?: string;
    /** Fill color — defaults to theme primary */
    fillColor?: string;
    /** Optional gradient-like shimmer on the fill */
    shimmer?: boolean;
    style?: ViewStyle;
}

/**
 * Smooth, flicker-free progress bar with premium glassmorphic feel.
 * 
 * Features:
 * - Animated native driver-friendly width updates
 * - Glassmorphic track background
 * - Glowing fill with inner shadow simulation
 * - Optional metallic shimmer effect
 */
export const ProgressBar = ({
    progress,
    height = 8,
    trackColor,
    fillColor,
    shimmer = false,
    style,
}: ProgressBarProps) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const shimmerX = useRef(new Animated.Value(-200)).current;

    // Animate fill width whenever progress or trackWidth changes
    useEffect(() => {
        if (trackWidth === 0) return;
        const targetWidth = (Math.min(Math.max(progress, 0), 100) / 100) * trackWidth;
        
        Animated.spring(animatedWidth, {
            toValue: targetWidth,
            useNativeDriver: false, // width cannot use native driver
            tension: 40,
            friction: 7,
            overshootClamping: true,
        }).start();
    }, [progress, trackWidth]);

    // Shimmer sweep animation
    useEffect(() => {
        if (!shimmer) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerX, {
                    toValue: trackWidth + 100, // Sweep past the end
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.delay(1000) // Pause between shimmers
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmer, trackWidth]);

    const resolvedTrack = trackColor ?? 'rgba(0,0,0,0.05)'; // Subtle glass track
    const resolvedFill = fillColor ?? colors.primary;
    const br = height / 2;

    return (
        <View
            style={[styles.track, { height, backgroundColor: resolvedTrack, borderRadius: br }, style]}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
            {/* Fill Container */}
            <Animated.View
                style={{
                    width: animatedWidth,
                    height: '100%',
                    backgroundColor: resolvedFill,
                    borderRadius: br,
                    overflow: 'hidden',
                }}
            >
                {/* Top highlight for 3D/Glass effect */}
                <View style={[styles.highlight, { borderRadius: br }]} />

                {/* Shimmer Effect */}
                {shimmer && (
                    <Animated.View
                        style={[
                            styles.shimmer,
                            { transform: [{ translateX: shimmerX }] },
                        ]}
                    />
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    track: {
        overflow: 'hidden',
        // Optional: Add a very subtle border/shadow for depth on the track itself
        // borderWidth: 0.5,
        // borderColor: 'rgba(0,0,0,0.05)',
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.25)', // Top highlight
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.4)',
        transform: [{ skewX: '-20deg' }], // Angled shimmer
    },
});
