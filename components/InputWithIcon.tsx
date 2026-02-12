import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/constants/theme';

type InputWithIconProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'name' | 'tel' | 'off';
  error?: boolean;
  editable?: boolean;
  maxLength?: number;
  style?: object;
};

export function InputWithIcon({
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  editable = true,
  maxLength,
  style,
}: InputWithIconProps) {
  return (
    <View style={[styles.wrapper, error && styles.wrapperError]}>
      <Ionicons name={icon} size={20} color={colors.text.muted} style={styles.icon} />
      <TextInput
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={editable}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.input,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  },
  wrapperError: { borderWidth: 1, borderColor: colors.error },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
  },
});
