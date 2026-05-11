import React from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { colors, spacing } from '@/constants/theme';

type HtmlContentProps = {
  /** HTML or plain text (e.g. from listing description, directions, about sections). */
  content: string;
  /** Optional style for the wrapper View. */
  style?: object;
};

/**
 * Renders listing rich text (HTML) so bold, lists, etc. display correctly.
 * Falls back to plain Text when content has no HTML tags (legacy content).
 */
export function HtmlContent({ content, style }: HtmlContentProps) {
  const { width } = useWindowDimensions();
  const contentWidth = width - spacing.lg * 2;

  if (!content?.trim()) return null;

  const isHtml = content.includes('<');

  if (!isHtml) {
    return <Text style={[styles.plain, style]}>{content}</Text>;
  }

  const tagsStyles = {
    body: { color: colors.text.secondary, marginBottom: spacing.md, textAlign: 'justify' as const },
    p: { color: colors.text.secondary, marginBottom: spacing.sm, textAlign: 'justify' as const },
    strong: { fontWeight: '700' as const, color: colors.text.primary },
    b: { fontWeight: '700' as const, color: colors.text.primary },
    em: { fontStyle: 'italic' as const },
    i: { fontStyle: 'italic' as const },
    ul: { marginBottom: spacing.sm, paddingLeft: spacing.lg },
    ol: { marginBottom: spacing.sm, paddingLeft: spacing.lg },
    li: { color: colors.text.secondary, marginBottom: 4 },
    h2: { fontSize: 18, fontWeight: '600' as const, color: colors.text.primary, marginTop: spacing.md, marginBottom: spacing.sm },
    h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.xs },
    h4: { fontSize: 15, fontWeight: '600' as const, color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.xs },
  };

  return (
    <View style={[styles.wrapper, style]}>
      <RenderHtml
        contentWidth={contentWidth}
        source={{ html: content }}
        tagsStyles={tagsStyles}
        baseStyle={{ color: colors.text.secondary, fontSize: 15 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  plain: { color: colors.text.secondary, marginBottom: spacing.md, textAlign: 'justify', fontSize: 15 },
});
