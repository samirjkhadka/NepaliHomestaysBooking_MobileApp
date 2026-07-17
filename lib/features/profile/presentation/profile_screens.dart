import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:nepali_homestays/core/currency/currency_provider.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/core/utils/html_text.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _loading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final profile = await ref.read(apiRepositoryProvider).getProfile();
      _name.text = profile['name']?.toString() ?? '';
      _phone.text = profile['phone']?.toString() ?? '';
    } catch (_) {
      final user = ref.read(authControllerProvider).user;
      _name.text = user?.name ?? '';
      _phone.text = user?.phone ?? '';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(apiRepositoryProvider).updateProfile({
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
      });
      await ref.read(authControllerProvider.notifier).refreshUser();
      if (mounted) showSnack(context, 'Profile saved');
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(authControllerProvider).user;
    final locale = ref.watch(localeProvider);
    final currency = ref.watch(currencyProvider);

    return Scaffold(
      appBar: AppBar(title: Text(s.profile)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppColors.secondaryContainer,
                  child: Text(
                    (user?.name?.isNotEmpty == true ? user!.name![0] : 'G').toUpperCase(),
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.email ?? '', style: Theme.of(context).textTheme.titleMedium),
                Text('Role: ${user?.role ?? ''}'),
                const SizedBox(height: 24),
                TextField(controller: _name, decoration: InputDecoration(labelText: s.name)),
                const SizedBox(height: 12),
                TextField(controller: _phone, decoration: InputDecoration(labelText: s.phone)),
                const SizedBox(height: 16),
                NhPrimaryButton(label: s.save, onPressed: _save, loading: _saving),
                const SizedBox(height: 24),
                ListTile(
                  leading: const Icon(Icons.language),
                  title: const Text('Language'),
                  subtitle: Text(locale.languageCode == 'ne' ? 'नेपाली' : 'English'),
                  trailing: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'en', label: Text('EN')),
                      ButtonSegment(value: 'ne', label: Text('NE')),
                    ],
                    selected: {locale.languageCode == 'ne' ? 'ne' : 'en'},
                    onSelectionChanged: (set) {
                      ref.read(localeProvider.notifier).setLocale(Locale(set.first));
                    },
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.payments_outlined),
                  title: const Text('Currency'),
                  subtitle: Text('${currency.code} (${currencySymbols[currency.code] ?? ''})'),
                  onTap: () async {
                    final next = await showModalBottomSheet<String>(
                      context: context,
                      builder: (ctx) => SafeArea(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const ListTile(title: Text('Display currency')),
                            ...currencyCodes.map(
                              (c) => RadioListTile<String>(
                                title: Text('$c (${currencySymbols[c] ?? c})'),
                                value: c,
                                groupValue: currency.code,
                                onChanged: (v) => Navigator.pop(ctx, v),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                    if (next != null) {
                      await ref.read(currencyProvider.notifier).setCurrency(next);
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.lock_outline),
                  title: Text(s.changePassword),
                  onTap: () => context.push('/change-password'),
                ),
                ListTile(
                  leading: const Icon(Icons.shield_outlined),
                  title: const Text('Settings & safety'),
                  onTap: () => context.push('/settings-safety'),
                ),
                ListTile(
                  leading: const Icon(Icons.verified_user_outlined),
                  title: const Text('Identity verification'),
                  onTap: () => context.push('/identity'),
                ),
                ListTile(
                  leading: const Icon(Icons.card_giftcard_outlined),
                  title: const Text('Referral program'),
                  onTap: () => context.push('/referral'),
                ),
                ListTile(
                  leading: const Icon(Icons.auto_awesome_outlined),
                  title: const Text('Explore more'),
                  subtitle: const Text('USP previews'),
                  onTap: () => context.push('/usp'),
                ),
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: Text(s.notifications),
                  onTap: () => context.push('/notifications'),
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: Text(s.help),
                  onTap: () => context.push('/help'),
                ),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(s.about),
                  onTap: () => context.push('/about'),
                ),
                ListTile(
                  leading: const Icon(Icons.mail_outline),
                  title: Text(s.contact),
                  onTap: () => context.push('/contact'),
                ),
                ListTile(
                  leading: const Icon(Icons.article_outlined),
                  title: const Text('More pages'),
                  subtitle: const Text('CMS content'),
                  onTap: () => context.push('/cms'),
                ),
                const Divider(),
                Text('Explore',
                    style: Theme.of(context).textTheme.titleMedium),
                ListTile(
                  leading: const Icon(Icons.video_library_outlined),
                  title: const Text('Video stories'),
                  onTap: () => context.push('/videos'),
                ),
                ListTile(
                  leading: const Icon(Icons.newspaper_outlined),
                  title: const Text('Blogs & news'),
                  onTap: () => context.push('/blogs'),
                ),
                ListTile(
                  leading: const Icon(Icons.celebration_outlined),
                  title: const Text('Festivals'),
                  onTap: () => context.push('/festivals'),
                ),
                ListTile(
                  leading: const Icon(Icons.route_outlined),
                  title: const Text('Trip planner'),
                  onTap: () => context.push('/trip-planner'),
                ),
                const Divider(),
                Text('Support & legal',
                    style: Theme.of(context).textTheme.titleMedium),
                ...const [
                  ('Safety', '/safety', Icons.health_and_safety_outlined),
                  ('FAQs', '/faqs', Icons.quiz_outlined),
                  ('Cancellation policy', '/cancellation',
                      Icons.event_busy_outlined),
                  ('Privacy policy', '/privacy', Icons.privacy_tip_outlined),
                  ('Terms of service', '/terms', Icons.gavel_outlined),
                  ('Cookie policy', '/cookies', Icons.cookie_outlined),
                ].map(
                  (item) => ListTile(
                    leading: Icon(item.$3),
                    title: Text(item.$1),
                    onTap: () => context.push(item.$2),
                  ),
                ),
                if (user?.isGuest == true)
                  ListTile(
                    leading: const Icon(Icons.cottage_outlined),
                    title: Text(s.becomeHost),
                    onTap: () async {
                      try {
                        await ref.read(authControllerProvider.notifier).becomeHost();
                        if (context.mounted) {
                          showSnack(context, 'You are now a host');
                          context.push('/host');
                        }
                      } on AppException catch (e) {
                        if (context.mounted) showSnack(context, e.message, error: true);
                      }
                    },
                  ),
                if (user?.isHost == true)
                  ListTile(
                    leading: const Icon(Icons.dashboard_customize_outlined),
                    title: Text(s.hostDashboard),
                    onTap: () => context.push('/host'),
                  ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout, color: AppColors.error),
                  title: Text(s.logout, style: const TextStyle(color: AppColors.error)),
                  onTap: () async {
                    await ref.read(authControllerProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  },
                ),
              ],
            ),
    );
  }
}

