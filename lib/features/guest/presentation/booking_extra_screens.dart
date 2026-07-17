import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/core/utils/html_text.dart';
import 'package:nepali_homestays/features/payments/presentation/payment_nav.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';

/// Guest modifies an unpaid booking by cancelling it and re-initiating with new dates.
class ModifyBookingScreen extends ConsumerStatefulWidget {
  const ModifyBookingScreen({super.key, required this.bookingId});
  final int bookingId;

  @override
  ConsumerState<ModifyBookingScreen> createState() => _ModifyBookingScreenState();
}

class _ModifyBookingScreenState extends ConsumerState<ModifyBookingScreen> {
  Booking? _booking;
  DateTimeRange? _range;
  int _guests = 1;
  final _message = TextEditingController();
  BookingPreview? _preview;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final bookings = await ref.read(apiRepositoryProvider).getBookings();
      final b = bookings.where((e) => e.id == widget.bookingId).firstOrNull;
      if (b == null) {
        setState(() {
          _error = 'Booking not found';
          _loading = false;
        });
        return;
      }
      final status = b.status.toLowerCase();
      final canModify = status.contains('pending') || status == 'approved';
      DateTimeRange? range;
      try {
        final start = DateTime.parse(b.checkIn);
        final end = DateTime.parse(b.checkOut);
        range = DateTimeRange(start: start, end: end);
      } catch (_) {}
      setState(() {
        _booking = b;
        _guests = b.guests;
        _message.text = b.message ?? '';
        _range = range;
        _loading = false;
        if (!canModify) _error = 'Only unpaid reservations can be modified.';
      });
      if (canModify && range != null) await _loadPreview();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  String _fmt(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  Future<void> _loadPreview() async {
    final b = _booking;
    if (b == null || _range == null) return;
    try {
      final preview = await ref.read(apiRepositoryProvider).getBookingPreview(
            listingId: b.listingId,
            checkIn: _fmt(_range!.start),
            checkOut: _fmt(_range!.end),
            guests: _guests,
          );
      if (mounted) setState(() => _preview = preview);
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  Future<void> _pickDates() async {
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange: _range,
    );
    if (range != null) {
      setState(() => _range = range);
      await _loadPreview();
    }
  }

  Future<void> _submit() async {
    final b = _booking;
    if (b == null || _range == null) return;
    setState(() => _saving = true);
    try {
      final api = ref.read(apiRepositoryProvider);
      await api.cancelBooking(b.id);
      final res = await api.initiatePayment({
        'listing_id': b.listingId,
        'check_in': _fmt(_range!.start),
        'check_out': _fmt(_range!.end),
        'guests': _guests,
        if (_message.text.trim().isNotEmpty) 'message': _message.text.trim(),
        'payment_type': 'full',
      });
      if (!mounted) return;
      showSnack(context, 'Booking updated');
      navigateToPayment(context, res);
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Modify booking')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _booking == null
              ? ErrorRetry(message: _error!, onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      _booking?.listing?.title ?? 'Booking #${widget.bookingId}',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Cancel the current unpaid reservation and book new dates.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: AppColors.error)),
                    ],
                    const SizedBox(height: 16),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(s.checkIn),
                      subtitle: Text(
                        _range == null
                            ? 'Select dates'
                            : '${_fmt(_range!.start)} → ${_fmt(_range!.end)}',
                      ),
                      trailing: const Icon(Icons.calendar_month),
                      onTap: _error != null && _booking != null && !_error!.contains('unpaid')
                          ? null
                          : _pickDates,
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
                    if (_preview != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        '${_preview!.currency} ${_preview!.total.toStringAsFixed(0)} · ${_preview!.nights} nights',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.dhakaRed),
                      ),
                    ],
                    const SizedBox(height: 24),
                    NhPrimaryButton(
                      label: 'Save changes',
                      onPressed: (_error != null && _error!.contains('unpaid')) || _range == null
                          ? null
                          : _submit,
                      loading: _saving,
                    ),
                  ],
                ),
    );
  }
}

class CheckInInstructionsScreen extends ConsumerStatefulWidget {
  const CheckInInstructionsScreen({super.key, required this.bookingId});
  final int bookingId;

  @override
  ConsumerState<CheckInInstructionsScreen> createState() => _CheckInInstructionsScreenState();
}

