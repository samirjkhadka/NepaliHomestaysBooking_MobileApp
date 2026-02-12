import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Linking } from 'react-native';
import { api } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type VideoEntry = { url: string; title?: string };

function youtubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const m = url.trim().match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function VideosScreen() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSettingsLanding(), api.getSettingsVideos()])
      .then(([landingRes, videosRes]) => {
        const landingUrl = landingRes.landing_youtube_url?.trim() || null;
        const gallery = videosRes.videos ?? [];
        const seen = new Set<string>();
        const combined: VideoEntry[] = [];
        if (landingUrl) {
          const key = youtubeVideoId(landingUrl) || landingUrl;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push({ url: landingUrl, title: 'Featured video' });
          }
        }
        for (const v of gallery) {
          const key = youtubeVideoId(v.url) || v.url;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(v);
          }
        }
        setVideos(combined);
      })
      .catch(() => setVideos([]))
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
      <Text style={styles.intro}>Watch real experiences from travelers who stayed with our homestay families.</Text>
      {videos.length === 0 ? (
        <Text style={styles.empty}>No videos yet. Check back later.</Text>
      ) : (
        videos.map((video, index) => {
          const id = youtubeVideoId(video.url);
          const thumbnail = id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
          const title = video.title?.trim() || `Video ${index + 1}`;
          const watchUrl = id ? `https://www.youtube.com/watch?v=${id}` : video.url;
          return (
            <Pressable
              key={id || index}
              style={styles.card}
              onPress={() => Linking.openURL(watchUrl)}
            >
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={styles.thumbPlaceholder} />
              )}
              <View style={styles.playWrap}>
                <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.cardTitle}>{title}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  intro: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: spacing.lg },
  card: { marginBottom: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface.card },
  thumb: { width: '100%', aspectRatio: 16 / 9 },
  thumbPlaceholder: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface.input },
  playWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { ...typography.body, color: colors.text.primary, padding: spacing.md },
});
