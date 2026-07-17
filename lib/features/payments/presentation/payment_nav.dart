import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Navigate to payment WebView from initiate/resume payment API payloads (web parity).
void navigateToPayment(
  BuildContext context,
  Map<String, dynamic> res, {
  int? bookingIdFallback,
}) {
  final redirect = res['redirect_url']?.toString();
  final bookingId = (res['booking_id'] as num?)?.toInt() ??
      (res['booking'] is Map ? (res['booking']['id'] as num?)?.toInt() : null) ??
      bookingIdFallback;

  Map<String, dynamic>? form;
  final rawForm = res['redirect_form'];
  if (rawForm is Map) {
    form = Map<String, dynamic>.from(rawForm);
  }

  if (res['reservation_without_payment'] == true) {
    final message = res['confirmation_message']?.toString();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message?.isNotEmpty == true
              ? message!
              : 'Reservation saved. No online payment is required.',
        ),
      ),
    );
    context.go('/booking-confirm?id=${bookingId ?? ''}');
    return;
  }

  if ((redirect != null && redirect.isNotEmpty) || form != null) {
    context.push(
      '/pay?bookingId=${bookingId ?? ''}${redirect != null && redirect.isNotEmpty ? '&url=${Uri.encodeComponent(redirect)}' : ''}',
      extra: {'redirectForm': form, 'url': redirect},
    );
    return;
  }

  context.go('/booking-confirm?id=${bookingId ?? ''}');
}
