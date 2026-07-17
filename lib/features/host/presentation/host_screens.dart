import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';

class HostShellScreen extends ConsumerStatefulWidget {
  const HostShellScreen({super.key});

  @override
  ConsumerState<HostShellScreen> createState() => _HostShellScreenState();
}

class _HostShellScreenState extends ConsumerState<HostShellScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final pages = [
      const HostOverviewTab(),
      const HostListingsTab(),
      const HostBookingsTab(),
      const HostMoreTab(),
    ];
    return Scaffold(
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.dashboard_outlined), label: s.overview),
          NavigationDestination(icon: const Icon(Icons.cottage_outlined), label: s.listings),
          NavigationDestination(icon: const Icon(Icons.event_note_outlined), label: s.bookings),
          NavigationDestination(icon: const Icon(Icons.more_horiz), label: s.more),
        ],
      ),
    );
  }
}

class HostOverviewTab extends ConsumerStatefulWidget {
  const HostOverviewTab({super.key});

  @override
  ConsumerState<HostOverviewTab> createState() => _HostOverviewTabState();
}

class _HostOverviewTabState extends ConsumerState<HostOverviewTab> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiRepositoryProvider).getHostDashboard();
      if (mounted) setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showSnack(context, e.toString(), error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final bookings = (_data?['bookings'] as List? ?? [])
        .whereType<Map>()
        .toList();
    final statusCounts = <String, int>{};
    for (final booking in bookings) {
      final status = booking['status']?.toString() ?? 'unknown';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(s.hostDashboard),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _StatCard(label: s.listings, value: '${_data?['listings_count'] ?? 0}'),
                      _StatCard(label: s.bookings, value: '${_data?['bookings_count'] ?? 0}'),
                      _StatCard(
                        label: 'Earnings',
                        value: '${_data?['earnings_currency'] ?? 'NPR'} ${(_data?['earnings'] as num?)?.toStringAsFixed(0) ?? '0'}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (statusCounts.isNotEmpty) ...[
                    Text('Booking activity',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...statusCounts.entries.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                    child: Text(entry.key.replaceAll('_', ' '))),
                                Text('${entry.value}'),
                              ],
                            ),
                            const SizedBox(height: 4),
                            LinearProgressIndicator(
                              value: bookings.isEmpty
                                  ? 0
                                  : entry.value / bookings.length,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.insights_outlined, color: AppColors.dhakaRed),
                    title: const Text('Earnings report'),
                    subtitle: const Text('Payouts by booking'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/host/earnings'),
                  ),
                ],
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.dhakaRed)),
            ],
          ),
        ),
      ),
    );
  }
}

class HostListingsTab extends ConsumerStatefulWidget {
  const HostListingsTab({super.key});

  @override
  ConsumerState<HostListingsTab> createState() => _HostListingsTabState();
}