class _CheckInInstructionsScreenState extends ConsumerState<CheckInInstructionsScreen> {
  Booking? _booking;
  Listing? _listing;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiRepositoryProvider);
      final bookings = await api.getBookings();
      final b = bookings.where((e) => e.id == widget.bookingId).firstOrNull;
      if (b == null) {
        setState(() {
          _error = 'Booking not found';
          _loading = false;
        });
        return;
      }
      Listing? listing = b.listing;
      try {
        listing = await api.getListing(b.listingId);
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _booking = b;
        _listing = listing;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Check-in instructions')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorRetry(message: _error!, onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      _listing?.title ?? _booking?.listing?.title ?? 'Your stay',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text('${_booking!.checkIn} → ${_booking!.checkOut}'),
                    Text(_listing?.location ?? ''),
                    const SizedBox(height: 24),
                    Text('Arrival guide', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(
                      stripHtml(_listing?.wayToGetThere).isNotEmpty
                          ? stripHtml(_listing?.wayToGetThere)
                          : 'Your host has not added landmark directions yet. Message them for arrival tips.',
                    ),
                    if (_listing?.sections.isNotEmpty == true) ...[
                      const SizedBox(height: 24),
                      Text('House notes', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ..._listing!.sections.entries.map(
                        (e) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                e.key.replaceAll('_', ' '),
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              Text(stripHtml(e.value)),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    OutlinedButton.icon(
                      onPressed: () {
                        final hosts = _listing?.hosts ?? [];
                        final other = hosts.isNotEmpty ? (hosts.first['id'] as num?)?.toInt() : null;
                        context.push(
                          '/messages/${_booking!.id}?receiverId=${other ?? 0}&name=${Uri.encodeComponent(_listing?.title ?? 'Host')}',
                        );
                      },
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: const Text('Message host'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () => context.push('/listing/${_booking!.listingId}'),
                      child: const Text('View listing'),
                    ),
                  ],
                ),
    );
  }
}

class TripItineraryScreen extends ConsumerStatefulWidget {
  const TripItineraryScreen({super.key, required this.bookingId});
  final int bookingId;

  @override
  ConsumerState<TripItineraryScreen> createState() => _TripItineraryScreenState();
}

class _TripItineraryScreenState extends ConsumerState<TripItineraryScreen> {
  Booking? _booking;
  Listing? _listing;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiRepositoryProvider);
      final bookings = await api.getBookings();
      final b = bookings.where((e) => e.id == widget.bookingId).firstOrNull;
      Listing? listing;
      if (b != null) {
        try {
          listing = await api.getListing(b.listingId);
        } catch (_) {
          listing = b.listing;
        }
      }
      if (mounted) {
        setState(() {
          _booking = b;
          _listing = listing;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trip itinerary')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _booking == null
              ? const EmptyState(message: 'Trip not found')
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      _listing?.title ?? 'Stay',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 16),
                    _ItineraryTile(
                      icon: Icons.login,
                      title: 'Check-in',
                      subtitle: _booking!.checkIn,
                    ),
                    _ItineraryTile(
                      icon: Icons.logout,
                      title: 'Check-out',
                      subtitle: _booking!.checkOut,
                    ),
                    _ItineraryTile(
                      icon: Icons.people_outline,
                      title: 'Guests',
                      subtitle: '${_booking!.guests}',
                    ),
                    if (_listing?.location != null)
                      _ItineraryTile(
                        icon: Icons.place_outlined,
                        title: 'Location',
                        subtitle: _listing!.location!,
                      ),
                    if (stripHtml(_listing?.wayToGetThere).isNotEmpty)
                      _ItineraryTile(
                        icon: Icons.directions,
                        title: 'Getting there',
                        subtitle: stripHtml(_listing?.wayToGetThere),
                      ),
                    const SizedBox(height: 16),
                    NhPrimaryButton(
                      label: 'Check-in instructions',
                      onPressed: () => context.push('/check-in/${_booking!.id}'),
                    ),
                  ],
                ),
    );
  }
}

class _ItineraryTile extends StatelessWidget {
  const _ItineraryTile({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppColors.dhakaRed),
      title: Text(title),
      subtitle: Text(subtitle),
    );
  }
}
