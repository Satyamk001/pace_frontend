import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {colors, fonts, borderRadius, typography, spacing} from '../theme';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message || 'An unexpected error occurred.' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
            <Image 
                source={require('../../assets/appLogo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
            />
            <Text style={styles.title}>Service Unavailable</Text>
            <Text style={styles.message}>
                {this.state.errorMsg.includes('Network') || this.state.errorMsg.includes('Clerk') 
                    ? "We're having trouble connecting to our services.Please check your internet connection or try again later." 
                    : this.state.errorMsg}
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false })}>
                <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE9', // Calm Tech Gradient Start
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,

    color: colors.text,
    marginBottom: spacing.m,
  },
  message: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.m,
  },
  buttonText: {
    ...typography.body,
    color: colors.buttonPrimaryText,
    

  }
});
