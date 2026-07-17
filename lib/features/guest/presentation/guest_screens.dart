import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart' hide Card;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/config/env.dart';
import 'package:nepali_homestays/core/currency/currency_provider.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/core/utils/html_text.dart';
import 'package:nepali_homestays/core/utils/status_labels.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:nepali_homestays/features/guest/presentation/favorites_controller.dart';
import 'package:nepali_homestays/features/payments/presentation/payment_nav.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';

class TripsScreen extends ConsumerStatefulWidget {
  const TripsScreen({super.key});

  @override
  ConsumerState<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends ConsumerState<TripsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Booking> _bookings = [];
  List<FavoriteRow> _favorites = [];
  List<Conversation> _conversations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiRepositoryProvider);
      final results = await Future.wait([
        api.getBookings(),
        api.getFavorites(),
        api.getConversations(),
      ]);
      if (!mounted) return;
      setState(() {
        _bookings = results[0] as List<Booking>;
        _favorites = results[1] as List<FavoriteRow>;
        _conversations = results[2] as List<Conversation>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showSnack(context, e.toString(), error: true);
      }
    }
  }

  Future<void> _cancel(Booking b) async {
    try {
      await ref.read(apiRepositoryProvider).cancelBooking(b.id);
      showSnack(context, 'Booking cancelled');
      _load();
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    }
  }

  Future<void> _resumePay(Booking b) async {
    try {
      final res = await ref.read(apiRepositoryProvider).resumePayment(b.id);
      if (!mounted) return;
      navigateToPayment(context, res, bookingIdFallback: b.id);
    } on AppException catch (e) {
      showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final currency = ref.watch(currencyProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.trips),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: [
            Tab(text: s.bookings),
            Tab(text: s.wishlist),
            Tab(text: s.messages),
            Tab(text: s.paymentHistory),
            const Tab(text: 'Review'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabs,
              children: [
                RefreshIndicator(
                  onRefresh: _load,
                  child: _bookings.isEmpty
                      ? ListView(children: [EmptyState(message: 'No bookings yet')])
                      : ListView.builder(
                          itemCount: _bookings.length,
                          itemBuilder: (context, i) {
                            final b = _bookings[i];
                            return Card(
                              margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                              child: ListTile(
                                title: Text(b.listing?.title ?? 'Booking #${b.id}'),
                                subtitle: Text(
                                  '${b.checkIn} → ${b.checkOut}\n${humanReadableStatus(b.status)}'
                                  '${b.totalAmount != null ? ' · ${currency.format(b.totalAmount!)}' : ''}',
                                ),
                                isThreeLine: true,
                                onTap: () => context.push('/booking-detail/${b.id}'),
                                trailing: PopupMenuButton<String>(
                                  onSelected: (v) {
                                    if (v == 'cancel') _cancel(b);
                                    if (v == 'pay') _resumePay(b);
                                    if (v == 'review') context.push('/review/${b.id}');
                                    if (v == 'modify') context.push('/booking-modify/${b.id}');
                                    if (v == 'checkin') context.push('/check-in/${b.id}');
                                    if (v == 'itinerary') context.push('/itinerary/${b.id}');
                                    if (v == 'message') {
                                      final other = b.listing?.hosts.isNotEmpty == true
                                          ? (b.listing!.hosts.first['id'] as num?)?.toInt()
                                          : null;
                                      context.push(
                                        '/messages/${b.id}?receiverId=${other ?? 0}&name=${Uri.encodeComponent(b.listing?.title ?? 'Host')}',
                                      );
                                    }
                                  },
                                  itemBuilder: (_) => [
                                    if (b.status.toLowerCase().contains('pending') ||
                                        b.status.toLowerCase().contains('unpaid') ||
                                        b.status.toLowerCase() == 'approved')
                                      const PopupMenuItem(value: 'pay', child: Text('Resume payment')),
                                    if (b.status.toLowerCase().contains('pending') ||
                                        b.status.toLowerCase() == 'approved')
                                      const PopupMenuItem(value: 'modify', child: Text('Modify')),
                                    const PopupMenuItem(value: 'checkin', child: Text('Check-in guide')),
                                    const PopupMenuItem(value: 'itinerary', child: Text('Itinerary')),
                                    const PopupMenuItem(value: 'message', child: Text('Message')),
                                    const PopupMenuItem(value: 'review', child: Text('Rate stay')),
                                    const PopupMenuItem(value: 'cancel', child: Text('Cancel')),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
                _favorites.isEmpty
                    ? EmptyState(message: 'No saved homes')
                    : ListView.builder(
                        itemCount: _favorites.length,
                        itemBuilder: (context, i) {
                          final f = _favorites[i];
                          final img = Env.imageUrl(f.imageUrl);
                          return ListTile(
                            leading: img.isEmpty
                                ? const Icon(Icons.cottage)
                                : ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: CachedNetworkImage(imageUrl: img, width: 56, height: 56, fit: BoxFit.cover),
                                  ),
                            title: Text(f.listingTitle),
                            subtitle: Text(f.listingLocation),
                            onTap: () => context.push('/listing/${f.listingId}'),
                            trailing: IconButton(
                              icon: const Icon(Icons.favorite, color: AppColors.dhakaRed),
                              onPressed: () async {
                                await ref.read(favoritesIdsProvider.notifier).toggle(f.listingId);
                                _load();
                              },
                            ),
                          );
                        },
                      ),
                _conversations.isEmpty
                    ? EmptyState(message: 'No messages', icon: Icons.mail_outline)
                    : ListView.builder(
                        itemCount: _conversations.length,
                        itemBuilder: (context, i) {
                          final c = _conversations[i];
                          return ListTile(
                            title: Text(c.otherName),
                            subtitle: Text(c.lastMessage ?? c.listingTitle),
                            trailing: c.unreadCount > 0
                                ? CircleAvatar(
                                    radius: 12,
                                    backgroundColor: AppColors.dhakaRed,
                                    child: Text('${c.unreadCount}', style: const TextStyle(fontSize: 11, color: Colors.white)),
                                  )
                                : null,
                            onTap: () => context.push(
                              '/messages/${c.bookingId}?receiverId=${c.otherUserId}&name=${Uri.encodeComponent(c.otherName)}',
                            ),
                          );
                        },
                      ),
                _bookings.where((b) => (b.paidAmount ?? b.totalAmount) != null).isEmpty
                    ? EmptyState(message: 'No payments yet')
                    : ListView(
                        children: _bookings
                            .where((b) => (b.paidAmount ?? b.totalAmount) != null)
                            .map(
                              (b) {
                                final name = b.listing?.title?.trim().isNotEmpty == true
                                    ? b.listing!.title
                                    : 'Homestay';
                                final amount = b.paidAmount ?? b.totalAmount!;
                                return ListTile(
                                  title: Text(name),
                                  subtitle: Text(
                                    'Booking ID: ${b.id}\n${humanReadableStatus(b.status)}',
                                  ),
                                  isThreeLine: true,
                                  trailing: Text(
                                    currency.format(amount),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.dhakaRed,
                                    ),
                                  ),
                                  onTap: () => context.push('/booking-detail/${b.id}'),
                                );
                              },
                            )
                            .toList(),
                      ),
                _bookings.isEmpty
                    ? EmptyState(message: 'Complete a stay to leave a review')
                    : ListView(
                        children: _bookings
                            .map(
                              (b) => ListTile(
                                title: Text(b.listing?.title ?? 'Booking #${b.id}'),
                                trailing: const Icon(Icons.rate_review_outlined),
                                onTap: () => context.push('/review/${b.id}'),
                              ),
                            )
                            .toList(),
                      ),
              ],
            ),
    );
  }
}

class BookingDetailScreen extends ConsumerWidget {
  const BookingDetailScreen({super.key, required this.bookingId});
  final int bookingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Booking>>(
      future: ref.read(apiRepositoryProvider).getBookings(),
      builder: (context, snap) {
        if (!snap.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final b = snap.data!.where((e) => e.id == bookingId).firstOrNull;
        if (b == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const EmptyState(message: 'Booking not found'),
          );
        }
        return Scaffold(
          appBar: AppBar(title: Text('Booking #${b.id}')),
          body: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(b.listing?.title ?? 'Homestay', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text('Status: ${humanReadableStatus(b.status)}'),
              Text('Check-in: ${b.checkIn}'),
              Text('Check-out: ${b.checkOut}'),
              Text('Guests: ${b.guests}'),
              if (b.totalAmount != null) Text('Total: NPR ${b.totalAmount!.toStringAsFixed(0)}'),
              if (stripHtml(b.listing?.wayToGetThere).isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Check-in instructions', style: Theme.of(context).textTheme.titleMedium),
                Text(stripHtml(b.listing?.wayToGetThere)),
              ],
              const SizedBox(height: 24),
              NhPrimaryButton(
                label: 'Check-in guide',
                onPressed: () => context.push('/check-in/${b.id}'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.push('/itinerary/${b.id}'),
                child: const Text('Trip itinerary'),
              ),
              const SizedBox(height: 8),
              if (b.status.toLowerCase().contains('pending') || b.status.toLowerCase() == 'approved')
                OutlinedButton(
                  onPressed: () => context.push('/booking-modify/${b.id}'),
                  child: const Text('Modify booking'),
                ),
              if (Env.stripePublishableKey.isNotEmpty &&
                  (b.status.toLowerCase().contains('pending') ||
                      b.status.toLowerCase() == 'approved')) ...[
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: () async {
                    try {
                      final result = await ref
                          .read(apiRepositoryProvider)
                          .createStripePayment(b.id);
                      final secret = result['client_secret']?.toString();
                      if (secret == null || secret.isEmpty) {
                        throw AppException(
                            'Card payment is not available for this booking.');
                      }
                      await Stripe.instance.initPaymentSheet(
                        paymentSheetParameters:
                            SetupPaymentSheetParameters(
                          paymentIntentClientSecret: secret,
                          merchantDisplayName: Env.appName,
                          style: ThemeMode.system,
                        ),
                      );
                      await Stripe.instance.presentPaymentSheet();
                      if (context.mounted) {
                        context.go('/booking-confirm?id=${b.id}');
                      }
                    } on StripeException catch (e) {
                      if (context.mounted &&
                          e.error.code != FailureCode.Canceled) {
                        showSnack(context,
                            e.error.localizedMessage ?? 'Card payment failed',
                            error: true);
                      }
                    } on AppException catch (e) {
                      if (context.mounted) {
                        showSnack(context, e.message, error: true);
                      }
                    }
                  },
                  icon: const Icon(Icons.credit_card),
                  label: const Text('Pay by card'),
                ),
              ],
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.push('/listing/${b.listingId}'),
                child: const Text('View listing'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({super.key, required this.bookingId});
  final int bookingId;

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  int _rating = 5;
  final _title = TextEditingController();
  final _comment = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _title.dispose();
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await ref.read(apiRepositoryProvider).createReview(
            bookingId: widget.bookingId,
            rating: _rating,
            title: _title.text.trim().isEmpty ? null : _title.text.trim(),
            comment: _comment.text.trim().isEmpty ? null : _comment.text.trim(),
          );
      if (!mounted) return;
      showSnack(context, 'Thanks for your review');
      context.pop();
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rate your stay')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final star = i + 1;
              return IconButton(
                onPressed: () => setState(() => _rating = star),
                icon: Icon(
                  star <= _rating ? Icons.star : Icons.star_border,
                  color: AppColors.secondary,
                  size: 36,
                ),
              );
            }),
          ),
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(
            controller: _comment,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Comment'),
          ),
          const SizedBox(height: 24),
          NhPrimaryButton(label: 'Submit', onPressed: _submit, loading: _loading),
        ],
      ),
    );
  }
}

class MessageThreadScreen extends ConsumerStatefulWidget {
  const MessageThreadScreen({
    super.key,
    required this.bookingId,
    required this.receiverId,
    required this.name,
  });

  final int bookingId;
  final int receiverId;
  final String name;

  @override
  ConsumerState<MessageThreadScreen> createState() => _MessageThreadScreenState();
}

class _MessageThreadScreenState extends ConsumerState<MessageThreadScreen> {
  final _text = TextEditingController();
  List<ChatMessage> _messages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final msgs = await ref.read(apiRepositoryProvider).getThread(widget.bookingId);
      if (mounted) setState(() {
        _messages = msgs;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final body = _text.text.trim();
    if (body.isEmpty) return;
    try {
      await ref.read(apiRepositoryProvider).sendMessage(
            bookingId: widget.bookingId,
            receiverId: widget.receiverId,
            message: body,
          );
      _text.clear();
      await _load();
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(authControllerProvider).user?.id;
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(widget.name)),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, i) {
                      final m = _messages[i];
                      final mine = m.senderId == me;
                      return Align(
                        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: mine ? AppColors.secondaryContainer : AppColors.surfaceContainerHigh,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(m.message),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _text,
                      decoration: const InputDecoration(hintText: 'Message'),
                    ),
                  ),
                  IconButton(onPressed: _send, icon: Icon(Icons.send, color: AppColors.dhakaRed), tooltip: s.send),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final items = await ref.read(apiRepositoryProvider).getNotifications();
    if (mounted) setState(() {
      _items = items;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.notifications)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? EmptyState(message: 'No notifications')
              : ListView.builder(
                  itemCount: _items.length,
                  itemBuilder: (context, i) {
                    final n = _items[i];
                    return ListTile(
                      title: Text(n['title']?.toString() ?? n['message']?.toString() ?? 'Notification'),
                      subtitle: Text(n['body']?.toString() ?? n['created_at']?.toString() ?? ''),
                    );
                  },
                ),
    );
  }
}
