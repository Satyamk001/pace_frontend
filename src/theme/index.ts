// ============================================================
// SINGLE SOURCE OF TRUTH — DO NOT ADD COLORS OUTSIDE THIS FILE
// ============================================================

const palette = {
  // Brand — teal emerald (distinctive, modern, health-forward)
  accent: '#059669',        // teal emerald — premium interactive
  accentDark: '#047857',    // pressed / deep
  accentSoft: '#ECFDF5',    // subtle selection tint

  // Neutrals — warm off-white layers (replaces cold iOS grays)
  background: '#F7F7F5',    // warm near-white canvas
  surface: '#FFFFFF',       // primary card surface
  surfaceSoft: '#FAFAF8',   // elevated surface, warm tint
  border: '#E6E6E1',        // warm separator — softer than iOS default

  // Text — high contrast with intentional warmth
  headerText: '#0D0D0D',    // near-black, avoids harsh pure black
  textPrimary: '#1A1A1A',   // rich dark body
  subtitleText: '#8C8C8C',  // balanced secondary label

  // Buttons
  buttonPrimaryText: '#FFFFFF',
  buttonDisabledBg: '#EBEBEB',
  buttonDisabledText: '#B8B8B8',

  // Mood — jewel-toned, rich and intentional
  moodGreat: '#16A34A',  // deep emerald — confident, alive
  moodGood: '#0891B2',  // ocean teal — calm, steady
  moodOkay: '#D97706',  // warm amber — caution without alarm
  moodLow: '#EA580C',  // ember orange — low but grounded
  moodPain: '#DC2626',  // true red — clear signal, no noise

  // Accent utilities
  mint: '#16A34A',
};

// ============================================================
// EXPORTED COLORS — use these everywhere in the app
// ============================================================
export const colors = {
  // Backgrounds
  background: palette.background,
  surface: palette.surface,
  surfaceSoft: palette.surfaceSoft,
  border: palette.border,

  // Typography
  text: palette.headerText,   // Titles / headers
  textPrimary: palette.textPrimary,  // Body text
  textSecondary: palette.subtitleText, // Captions / secondary
  textLight: palette.subtitleText, // Alias for legacy usage

  // Accent (primary action color)
  primary: palette.accent,
  accent: palette.accent,
  accentDark: palette.accentDark,
  accentSoft: palette.accentSoft,

  // Semantic
  success: palette.accentSoft,    // Soft highlight for success states
  error: palette.moodPain,      // Pain / alert
  warning: palette.moodOkay,      // Caution / moderate
  info: palette.subtitleText,

  // Buttons
  buttonPrimaryText: palette.buttonPrimaryText,
  buttonDisabledBg: palette.buttonDisabledBg,
  buttonDisabledText: palette.buttonDisabledText,

  // Mood — ONLY for mood-related UI
  mood: {
    great: palette.moodGreat,
    good: palette.moodGood,
    okay: palette.moodOkay,
    low: palette.moodLow,
    pain: palette.moodPain,
  },

  // Charts / Graphs — ONLY these allowed in data visuals
  chart: {
    pain: palette.moodPain,
    fatigue: palette.subtitleText,
    grid: palette.border,
    text: palette.subtitleText,
  },

  // Premium (gold) — only for premium upsell UI
  premium: '#B8922A', // Deep antique gold — richer, more intentional

  // Layer system (tonal depth)
  l0: palette.background,  // Screen background
  l1: palette.surface,     // Card / container
  l2: '#F2F2EF',           // Slightly elevated — warmer than surface
  l3: palette.accentSoft,  // Active / highlighted layer

  // Divider
  divider: palette.border,

  // Input
  inputBackground: '#F2F2EF',

  // Special
  lavender: '#ECFDF5', // Aligned to accentSoft for coherence

  // Expose raw palette for specific component needs
  palette: palette,

  // Gradients — warmer, more editorial
  gradients: {
    background: ['#F0EEE9', '#EBE9E4', '#F7F7F5'], // Warm Parchment
    header: ['#FFFFFF', '#FAFAF8'],                 // Clean ivory fade
  },
};

// ============================================================
// LAYOUT
// ============================================================
export const layout = {
  screenPadding: 20,
  headerHeight: 60,
  borderRadius: 18, // Slightly softer than before — feels more modern
};

// ============================================================
// SPACING
// ============================================================
export const spacing = {
  xs: 8,
  sm: 10, // Added
  s: 12,
  md: 14, // Added
  m: 16,
  lg: 20, // Added
  l: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================
// BORDER RADIUS
// ============================================================
export const borderRadius = {
  s: 12,
  m: 18,
  md: 22, // Added
  l: 26,
  lg: 30, // Added
  xl: 36,
  round: 999,
};

// ============================================================
// SHADOWS — color-tinted for depth, not just dark opacity
// ============================================================
export const shadows = {
  soft: {
    shadowColor: '#1A1400',       // Warm dark tint
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 5,
  },
  glow: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,          // Green glow — visible but not neon
    shadowRadius: 18,
    elevation: 8,
  },
  level1: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  level2: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  level3: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,          // Deep, dramatic elevation
    shadowRadius: 32,
    elevation: 10,
  },
};

// ============================================================
// TYPOGRAPHY — tighter tracking, stronger hierarchy
// ============================================================
export const typography = {
  // New Semantic Hierarchy
  h1: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  h2: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  header: { // Legacy compat
    fontSize: 30,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subheader: { // Legacy compat
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 25,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 25,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    letterSpacing: 0.1,
  },
};

export const fonts = typography;