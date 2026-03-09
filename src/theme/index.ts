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
  // Warm ivory — richer than plain white, avoids clinical feel
  baseBackground: '#FAF8F5',

  // PRIMARY — deeper, more sophisticated terracotta
  coral: '#C96B45',   // 500 — base (richer than #D97757)
  terracotta: '#E2906A',   // warm mid-tone

  white: '#FFFFFF',
  // Deep warm black — never pure #000, feels expensive on screen
  black: '#1C1917',

  // Derived shades
  coralDark: '#8B3E22',   // rich espresso-terracotta
  coralLight: '#FDEEE8',   // barely-there blush tint
  coralLight2: '#EBAA8C',   // warm peach-gold mid

  terracottaDark: '#B0501E',  // saturated burnt sienna
  terracottaLight: '#FBF2ED',  // near-white warm blush

  // Surfaces & borders — warm neutrals, no pink cast
  backgroundSoft: '#F5F0EA',   // warm cream
  borderSoft: '#EAE2D9',   // warm taupe (not pink-tinted)
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

  // Typography — warm grays, never pure black/gray
  text: palette.black,
  textPrimary: palette.black,
  textSecondary: '#57534E',   // warm medium charcoal
  textLight: '#A8A29E',   // warm stone gray

  // Primary Branding
  primary: palette.coral,
  accent: palette.coral,
  accentDark: palette.coralDark,
  accentSoft: palette.coralLight2,
  accentSoft2: palette.coralLight,

  // Semantic States — success is distinct from primary palette
  success: palette.coralDark,              // muted sage green — clearly different from terracotta
  error: palette.terracottaDark,
  warning: palette.terracottaLight,
  info: palette.coral,

  // Buttons
  buttonPrimaryText: palette.white,
  buttonDisabledBg: palette.borderSoft,
  buttonDisabledText: '#B5ADA6',   // warm disabled gray

  // Mood Mapping — Clinical Differentiation
  mood: {
    none: palette.coralDark,            // calm sage — visually distinct
    mild: palette.coralLight2,
    moderate: palette.coral,
    elevated: palette.terracotta,
    severe: palette.terracottaDark,
    critical: palette.coralDark,
  },

  // Charts
  chart: {
    primary: palette.coral,
    secondary: palette.terracotta,
    grid: palette.borderSoft,
    text: palette.black,
  },

  // Premium
  premium: palette.coralDark,

  // Layers
  l0: palette.baseBackground,
  l1: palette.white,
  l2: palette.backgroundSoft,
  l3: palette.coralLight,

  transparent: 'transparent',

  palette,
  gradients: {
    background: [palette.baseBackground, palette.backgroundSoft],
    surface: [palette.white, palette.baseBackground],
    premium: [palette.coralLight, palette.coral],
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
// SHADOWS — warm-tinted, real depth (was all zeros)
// ============================================================

export const shadows = {
  soft: {
    shadowColor: '#8B6354',    // warm shadow, never cold gray
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#8B6354',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: palette.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
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
    color: palette.coralDark,
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
    color: palette.coralDark,
  },
};

export const fonts = typography;