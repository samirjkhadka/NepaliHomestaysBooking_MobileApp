import { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/constants/theme';

type PasswordInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoComplete?: 'password' | 'password-new' | 'password-new-password';
  style?: object;
  error?: boolean;
  editable?: boolean;
};

export function PasswordInput({
  value,
  onChangeText,
  placeholder,
  autoComplete = 'password',
  style,
  error,
  editable = true,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <View style={[styles.wrapper, error && styles.wrapperError]}>
      <TextInput
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoComplete={autoComplete}
        editable={editable}
      />
      <Pressable
        style={styles.eye}
        onPress={() => setShow((s) => !s)}
        hitSlop={12}
        accessibilityLabel={show ? 'Hide password' : 'Show password'}
      >
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.text.muted} />
      </Pressable>
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
    paddingRight: spacing.sm,
  },
  wrapperError: { borderWidth: 1, borderColor: colors.error },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
  },
  eye: { padding: spacing.sm },
});
