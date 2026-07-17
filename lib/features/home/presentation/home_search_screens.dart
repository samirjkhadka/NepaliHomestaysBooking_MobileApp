import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:nepali_homestays/core/currency/currency_provider.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:nepali_homestays/features/guest/presentation/favorites_controller.dart';
import 'package:nepali_homestays/features/home/data/home_static_content.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  List<Listing> _hero = [];
  List<Listing> _featured = [];
  List<Map<String, dynamic>> _news = [];
  List<Map<String, dynamic>> _videos = [];
  List<Map<String, dynamic>> _partners = [];
  List<Province> _provinces = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  String? _youtubeId(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    final m = RegExp(r'(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})')
        .firstMatch(url.trim());
    return m?.group(1);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiRepositoryProvider);
      final results = await Future.wait([
        api.getHero(),
        api.getFeatured(),
        api.getNewsFeed(),
        api.getLandingSettings(),
        api.getVideos(),
        api.getProvinces(),
        api.getPublicSetting('partners'),
      ]);
      if (!mounted) return;
      final news = results[2] as List<Map<String, dynamic>>;
      final landing = results[3] as Map<String, dynamic>;
      final gallery = results[4] as List<Map<String, dynamic>>;
      final partnersData = results[6] as Map<String, dynamic>;
      final directPartners = (partnersData['partners'] as List? ??
          partnersData['items'] as List? ??
          const []);
      final categories = partnersData['categories'] as List? ?? const [];
      final nestedPartners = categories
          .whereType<Map>()
          .expand((category) => category['partners'] as List? ?? const []);
      final partnerList = [...directPartners, ...nestedPartners]
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      final seen = <String>{};
      final videos = <Map<String, dynamic>>[];
      final landingUrl = landing['landing_youtube_url']?.toString().trim();
      if (landingUrl != null && landingUrl.isNotEmpty) {
        final id = _youtubeId(landingUrl) ?? landingUrl;
        seen.add(id);
        videos.add({'url': landingUrl, 'title': 'Featured video'});
      }
      for (final v in gallery) {
        final url = v['url']?.toString() ?? '';
        final id = _youtubeId(url) ?? url;
        if (url.isEmpty || seen.contains(id)) continue;
        seen.add(id);
        videos.add(v);
      }
      setState(() {
        _hero = results[0] as List<Listing>;
        _featured = results[1] as List<Listing>;
        _news = news.isNotEmpty ? news.take(6).toList() : List.from(homeNewsFallback);
        _videos = videos.take(4).toList();
        _provinces = results[5] as List<Province>;
        _partners = partnerList;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _onFavorite(int listingId) async {
    final auth = ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated) {
      context.push('/login');
      return;
    }
    try {
      await ref.read(favoritesIdsProvider.notifier).toggle(listingId);
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final favIds = ref.watch(favoritesIdsProvider);
    final locale = ref.watch(localeProvider);
    final currency = ref.watch(currencyProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.appName),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.language),
            tooltip: 'Language',
            onSelected: (code) {
              ref.read(localeProvider.notifier).setLocale(Locale(code));
            },
            itemBuilder: (_) => [
              CheckedPopupMenuItem(
                value: 'en',
                checked: locale.languageCode == 'en',
                child: const Text('English'),
              ),
              CheckedPopupMenuItem(
                value: 'ne',
                checked: locale.languageCode == 'ne',
                child: const Text('नेपाली'),
              ),
            ],
          ),
          PopupMenuButton<String>(
            icon: Text(
              currency.code,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
            ),
            tooltip: 'Currency',
            onSelected: (code) => ref.read(currencyProvider.notifier).setCurrency(code),
            itemBuilder: (_) => currencyCodes
                .map(
                  (c) => CheckedPopupMenuItem(
                    value: c,
                    checked: currency.code == c,
                    child: Text('$c (${currencySymbols[c] ?? c})'),
                  ),
                )
                .toList(),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorRetry(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    children: [
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                        padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppRadii.xl),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.primary.withValues(alpha: 0.12),
                              AppColors.secondaryContainer.withValues(alpha: 0.45),
                              AppColors.surfaceContainer,
                            ],
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              s.appName,
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    color: AppColors.dhakaRed,
                                  ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              s.explore,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: AppColors.onSurfaceVariant,
                                  ),
                            ),
                            const SizedBox(height: 14),
                            OutlinedButton.icon(
                              onPressed: () => context.go('/search'),
                              icon: const Icon(Icons.search),
                              label: Text(s.search),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          alignment: WrapAlignment.spaceBetween,
                          children: const [
                            _HomeStat(
                                icon: Icons.people_outline,
                                value: '10,000+',
                                label: 'Travelers hosted'),
                            _HomeStat(
                                icon: Icons.cottage_outlined,
                                value: '200+',
                                label: 'Verified hosts'),
                            _HomeStat(
                                icon: Icons.map_outlined,
                                value: '7',
                                label: 'Provinces'),
                            _HomeStat(
                                icon: Icons.star_outline,
                                value: '4.8',
                                label: 'Average rating'),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                        child: Card(
                          color:
                              AppColors.primary.withValues(alpha: 0.06),
                          child: const Padding(
                            padding: EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Our impact',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(height: 6),
                                Text(
                                  'Every booking supports local families and helps preserve Nepal’s rich cultural heritage.',
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      SectionHeader(s.featured),
                      SizedBox(
                        height: ListingCard.denseHeight,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          itemCount: (_featured.isNotEmpty ? _featured : _hero).length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, i) {
                            final list = _featured.isNotEmpty ? _featured : _hero;
                            if (list.isEmpty) return const SizedBox.shrink();
                            final item = list[i];
                            return SizedBox(
                              width: 240,
                              height: ListingCard.denseHeight,
                              child: ListingCard(
                                listing: item,
                                dense: true,
                                isFavorite: favIds.contains(item.id),
                                onFavorite: () => _onFavorite(item.id),
                                onTap: () => context.push('/listing/${item.id}'),
                              ),
                            );
                          },
                        ),
                      ),
                      SectionHeader('Near you'),
                      ...(_hero.isNotEmpty ? _hero : _featured).map(
                        (item) => Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: ListingCard(
                            listing: item,
                            isFavorite: favIds.contains(item.id),
                            onFavorite: () => _onFavorite(item.id),
                            onTap: () => context.push('/listing/${item.id}'),
                          ),
                        ),
                      ),
                      if (_hero.isEmpty && _featured.isEmpty)
                        EmptyState(message: s.emptyListings, icon: Icons.cottage_outlined),
                      SectionHeader('Guest stories'),
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.format_quote,
                                        color: AppColors.dhakaRed),
                                    Spacer(),
                                    Text('★★★★★',
                                        style: TextStyle(
                                            color: AppColors.secondary)),
                                  ],
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'The host family treated us like their own. Waking up to the Himalayan sunrise with Nepali chai was unforgettable.',
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Sarah Johnson · United States',
                                  style:
                                      TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      SectionHeader('Explore by region'),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        child: Text(
                          'The Map of Nepal — tap a province to search homestays',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.onSurfaceVariant,
                              ),
                        ),
                      ),
                      ..._provinces.map((p) {
                        final slug = (p.slug ?? p.name).toLowerCase();
                        final count = provinceHomestayCounts[slug] ?? 20;
                        final signature = provinceSignatures[slug] ?? 'Homestays across the region';
                        return Card(
                          margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                              child: Text(
                                '$count',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.dhakaRed,
                                ),
                              ),
                            ),
                            title: Text(p.name),
                            subtitle: Text('$signature · $count homestays'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.go('/search?provinceId=${p.id}'),
                          ),
                        );
                      }),
                      if (_videos.isNotEmpty) ...[
                        SectionHeader(
                          'Video stories',
                          action: TextButton(
                            onPressed: () => context.push('/videos'),
                            child: const Text('View all'),
                          ),
                        ),
                        SizedBox(
                          height: 168,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            scrollDirection: Axis.horizontal,
                            itemCount: _videos.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (context, i) {
                              final v = _videos[i];
                              final url = v['url']?.toString() ?? '';
                              final id = _youtubeId(url);
                              final thumb = id == null
                                  ? null
                                  : 'https://img.youtube.com/vi/$id/hqdefault.jpg';
                              return SizedBox(
                                width: 220,
                                child: InkWell(
                                  onTap: () => _openUrl(url),
                                  borderRadius: BorderRadius.circular(AppRadii.lg),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(AppRadii.lg),
                                          child: Stack(
                                            fit: StackFit.expand,
                                            children: [
                                              if (thumb != null)
                                                Image.network(thumb, fit: BoxFit.cover)
                                              else
                                                ColoredBox(color: AppColors.surfaceContainerHigh),
                                              const Center(
                                                child: Icon(Icons.play_circle_fill, size: 48, color: Colors.white),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        v['title']?.toString() ?? 'Video',
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context).textTheme.titleSmall,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                      SectionHeader(
                        'Blogs & news',
                        action: TextButton(
                          onPressed: () => context.push('/blogs'),
                          child: const Text('View all'),
                        ),
                      ),
                      ..._news.map((item) {
                        final title = item['title']?.toString() ?? 'Article';
                        final excerpt = item['excerpt']?.toString() ?? '';
                        final url = item['url']?.toString() ?? homeNewsSourceUrl;
                        final category = item['category']?.toString() ?? 'News';
                        return Card(
                          margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                          child: ListTile(
                            title: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
                            subtitle: Text(
                              '$category\n$excerpt',
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            isThreeLine: true,
                            trailing: const Icon(Icons.open_in_new, size: 18),
                            onTap: () => _openUrl(url),
                          ),
                        );
                      }),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        child: TextButton(
                          onPressed: () => _openUrl(homeNewsSourceUrl),
                          child: const Text('View all articles'),
                        ),
                      ),
                      if (_partners.isNotEmpty) ...[
                        SectionHeader('Our partners'),
                        SizedBox(
                          height: 88,
                          child: ListView.separated(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            scrollDirection: Axis.horizontal,
                            itemCount: _partners.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemBuilder: (context, index) {
                              final partner = _partners[index];
                              return Card(
                                child: SizedBox(
                                  width: 180,
                                  child: ListTile(
                                    leading:
                                        const Icon(Icons.handshake_outlined),
                                    title: Text(
                                      partner['name']?.toString() ??
                                          partner['title']?.toString() ??
                                          'Partner',
                                      maxLines: 2,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        child: Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () =>
                                    context.push('/festivals'),
                                icon:
                                    const Icon(Icons.celebration_outlined),
                                label: const Text('Festivals'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () =>
                                    context.push('/trip-planner'),
                                icon: const Icon(Icons.route_outlined),
                                label: const Text('Plan a trip'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _HomeStat extends StatelessWidget {
  const _HomeStat({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Icon(icon, color: AppColors.dhakaRed),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: const TextStyle(fontWeight: FontWeight.w800)),
                Text(label,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.initialProvinceId});

  final int? initialProvinceId;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _query = TextEditingController();
  List<Listing> _items = [];
  List<Province> _provinces = [];
  List<District> _districts = [];
  int? _provinceId;
  int? _districtId;
  int _guests = 1;
  String? _category;
  String? _type;
  double? _minPrice;
  double? _maxPrice;
  String _sort = 'default';
  int _page = 1;
  int _total = 0;
  int _loadedRawCount = 0;
  static const _pageSize = 20;
  bool _loadingMore = false;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _provinceId = widget.initialProvinceId;
    _bootstrap();
  }

  @override
  void didUpdateWidget(covariant SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialProvinceId != oldWidget.initialProvinceId &&
        widget.initialProvinceId != _provinceId) {
      _provinceId = widget.initialProvinceId;
      _search();
    }
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final provinces = await ref.read(apiRepositoryProvider).getProvinces();
      if (!mounted) return;
      final initial = widget.initialProvinceId;
      final validId = initial != null && provinces.any((p) => p.id == initial) ? initial : null;
      setState(() {
        _provinces = provinces;
        _provinceId = validId;
      });
      if (validId != null) {
        try {
          final d = await ref.read(apiRepositoryProvider).getDistricts(validId);
          if (mounted) setState(() => _districts = d);
        } catch (_) {}
      }
    } catch (_) {}
    await _search();
  }

  Future<void> _search({bool loadMore = false}) async {
    if (loadMore) {
      if (_loadingMore || _loadedRawCount >= _total) return;
      setState(() => _loadingMore = true);
    } else {
      _page = 1;
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    final q = _query.text.trim();
    try {
      final result = await ref.read(apiRepositoryProvider).getListingsPage(
            location: q.isEmpty ? null : q,
            title: q.isEmpty ? null : q,
            category: _category,
            type: _type,
            sort: _sort,
            minPrice: _minPrice,
            maxPrice: _maxPrice,
            provinceId: _provinceId,
            districtId: _districtId,
            guests: _guests,
            page: loadMore ? _page + 1 : 1,
            limit: _pageSize,
          );
      if (!mounted) return;
      final pageItems = result.listings;
      setState(() {
        if (loadMore) {
          _page++;
          _items = [..._items, ...pageItems];
          _loadedRawCount += result.listings.length;
        } else {
          _items = pageItems;
          _loadedRawCount = result.listings.length;
        }
        _sortItems();
        _total = result.total;
        _loading = false;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
        _loadingMore = false;
      });
    }
  }

  void _sortItems() {
    if (_sort == 'price_asc') {
      _items.sort((a, b) => a.pricePerNight.compareTo(b.pricePerNight));
    } else if (_sort == 'price_desc') {
      _items.sort((a, b) => b.pricePerNight.compareTo(a.pricePerNight));
    }
  }

  Future<void> _openFilters() async {
    final minController =
        TextEditingController(text: _minPrice?.toStringAsFixed(0) ?? '');
    final maxController =
        TextEditingController(text: _maxPrice?.toStringAsFixed(0) ?? '');
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                  20, 8, 20, 20 + MediaQuery.viewInsetsOf(ctx).bottom),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Filters', style: Theme.of(ctx).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int?>(
                    value: _provinces.any((p) => p.id == _provinceId) ? _provinceId : null,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Province'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All')),
                      ..._provinces.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))),
                    ],
                    onChanged: (v) async {
                      setState(() {
                        _provinceId = v;
                        _districtId = null;
                        _districts = [];
                      });
                      setModal(() {});
                      if (v != null) {
                        try {
                          final districts = await ref
                              .read(apiRepositoryProvider)
                              .getDistricts(v);
                          if (mounted) {
                            setState(() => _districts = districts);
                            setModal(() {});
                          }
                        } catch (_) {}
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int?>(
                    value: _districts.any((d) => d.id == _districtId) ? _districtId : null,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'District'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All')),
                      ..._districts.map((d) => DropdownMenuItem(value: d.id, child: Text(d.name))),
                    ],
                    onChanged: (v) {
                      setState(() => _districtId = v);
                      Navigator.pop(ctx);
                      _search();
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    initialValue: _category,
                    decoration: const InputDecoration(labelText: 'Category'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Any category')),
                      DropdownMenuItem(value: 'rural', child: Text('Rural')),
                      DropdownMenuItem(value: 'urban', child: Text('Urban')),
                      DropdownMenuItem(value: 'eco', child: Text('Eco')),
                      DropdownMenuItem(value: 'cultural', child: Text('Cultural')),
                      DropdownMenuItem(value: 'farmstay', child: Text('Farmstay')),
                    ],
                    onChanged: (value) {
                      setState(() => _category = value);
                      setModal(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    initialValue: _type,
                    decoration:
                        const InputDecoration(labelText: 'Homestay type'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Any type')),
                      DropdownMenuItem(
                          value: 'individual', child: Text('Individual')),
                      DropdownMenuItem(
                          value: 'community', child: Text('Community')),
                    ],
                    onChanged: (value) {
                      setState(() => _type = value);
                      setModal(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minController,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Min price (NPR)'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: maxController,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Max price (NPR)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _sort,
                    decoration: const InputDecoration(labelText: 'Sort'),
                    items: const [
                      DropdownMenuItem(
                          value: 'default', child: Text('Recommended')),
                      DropdownMenuItem(
                          value: 'price_asc',
                          child: Text('Price: low to high')),
                      DropdownMenuItem(
                          value: 'price_desc',
                          child: Text('Price: high to low')),
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() => _sort = value);
                      setModal(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text('Guests'),
                      IconButton(
                        onPressed: () {
                          if (_guests > 1) {
                            setState(() => _guests--);
                            setModal(() {});
                          }
                        },
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('$_guests'),
                      IconButton(
                        onPressed: () {
                          setState(() => _guests++);
                          setModal(() {});
                        },
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  NhPrimaryButton(
                    label: 'Apply filters',
                    onPressed: () {
                      setState(() {
                        _minPrice =
                            double.tryParse(minController.text.trim());
                        _maxPrice =
                            double.tryParse(maxController.text.trim());
                      });
                      Navigator.pop(ctx);
                      _search();
                    },
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _category = null;
                        _type = null;
                        _minPrice = null;
                        _maxPrice = null;
                        _sort = 'default';
                        _guests = 1;
                      });
                      Navigator.pop(ctx);
                      _search();
                    },
                    child: const Text('Clear filters'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    minController.dispose();
    maxController.dispose();
  }

  Future<void> _onProvince(int? id) async {
    setState(() {
      _provinceId = id;
      _districtId = null;
      _districts = [];
    });
    if (id != null) {
      try {
        final d = await ref.read(apiRepositoryProvider).getDistricts(id);
        if (mounted) setState(() => _districts = d);
      } catch (_) {}
    }
    await _search();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.search),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined),
            onPressed: () => context.push('/search/map'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _query,
                  decoration: InputDecoration(
                    hintText: 'Village, district, or homestay',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.tune),
                      tooltip: 'Filters',
                      onPressed: _openFilters,
                    ),
                  ),
                  onSubmitted: (_) => _search(),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<int?>(
                        key: ValueKey('province-${_provinceId ?? 'all'}-${_provinces.length}'),
                        value: _provinces.any((p) => p.id == _provinceId) ? _provinceId : null,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Province',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('All', overflow: TextOverflow.ellipsis)),
                          ..._provinces.map(
                            (p) => DropdownMenuItem(
                              value: p.id,
                              child: Text(p.name, overflow: TextOverflow.ellipsis),
                            ),
                          ),
                        ],
                        onChanged: _onProvince,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<int?>(
                        key: ValueKey('district-$_provinceId-${_districtId ?? 'all'}-${_districts.length}'),
                        value: _districts.any((d) => d.id == _districtId) ? _districtId : null,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'District',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('All', overflow: TextOverflow.ellipsis)),
                          ..._districts.map(
                            (d) => DropdownMenuItem(
                              value: d.id,
                              child: Text(d.name, overflow: TextOverflow.ellipsis),
                            ),
                          ),
                        ],
                        onChanged: (v) {
                          setState(() => _districtId = v);
                          _search();
                        },
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Text(s.guests),
                    IconButton(
                      onPressed: () {
                        if (_guests > 1) {
                          setState(() => _guests--);
                          _search();
                        }
                      },
                      icon: const Icon(Icons.remove_circle_outline),
                    ),
                    Text('$_guests'),
                    IconButton(
                      onPressed: () {
                        setState(() => _guests++);
                        _search();
                      },
                      icon: const Icon(Icons.add_circle_outline),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? ErrorRetry(message: _error!, onRetry: _search)
                    : _items.isEmpty
                        ? EmptyState(message: s.emptyListings)
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                            itemCount: _items.length +
                                (_loadedRawCount < _total ? 1 : 0),
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, i) {
                              if (i == _items.length) {
                                return Center(
                                  child: TextButton(
                                    onPressed: _loadingMore
                                        ? null
                                        : () => _search(loadMore: true),
                                    child: _loadingMore
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                                strokeWidth: 2),
                                          )
                                        : Text(
                                            'Load more (${_items.length} of $_total)'),
                                  ),
                                );
                              }
                              final item = _items[i];
                              final favIds = ref.watch(favoritesIdsProvider);
                              return ListingCard(
                                listing: item,
                                isFavorite: favIds.contains(item.id),
                                onFavorite: () async {
                                  final auth = ref.read(authControllerProvider);
                                  if (auth.status != AuthStatus.authenticated) {
                                    context.push('/login');
                                    return;
                                  }
                                  try {
                                    await ref.read(favoritesIdsProvider.notifier).toggle(item.id);
                                  } on AppException catch (e) {
                                    if (context.mounted) showSnack(context, e.message, error: true);
                                  }
                                },
                                onTap: () => context.push('/listing/${item.id}'),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class SearchMapScreen extends ConsumerStatefulWidget {
  const SearchMapScreen({super.key});

  @override
  ConsumerState<SearchMapScreen> createState() => _SearchMapScreenState();
}

class _SearchMapScreenState extends ConsumerState<SearchMapScreen> {
  List<Listing> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await ref.read(apiRepositoryProvider).getListings(limit: 50);
      if (mounted) {
        setState(() {
          _items = items.where((e) => e.latitude != null && e.longitude != null).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final center = _items.isNotEmpty
        ? LatLng(_items.first.latitude!, _items.first.longitude!)
        : const LatLng(28.3949, 84.1240);

    return Scaffold(
      appBar: AppBar(title: Text(s.map)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(initialCenter: center, initialZoom: 7),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'io.dghub.nepali_homestays',
                ),
                MarkerLayer(
                  markers: _items
                      .map(
                        (l) => Marker(
                          point: LatLng(l.latitude!, l.longitude!),
                          width: 40,
                          height: 40,
                          child: GestureDetector(
                            onTap: () => context.push('/listing/${l.id}'),
                            child: const Icon(Icons.location_on, color: AppColors.dhakaRed, size: 40),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
    );
  }
}
