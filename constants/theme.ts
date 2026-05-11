/**
 * Light theme — warm cream, forest, terracotta, saffron (aligned with frontend `src/index.css`).
 */
export const colors = {
  /** Page background (HSL ~35 30% 97%) */
  background: '#F9F7F4',
  /** Nav / chrome (forest — frontend `--secondary`) */
  forest: {
    500: '#2A4A3F',
    600: '#223D33',
  },
  /** Terracotta scale (frontend `--primary`) */
  primary: {
    50: '#FDF6F3',
    100: '#F5E6DF',
    500: '#C45D42',
    600: '#A84E37',
    900: '#3D2920',
  },
  secondary: {
    500: '#5C6778',
  },
  /** Same terracotta as buttons / CTAs */
  accent: {
    100: '#FCEBD9',
    500: '#C45D42',
    600: '#A84E37',
  },
  /** Saffron highlights (frontend `--accent`) */
  accentAlt: {
    500: '#E8AA2E',
    600: '#C98F1E',
  },
  text: {
    primary: '#2C2419',
    secondary: 'rgba(44,36,25,0.78)',
    muted: 'rgba(44,36,25,0.55)',
    inverse: '#2C2419',
    /** Text on terracotta / forest filled buttons */
    onAccent: '#FEFDFB',
  },
  surface: {
    card: '#FEFCF9',
    input: '#FFFFFF',
    elevated: '#EEEBE6',
  },
  border: '#E5DFD5',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const },
  subtitle: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  /** Use for paragraphs; text is justified. */
  bodyJustified: { fontSize: 16, fontWeight: '400' as const, textAlign: 'justify' as const },
} as const;
