export const colors = {
  background: '#FDFCF5', // Warm Creamy White
  surface: '#FFFFFF',    // Pure White
  primary: '#B39DDB',    // Soft Lavender (Main Action)
  secondary: '#80CBC4',  // Teal Mint (Success/Calm)
  accent: '#FFAB91',     // Soft Peach (Highlights)
  text: '#5D5D5D',       // Soft Charcoal (Readable)
  textLight: '#9E9E9E',  // Muted Grey
  success: '#c7ce50ff',    // Pastel Green
  success1: '#83f884ff',    // Pastel Green
  success2: '#99e29aff',    // Pastel Green
  success3: '#beddbfff',    // Pastel Green
  warning: '#FFE082',    // Pastel Amber
  error: '#EF9A9A',      // Soft Red
  border: '#F0F0F0',     // Very light grey
  
  // Specific UI Elements
  inputBackground: '#FAFAFA',
  placeholder: '#BDBDBD',
  
  // Gradients/Glows
   glowPurple: '#E1BEE7',
   glowMint: '#B2DFDB',
};

export const spacing = {
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  s: 16,
  m: 20,
  l: 24, // Generous rounding
  xl: 32,
  round: 999,
};

export const shadows = {
  soft: {
    shadowColor: '#B0BEC5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#90A4AE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
  glow: {
      shadowColor: '#B39DDB',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 6,
  }
};

export const typography = {
  header: {
    fontSize: 32, // Large
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subheader: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 28, // Relaxed
  },
  bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },
};
