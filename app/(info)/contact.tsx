import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable, ActivityIndicator } from 'react-native';
import { api } from '@/lib/api';
import { colors, spacing, typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const defaultContact = {
  address: 'Thamel, Kathmandu, Nepal',
  phone: '+977 1-4123456',
  email: 'info@nepalihomestays.com',
};

export default function ContactScreen() {
  const [contact, setContact] = useState(defaultContact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCmsSections('footer')
      .then((r) => {
        const byKey = (key: string) => r.sections?.find((s) => s.section_key === key)?.content?.trim();
        setContact({
          address: byKey('address') || defaultContact.address,
          phone: byKey('contact_phone') || defaultContact.phone,
          email: byKey('contact_email') || defaultContact.email,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Experience the warmth of Nepali hospitality. Get in touch.</Text>
      <Pressable style={styles.row} onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`)}>
        <Ionicons name="location-outline" size={24} color={colors.accentAlt[500]} style={styles.icon} />
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{contact.address}</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`)}>
        <Ionicons name="call-outline" size={24} color={colors.accentAlt[500]} style={styles.icon} />
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{contact.phone}</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
        <Ionicons name="mail-outline" size={24} color={colors.accentAlt[500]} style={styles.icon} />
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{contact.email}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  intro: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.sm },
  icon: { marginRight: spacing.md },
  label: { color: colors.text.muted, fontSize: 12, marginRight: spacing.sm },
  value: { ...typography.body, color: colors.text.primary, flex: 1 },
});
