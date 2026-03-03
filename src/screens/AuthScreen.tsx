import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {colors, typography, spacing, borderRadius} from '../theme';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Image } from 'react-native-svg';
import Animated from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
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
        redirectUrl: Linking.createURL('/dashboard'),
      });

      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Ambient background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobCenter} />

      {/* Top section — brand */}
      <View style={styles.brandSection}>
        {/* Logomark */}
        {/* <View style={styles.logomark}>
          <View style={styles.logoInner} />
        </View> */}
        <Animated.Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
        {/* <Text style={styles.wordmark}>PACE</Text> */}
        <Text style={styles.tagline}>Your gentle productivity companion.</Text>
      </View>

      {/* Bottom section — card */}
      <View style={styles.cardSection}>
        {/* Pill divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>Get started</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleSignIn}
          activeOpacity={0.85}
        >
          {/* Google G icon */}
          <View style={styles.googleIconWrapper}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legal}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text> &{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

const BLOB_SIZE = width * 0.72;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
    overflow: 'hidden',
  },
  logo: {
    width: 350,
    height: 350,
    // marginBottom: spacing.l,
  },
  // ── Ambient blobs ──────────────────────────────────────────
  blobTopRight: {
    position: 'absolute',
    top: -BLOB_SIZE * 0.35,
    right: -BLOB_SIZE * 0.25,
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE,
    backgroundColor: colors.accentSoft,
    opacity: 0.9,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: height * 0.12,
    left: -BLOB_SIZE * 0.4,
    width: BLOB_SIZE * 0.85,
    height: BLOB_SIZE * 0.85,
    borderRadius: BLOB_SIZE,
    backgroundColor: colors.accentSoft,
    opacity: 0.6,
  },
  blobCenter: {
    position: 'absolute',
    top: height * 0.28,
    right: -BLOB_SIZE * 0.55,
    width: BLOB_SIZE * 0.65,
    height: BLOB_SIZE * 0.65,
    borderRadius: BLOB_SIZE,
    backgroundColor: colors.accentSoft,
    opacity: 0.35,
  },

  // ── Brand ─────────────────────────────────────────────────
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    position:'relative'
  },

  logomark: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.m,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.l,
  },
  logoInner: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.s,
    borderWidth: 3,
    borderColor: colors.buttonPrimaryText,
    borderTopRightRadius: 10,
    transform: [{ rotate: '15deg' }],
  },

  wordmark: {
    fontSize: 44,
    color: colors.text,
    letterSpacing: 10,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.s,
    textAlign: 'center',
    letterSpacing: 0.2,
    position:'absolute',
    top:450
  },

  // ── Card section ──────────────────────────────────────────
  cardSection: {
    marginHorizontal: spacing.l,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
    gap: spacing.s,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // ── Google button ─────────────────────────────────────────
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  googleIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  googleG: {
    ...typography.body,
    color: '#FFF',
    

    lineHeight: 18,
  },
  googleButtonText: {
    flex: 1,
    textAlign: 'center',
    ...typography.body,

    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginRight: 28, // visually center text accounting for icon width
  },

  // ── Legal ─────────────────────────────────────────────────
  legal: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  legalLink: {
    color: colors.accent,
  },
});