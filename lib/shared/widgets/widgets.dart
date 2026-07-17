import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/core/config/env.dart';
import 'package:nepali_homestays/core/currency/currency_provider.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/shared/models/models.dart';

class NhPrimaryButton extends StatelessWidget {
  const NhPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        child: loading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(label.toUpperCase()),
      ),
    );
  }
}

/// Password field with show / hide toggle.
class NhPasswordField extends StatefulWidget {
  const NhPasswordField({
    super.key,
    required this.controller,
    required this.label,
    this.textInputAction,
  });

  final TextEditingController controller;
  final String label;
  final TextInputAction? textInputAction;

  @override
  State<NhPasswordField> createState() => _NhPasswordFieldState();
}

class _NhPasswordFieldState extends State<NhPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      obscureText: _obscure,
      textInputAction: widget.textInputAction,
      decoration: InputDecoration(
        labelText: widget.label,
        suffixIcon: IconButton(
          tooltip: _obscure ? 'Show password' : 'Hide password',
          onPressed: () => setState(() => _obscure = !_obscure),
          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
        ),
      ),
    );
  }
}

/// Recommended / Featured / New pills (web ListingBadges parity).
class ListingBadgeRow extends StatelessWidget {
  const ListingBadgeRow({super.key, required this.badges, this.compact = false});

  final List<String> badges;
  final bool compact;

  static const _labels = {
    'recommended': 'Recommended',
    'featured': 'Featured',
    'new': 'New',
  };

  static const _colors = {
    'recommended': Color(0xFFFFE8D6),
    'featured': Color(0xFFD6E8FF),
    'new': Color(0xFFD8F5E5),
  };

  static const _fg = {
    'recommended': Color(0xFF9A442D),
    'featured': Color(0xFF1E4B8C),
    'new': Color(0xFF1B6B45),
  };

  @override
  Widget build(BuildContext context) {
    final keys = badges
        .map((e) => e.trim().toLowerCase())
        .where((e) => _labels.containsKey(e))
        .toList();
    if (keys.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: keys.map((k) {
        return Container(
          padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 10, vertical: compact ? 2 : 4),
          decoration: BoxDecoration(
            color: _colors[k],
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: (_fg[k] ?? AppColors.outline).withValues(alpha: 0.25)),
          ),
          child: Text(
            _labels[k]!,
            style: TextStyle(
              fontSize: compact ? 10 : 12,
              fontWeight: FontWeight.w700,
              color: _fg[k],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class ListingCard extends ConsumerWidget {
  const ListingCard({
    super.key,
    required this.listing,
    required this.onTap,
    this.onFavorite,
    this.isFavorite = false,
    this.dense = false,
  });

  final Listing listing;
  final VoidCallback onTap;
  final VoidCallback? onFavorite;
  final bool isFavorite;

  /// Compact horizontal carousel card (fixed total size — no bottom overflow).
  final bool dense;

  /// Must match home Featured `SizedBox` height.
  /// Image + compact text (title/location/price) with padding — keep ≥ text needs.
  static const double denseHeight = 228;
  static const double denseImageHeight = 124;

  static const _placeholders = [
    'assets/brand/splash_1.jpg',
    'assets/brand/splash_2.jpg',
    'assets/brand/splash_3.jpg',
  ];

  Widget _placeholderImage(String asset) {
    return Image.asset(
      asset,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stack) {
        return ColoredBox(
          color: AppColors.surfaceContainerHigh,
          child: Center(
            child: Icon(Icons.cottage_outlined, size: 40, color: AppColors.dhakaRed.withValues(alpha: 0.55)),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currency = ref.watch(currencyProvider);
    final img = Env.imageUrl(listing.coverImage);
    final placeholder = _placeholders[listing.id.abs() % _placeholders.length];
    final imageChild = img.isEmpty
        ? _placeholderImage(placeholder)
        : CachedNetworkImage(
            imageUrl: img,
            fit: BoxFit.cover,
            placeholder: (_, __) => ColoredBox(color: AppColors.surfaceContainerHigh),
            errorWidget: (context, url, error) => _placeholderImage(placeholder),
          );

    final media = Stack(
      fit: StackFit.expand,
      children: [
        imageChild,
        if (listing.badgeKeys.isNotEmpty)
          Positioned(
            top: 8,
            left: 8,
            right: onFavorite != null ? 52 : 8,
            child: ListingBadgeRow(badges: listing.badgeKeys, compact: true),
          ),
        if (onFavorite != null)
          Positioned(
            top: 8,
            right: 8,
            child: IconButton.filledTonal(
              onPressed: onFavorite,
              icon: Icon(
                isFavorite ? Icons.favorite : Icons.favorite_border,
                color: AppColors.dhakaRed,
              ),
            ),
          ),
      ],
    );

    final titleStyle = dense
        ? Theme.of(context).textTheme.titleSmall
        : Theme.of(context).textTheme.titleMedium;
    final locationStyle = (dense
            ? Theme.of(context).textTheme.bodySmall
            : Theme.of(context).textTheme.bodyMedium)
        ?.copyWith(
      color: AppColors.onSurfaceVariant,
      fontStyle: FontStyle.italic,
    );
    final priceStyle = (dense
            ? Theme.of(context).textTheme.titleSmall
            : Theme.of(context).textTheme.titleMedium)
        ?.copyWith(color: AppColors.dhakaRed);

    final textBlock = Padding(
      padding: EdgeInsets.fromLTRB(12, dense ? 6 : 10, 12, dense ? 6 : 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: dense ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: dense ? MainAxisAlignment.center : MainAxisAlignment.start,
        children: [
          Text(
            listing.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: titleStyle,
          ),
          SizedBox(height: dense ? 2 : 2),
          Text(
            listing.location ?? '',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: locationStyle,
          ),
          SizedBox(height: dense ? 4 : 8),
          Row(
            children: [
              Flexible(
                child: Text(
                  currency.format(listing.pricePerNight),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: priceStyle,
                ),
              ),
              Text(
                ' / night',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (!dense && listing.averageRating != null) ...[
                const SizedBox(width: 6),
                const Icon(Icons.star, size: 16, color: AppColors.secondary),
                Text(listing.averageRating!.toStringAsFixed(1)),
              ],
            ],
          ),
        ],
      ),
    );

    final cardBody = dense
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: denseImageHeight, width: double.infinity, child: media),
              Expanded(child: textBlock),
            ],
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              AspectRatio(aspectRatio: 16 / 10, child: media),
              textBlock,
            ],
          );

    final card = Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, child: cardBody),
    );

    if (!dense) return card;
    return SizedBox(height: denseHeight, width: double.infinity, child: card);
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.message, this.icon = Icons.inbox_outlined});
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: AppColors.outline),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class ErrorRetry extends StatelessWidget {
  const ErrorRetry({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.action});
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
          if (action != null) action!,
        ],
      ),
    );
  }
}

void showSnack(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: error ? AppColors.error : AppColors.tertiaryContainer,
    ),
  );
}
