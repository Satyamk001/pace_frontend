import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, shadows } from '../theme';

interface MascotAvatarProps {
    size?: 'small' | 'medium' | 'large';
    imageUrl?: string | null;
}

export const MascotAvatar = ({ size = 'medium', imageUrl }: MascotAvatarProps) => {
    const getSize = () => {
        switch (size) {
            case 'small': return 40;
            case 'large': return 120;
            default: return 80;
        }
    };

    const dimension = getSize();

    return (
        <View style={[
            styles.container, 
            { width: dimension, height: dimension, borderRadius: dimension / 2 }
        ]}>
            {imageUrl ? (
                <Image 
                    source={{ uri: imageUrl }} 
                    style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }} 
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
        ...shadows.medium,
    }
});
