import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:nepali_homestays/core/config/env.dart';
import 'package:nepali_homestays/core/currency/currency_provider.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/core/utils/html_text.dart';
import 'package:nepali_homestays/core/utils/listing_section_labels.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:nepali_homestays/features/payments/presentation/payment_nav.dart';
import 'package:nepali_homestays/features/payments/presentation/payment_screens.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:share_plus/share_plus.dart';

class ListingDetailScreen extends ConsumerStatefulWidget {
  const ListingDetailScreen({super.key, required this.id});
  final int id;

  @override
  ConsumerState<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends ConsumerState<ListingDetailScreen> {
  Listing? _listing;
  List<Review> _reviews = [];
  List<Listing> _nearby = [];
  bool _loading = true;
  bool _fav = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiRepositoryProvider);
      final listing = await api.getListing(widget.id);
      final reviews = await api.getListingReviews(widget.id);
      var nearby = <Listing>[];
      if (listing.districtId != null || listing.provinceId != null) {
        try {
          nearby = (await api.getListings(
            districtId: listing.districtId,
            provinceId: listing.districtId == null ? listing.provinceId : null,
            limit: 6,
          ))
              .where((item) => item.id != listing.id)
              .take(4)
              .toList();
        } catch (_) {}
      }
      bool fav = false;
      final auth = ref.read(authControllerProvider);
      if (auth.status == AuthStatus.authenticated) {
        try {
          final favorites = await api.getFavorites();
          fav = favorites.any((f) => f.listingId == widget.id);
        } catch (_) {}
      }
      if (!mounted) return;
      setState(() {
        _listing = listing;
        _reviews = reviews;
        _nearby = nearby;
        _fav = fav;
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

  Future<void> _toggleFav() async {
    final auth = ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated) {
      context.push('/login');
      return;
    }
    try {
      final api = ref.read(apiRepositoryProvider);
      if (_fav) {
        await api.removeFavorite(widget.id);
      } else {
        await api.addFavorite(widget.id);
      }
      setState(() => _fav = !_fav);
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_error != null || _listing == null) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorRetry(message: _error ?? 'Not found', onRetry: _load),
      );
    }
    final listing = _listing!;
    final currency = ref.watch(currencyProvider);
    final images = listing.imageUrls.map(Env.imageUrl).where((u) => u.isNotEmpty).toList();
    final experience = listing.experienceBadgeKeys;
    const skipSectionKeys = {
      'experience_badges',
      'guest_photo_wall',
      'host_video_intro',
    };

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            actions: [
              IconButton(
                tooltip: 'Share',
                onPressed: () {
                  SharePlus.instance.share(
                    ShareParams(
                      text:
                          '${listing.title}\nhttps://nepalihomestays.com/listings/${listing.id}',
                      subject: listing.title,
                    ),
                  );
                },
                icon: const Icon(Icons.share_outlined),
              ),
              IconButton(
                onPressed: _toggleFav,
                icon: Icon(_fav ? Icons.favorite : Icons.favorite_border, color: AppColors.dhakaRed),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: images.isEmpty
                  ? Container(color: AppColors.surfaceContainerHigh)
                  : PageView.builder(
                      itemCount: images.length,
                      itemBuilder: (_, i) => CachedNetworkImage(imageUrl: images[i], fit: BoxFit.cover),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(listing.title, style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 4),
                  Text(
                    listing.location ?? '',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.onSurfaceVariant,
                          fontStyle: FontStyle.italic,
                        ),
                  ),
                  if (listing.badgeKeys.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    ListingBadgeRow(badges: listing.badgeKeys),
                  ],
                  if (experience.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (experience.contains('cultural-heritage'))
                          Chip(
                            avatar: const Icon(Icons.account_balance, size: 16),
                            label: const Text('Cultural Heritage'),
                            side: BorderSide(color: AppColors.secondary.withValues(alpha: 0.5)),
                            backgroundColor: AppColors.secondaryContainer.withValues(alpha: 0.55),
                          ),
                        if (experience.contains('eco-certified'))
                          Chip(
                            avatar: Icon(Icons.eco_outlined, size: 16, color: Colors.green.shade800),
                            label: Text(
                              'Eco-certified',
                              style: TextStyle(color: Colors.green.shade800),
                            ),
                            side: BorderSide(color: Colors.green.withValues(alpha: 0.45)),
                            backgroundColor: Colors.green.withValues(alpha: 0.12),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(
                        currency.format(listing.pricePerNight),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.dhakaRed),
                      ),
                      Text(s.perNight),
                      const Spacer(),
                      if (listing.averageRating != null)
                        Row(
                          children: [
                            const Icon(Icons.star, color: AppColors.secondary, size: 18),
                            Text('${listing.averageRating!.toStringAsFixed(1)} (${listing.reviewCount ?? 0})'),
                          ],
                        ),
                    ],
                  ),
                  if (stripHtml(listing.description).isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('About', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(stripHtml(listing.description)),
                  ],
                  if (listing.amenities.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Amenities', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: listing.amenities.map((a) => Chip(label: Text(a))).toList(),
                    ),
                  ],
                  if (listing.extraServices.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Extra services',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Optional paid add-ons can be selected while booking.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 8),
                    ...listing.extraServices.map(
                      (extra) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.add_circle_outline),
                        title: Text(extra.name),
                        subtitle: extra.description == null
                            ? null
                            : Text(extra.description!),
                        trailing: Text(
                          '${currency.format(extra.priceNpr)}'
                          '${extra.unit == 'per_person' ? ' / person' : extra.unit == 'per_group' ? ' / group' : ''}',
                        ),
                      ),
                    ),
                  ],
                  if (listing.latitude != null && listing.longitude != null) ...[
                    const SizedBox(height: 20),
                    Text('Location & directions', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadii.lg),
                      child: SizedBox(
                        height: 200,
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: LatLng(listing.latitude!, listing.longitude!),
                            initialZoom: 12,
                            interactionOptions: const InteractionOptions(
                              flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag,
                            ),
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'io.dghub.nepali_homestays',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(listing.latitude!, listing.longitude!),
                                  width: 44,
                                  height: 44,
                                  child: const Icon(
                                    Icons.location_on,
                                    color: AppColors.dhakaRed,
                                    size: 44,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (stripHtml(listing.wayToGetThere).isNotEmpty ||
                        stripHtml(listing.sections['how_to_get_there']).isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        stripHtml(
                          listing.sections['how_to_get_there']?.trim().isNotEmpty == true
                              ? listing.sections['how_to_get_there']
                              : listing.wayToGetThere,
                        ),
                      ),
                    ],
                  ] else if (stripHtml(listing.wayToGetThere).isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Getting there', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(stripHtml(listing.wayToGetThere)),
                  ],
                  if (listing.sections.entries.any(
                    (e) =>
                        !skipSectionKeys.contains(e.key) &&
                        e.key != 'how_to_get_there' &&
                        stripHtml(e.value).isNotEmpty,
                  )) ...[
                    const SizedBox(height: 20),
                    Text('Life at this hearth', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...listing.sections.entries
                        .where(
                          (e) =>
                              !skipSectionKeys.contains(e.key) &&
                              e.key != 'how_to_get_there' &&
                              stripHtml(e.value).isNotEmpty,
                        )
                        .map(
                      (e) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              listingSectionTitle(e.key),
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    color: AppColors.dhakaRed,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(stripHtml(e.value)),
                          ],
                        ),
                      ),
                    ),
                  ],
                  if (listing.hosts.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Your hosts', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...listing.hosts.map((h) {
                      final id = (h['id'] as num?)?.toInt();
                      final name = h['name']?.toString() ?? h['email']?.toString() ?? 'Host';
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: AppColors.secondaryContainer,
                          child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'H'),
                        ),
                        title: Text(name),
                        subtitle: Text(h['bio']?.toString() ?? 'Homestay host'),
                        trailing: id == null ? null : const Icon(Icons.chevron_right),
                        onTap: id == null
                            ? null
                            : () => context.push(
                                  '/host-profile/$id?listingId=${listing.id}',
                                ),
                      );
                    }),
                  ],
                  const SizedBox(height: 20),
                  Text(s.reviews, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  if (_reviews.isEmpty)
                    const Text('No reviews yet')
                  else
                    ..._reviews.take(5).map(
                      (r) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(r.guestName ?? 'Guest'),
                        subtitle: Text(r.comment ?? r.title ?? ''),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star, size: 16, color: AppColors.secondary),
                            Text('${r.rating}'),
                          ],
                        ),
                      ),
                    ),
                  if (_nearby.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Nearby homestays',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ..._nearby.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ListingCard(
                          listing: item,
                          onTap: () => context.push('/listing/${item.id}'),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 88),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: NhPrimaryButton(
            label: s.bookNow,
            onPressed: () {
              final auth = ref.read(authControllerProvider);
              if (auth.status != AuthStatus.authenticated) {
                context.push('/login');
                return;
              }
              context.push('/booking/${listing.id}');
            },
          ),
        ),
      ),
    );
  }
}

