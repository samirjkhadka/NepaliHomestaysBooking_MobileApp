import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/core/utils/html_text.dart';
import 'package:nepali_homestays/features/home/data/home_static_content.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';
import 'package:url_launcher/url_launcher.dart';

String? youtubeId(String? url) {
  if (url == null) return null;
  return RegExp(r'(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})')
      .firstMatch(url)
      ?.group(1);
}

Future<void> openExternal(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class VideosScreen extends ConsumerWidget {
  const VideosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Video stories')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: ref.read(apiRepositoryProvider).getVideos(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final videos = snapshot.data!;
          if (videos.isEmpty) {
            return const EmptyState(message: 'No videos available');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: videos.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final video = videos[index];
              final url = video['url']?.toString() ?? '';
              final id = youtubeId(url);
              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => openExternal(url),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AspectRatio(
                        aspectRatio: 16 / 9,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            if (id != null)
                              Image.network(
                                'https://img.youtube.com/vi/$id/hqdefault.jpg',
                                fit: BoxFit.cover,
                              )
                            else
                              const ColoredBox(
                                  color: AppColors.surfaceContainerHigh),
                            const Center(
                              child: Icon(Icons.play_circle_fill,
                                  color: Colors.white, size: 56),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          video['title']?.toString() ?? 'Video story',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class BlogsScreen extends ConsumerWidget {
  const BlogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Blogs & news')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: ref.read(apiRepositoryProvider).getNewsFeed(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snapshot.data!;
          if (items.isEmpty) {
            return const EmptyState(message: 'No posts yet');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final item = items[index];
              return Card(
                child: ListTile(
                  title: Text(item['title']?.toString() ?? 'Article'),
                  subtitle: Text(
                    [
                      item['category']?.toString(),
                      item['date']?.toString(),
                      item['excerpt']?.toString(),
                    ].whereType<String>().where((s) => s.isNotEmpty).join('\n'),
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                  ),
                  isThreeLine: true,
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () => openExternal(
                    item['url']?.toString() ?? homeNewsSourceUrl,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class SettingsContentScreen extends ConsumerWidget {
  const SettingsContentScreen({
    super.key,
    required this.settingKey,
    required this.title,
    required this.icon,
  });

  final String settingKey;
  final String title;
  final IconData icon;

  List<Map<String, dynamic>> _findItems(Map<String, dynamic> data) {
    for (final key in [
      'items',
      'festivals',
      'routes',
      'plans',
      'suggestions',
      'suggested_routes',
    ]) {
      final value = data[key];
      if (value is List) {
        return value
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      }
    }
    return const [];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: FutureBuilder<Map<String, dynamic>>(
        future: ref.read(apiRepositoryProvider).getPublicSetting(settingKey),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          final items = _findItems(data);
          final intro = stripHtml(
            data['description']?.toString() ??
                data['subtitle']?.toString() ??
                data['intro']?.toString(),
          );
          if (data.isEmpty) {
            return EmptyState(message: '$title content is not available yet');
          }
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Icon(icon, size: 56, color: AppColors.dhakaRed),
              const SizedBox(height: 12),
              Text(
                data['title']?.toString() ?? title,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              if (intro.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(intro),
              ],
              const SizedBox(height: 16),
              if (items.isNotEmpty)
                ...items.map(
                  (item) => Card(
                    child: ListTile(
                      title: Text(
                        item['title']?.toString() ??
                            item['name']?.toString() ??
                            'Explore',
                      ),
                      subtitle: Text(
                        [
                          item['description']?.toString(),
                          item['region']?.toString(),
                          item['duration']?.toString(),
                          item['days'] == null
                              ? null
                              : '${item['days']} days',
                          item['stops'] is List
                              ? (item['stops'] as List).join(' → ')
                              : null,
                        ]
                            .whereType<String>()
                            .where((value) => value.isNotEmpty)
                            .join('\n'),
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: settingKey == 'trip-planner'
                          ? () => context.push('/search')
                          : null,
                    ),
                  ),
                )
              else
                _JsonContent(data: data),
            ],
          );
        },
      ),
    );
  }
}

class _JsonContent extends StatelessWidget {
  const _JsonContent({required this.data});
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final entries = data.entries.where(
      (entry) =>
          !{'title', 'description', 'intro'}.contains(entry.key) &&
          entry.value != null,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: entries.map((entry) {
        final value = entry.value;
        final text = value is String ? stripHtml(value) : value.toString();
        if (text.isEmpty || text == '[]' || text == '{}') {
          return const SizedBox.shrink();
        }
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                entry.key
                    .split('_')
                    .map((part) =>
                        '${part[0].toUpperCase()}${part.substring(1)}')
                    .join(' '),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(text),
            ],
          ),
        );
      }).toList(),
    );
  }
}

const publicPageFallbacks = <String, ({String title, String content})>{
  'safety': (
    title: 'Safety',
    content:
        'Choose verified homestays, keep your itinerary and emergency contacts accessible, and contact your host if plans change. For emergencies in Nepal, dial 112.',
  ),
  'faqs': (
    title: 'Frequently asked questions',
    content:
        'How do I book? Select a homestay, choose available dates, and complete payment.\n\nCan I cancel? Cancellation terms depend on the booking and are shown before payment.\n\nHow do I contact my host? Open Trips and use Messages for your booking.',
  ),
  'privacy_policy': (
    title: 'Privacy policy',
    content:
        'We use account and booking information to provide reservations, payments, support, and safety services. Contact privacy@nepalihomestays.com for data requests.',
  ),
  'terms_of_service': (
    title: 'Terms of service',
    content:
        'By using Nepali Homestays you agree to provide accurate information, respect hosts and communities, and follow booking and cancellation terms.',
  ),
  'cancellation': (
    title: 'Cancellation policy',
    content:
        'Cancellation and refund eligibility depends on the booking terms and payment status. Review your booking details or contact support before cancelling.',
  ),
  'cookies': (
    title: 'Cookie policy',
    content:
        'The web service uses essential and analytics cookies. The mobile app uses local storage for preferences such as language and currency.',
  ),
};

class PublicCmsPageScreen extends ConsumerWidget {
  const PublicCmsPageScreen({super.key, required this.keyName});
  final String keyName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const cmsKeys = {
      'safety': 'safety_information',
      'cancellation': 'cancellation_policy',
      'cookies': 'cookie_policy',
    };
    final fallback = publicPageFallbacks[keyName] ??
        (title: keyName.replaceAll('_', ' '), content: '');
    return Scaffold(
      appBar: AppBar(title: Text(fallback.title)),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: ref
            .read(apiRepositoryProvider)
            .getCmsSection(cmsKeys[keyName] ?? keyName),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final section = snapshot.data;
          final title = section?['title']?.toString() ?? fallback.title;
          final content = stripHtml(section?['content']?.toString());
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 16),
              Text(content.isNotEmpty ? content : fallback.content),
              if (keyName == 'safety') ...[
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: () => launchUrl(Uri.parse('tel:112')),
                  icon: const Icon(Icons.emergency_outlined),
                  label: const Text('Call emergency services (112)'),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
