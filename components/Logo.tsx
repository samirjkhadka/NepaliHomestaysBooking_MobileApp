import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { colors, typography } from '@/constants/theme';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  /** When true, shows the logo image (from assets). Use on auth/splash for visibility. */
  showImage?: boolean;
  style?: ViewStyle;
};

const sizes = {
  sm: { width: 80, height: 60 },
  md: { width: 120, height: 90 },
  lg: { width: 160, height: 120 },
};

export function Logo({ size = 'md', showImage = true, style }: LogoProps) {
  const s = sizes[size];
  const textColor = colors.text.primary;
  const accentColor = colors.accentAlt[500];

  return (
    <View style={[styles.wrapper, style]}>
      {showImage ? (
        <Image
          source={require('@/assets/images/Nepali_homestays_without_bg.png')}
          style={[{ width: s.width, height: s.height }, styles.image]}
          resizeMode="contain"
          accessibilityLabel="Nepali Homestays logo"
        />
      ) : null}
      {!showImage && (
        <Text style={[styles.brand, { fontSize: size === 'lg' ? 28 : size === 'md' ? 22 : 18, color: textColor }]}>
          Nepali <Text style={[styles.accent, { color: accentColor }]}>Homestays</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  image: {},
  brand: { ...typography.title, fontWeight: '700' },
  accent: { fontWeight: '700' },
});
