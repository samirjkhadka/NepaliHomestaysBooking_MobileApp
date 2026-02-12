import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  style?: object;
  borderRadius?: number;
};

export function Skeleton({ width = '100%', height = 20, style, borderRadius = radius.sm }: SkeletonProps) {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: typeof width === 'number' ? width : width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonListingCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={160} borderRadius={radius.lg} style={styles.image} />
      <Skeleton height={18} width="80%" style={styles.mb} />
      <Skeleton height={14} width="50%" />
    </View>
  );
}

export function SkeletonListingDetail() {
  return (
    <View style={styles.detail}>
      <Skeleton height={280} borderRadius={0} />
      <View style={styles.body}>
        <Skeleton height={24} width="90%" style={styles.mb} />
        <Skeleton height={16} width="70%" style={styles.mb} />
        <Skeleton height={80} width="100%" style={styles.mb} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.surface.card },
  card: { marginBottom: spacing.md },
  image: { marginBottom: spacing.sm },
  mb: { marginBottom: spacing.sm },
  detail: {},
  body: { padding: spacing.lg },
});