class _HostListingsTabState extends ConsumerState<HostListingsTab> {
  List<Listing> _listings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiRepositoryProvider).getHostDashboard();
      final raw = data['listings'] as List? ?? [];
      if (mounted) {
        setState(() {
          _listings = raw.map((e) => Listing.fromJson(Map<String, dynamic>.from(e as Map))).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.listings),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/host/listings/new'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _listings.isEmpty
              ? EmptyState(message: 'No listings yet')
              : ListView.builder(
                  itemCount: _listings.length,
                  itemBuilder: (context, i) {
                    final l = _listings[i];
                    return ListTile(
                      title: Text(l.title),
                      subtitle: Text('${l.status ?? ''} · NPR ${l.pricePerNight.toStringAsFixed(0)}'),
                      trailing: PopupMenuButton<String>(
                        onSelected: (v) async {
                          if (v == 'edit') context.push('/host/listings/${l.id}/edit');
                          if (v == 'calendar') context.push('/host/calendar/${l.id}');
                          if (v == 'disable' || v == 'approved') {
                            await ref.read(apiRepositoryProvider).setListingStatus(l.id, v == 'disable' ? 'disabled' : 'approved');
                            _load();
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'calendar', child: Text('Calendar')),
                          PopupMenuItem(value: 'approved', child: Text('Enable')),
                          PopupMenuItem(value: 'disable', child: Text('Disable')),
                        ],
                      ),
                      onTap: () => context.push('/host/listings/${l.id}/edit'),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/host/listings/new'),
        label: Text(s.createListing),
        icon: const Icon(Icons.add),
      ),
    );
  }
}

class HostBookingsTab extends ConsumerStatefulWidget {
  const HostBookingsTab({super.key});

  @override
  ConsumerState<HostBookingsTab> createState() => _HostBookingsTabState();
}

class _HostBookingsTabState extends ConsumerState<HostBookingsTab> {
  List<Booking> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiRepositoryProvider).getHostDashboard();
      final raw = data['bookings'] as List? ?? [];
      if (mounted) {
        setState(() {
          _bookings = raw.map((e) => Booking.fromJson(Map<String, dynamic>.from(e as Map))).toList();
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
    return Scaffold(
      appBar: AppBar(title: Text(s.bookings)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _bookings.isEmpty
              ? EmptyState(message: 'No bookings')
              : ListView.builder(
                  itemCount: _bookings.length,
                  itemBuilder: (context, i) {
                    final b = _bookings[i];
                    return ListTile(
                      title: Text(b.listing?.title ?? 'Booking #${b.id}'),
                      subtitle: Text('${b.checkIn} → ${b.checkOut}\n${b.status}'),
                      isThreeLine: true,
                      trailing: PopupMenuButton<String>(
                        onSelected: (status) async {
                          try {
                            await ref.read(apiRepositoryProvider).updateBookingStatus(b.id, status);
                            _load();
                          } on AppException catch (e) {
                            showSnack(context, e.message, error: true);
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'confirmed', child: Text('Confirm')),
                          PopupMenuItem(value: 'cancelled', child: Text('Cancel')),
                          PopupMenuItem(value: 'completed', child: Text('Complete')),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}

class HostMoreTab extends ConsumerWidget {
  const HostMoreTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.more)),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.account_balance_wallet_outlined),
            title: Text(s.utilities),
            onTap: () => context.push('/host/utilities'),
          ),
          ListTile(
            leading: const Icon(Icons.insights_outlined),
            title: const Text('Earnings report'),
            onTap: () => context.push('/host/earnings'),
          ),
          ListTile(
            leading: const Icon(Icons.reviews_outlined),
            title: Text(s.reviews),
            onTap: () => context.push('/host/reviews'),
          ),
          ListTile(
            leading: const Icon(Icons.mail_outline),
            title: Text(s.messages),
            onTap: () => context.push('/host/messages'),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text(s.profile),
            onTap: () => context.go('/profile'),
          ),
        ],
      ),
    );
  }
}

class HostListingFormScreen extends ConsumerStatefulWidget {
  const HostListingFormScreen({super.key, this.listingId});
  final int? listingId;

  @override
  ConsumerState<HostListingFormScreen> createState() => _HostListingFormScreenState();
}

class _HostListingFormScreenState extends ConsumerState<HostListingFormScreen> {
  final _page = PageController();
  int _step = 0;
  final _title = TextEditingController();
  final _location = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController(text: '2000');
  final _guests = TextEditingController(text: '2');
  final _type = TextEditingController(text: 'individual');
  final _way = TextEditingController();
  final _amenities = TextEditingController();
  final _cohostEmail = TextEditingController();
  final _sectionAbout = TextEditingController();
  final _sectionHistory = TextEditingController();
  final _sectionStory = TextEditingController();
  List<String> _imageUrls = [];
  List<Province> _provinces = [];
  List<District> _districts = [];
  int? _provinceId;
  int? _districtId;
  String? _category;
  double? _latitude;
  double? _longitude;
  final List<Map<String, dynamic>> _extraServices = [];
  bool _loading = false;
  Listing? _existing;

  bool get _isCreate => widget.listingId == null;

  @override
  void initState() {
    super.initState();
    _loadTaxonomy();
    if (widget.listingId != null) _load();
  }

  Future<void> _loadTaxonomy() async {
    try {
      final provinces =
          await ref.read(apiRepositoryProvider).getProvinces();
      if (!mounted) return;
      setState(() => _provinces = provinces);
      if (_provinceId != null) {
        final districts = await ref
            .read(apiRepositoryProvider)
            .getDistricts(_provinceId!);
        if (mounted) setState(() => _districts = districts);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _page.dispose();
    _title.dispose();
    _location.dispose();
    _description.dispose();
    _price.dispose();
    _guests.dispose();
    _type.dispose();
    _way.dispose();
    _amenities.dispose();
    _cohostEmail.dispose();
    _sectionAbout.dispose();
    _sectionHistory.dispose();
    _sectionStory.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final listing = await ref.read(apiRepositoryProvider).getListing(widget.listingId!);
    if (!mounted) return;
    setState(() {
      _existing = listing;
      _title.text = listing.title;
      _location.text = listing.location ?? '';
      _description.text = listing.description ?? '';
      _price.text = listing.pricePerNight.toStringAsFixed(0);
      _guests.text = '${listing.maxGuests ?? 2}';
      _type.text = listing.type ?? 'individual';
      _way.text = listing.wayToGetThere ?? '';
      _amenities.text = listing.amenities.join(', ');
      _imageUrls = List.from(listing.imageUrls);
      _provinceId = listing.provinceId;
      _districtId = listing.districtId;
      _category = listing.category;
      _latitude = listing.latitude;
      _longitude = listing.longitude;
      _sectionAbout.text = listing.sections['about_us'] ?? '';
      _sectionHistory.text = listing.sections['history'] ?? '';
      _sectionStory.text = listing.sections['owners_story'] ?? '';
      _extraServices
        ..clear()
        ..addAll(listing.extraServices.map((extra) => {
              'name': extra.name,
              'price_npr': extra.priceNpr,
              'unit': extra.unit,
              'description': extra.description,
            }));
    });
    if (listing.provinceId != null) {
      try {
        final districts = await ref
            .read(apiRepositoryProvider)
            .getDistricts(listing.provinceId!);
        if (mounted) setState(() => _districts = districts);
      } catch (_) {}
    }
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final files = await picker.pickMultiImage(imageQuality: 80);
    if (files.isEmpty) return;
    setState(() => _loading = true);
    try {
      final multiparts = await Future.wait(
        files.map((f) async => MultipartFile.fromFile(f.path, filename: f.name)),
      );
      final urls = await ref.read(apiRepositoryProvider).uploadListingImages(multiparts);
      setState(() => _imageUrls = [..._imageUrls, ...urls]);
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> get _body {
    final am = _amenities.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    return {
      'title': _title.text.trim(),
      'type': _type.text.trim(),
      'location': _location.text.trim(),
      'price_per_night': num.tryParse(_price.text) ?? 0,
      'max_guests': int.tryParse(_guests.text) ?? 2,
      'description': _description.text.trim(),
      'way_to_get_there': _way.text.trim(),
      'province_id': _provinceId,
      'district_id': _districtId,
      'latitude': _latitude,
      'longitude': _longitude,
      'category': _category,
      'image_urls': _imageUrls,
      if (am.isNotEmpty) 'amenities': am,
      'sections': {
        if (_sectionAbout.text.trim().isNotEmpty)
          'about_us': _sectionAbout.text.trim(),
        if (_sectionHistory.text.trim().isNotEmpty)
          'history': _sectionHistory.text.trim(),
        if (_sectionStory.text.trim().isNotEmpty)
          'owners_story': _sectionStory.text.trim(),
      },
      'extra_services': _extraServices,
    };
  }

  Future<void> _addExtraService() async {
    final name = TextEditingController();
    final price = TextEditingController();
    final description = TextEditingController();
    var unit = 'fixed';
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialog) => AlertDialog(
          title: const Text('Add extra service'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Name'),
                ),
                TextField(
                  controller: price,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Price (NPR)'),
                ),
                DropdownButtonFormField<String>(
                  initialValue: unit,
                  decoration: const InputDecoration(labelText: 'Unit'),
                  items: const [
                    DropdownMenuItem(value: 'fixed', child: Text('Fixed')),
                    DropdownMenuItem(
                        value: 'per_person', child: Text('Per person')),
                    DropdownMenuItem(
                        value: 'per_group', child: Text('Per group')),
                  ],
                  onChanged: (value) {
                    if (value != null) setDialog(() => unit = value);
                  },
                ),
                TextField(
                  controller: description,
                  decoration:
                      const InputDecoration(labelText: 'Description'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (name.text.trim().isEmpty) return;
                Navigator.pop(dialogContext, {
                  'name': name.text.trim(),
                  'price_npr': num.tryParse(price.text) ?? 0,
                  'unit': unit,
                  'description': description.text.trim(),
                });
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
    name.dispose();
    price.dispose();
    description.dispose();
    if (result != null && mounted) {
      setState(() => _extraServices.add(result));
    }
  }

  Future<void> _save({bool goSuccess = false}) async {
    setState(() => _loading = true);
    try {
      if (_isCreate) {
        final listing = await ref.read(apiRepositoryProvider).createListing(_body);
        if (!mounted) return;
        if (goSuccess) {
          context.go('/host/listings/success?id=${listing.id}&title=${Uri.encodeComponent(listing.title)}');
        } else {
          showSnack(context, 'Listing saved');
          context.pop();
        }
      } else {
        await ref.read(apiRepositoryProvider).updateListing(widget.listingId!, _body);
        if (!mounted) return;
        showSnack(context, 'Listing saved');
        context.pop();
      }
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addCoHost() async {
    if (widget.listingId == null || _cohostEmail.text.trim().isEmpty) return;
    try {
      await ref.read(apiRepositoryProvider).addCoHost(widget.listingId!, {
        'email': _cohostEmail.text.trim(),
      });
      showSnack(context, 'Co-host invited');
      _cohostEmail.clear();
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    }
  }

  void _goStep(int step) {
    setState(() => _step = step);
    _page.animateToPage(step, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  Widget _detailsStep() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Property details', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 12),
        TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: const ['individual', 'community'].contains(_type.text)
              ? _type.text
              : null,
          decoration: const InputDecoration(labelText: 'Type'),
          items: const [
            DropdownMenuItem(
                value: 'individual', child: Text('Individual')),
            DropdownMenuItem(
                value: 'community', child: Text('Community')),
          ],
          onChanged: (value) => _type.text = value ?? '',
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String?>(
          initialValue: _category,
          decoration: const InputDecoration(labelText: 'Category'),
          items: const [
            DropdownMenuItem(value: null, child: Text('Select category')),
            DropdownMenuItem(value: 'rural', child: Text('Rural')),
            DropdownMenuItem(value: 'urban', child: Text('Urban')),
            DropdownMenuItem(value: 'eco', child: Text('Eco')),
            DropdownMenuItem(value: 'cultural', child: Text('Cultural')),
            DropdownMenuItem(value: 'farmstay', child: Text('Farmstay')),
          ],
          onChanged: (value) => setState(() => _category = value),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<int?>(
          initialValue:
              _provinces.any((p) => p.id == _provinceId) ? _provinceId : null,
          decoration: const InputDecoration(labelText: 'Province'),
          items: [
            const DropdownMenuItem(value: null, child: Text('Select province')),
            ..._provinces.map(
              (province) => DropdownMenuItem(
                value: province.id,
                child: Text(province.name),
              ),
            ),
          ],
          onChanged: (value) async {
            setState(() {
              _provinceId = value;
              _districtId = null;
              _districts = [];
            });
            if (value != null) {
              final districts = await ref
                  .read(apiRepositoryProvider)
                  .getDistricts(value);
              if (mounted) setState(() => _districts = districts);
            }
          },
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<int?>(
          key: ValueKey('host-district-$_provinceId-${_districts.length}'),
          initialValue:
              _districts.any((d) => d.id == _districtId) ? _districtId : null,
          decoration: const InputDecoration(labelText: 'District'),
          items: [
            const DropdownMenuItem(value: null, child: Text('Select district')),
            ..._districts.map(
              (district) => DropdownMenuItem(
                value: district.id,
                child: Text(district.name),
              ),
            ),
          ],
          onChanged: (value) => setState(() => _districtId = value),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _description,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'Description'),
        ),
        const SizedBox(height: 12),
        Text('Pin location', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        SizedBox(
          height: 220,
          child: FlutterMap(
            options: MapOptions(
              initialCenter: LatLng(
                _latitude ?? 28.3949,
                _longitude ?? 84.1240,
              ),
              initialZoom: _latitude == null ? 6 : 13,
              onTap: (_, point) => setState(() {
                _latitude = point.latitude;
                _longitude = point.longitude;
              }),
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'io.dghub.nepali_homestays',
              ),
              if (_latitude != null && _longitude != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(_latitude!, _longitude!),
                      width: 44,
                      height: 44,
                      child: const Icon(Icons.location_on,
                          color: AppColors.dhakaRed, size: 44),
                    ),
                  ],
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _way,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Getting there / check-in'),
        ),
        const SizedBox(height: 20),
        Text('Story & cultural sections',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        TextField(
          controller: _sectionAbout,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'About us'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _sectionHistory,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'History'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _sectionStory,
          maxLines: 3,
          decoration:
              const InputDecoration(labelText: "Homestay owner's story"),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: Text('Extra services',
                  style: Theme.of(context).textTheme.titleMedium),
            ),
            TextButton.icon(
              onPressed: _addExtraService,
              icon: const Icon(Icons.add),
              label: const Text('Add'),
            ),
          ],
        ),
        ..._extraServices.asMap().entries.map(
          (entry) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(entry.value['name']?.toString() ?? 'Service'),
            subtitle: Text(
                'NPR ${entry.value['price_npr']} · ${entry.value['unit']}'),
            trailing: IconButton(
              onPressed: () =>
                  setState(() => _extraServices.removeAt(entry.key)),
              icon: const Icon(Icons.delete_outline),
            ),
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _pickImages,
          icon: const Icon(Icons.photo_library_outlined),
          label: Text('Add photos (${_imageUrls.length})'),
        ),
        if (_isCreate) ...[
          const SizedBox(height: 24),
          NhPrimaryButton(label: 'Next: amenities & pricing', onPressed: () => _goStep(1)),
        ],
      ],
    );
  }

  Widget _amenitiesStep() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Amenities & pricing', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        TextField(
          controller: _price,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Price per night (NPR)'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _guests,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Max guests'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _amenities,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Amenities',
            hintText: 'wifi, parking, breakfast (comma separated)',
          ),
        ),
        if (!_isCreate) ...[
          const SizedBox(height: 24),
          Text('Co-host', style: Theme.of(context).textTheme.titleMedium),
          TextField(
            controller: _cohostEmail,
            decoration: const InputDecoration(labelText: 'Co-host email'),
          ),
          TextButton(onPressed: _addCoHost, child: const Text('Add co-host')),
          if (_existing?.hosts.isNotEmpty == true)
            ..._existing!.hosts.map(
              (h) => ListTile(
                title: Text(h['name']?.toString() ?? h['email']?.toString() ?? 'Host'),
                trailing: IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: () async {
                    final id = (h['id'] as num?)?.toInt();
                    if (id == null) return;
                    await ref.read(apiRepositoryProvider).removeCoHost(widget.listingId!, id);
                    _load();
                  },
                ),
              ),
            ),
        ],
        const SizedBox(height: 24),
        if (_isCreate)
          Row(
            children: [
              Expanded(
                child: OutlinedButton(onPressed: () => _goStep(0), child: const Text('Back')),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: NhPrimaryButton(
                  label: 'Publish',
                  onPressed: () => _save(goSuccess: true),
                  loading: _loading,
                ),
              ),
            ],
          )
        else
          NhPrimaryButton(label: 'Save', onPressed: _save, loading: _loading),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCreate) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit listing')),
        body: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _page,
                physics: const NeverScrollableScrollPhysics(),
                children: [_detailsStep(), _amenitiesStep()],
              ),
            ),
            if (_step == 0)
              Padding(
                padding: const EdgeInsets.all(16),
                child: NhPrimaryButton(label: 'Next', onPressed: () => _goStep(1)),
              ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_step == 0 ? 'Property details' : 'Amenities & pricing'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: (_step + 1) / 2, color: AppColors.dhakaRed),
        ),
      ),
      body: PageView(
        controller: _page,
        physics: const NeverScrollableScrollPhysics(),
        onPageChanged: (i) => setState(() => _step = i),
        children: [_detailsStep(), _amenitiesStep()],
      ),
    );
  }
}

