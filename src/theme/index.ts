import { Dimensions } from 'react-native';

// ============================================================
// RESPONSIVE SCALING UTILITIES
// ============================================================
const { width } = Dimensions.get('window');
const guidelineBaseWidth = 390;

export const scale = (size: number) =>
  Math.min(width / guidelineBaseWidth, 1) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// ============================================================
// STRICT COLOR PALETTE (ONLY THESE COLORS + SHADES)
// ============================================================
const palette = {
  baseBackground: '#F6F8F0',

  // NEW Primary Accent — Dusty Blue
  lavender: '#5F7DB8',
  olive: '#9BA146',
  white: '#FFFFFF',
  black: '#000000',

  // Derived shades (lighter/darker only)
  lavenderDark: '#4A6599',
  lavenderLight: '#D6E0F5',

  oliveDark: '#83883D',
  oliveLight: '#C4C878',

  backgroundSoft: '#FAFBF6',
  borderSoft: '#E4E8DA',
};
// ============================================================
// EXPORTED COLORS — SEMANTIC SYSTEM
// ============================================================

export const colors = {
  // Background Layers
  background: palette.baseBackground,
  surface: palette.white,
  surfaceSoft: palette.backgroundSoft,
  border: palette.borderSoft,
  divider: palette.borderSoft,
  inputBackground: palette.white,

  // Typography
  text: palette.black,
  textPrimary: palette.black,
  textSecondary: '#4A4A4A', // darker grey derived from black
  textLight: '#777777',

  // Primary Branding
  primary: palette.lavender,
  accent: palette.lavender,
  accentDark: palette.lavenderDark,
  accentSoft: palette.lavenderLight,

  // Semantic States (derived only)
  success: palette.olive,
  error: palette.oliveDark,
  warning: palette.oliveLight,
  info: palette.lavender,

  // Buttons
  buttonPrimaryText: palette.white,
  buttonDisabledBg: palette.borderSoft,
  buttonDisabledText: '#888888',

  // Mood Mapping (strictly derived)
 // Mood Mapping — Strong Clinical Differentiation
mood: {
  none: palette.oliveDark,          // No pain — visual relief
  mild: palette.oliveLight,  // Subtle discomfort
  moderate: palette.lavenderLight,   // Noticeable but stable
  elevated: palette.lavender, // Monitoring required
  severe: palette.lavenderDark,    // High concern
  critical: palette.lavenderDark,      // Immediate attention
},
  // Charts
  chart: {
    primary: palette.lavender,
    secondary: palette.olive,
    grid: palette.borderSoft,
    text: palette.black,
  },

  // Premium
  premium: palette.oliveDark,

  // Layers
  l0: palette.baseBackground,
  l1: palette.white,
  l2: palette.backgroundSoft,
  l3: palette.lavenderLight,

  transparent: 'transparent',

  palette,
  gradients: {
    background: [palette.baseBackground, palette.backgroundSoft],
    surface: [palette.white, palette.baseBackground],
    premium: [palette.lavenderLight, palette.lavender],
  },
};

// ============================================================
// LAYOUT
// ============================================================

export const layout = {
  screenPadding: moderateScale(16),
  headerHeight: moderateScale(64),
  borderRadius: 16,
};

export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  s: moderateScale(12),
  md: moderateScale(14),
  m: moderateScale(16),
  lg: moderateScale(20),
  l: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

export const borderRadius = {
  s: 8,
  m: 12,
  md: 16,
  l: 24,
  lg: 32,
  xl: 40,
  round: 999,
};

// ============================================================
// SHADOWS (BLACK ONLY)
// ============================================================

export const shadows = {
  soft: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: palette.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
};

// ============================================================
// TYPOGRAPHY
// ============================================================

export const typography = {
  h1: {
    fontSize: moderateScale(34),
    fontWeight: '800' as const,
    color: palette.black,
    lineHeight: moderateScale(42),
  },
  h2: {
    fontSize: moderateScale(26),
    fontWeight: '700' as const,
    color: palette.black,
    lineHeight: moderateScale(32),
  },
  h3: {
    fontSize: moderateScale(20),
    fontWeight: '600' as const,
    color: palette.black,
    lineHeight: moderateScale(26),
  },
  header: {
    fontSize: moderateScale(22),
    fontWeight: '700' as const,
    color: palette.black,
  },
  subheader: {
    fontSize: moderateScale(18),
    fontWeight: '600' as const,
    color: palette.lavenderDark,
  },
  body: {
    fontSize: moderateScale(16),
    fontWeight: '400' as const,
    color: palette.black,
    lineHeight: moderateScale(24),
  },
  bodyBold: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
    color: palette.black,
  },
  button: {
    fontSize: moderateScale(16),
    fontWeight: '700' as const,
    color: palette.white,
  },
  caption: {
    fontSize: moderateScale(13),
    fontWeight: '500' as const,
    color: palette.lavenderDark,
  },
};

export const fonts = typography;