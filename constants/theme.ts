/**
 * Design tokens – aligned with frontend (Nepali_homestays_final_logo)
 * Primary: #0F233E (navy), Accent: #FB6F08 / #FFA101 (orange/amber)
 */
export const colors = {
  primary: {
    50: '#E8EBF0',
    500: '#0F233E',
    600: '#0D1E36',
    900: '#070F1E',
  },
  secondary: {
    500: '#5A6F8F',
  },
  accent: {
    100: '#FFE4D1',
    500: '#FB6F08',
    600: '#E56407',
  },
  accentAlt: {
    500: '#FFA101',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.85)',
    muted: 'rgba(255,255,255,0.7)',
    inverse: '#0F233E',
  },
  surface: {
    card: 'rgba(255,255,255,0.08)',
    input: 'rgba(255,255,255,0.12)',
    elevated: 'rgba(255,255,255,0.06)',
  },
  border: 'rgba(255,255,255,0.2)',
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