class HostCalendarScreen extends ConsumerStatefulWidget {
  const HostCalendarScreen({super.key, required this.listingId});
  final int listingId;

  @override
  ConsumerState<HostCalendarScreen> createState() => _HostCalendarScreenState();
}

class _HostCalendarScreenState extends ConsumerState<HostCalendarScreen> {
  List<String> _blocked = [];
  final _selected = <DateTime>{};
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final dates = await ref.read(apiRepositoryProvider).getBlockedDates(widget.listingId);
      if (mounted) {
        setState(() {
          _blocked = dates;
          _loading = false;
          _selected.clear();
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _ymd(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  Future<void> _blockSelected() async {
    if (_selected.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiRepositoryProvider).blockDates(
            widget.listingId,
            _selected.map(_ymd).toList(),
          );
      showSnack(context, 'Dates blocked');
      await _load();
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unblockSelected() async {
    if (_selected.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiRepositoryProvider).unblockDates(
            widget.listingId,
            _selected.map(_ymd).toList(),
          );
      showSnack(context, 'Dates unblocked');
      await _load();
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unblockChip(String date) async {
    setState(() => _busy = true);
    try {
      await ref.read(apiRepositoryProvider).unblockDates(widget.listingId, [date]);
      await _load();
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage calendar')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Tap dates to select, then block or unblock. Already blocked: ${_blocked.length}.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                CalendarDatePicker(
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                  onDateChanged: (d) {
                    setState(() {
                      final key = _ymd(d);
                      final match = _selected.where((e) => _ymd(e) == key).toList();
                      if (match.isNotEmpty) {
                        _selected.removeWhere((e) => _ymd(e) == key);
                      } else {
                        _selected.add(d);
                      }
                    });
                  },
                ),
                OutlinedButton.icon(
                  onPressed: () async {
                    final now = DateTime.now();
                    final range = await showDateRangePicker(
                      context: context,
                      firstDate: now,
                      lastDate: now.add(const Duration(days: 365)),
                    );
                    if (range == null) return;
                    setState(() {
                      for (var day = DateUtils.dateOnly(range.start);
                          !day.isAfter(range.end);
                          day = day.add(const Duration(days: 1))) {
                        _selected.add(day);
                      }
                    });
                  },
                  icon: const Icon(Icons.date_range_outlined),
                  label: const Text('Select a date range'),
                ),
                Text('Selected: ${_selected.length}'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: NhPrimaryButton(
                        label: 'Block',
                        onPressed: _busy || _selected.isEmpty ? null : _blockSelected,
                        loading: _busy,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _busy || _selected.isEmpty ? null : _unblockSelected,
                        child: const Text('Unblock'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text('Blocked dates', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _blocked
                      .take(60)
                      .map(
                        (d) => InputChip(
                          label: Text(d),
                          onDeleted: _busy ? null : () => _unblockChip(d),
                          deleteIcon: const Icon(Icons.close, size: 16),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
    );
  }
}

class HostUtilitiesScreen extends ConsumerStatefulWidget {
  const HostUtilitiesScreen({super.key});

  @override
  ConsumerState<HostUtilitiesScreen> createState() => _HostUtilitiesScreenState();
}

class _HostUtilitiesScreenState extends ConsumerState<HostUtilitiesScreen> {
  Map<String, dynamic>? _catalog;
  List<Map<String, dynamic>> _txns = [];
  String? _selectedService;
  final _amount = TextEditingController();
  final _form = <String, TextEditingController>{};
  bool _loading = true;
  Map<String, dynamic>? _preview;
  List<Map<String, dynamic>> _neaCounters = [];
  List<Map<String, dynamic>> _neaBills = [];
  int? _selectedNeaBill;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amount.dispose();
    for (final c in _form.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiRepositoryProvider);
      final catalog = await api.getWalletCatalog();
      final txns = await api.getWalletTransactions();
      if (mounted) {
        setState(() {
          _catalog = catalog;
          _txns = txns;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showSnack(context, e.toString(), error: true);
      }
    }
  }

  List<Map<String, dynamic>> get _services {
    final list = _catalog?['services'] as List? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Map<String, dynamic> get _selectedServiceConfig => _services.firstWhere(
        (service) =>
            service['wallet_service_name']?.toString() == _selectedService,
        orElse: () => {},
      );

  bool get _isNea =>
      _selectedServiceConfig['flow_type']?.toString().toLowerCase() == 'nea';

  Map<String, dynamic>? get _selectedNeaBillData {
    final index = _selectedNeaBill;
    if (index == null || index < 0 || index >= _neaBills.length) return null;
    return _neaBills[index];
  }

  Future<void> _doPreview() async {
    if (_selectedService == null) return;
    try {
      final form = <String, String>{};
      _form.forEach((k, c) => form[k] = c.text.trim());
      final selectedBill = _selectedNeaBillData;
      if (_isNea && selectedBill == null) {
        showSnack(context, 'Select an outstanding NEA bill first',
            error: true);
        return;
      }
      final faceValue = _isNea
          ? (selectedBill!['amount_npr'] as num?)?.toDouble() ?? 0
          : num.tryParse(_amount.text) ?? 0;
      final preview = await ref.read(apiRepositoryProvider).previewWalletService({
        'wallet_service_name': _selectedService,
        'face_value_npr': faceValue,
        if (!_isNea) 'form': form,
        if (_isNea) 'data_json': jsonEncode(selectedBill!['bill']),
      });
      setState(() => _preview = preview);
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    }
  }

  Future<void> _lookupNeaBills() async {
    String field(String key) => _form[key]?.text.trim() ?? '';
    try {
      final result =
          await ref.read(apiRepositoryProvider).getNeaBills({
        'counter': field('counter'),
        'sc_no': field('sc_no'),
        'consumer_id': field('consumer_id'),
      });
      final bills = (result['bills'] as List? ?? [])
          .whereType<Map>()
          .map((bill) => Map<String, dynamic>.from(bill))
          .toList();
      if (!mounted) return;
      setState(() {
        _neaBills = bills;
        _selectedNeaBill = null;
      });
      if (bills.isEmpty) {
        showSnack(context, 'No outstanding NEA bills found');
      }
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  Future<void> _checkout() async {
    if (_selectedService == null) return;
    try {
      final form = <String, String>{};
      _form.forEach((k, c) => form[k] = c.text.trim());
      final selectedBill = _selectedNeaBillData;
      if (_isNea && selectedBill == null) {
        showSnack(context, 'Select an outstanding NEA bill first',
            error: true);
        return;
      }
      final faceValue = _isNea
          ? (selectedBill!['amount_npr'] as num?)?.toDouble() ?? 0
          : num.tryParse(_amount.text) ?? 0;
      final res = await ref.read(apiRepositoryProvider).checkoutWalletService({
        'wallet_service_name': _selectedService,
        'face_value_npr': faceValue,
        if (!_isNea) 'form': form,
        'data_json': _isNea
            ? jsonEncode(selectedBill!['bill'])
            : _preview?['data_json'],
      });
      final url = res['redirect_url']?.toString();
      if (url != null && url.isNotEmpty && mounted) {
        context.push('/pay?url=${Uri.encodeComponent(url)}');
      }
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.utilities)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_catalog?['enabled'] != true)
                  const Text('Wallet utilities are currently unavailable.')
                else ...[
                  DropdownButtonFormField<String>(
                    initialValue: _selectedService,
                    decoration: const InputDecoration(labelText: 'Service'),
                    items: _services
                        .map(
                          (svc) => DropdownMenuItem(
                            value: svc['wallet_service_name']?.toString(),
                            child: Text(svc['display_name']?.toString() ?? svc['wallet_service_name']?.toString() ?? ''),
                          ),
                        )
                        .toList(),
                    onChanged: (v) async {
                      setState(() {
                        _selectedService = v;
                        _form.clear();
                        _neaCounters = [];
                        _neaBills = [];
                        _selectedNeaBill = null;
                        final svc = _services.firstWhere(
                          (e) => e['wallet_service_name'] == v,
                          orElse: () => {},
                        );
                        final fields = svc['fields'] as List? ?? [];
                        for (final f in fields) {
                          final map = Map<String, dynamic>.from(f as Map);
                          final key = map['key']?.toString() ?? '';
                          if (key.isNotEmpty) _form[key] = TextEditingController();
                        }
                      });
                      if (_isNea) {
                        try {
                          final res = await ref.read(apiRepositoryProvider).getNeaCounters();
                          final list = res['counters'] as List? ?? res['data'] as List? ?? [];
                          if (mounted) {
                            setState(() {
                              _neaCounters = list
                                  .map((e) => Map<String, dynamic>.from(e as Map))
                                  .toList();
                            });
                          }
                        } catch (_) {}
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  if (!_isNea)
                    TextField(
                      controller: _amount,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Amount (NPR)'),
                    ),
                  ..._form.entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextField(
                        controller: e.value,
                        decoration: InputDecoration(labelText: e.key),
                      ),
                    ),
                  ),
                  if (_neaCounters.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text('NEA counters', style: Theme.of(context).textTheme.titleSmall),
                    ..._neaCounters.take(8).map(
                          (c) => ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            title: Text(c['label']?.toString() ??
                                c['name']?.toString() ??
                                c['counter_name']?.toString() ??
                                'Counter'),
                            subtitle: Text(c['value']?.toString() ??
                                c['code']?.toString() ??
                                ''),
                            onTap: () {
                              final code = c['value']?.toString() ??
                                  c['code']?.toString();
                              if (code != null &&
                                  _form.containsKey('counter')) {
                                _form['counter']!.text = code;
                              } else if (code != null && _form.isNotEmpty) {
                                _form.values.first.text = code;
                              }
                              setState(() {});
                            },
                          ),
                        ),
                  ],
                  if (_isNea) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _lookupNeaBills,
                      icon: const Icon(Icons.receipt_long_outlined),
                      label: const Text('Find outstanding bills'),
                    ),
                    ..._neaBills.asMap().entries.map((entry) {
                      final amount =
                          (entry.value['amount_npr'] as num?)?.toDouble();
                      return RadioListTile<int>(
                        contentPadding: EdgeInsets.zero,
                        value: entry.key,
                        groupValue: _selectedNeaBill,
                        title: Text(
                          amount == null
                              ? 'NEA bill'
                              : 'NEA bill · NPR ${amount.toStringAsFixed(0)}',
                        ),
                        subtitle:
                            Text(entry.value['bill']?.toString() ?? ''),
                        onChanged: (value) {
                          setState(() {
                            _selectedNeaBill = value;
                            _preview = null;
                            if (amount != null) {
                              _amount.text = amount.toStringAsFixed(0);
                            }
                          });
                        },
                      );
                    }),
                  ],
                  const SizedBox(height: 16),
                  OutlinedButton(onPressed: _doPreview, child: const Text('Preview')),
                  if (_preview != null) ...[
                    const SizedBox(height: 8),
                    Text('Host due: NPR ${(_preview!['host_due_npr'] as num?)?.toStringAsFixed(0) ?? '-'}'),
                    NhPrimaryButton(label: 'Checkout', onPressed: _checkout),
                  ],
                ],
                const SizedBox(height: 24),
                Text('Transactions', style: Theme.of(context).textTheme.titleMedium),
                ..._txns.map(
                  (t) => ListTile(
                    title: Text(t['wallet_service_name']?.toString() ?? ''),
                    subtitle: Text(t['status']?.toString() ?? ''),
                    trailing: Text(t['created_at']?.toString().split('T').first ?? ''),
                  ),
                ),
              ],
            ),
    );
  }
}

class HostReviewsScreen extends ConsumerStatefulWidget {
  const HostReviewsScreen({super.key});

  @override
  ConsumerState<HostReviewsScreen> createState() => _HostReviewsScreenState();
}

class _HostReviewsScreenState extends ConsumerState<HostReviewsScreen> {
  List<Review> _reviews = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final reviews = await ref.read(apiRepositoryProvider).getHostReviews();
      if (mounted) setState(() {
        _reviews = reviews;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(ref.watch(stringsProvider).reviews)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _reviews.isEmpty
              ? const EmptyState(message: 'No reviews yet')
              : ListView.builder(
                  itemCount: _reviews.length,
                  itemBuilder: (context, i) {
                    final r = _reviews[i];
                    return ListTile(
                      title: Text(r.guestName ?? 'Guest'),
                      subtitle: Text(r.comment ?? r.title ?? ''),
                      trailing: Text('${r.rating}★'),
                    );
                  },
                ),
    );
  }
}
