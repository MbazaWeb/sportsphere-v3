import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Avatar from '../../components/Avatar';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { messagesApi } from '../../lib/api';
import { socket } from '../../lib/socket';
import { useAuthStore } from '../../lib/authStore';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

export default function MessageScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  // In a real app, we would fetch message history here.
  // For now, we'll just handle real-time sending/receiving.
  useEffect(() => {
    setLoading(false); // mock loading

    if (!partnerId) return;

    // Join DM room
    const roomId = getRoomId(user?.id, partnerId);
    socket.emit('join_room', roomId);

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user_typing', (data) => {
      if (data.userId === partnerId) setIsTyping(true);
    });

    socket.on('user_stopped_typing', (data) => {
      if (data.userId === partnerId) setIsTyping(false);
    });

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [partnerId, user?.id]);

  const handleSend = async () => {
    if (!partnerId || !newMessage.trim()) return;

    const msgContent = newMessage.trim();
    setNewComment('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      const res = await messagesApi.sendMessage(partnerId, msgContent);
      setMessages(prev => [...prev, res]);

      // Emit via WS for instant delivery
      const roomId = getRoomId(user?.id, partnerId);
      socket.emit('send_message', { roomId, message: res });

      // Stop typing
      socket.emit('typing_stop', { roomId, userId: user?.id });
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleInputChange = (text: string) => {
    setNewComment(text);

    if (!partnerId || !user?.id) return;
    const roomId = getRoomId(user?.id, partnerId);

    // Emit typing start
    socket.emit('typing_start', { roomId, userId: user.id, name: user.name });

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId, userId: user.id });
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft color={FG} size={24} />
          </Pressable>
          <View style={styles.headerUser}>
            <Text style={styles.headerTitle}>Chat</Text>
            {isTyping && <Text style={styles.typingText}>typing...</Text>}
          </View>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === user?.id}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={MUTED}
            value={newMessage}
            onChangeText={handleInputChange}
            multiline
          />
          <Pressable
            style={[styles.sendButton, !newMessage.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color="#0A1628" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, isMine }: { message: any; isMine: boolean }) {
  return (
    <View style={[styles.bubbleWrap, isMine ? styles.myBubbleWrap : styles.theirBubbleWrap]}>
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{message.content}</Text>
      </View>
      <Text style={styles.timeText}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );
}

function getRoomId(id1: string | undefined, id2: string) {
  if (!id1) return id2;
  return [id1, id2].sort().join('_');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerUser: { alignItems: 'center' },
  headerTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },
  typingText: { fontFamily: FONT_BODY_REG, fontSize: 10, color: GOLD },

  listContent: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { marginTop: 100, alignItems: 'center' },
  emptyText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },

  bubbleWrap: { maxWidth: '80%', gap: 4 },
  myBubbleWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirBubbleWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  myBubble: { backgroundColor: GOLD, borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: SURFACE, borderBottomLeftRadius: 2 },
  messageText: { fontFamily: FONT_BODY_REG, fontSize: 15 },
  myText: { color: '#0A1628' },
  theirText: { color: FG },
  timeText: { fontFamily: FONT_BODY_REG, fontSize: 10, color: MUTED },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#0F1D3A', borderTopWidth: 1, borderTopColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, paddingTop: 8,
    color: FG, fontFamily: FONT_BODY, fontSize: 14, maxHeight: 100,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
});
