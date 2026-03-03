import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import {colors, typography, spacing, borderRadius} from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface JournalBarChartProps {
    data: {
        day: number;
        pain: number;
        fatigue: number;
    }[];
    height?: number;
}

export const JournalBarChart = ({ data, height = 220 }: JournalBarChartProps) => {
    // Config
    const BAR_WIDTH = 6;
    const BAR_GAP = 4; // Gap between Pain and Fatigue bars
    const DAY_WIDTH = 32; // Total width allocated per day
    const CHART_HEIGHT = height - 40; // Reserve space for labels
    const MAX_VALUE = 10; // Assuming 0-10 scale

    // Colors
    const COLOR_PAIN = '#FF9E9E'; // Soft Coral
    const COLOR_FATIGUE = '#A0C4FF'; // Soft Pastel Blue
    
    // Scale helper
    const getY = (value: number) => {
        return CHART_HEIGHT - (value / MAX_VALUE) * CHART_HEIGHT;
    };

    const getBarHeight = (value: number) => {
        return (value / MAX_VALUE) * CHART_HEIGHT;
    };

    // Total width of the chart content
    const chartWidth = Math.max(SCREEN_WIDTH - 64, data.length * DAY_WIDTH + 20);

    return (
        <View style={styles.container}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.s }}
            >
                <Svg width={chartWidth} height={height}>
                    {/* Grid Lines (Horizontal) - Minimal */}
                    {[0, 5, 10].map((val) => (
                        <G key={`grid-${val}`}>
                            <Rect 
                                x="0" 
                                y={getY(val)} 
                                width={chartWidth} 
                                height="1" 
                                fill={colors.border} 
                                opacity={0.3} 
                            />
                        </G>
                    ))}

                    {/* Bars */}
                    {data.map((item, index) => {
                        const x = index * DAY_WIDTH + 10; // Start with some padding
                        
                        // Pain Bar
                        const painHeight = getBarHeight(item.pain);
                        const painY = getY(item.pain);
                        
                        // Fatigue Bar
                        const fatigueHeight = getBarHeight(item.fatigue);
                        const fatigueY = getY(item.fatigue);

                        return (
                            <G key={`day-${index}`}>
                                {/* Pain Bar */}
                                <Rect
                                    x={x}
                                    y={painY}
                                    width={BAR_WIDTH}
                                    height={painHeight}
                                    fill={COLOR_PAIN}
                                    rx={BAR_WIDTH / 2} // Fully rounded top
                                />

                                {/* Fatigue Bar */}
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
                                    y={height - 10}
                                    fontSize="10"
                                    fill={colors.textSecondary}
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
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLOR_PAIN }]} />
                    <Text style={styles.legendText}>Pain</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLOR_FATIGUE }]} />
                    <Text style={styles.legendText}>Fatigue</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.s,
        gap: spacing.l,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: borderRadius.s,
    },
    legendText: {
        ...typography.caption,
        color: colors.textSecondary,
    }
});