class HelpScreen extends ConsumerStatefulWidget {
  const HelpScreen({super.key});

  @override
  ConsumerState<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends ConsumerState<HelpScreen> {
  String? _title;
  String? _content;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final section = await ref.read(apiRepositoryProvider).getCmsSection('help');
    if (mounted) {
      setState(() {
        _title = section?['title']?.toString();
        _content = stripHtml(section?['content']?.toString()) ;
        if (_content == null || _content!.isEmpty) {
          _content = 'For support, use Contact or email support.';
        }
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_title?.isNotEmpty == true ? _title! : ref.watch(stringsProvider).help)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(24),
              child: Text(_content ?? ''),
            ),
    );
  }
}

class AboutScreen extends ConsumerStatefulWidget {
  const AboutScreen({super.key});

  @override
  ConsumerState<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends ConsumerState<AboutScreen> {
  List<Map<String, dynamic>> _sections = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final sections = await ref.read(apiRepositoryProvider).getCmsSections(place: 'page');
    if (!mounted) return;
    setState(() {
      _sections = sections
          .where((s) => s['section_key'] == 'about_us' || s['section_key'] == 'our_team')
          .toList()
        ..sort((a, b) => ((a['sort_order'] as num?)?.toInt() ?? 0)
            .compareTo((b['sort_order'] as num?)?.toInt() ?? 0));
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(ref.watch(stringsProvider).about)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sections.isEmpty
              ? const EmptyState(message: 'About us content will appear here once added by the admin.')
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      'Authentic homestays, community, and the stories behind the stays.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 20),
                    ..._sections.map((section) {
                      final title = section['title']?.toString() ?? section['section_key']?.toString() ?? '';
                      final content = stripHtml(section['content']?.toString());
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 8),
                            Text(content.isEmpty ? 'Content not yet added.' : content),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
    );
  }
}

class ContactScreen extends ConsumerStatefulWidget {
  const ContactScreen({super.key});

  @override
  ConsumerState<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends ConsumerState<ContactScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _subject = TextEditingController();
  final _message = TextEditingController();
  bool _loading = false;
  bool _booting = true;
  String? _intro;
  String _address = 'Thamel, Kathmandu, Nepal';
  String _phone = '+977 1-4123456';
  String _contactEmail = 'info@nepalihomestays.com';
  XFile? _image;

  @override
  void initState() {
    super.initState();
    _loadCms();
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _loadCms() async {
    final api = ref.read(apiRepositoryProvider);
    final contact = await api.getCmsSection('contact');
    final footer = await api.getCmsSections(place: 'footer');
    String? byKey(String key) {
      for (final s in footer) {
        if (s['section_key']?.toString() == key) {
          final c = s['content']?.toString().trim();
          if (c != null && c.isNotEmpty) return c;
        }
      }
      return null;
    }

    if (!mounted) return;
    setState(() {
      _intro = stripHtml(contact?['content']?.toString());
      _address = byKey('address') ?? _address;
      _phone = byKey('contact_phone') ?? _phone;
      _contactEmail = byKey('contact_email') ?? _contactEmail;
      _booting = false;
    });
  }

  Future<void> _send() async {
    if (_name.text.trim().isEmpty ||
        _email.text.trim().isEmpty ||
        _subject.text.trim().isEmpty ||
        _message.text.trim().isEmpty) {
      showSnack(context, 'Please fill in name, email, subject, and message.', error: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(apiRepositoryProvider).contact(
            name: _name.text.trim(),
            email: _email.text.trim(),
            subject: _subject.text.trim(),
            message: _message.text.trim(),
            image: _image == null
                ? null
                : await MultipartFile.fromFile(
                    _image!.path,
                    filename: _image!.name,
                  ),
          );
      if (mounted) {
        showSnack(context, 'Message sent');
        context.pop();
      }
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.contact)),
      body: _booting
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                if (_intro != null && _intro!.isNotEmpty) ...[
                  Text(_intro!, style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: 16),
                ],
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.place_outlined),
                  title: Text(_address),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.phone_outlined),
                  title: Text(_phone),
                  onTap: () => launchUrl(Uri.parse('tel:${_phone.replaceAll(' ', '')}')),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.email_outlined),
                  title: Text(_contactEmail),
                  onTap: () => launchUrl(Uri.parse('mailto:$_contactEmail')),
                ),
                const SizedBox(height: 12),
                TextField(controller: _name, decoration: InputDecoration(labelText: s.name)),
                const SizedBox(height: 12),
                TextField(controller: _email, decoration: InputDecoration(labelText: s.email)),
                const SizedBox(height: 12),
                TextField(controller: _subject, decoration: const InputDecoration(labelText: 'Subject')),
                const SizedBox(height: 12),
                TextField(
                  controller: _message,
                  maxLines: 5,
                  decoration: const InputDecoration(labelText: 'Message'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    final image = await ImagePicker().pickImage(
                      source: ImageSource.gallery,
                      imageQuality: 80,
                    );
                    if (image == null) return;
                    final size = await image.length();
                    if (!context.mounted) return;
                    if (size > 1024 * 1024) {
                      showSnack(
                        context,
                        'Image must be 1 MB or smaller.',
                        error: true,
                      );
                      return;
                    }
                    setState(() => _image = image);
                  },
                  icon: const Icon(Icons.image_outlined),
                  label: Text(_image?.name ?? 'Attach image (optional)'),
                ),
                const SizedBox(height: 24),
                NhPrimaryButton(label: s.send, onPressed: _send, loading: _loading),
              ],
            ),
    );
  }
}

