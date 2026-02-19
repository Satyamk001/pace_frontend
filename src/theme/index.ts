// ============================================================
// SINGLE SOURCE OF TRUTH — DO NOT ADD COLORS OUTSIDE THIS FILE
// ============================================================

const palette = {
  // Brand — refined indigo (distinctive, not generic system blue)
  accent: '#5B5BD6',        // indigo — premium interactive
  accentDark: '#4747B8',    // pressed / deep
  accentSoft: '#EDEDFF',    // subtle selection tint

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
  lavender: '#EDEDFF', // Aligned to accentSoft for coherence

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
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================
// BORDER RADIUS
// ============================================================
export const borderRadius = {
  s: 12,
  m: 18,  // Bumped — rounder feels more premium in 2024
  l: 26,
  xl: 36,
  round: 999,
};

// ============================================================
// SHADOWS — color-tinted for depth, not just dark opacity
// ============================================================
export const shadows = {
  soft: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 1 }, // Reduced offset
    shadowOpacity: 0.04, // Drastically reduced from 0.06
    shadowRadius: 6, // Tighter radius
    elevation: 1, // Minimal elevation for Android
  },
  medium: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3, // Reduced from 5
  },
  glow: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4, // Reduced from 8
  },
  level1: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  level2: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  level3: {
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6, // Reduced from 10
  },
};

// ============================================================
// TYPOGRAPHY — tighter tracking, stronger hierarchy
// ============================================================
export const typography = {
  header: {
    fontSize: 30,               // Slightly larger — more presence
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.8,        // Tighter — feels editorial and refined
    lineHeight: 36,
  },
  subheader: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 25,             // Tightened — cleaner reading rhythm
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 25,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    letterSpacing: 0.1,         // Subtler tracking — avoids "label" feel
  },
};