class BookingFlowScreen extends ConsumerStatefulWidget {
  const BookingFlowScreen({super.key, required this.listingId});
  final int listingId;

  @override
  ConsumerState<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends ConsumerState<BookingFlowScreen> {
  DateTimeRange? _range;
  int _guests = 1;
  final _message = TextEditingController();
  BookingPreview? _preview;
  bool _loading = false;
  bool _previewLoading = false;
  /// `full` or `partial` when preview allows partial payment.
  String _paymentType = 'full';
  int? _partialPercent;
  /// `npx` (e-bank/m-bank) or `himalpay` (N-Cash), matching web.
  String _paymentProvider = 'npx';
  List<DateTime> _blockedDates = [];
  Listing? _listing;
  final Map<int, int> _extraQuantities = {};
  bool _initialLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBookingData();
  }

  Future<void> _loadBookingData() async {
    final api = ref.read(apiRepositoryProvider);
    try {
      final results = await Future.wait([
        api.getListing(widget.listingId),
        api.getBlockedDates(widget.listingId),
      ]);
      if (!mounted) return;
      setState(() {
        _listing = results[0] as Listing;
        _blockedDates = (results[1] as List<String>)
            .map(DateTime.tryParse)
            .whereType<DateTime>()
            .map(DateUtils.dateOnly)
            .toList();
        _initialLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _initialLoading = false);
      showSnack(context, e.toString(), error: true);
    }
  }

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _pickDates() async {
    final now = DateTime.now();
    final blocked = _blockedDates
        .map((date) => DateFormat('yyyy-MM-dd').format(date))
        .toSet();
    bool available(DateTime date) =>
        !blocked.contains(DateFormat('yyyy-MM-dd').format(date));
    bool availableForCheckIn(DateTime date) =>
        available(date) && available(date.add(const Duration(days: 1)));
    DateTime nextAvailableCheckIn(DateTime from) {
      var candidate = DateUtils.dateOnly(from);
      while (!availableForCheckIn(candidate)) {
        candidate = candidate.add(const Duration(days: 1));
      }
      return candidate;
    }
    final initialStart = nextAvailableCheckIn(_range?.start ?? now);
    final start = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      initialDate: initialStart,
      selectableDayPredicate: availableForCheckIn,
      helpText: 'Select check-in',
    );
    if (start == null || !mounted) return;
    final earliestEnd = start.add(const Duration(days: 1));
    final preferredEnd = _range?.end.isAfter(start) == true
        ? _range!.end
        : earliestEnd;
    final end = await showDatePicker(
      context: context,
      firstDate: start.add(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
      initialDate: available(preferredEnd) ? preferredEnd : earliestEnd,
      selectableDayPredicate: (date) {
        if (!available(date)) return false;
        for (var day = start;
            day.isBefore(date);
            day = day.add(const Duration(days: 1))) {
          if (!available(day)) return false;
        }
        return true;
      },
      helpText: 'Select check-out',
    );
    if (end != null) {
      setState(() => _range = DateTimeRange(start: start, end: end));
      await _loadPreview();
    }
  }

  String _fmt(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  List<Map<String, dynamic>> get _selectedExtras => _extraQuantities.entries
      .where((entry) => entry.value > 0)
      .map((entry) => {
            'extra_service_id': entry.key,
            'quantity': entry.value,
          })
      .toList();

  Future<void> _loadPreview() async {
    if (_range == null) return;
    setState(() => _previewLoading = true);
    try {
      final preview = await ref.read(apiRepositoryProvider).getBookingPreview(
            listingId: widget.listingId,
            checkIn: _fmt(_range!.start),
            checkOut: _fmt(_range!.end),
            guests: _guests,
            extraServices: _selectedExtras,
          );
      if (mounted) {
        setState(() {
          _preview = preview;
          final min = preview.partialPaymentMinPercent;
          if (min == null || min <= 0) {
            _paymentType = 'full';
            _partialPercent = null;
          } else {
            _partialPercent ??= min.round().clamp(1, 99);
          }
          if (preview.npxAvailable && !preview.himalpayAvailable) {
            _paymentProvider = 'npx';
          } else if (!preview.npxAvailable && preview.himalpayAvailable) {
            _paymentProvider = 'himalpay';
          } else if (preview.npxAvailable) {
            _paymentProvider = 'npx';
          }
        });
      }
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _previewLoading = false);
    }
  }

  Future<void> _pay() async {
    if (_range == null) {
      showSnack(context, 'Select dates', error: true);
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await ref.read(apiRepositoryProvider).initiatePayment({
        'listing_id': widget.listingId,
        'check_in': _fmt(_range!.start),
        'check_out': _fmt(_range!.end),
        'guests': _guests,
        if (_message.text.trim().isNotEmpty) 'message': _message.text.trim(),
        'payment_type': _paymentType,
        if (_paymentType == 'partial' && _partialPercent != null)
          'partial_percent': _partialPercent,
        if (_preview?.showPaymentMethodPicker == true) 'payment_provider': _paymentProvider,
        if (_selectedExtras.isNotEmpty) 'extra_services': _selectedExtras,
      });
      if (!mounted) return;
      navigateToPayment(context, res);
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final currency = ref.watch(currencyProvider);
    if (_initialLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Book stay')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(s.checkIn),
            subtitle: Text(
              _range == null
                  ? 'Select dates'
                  : '${_fmt(_range!.start)} → ${_fmt(_range!.end)}',
            ),
            trailing: const Icon(Icons.calendar_month),
            onTap: _pickDates,
          ),
          Row(
            children: [
              Text(s.guests),
              IconButton(
                onPressed: () {
                  if (_guests > 1) {
                    setState(() => _guests--);
                    _loadPreview();
                  }
                },
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$_guests'),
              IconButton(
                onPressed: () {
                  setState(() => _guests++);
                  _loadPreview();
                },
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
          TextField(
            controller: _message,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Message to host'),
          ),
          if (_listing?.extraServices.isNotEmpty == true) ...[
            const SizedBox(height: 16),
            Text('Extra services',
                style: Theme.of(context).textTheme.titleMedium),
            ..._listing!.extraServices.map((extra) {
              final quantity = _extraQuantities[extra.id] ?? 0;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(extra.name),
                subtitle: Text(
                  '${currency.format(extra.priceNpr)}'
                  '${extra.unit == 'per_person' ? ' per person' : extra.unit == 'per_group' ? ' per group' : ' fixed'}',
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      onPressed: quantity == 0
                          ? null
                          : () {
                              setState(() =>
                                  _extraQuantities[extra.id] = quantity - 1);
                              _loadPreview();
                            },
                      icon: const Icon(Icons.remove_circle_outline),
                    ),
                    Text('$quantity'),
                    IconButton(
                      onPressed: () {
                        setState(
                            () => _extraQuantities[extra.id] = quantity + 1);
                        _loadPreview();
                      },
                      icon: const Icon(Icons.add_circle_outline),
                    ),
                  ],
                ),
              );
            }),
          ],
          const SizedBox(height: 16),
          if (_previewLoading) const LinearProgressIndicator(),
          if (_preview != null) ...[
            Text(s.total, style: Theme.of(context).textTheme.titleMedium),
            Text(
              '${currency.format(_preview!.total)}'
              ' · ${_preview!.nights} nights',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.dhakaRed),
            ),
            if (_preview!.feeLabel != null)
              Text('${_preview!.feeLabel}: ${currency.format(_preview!.feeAmount)}'),
            if (_preview!.extraServicesTotal > 0)
              Text(
                'Extra services: ${currency.format(_preview!.extraServicesTotal)}',
              ),
            if (_preview!.partialPaymentMinPercent != null &&
                _preview!.partialPaymentMinPercent! > 0) ...[
              const SizedBox(height: 16),
              Text('Payment option', style: Theme.of(context).textTheme.titleMedium),
              RadioListTile<String>(
                contentPadding: EdgeInsets.zero,
                title: const Text('Pay in full'),
                value: 'full',
                groupValue: _paymentType,
                onChanged: (v) => setState(() => _paymentType = v ?? 'full'),
              ),
              RadioListTile<String>(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  'Partial (${_partialPercent ?? _preview!.partialPaymentMinPercent!.round()}%)',
                ),
                subtitle: Text(
                  'Minimum ${_preview!.partialPaymentMinPercent!.round()}%',
                ),
                value: 'partial',
                groupValue: _paymentType,
                onChanged: (v) => setState(() {
                  _paymentType = v ?? 'full';
                  _partialPercent ??= _preview!.partialPaymentMinPercent!.round();
                }),
              ),
              if (_paymentType == 'partial') ...[
                Builder(
                  builder: (context) {
                    final min = _preview!.partialPaymentMinPercent!;
                    final val = (_partialPercent ?? min.round())
                        .toDouble()
                        .clamp(min, 99)
                        .toDouble();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          '$_partialPercent% of total',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                color: AppColors.dhakaRed,
                              ),
                        ),
                        SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            activeTrackColor: AppColors.dhakaRed,
                            inactiveTrackColor: AppColors.outlineVariant,
                            thumbColor: AppColors.dhakaRed,
                            overlayColor: AppColors.dhakaRed.withValues(alpha: 0.15),
                            valueIndicatorColor: AppColors.dhakaRed,
                            trackHeight: 6,
                          ),
                          child: Slider(
                            value: val,
                            min: min,
                            max: 99,
                            divisions: (99 - min.round()).clamp(1, 98),
                            label: '$_partialPercent%',
                            onChanged: (v) => setState(() => _partialPercent = v.round()),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ],
            if (_preview!.showPaymentMethodPicker) ...[
              const SizedBox(height: 16),
              Text('Pay with', style: Theme.of(context).textTheme.titleMedium),
              if (_preview!.npxAvailable)
                RadioListTile<String>(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Pay via e-bank / m-bank (NPX)'),
                  value: 'npx',
                  groupValue: _paymentProvider,
                  onChanged: (v) => setState(() => _paymentProvider = v ?? 'npx'),
                ),
              if (_preview!.himalpayAvailable)
                RadioListTile<String>(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Pay via N-Cash'),
                  value: 'himalpay',
                  groupValue: _paymentProvider,
                  onChanged: (v) => setState(() => _paymentProvider = v ?? 'himalpay'),
                ),
            ],
          ],
          const SizedBox(height: 24),
          NhPrimaryButton(label: s.pay, onPressed: _pay, loading: _loading),
        ],
      ),
    );
  }
}

class PaymentWebViewScreen extends StatelessWidget {
  const PaymentWebViewScreen({
    super.key,
    this.url,
    this.bookingId,
    this.redirectForm,
  });

  final String? url;
  final String? bookingId;
  final Map<String, dynamic>? redirectForm;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
        backgroundColor: AppColors.surfaceContainerLowest,
        actions: [
          TextButton(
            onPressed: () => context.go('/booking-confirm?id=${bookingId ?? ''}'),
            child: const Text('Done'),
          ),
        ],
      ),
      body: PayWebView(url: url, redirectForm: redirectForm),
    );
  }
}
