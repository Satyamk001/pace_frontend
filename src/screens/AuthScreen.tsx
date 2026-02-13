import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen = () => {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleSignIn = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'myapp' }),
      });

      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to PACE</Text>
        <Text style={styles.subtitle}>Your gentle productivity companion.</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: shadows.soft.shadowColor,
    shadowOffset: shadows.soft.shadowOffset,
    shadowOpacity: shadows.soft.shadowOpacity,
    elevation: shadows.soft.elevation,
  },
  title: {
    ...typography.header,
    color: colors.primary,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.l,
  },
  buttonText: {
    ...typography.subheader,
    color: colors.text,
  },
});
