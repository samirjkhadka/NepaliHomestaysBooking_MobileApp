import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Opens NPX/HimalPay via GET [url] or auto-submitted POST [redirectForm] (web parity).
class PayWebView extends StatefulWidget {
  const PayWebView({super.key, this.url, this.redirectForm});

  final String? url;
  final Map<String, dynamic>? redirectForm;

  @override
  State<PayWebView> createState() => _PayWebViewState();
}

class _PayWebViewState extends State<PayWebView> {
  late final WebViewController _controller;
  var _loading = true;
  String? _externalUrl;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onNavigationRequest: (req) {
            final uri = Uri.tryParse(req.url);
            if (uri != null && uri.scheme == 'nepalhomestays') {
              final bookingId =
                  uri.queryParameters['bookingId'] ?? uri.queryParameters['id'] ?? '';
              context.go('/booking-confirm?id=$bookingId');
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      );

    final form = widget.redirectForm;
    final url = widget.url?.trim() ?? '';

    if (form != null) {
      final action = form['action']?.toString() ?? '';
      final method = (form['method']?.toString() ?? 'POST').toUpperCase();
      final fieldsRaw = form['fields'];
      final fields = <String, String>{};
      if (fieldsRaw is Map) {
        fieldsRaw.forEach((k, v) {
          if (k != null) fields[k.toString()] = v?.toString() ?? '';
        });
      }
      _externalUrl = action;
      final inputs = fields.entries
          .map(
            (e) =>
                '<input type="hidden" name="${_esc(e.key)}" value="${_esc(e.value)}" />',
          )
          .join();
      final html = '''
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecting to payment…</title></head>
<body style="font-family:sans-serif;padding:24px;background:#fbf9f4;color:#1b1c19;">
<p>Redirecting to payment gateway…</p>
<form id="pay" method="$method" action="${_esc(action)}" enctype="multipart/form-data">$inputs</form>
<script>document.getElementById('pay').submit();</script>
</body></html>''';
      _controller.loadHtmlString(html, baseUrl: action);
    } else if (url.isNotEmpty) {
      _externalUrl = url;
      _controller.loadRequest(Uri.parse(url));
    } else {
      _loading = false;
    }
  }

  static String _esc(String s) => const HtmlEscape(HtmlEscapeMode.attribute).convert(s);

  @override
  Widget build(BuildContext context) {
    if ((widget.url == null || widget.url!.isEmpty) && widget.redirectForm == null) {
      return const Center(child: Text('No payment URL'));
    }
    return Stack(
      children: [
        WebViewWidget(controller: _controller),
        if (_loading) const Center(child: CircularProgressIndicator()),
        if (_externalUrl != null && _externalUrl!.isNotEmpty)
          Positioned(
            bottom: 16,
            right: 16,
            child: FloatingActionButton.extended(
              onPressed: () =>
                  launchUrl(Uri.parse(_externalUrl!), mode: LaunchMode.externalApplication),
              label: const Text('Open in browser'),
              icon: const Icon(Icons.open_in_browser),
            ),
          ),
      ],
    );
  }
}

class BookingConfirmScreen extends StatelessWidget {
  const BookingConfirmScreen({super.key, this.bookingId});
  final String? bookingId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Booking confirmed')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.check_circle, color: AppColors.impactTeal, size: 64),
            const SizedBox(height: 16),
            Text(
              bookingId != null && bookingId!.isNotEmpty
                  ? 'Your booking #$bookingId is recorded.'
                  : 'Your booking request was submitted.',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            const Text('You can track it under Trips.'),
            const Spacer(),
            ElevatedButton(
              onPressed: () => context.go('/trips'),
              child: const Text('VIEW TRIPS'),
            ),
            TextButton(onPressed: () => context.go('/home'), child: const Text('Home')),
          ],
        ),
      ),
    );
  }
}