class CmsPagesScreen extends ConsumerStatefulWidget {
  const CmsPagesScreen({super.key});

  @override
  ConsumerState<CmsPagesScreen> createState() => _CmsPagesScreenState();
}

class _CmsPagesScreenState extends ConsumerState<CmsPagesScreen> {
  List<Map<String, dynamic>> _sections = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final sections = await ref.read(apiRepositoryProvider).getCmsSections(place: 'page');
    if (!mounted) return;
    setState(() {
      _sections = sections
        ..sort((a, b) => ((a['sort_order'] as num?)?.toInt() ?? 0)
            .compareTo((b['sort_order'] as num?)?.toInt() ?? 0));
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pages')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sections.isEmpty
              ? const EmptyState(message: 'No CMS pages yet')
              : ListView.builder(
                  itemCount: _sections.length,
                  itemBuilder: (context, i) {
                    final s = _sections[i];
                    final key = s['section_key']?.toString() ?? '';
                    final title = s['title']?.toString() ?? key;
                    return ListTile(
                      title: Text(title),
                      subtitle: Text(key),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/cms/$key'),
                    );
                  },
                ),
    );
  }
}

class CmsSectionScreen extends ConsumerStatefulWidget {
  const CmsSectionScreen({super.key, required this.sectionKey});
  final String sectionKey;

  @override
  ConsumerState<CmsSectionScreen> createState() => _CmsSectionScreenState();
}

class _CmsSectionScreenState extends ConsumerState<CmsSectionScreen> {
  String? _title;
  String? _content;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final section = await ref.read(apiRepositoryProvider).getCmsSection(widget.sectionKey);
    if (!mounted) return;
    setState(() {
      _title = section?['title']?.toString() ?? widget.sectionKey.replaceAll('_', ' ');
      _content = stripHtml(section?['content']?.toString());
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_title ?? 'Page')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                (_content == null || _content!.isEmpty) ? 'Content not yet added.' : _content!,
              ),
            ),
    );
  }
}
