import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';

class HostMessagesScreen extends ConsumerWidget {
  const HostMessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Guest messages')),
      body: FutureBuilder<List<Conversation>>(
        future: ref.read(apiRepositoryProvider).getConversations(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final conversations = snapshot.data!;
          if (conversations.isEmpty) {
            return const EmptyState(
              message: 'No guest conversations yet',
              icon: Icons.mail_outline,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: conversations.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, index) {
              final conversation = conversations[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.secondaryContainer,
                  child: Text(
                    conversation.otherName.isEmpty
                        ? 'G'
                        : conversation.otherName[0].toUpperCase(),
                  ),
                ),
                title: Text(conversation.otherName),
                subtitle: Text(
                  '${conversation.listingTitle}\n${conversation.lastMessage ?? ''}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                isThreeLine: true,
                trailing: conversation.unreadCount > 0
                    ? Badge(label: Text('${conversation.unreadCount}'))
                    : const Icon(Icons.chevron_right),
                onTap: () => context.push(
                  '/messages/${conversation.bookingId}'
                  '?receiverId=${conversation.otherUserId}'
                  '&name=${Uri.encodeComponent(conversation.otherName)}',
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class HostListingSuccessScreen extends StatelessWidget {
  const HostListingSuccessScreen({super.key, this.listingId, this.title});

  final int? listingId;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Icon(Icons.check_circle, size: 72, color: AppColors.dhakaRed.withValues(alpha: 0.9)),
              const SizedBox(height: 16),
              Text(
                'Your hearth is listed',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                title?.isNotEmpty == true
                    ? '"$title" is ready for review and bookings.'
                    : 'Your listing was created successfully.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
              ),
              const Spacer(),
              if (listingId != null)
                OutlinedButton(
                  onPressed: () => context.go('/host/calendar/$listingId'),
                  child: const Text('Manage calendar'),
                ),
              const SizedBox(height: 8),
              NhPrimaryButton(
                label: 'Back to host dashboard',
                onPressed: () => context.go('/host'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HostEarningsReportScreen extends ConsumerStatefulWidget {
  const HostEarningsReportScreen({super.key});

  @override
  ConsumerState<HostEarningsReportScreen> createState() => _HostEarningsReportScreenState();
}

class _HostEarningsReportScreenState extends ConsumerState<HostEarningsReportScreen> {
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
    final bookings = (_data?['bookings'] as List? ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final currency = _data?['earnings_currency']?.toString() ?? 'NPR';
    final total = (_data?['earnings'] as num?)?.toDouble() ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Earnings report')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Total earnings', style: Theme.of(context).textTheme.labelLarge),
                          const SizedBox(height: 8),
                          Text(
                            '$currency ${total.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  color: AppColors.dhakaRed,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'From ${bookings.length} booking(s) on your listings',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('By booking', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  if (bookings.isEmpty)
                    const EmptyState(message: 'No payout history yet')
                  else
                    ...bookings.map((b) {
                      final payout = (b['host_payout'] as num?)?.toDouble() ??
                          (b['payment_amount'] as num?)?.toDouble() ??
                          (b['total_amount'] as num?)?.toDouble();
                      String? title = b['listing_title']?.toString();
                      if ((title == null || title.isEmpty) && b['listing'] is Map) {
                        title = (b['listing'] as Map)['title']?.toString();
                      }
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(title ?? 'Booking #${b['id']}'),
                        subtitle: Text(
                          '${b['check_in'] ?? ''} → ${b['check_out'] ?? ''}\n${b['status'] ?? ''}',
                        ),
                        isThreeLine: true,
                        trailing: Text(
                          payout == null ? '—' : '$currency ${payout.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}

class HostProfileScreen extends ConsumerStatefulWidget {
  const HostProfileScreen({super.key, required this.hostId, this.listingId});

  final int hostId;
  final int? listingId;

  @override
  ConsumerState<HostProfileScreen> createState() => _HostProfileScreenState();
}

class _HostProfileScreenState extends ConsumerState<HostProfileScreen> {
  Listing? _listing;
  Map<String, dynamic>? _host;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final listingId = widget.listingId;
      if (listingId != null) {
        final listing = await ref.read(apiRepositoryProvider).getListing(listingId);
        Map<String, dynamic>? host;
        for (final h in listing.hosts) {
          if ((h['id'] as num?)?.toInt() == widget.hostId) {
            host = h;
            break;
          }
        }
        host ??= listing.hosts.isNotEmpty ? listing.hosts.first : null;
        if (mounted) {
          setState(() {
            _listing = listing;
            _host = host;
            _loading = false;
          });
        }
        return;
      }
      if (mounted) setState(() => _loading = false);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _host?['name']?.toString() ?? 'Host';
    final bio = _host?['bio']?.toString() ??
        _listing?.sections['host_story'] ??
        _listing?.sections['about_host'] ??
        'A local host welcoming travelers into their Himalayan hearth.';

    return Scaffold(
      appBar: AppBar(title: const Text('Host profile')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.secondaryContainer,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'H',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                const SizedBox(height: 16),
                Text(name, style: Theme.of(context).textTheme.headlineMedium),
                if (_host?['email'] != null)
                  Text(
                    _host!['email'].toString(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                  ),
                const SizedBox(height: 20),
                Text('Story', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(bio),
                if (_listing != null) ...[
                  const SizedBox(height: 24),
                  Text('Homestay', style: Theme.of(context).textTheme.titleMedium),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(_listing!.title),
                    subtitle: Text(_listing!.location ?? ''),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/listing/${_listing!.id}'),
                  ),
                ],
              ],
            ),
    );
  }
}
