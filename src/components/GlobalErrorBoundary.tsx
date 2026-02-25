import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, fonts, shadows, borderRadius } from '../theme';

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
    padding: 20,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.m,
    ...shadows.soft,
  },
  buttonText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  }
});
