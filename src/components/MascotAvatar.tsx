import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import {colors, typography, spacing, borderRadius} from '../theme';

interface MascotAvatarProps {
    size?: 'small' | 'medium' | 'large';
    imageUrl?: string | null;
    shape?: 'circle' | 'square';
}

export const MascotAvatar = ({ size = 'medium', imageUrl, shape = 'circle' }: MascotAvatarProps) => {
    const getSize = () => {
        switch (size) {
            case 'small': return 40;
            case 'large': return 120;
            default: return 80;
        }
    };

    const dimension = getSize();
    const radius = shape === 'square' ? 16 : dimension / 2;

    return (
        <View style={[
            styles.container, 
            { width: dimension, height: dimension, borderRadius: radius },
            shape === 'square' && styles.squareGlow
        ]}>
            {imageUrl ? (
                <Image 
                    source={{ uri: imageUrl }} 
                    style={{ width: dimension, height: dimension, borderRadius: radius }} 
                />
            ) : (
                <Text style={{ fontSize: dimension * 0.5 }}>👤</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    squareGlow: {
        borderWidth: 2,
        borderColor: colors.surfaceSoft,
    }
});
