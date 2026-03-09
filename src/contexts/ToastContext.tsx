import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

type ToastType = 'success' | 'error';

interface ToastContextData {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('success');
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(150)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    
    // Use a ref to store the current timeout so we can cancel it if a new toast arrives
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (msg: string, toastType: ToastType = 'success') => {
        setMessage(msg);
        setType(toastType);
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setVisible(true);

        // Pop up
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 8,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();

        // Dismiss after 3s
        timeoutRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 150,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => setVisible(false));
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        { transform: [{ translateY }], opacity },
                        type === 'success' ? styles.successBg : styles.errorBg
                    ]}
                    pointerEvents="none" // Don't block interactions behind toast
                >
                    <Ionicons 
                        name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                        size={24} 
                        color="#fff" 
                    />
                    <Text style={styles.toastText}>{message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 90, // Above bottom nav
        left: spacing.lg,
        right: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
        zIndex: 9999,
    },
    successBg: {
        backgroundColor: colors.primary, // Greenish success theme
    },
    errorBg: {
        backgroundColor: '#FF3B30', // Red error
    },
    toastText: {
        ...typography.body,
        color: '#fff',
        marginLeft: spacing.sm,
        flex: 1,
        fontWeight: '500',
    }
});
