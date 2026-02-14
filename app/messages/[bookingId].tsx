import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, type Message, type Conversation } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function MessageThreadScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const insets = useSafeAreaInsets();
  const bid = bookingId ? Number(bookingId) : NaN;
  // Use conversation's other_user_id, or derive from first message in thread (so send works before conversation loads)
  const otherUserId =
    conversation?.other_user_id ??
    (messages.length > 0 && user?.id
      ? (messages.find((m) => m.sender_id !== user.id)?.sender_id ?? messages.find((m) => m.receiver_id !== user.id)?.receiver_id)
      : 0);

  useEffect(() => {
    if (!token || !bid || Number.isNaN(bid)) {
      setLoading(false);
      return;
    }
    api.getMessages(token).then((res) => {
      const conv = (res.conversations ?? []).find((c) => c.booking_id === bid);
      setConversation(conv ?? null);
    }).catch(() => {});
    api.getMessagesThread(token, bid, true).then((res) => {
      setMessages(res.messages ?? []);
    }).catch(() => setMessages([])).finally(() => setLoading(false));
  }, [token, bid]);

  async function send() {
    const text = input.trim();
    if (!text || !token || sending) return;
    if (!otherUserId) {
      Alert.alert('Cannot send', 'Loading conversation. Please try again in a moment.');
      return;
    }
    setSending(true);
    try {
      const res = await api.sendMessage(token, { booking_id: bid, receiver_id: otherUserId, message: text });
      setMessages((prev) => [...prev, res.created]);
      setInput('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to send message.';
      Alert.alert('Send failed', msg);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  const isOwn = (m: Message) => m.sender_id === user?.id;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello!</Text>}
        renderItem={({ item }) => (
          <View style={[styles.bubble, isOwn(item) ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={styles.bubbleText}>{item.message}</Text>
            <Text style={styles.bubbleTime}>{formatDateTime(item.created_at)}</Text>
          </View>
        )}
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.text.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={10000}
        />
        <Pressable style={styles.sendBtn} onPress={send} disabled={!input.trim() || sending}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendBtnText}>Send</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  list: { padding: spacing.lg, paddingBottom: spacing.sm },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xl },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  bubbleOwn: { alignSelf: 'flex-end', backgroundColor: colors.accent[500] },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.surface.card },
  bubbleText: { color: colors.text.primary },
  bubbleTime: { fontSize: 11, color: colors.text.muted, marginTop: 4 },
  footer: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.sm, color: colors.text.primary, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.accent[500], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: 'center', minHeight: 40 },
  sendBtnText: { color: colors.text.primary, fontWeight: '600' },
});
