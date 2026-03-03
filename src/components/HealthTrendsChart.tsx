import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {colors, typography, spacing, borderRadius} from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface HealthTrendsChartProps {
    data: {
        day: number | string;
        pain: number;
        fatigue: number;
        isToday?: boolean;
    }[];
    height?: number;
}

export const HealthTrendsChart = ({ data, height = 240 }: HealthTrendsChartProps) => {
    // Config
    const BAR_WIDTH = 8; // Slightly thicker for "soft thick lines"
    const BAR_GAP = 6;
    const DAY_WIDTH = 44; // More spacing for "Clean spacious" look
    const CHART_HEIGHT = height - 50; // Reserve space for labels
    const MAX_VALUE = 10;

    // Pastel Colors
    const COLOR_PAIN = '#FFB5B5'; // Soft Pastel Red
    const COLOR_FATIGUE = '#B5D8FF'; // Soft Pastel Blue
    
    // Scale helper
    const getY = (value: number) => {
        return CHART_HEIGHT - (value / MAX_VALUE) * CHART_HEIGHT;
    };

    const getBarHeight = (value: number) => {
        return (value / MAX_VALUE) * CHART_HEIGHT;
    };

    // Calculate width
    const chartWidth = Math.max(SCREEN_WIDTH - 40, data.length * DAY_WIDTH + 20);

    return (
        <View style={styles.container}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.s }}
            >
                <Svg width={chartWidth} height={height}>
                    {/* Grid Lines */}
                    {[0, 2, 4, 6, 8, 10].map((val) => (
                        <G key={`grid-${val}`}>
                            <Line 
                                x1="0" 
                                y1={getY(val)} 
                                x2={chartWidth} 
                                y2={getY(val)} 
                                stroke={colors.border} 
                                strokeWidth="1" 
                                strokeDasharray="5, 5" // Dashed for lightness
                                opacity={0.4} 
                            />
                            {/* Axis Label */}
                             <SvgText
                                x="0"
                                y={getY(val) - 4}
                                fontSize="10"
                                fill={colors.textLight}
                                opacity={0.6}
                            >
                                {val}
                            </SvgText>
                        </G>
                    ))}

                    {/* Bars */}
                    {data.map((item, index) => {
                        const x = index * DAY_WIDTH + 20;
                        
                        // Pain Bar
                        const painHeight = getBarHeight(item.pain);
                        const painY = getY(item.pain);
                        
                        // Fatigue Bar
                        const fatigueHeight = getBarHeight(item.fatigue);
                        const fatigueY = getY(item.fatigue);

                        return (
                            <G key={`day-${index}`}>
                                {/* Background Highlight for Today if needed */}
                                {item.isToday && (
                                    <Rect
                                        x={x - 8}
                                        y={0}
                                        width={BAR_WIDTH * 2 + BAR_GAP + 16}
                                        height={CHART_HEIGHT}
                                        fill={colors.primary}
                                        opacity={0.05}
                                        rx={8}
                                    />
                                )}

                                {/* Pain Bar - Fully Rounded */}
                                <Rect
                                    x={x}
                                    y={painY}
                                    width={BAR_WIDTH}
                                    height={painHeight}
                                    fill={COLOR_PAIN}
                                    rx={BAR_WIDTH / 2}
                                />

                                {/* Fatigue Bar - Fully Rounded */}
                                <Rect
                                    x={x + BAR_WIDTH + BAR_GAP}
                                    y={fatigueY}
                                    width={BAR_WIDTH}
                                    height={fatigueHeight}
                                    fill={COLOR_FATIGUE}
                                    rx={BAR_WIDTH / 2}
                                />

                                {/* Day Label */}
                                <SvgText
                                    x={x + (BAR_WIDTH * 2 + BAR_GAP) / 2}
                                    y={height - 20}
                                    fontSize="12"
                                    fill={item.isToday ? colors.primary : colors.textSecondary}
                                    fontWeight={item.isToday ? "bold" : "normal"}
                                    textAnchor="middle"
                                >
                                    {item.day}
                                </SvgText>
                            </G>
                        );
                    })}
                </Svg>
            </ScrollView>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
                <View style={[styles.legendItem, { borderColor: COLOR_PAIN }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.accent} />
                    <Text style={styles.legendText}>Pain</Text>
                </View>
                <View style={[styles.legendItem, { borderColor: COLOR_FATIGUE }]}>
                    <Ionicons name="battery-half" size={16} color={colors.accent} />
                    <Text style={styles.legendText}>Fatigue</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'transparent', // Ensure it blends
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: spacing.m,
        gap: spacing.m,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surface, // Chip style
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: borderRadius.s,
    },
    legendText: {
        ...typography.caption,
        color: colors.textSecondary,
    }
});
