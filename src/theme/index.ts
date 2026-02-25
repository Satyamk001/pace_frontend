import { Dimensions } from 'react-native';

// ============================================================
// RESPONSIVE SCALING UTILITIES
// ============================================================
const { width } = Dimensions.get('window');
const guidelineBaseWidth = 390; // Standard modern device width (e.g. iPhone 12/13/14)

export const scale = (size: number) => Math.min(width / guidelineBaseWidth, 1) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// ============================================================
// SINGLE SOURCE OF TRUTH — DO NOT ADD COLORS OUTSIDE THIS FILE
// ============================================================

const palette = {
  // Brand — Medical Blue/Teal (Calm, Professional, Sterile but Kind)
  accent: '#0891B2',         // cyan-600 — modern medical teal
  accentDark: '#0E7490',     // cyan-700 — deep focus
  accentSoft: '#ECFEFF',     // cyan-50 — fresh morning air tint

  // Neutrals — Soft "Warm Slate" to prevent clinical coldness
  background: '#F8FAFC',     // slate-50 — clean hospital sheet white
  surface: '#FFFFFF',        // pure white — elevated cards
  surfaceSoft: '#F1F5F9',    // slate-100 — subtle depth
  border: '#E2E8F0',         // slate-200 — light definition

  // Text — Optimized for readability in high-stress moments
  headerText: '#0F172A',     // slate-900 — high contrast for titles
  textPrimary: '#334155',    // slate-700 — softer body text for less eye strain
  subtitleText: '#64748B',   // slate-500 — secondary metadata

  // Buttons
  buttonPrimaryText: '#FFFFFF',
  buttonDisabledBg: '#CBD5E1',
  buttonDisabledText: '#94A3B8',

  // Mood/Health Indicators — Clear, intuitive clinical signaling
  moodGreat: '#10B981',  // emerald-500 — vibrant health
  moodGood: '#34D399',   // emerald-400 — stable
  moodOkay: '#F59E0B',   // amber-500 — warning/monitoring
  moodLow: '#F97316',    // orange-500 — significant symptoms
  moodPain: '#EF4444',   // red-500 — acute distress / "take action"

  // Accent utilities
  mint: '#059669',       // Clinical utility green
};

// ============================================================
// EXPORTED COLORS — Semantic Health Mapping
// ============================================================
export const colors = {
  background: palette.background,
  surface: palette.surface,
  surfaceSoft: palette.surfaceSoft,
  border: palette.border,

  // Typography
  text: palette.headerText,
  textPrimary: palette.textPrimary,
  textSecondary: palette.subtitleText,
  textLight: palette.subtitleText,

  // Primary Branding
  primary: palette.accent,
  accent: palette.accent,
  accentDark: palette.accentDark,
  accentSoft: palette.accentSoft,

  // Semantic Health States
  success: palette.moodGreat,
  error: palette.moodPain,
  warning: palette.moodOkay,
  info: palette.accent,

  // Buttons
  buttonPrimaryText: palette.buttonPrimaryText,
  buttonDisabledBg: palette.buttonDisabledBg,
  buttonDisabledText: palette.buttonDisabledText,

  // Patient Mood/Vitals Tracking
  mood: {
    great: palette.moodGreat,
    good: palette.moodGood,
    okay: palette.moodOkay,
    low: palette.moodLow,
    pain: palette.moodPain,
  },

  // Health Metrics / Charts
  chart: {
    pain: palette.moodPain,
    fatigue: '#8B5CF6', // violet-500 for neurological fatigue
    grid: palette.border,
    text: palette.subtitleText,
  },

  // Caregiver / Pro features
  premium: '#F59E0B', // orange-700 — "Trust" color for upgraded care

  // Layer system (Z-index depth)
  l0: palette.background,
  l1: palette.surface,
  l2: '#F1F5F9',
  l3: palette.accentSoft,

  divider: palette.border,
  inputBackground: '#F8FAFC',
  transparent: 'transparent',

  palette: palette,

  // Gradients — "Healing" gradients (Soft transitions)
  gradients: {
    background: ['#F8FAFC', '#EFF6FF'], // Subtle blue-ish wash
    surface: ['#FFFFFF', '#F8FAFC'],
    premium: ['#EEF2FF', '#E0E7FF'],    // Soft indigo wash
  },
};

// ============================================================
// LAYOUT & SPACING — High "Breathability"
// ============================================================
export const layout = {
  screenPadding: moderateScale(16), // Tighter padding for wider content areas
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
// SHADOWS — Light & Weightless
// ============================================================
export const shadows = {
  soft: {
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  glow: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};

// ============================================================
// TYPOGRAPHY — Clear, Intentional Hierarchy
// ============================================================
export const typography = {
  h1: {
    fontSize: moderateScale(34),           // Scaled down for mobile focus
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: moderateScale(42),
  },
  h2: {
    fontSize: moderateScale(26),
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: moderateScale(32),
  },
  h3: {
    fontSize: moderateScale(20),
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: moderateScale(26),
  },
  header: {
    fontSize: moderateScale(22),
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: moderateScale(28),
  },
  subheader: {
    fontSize: moderateScale(18),
    fontWeight: '600' as const,
    color: colors.textSecondary,
    lineHeight: moderateScale(24),
  },
  body: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    lineHeight: moderateScale(24),
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: moderateScale(24),
  },
  button: {
    fontSize: moderateScale(16),
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.2, // Tighter tracking for readability
  },
  caption: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    lineHeight: moderateScale(18),
    fontWeight: '500' as const,
  },
};

export const fonts = typography;