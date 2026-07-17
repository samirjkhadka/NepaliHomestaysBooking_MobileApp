import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsSafetyScreen extends ConsumerStatefulWidget {
  const SettingsSafetyScreen({super.key});

  @override
  ConsumerState<SettingsSafetyScreen> createState() => _SettingsSafetyScreenState();
}

class _SettingsSafetyScreenState extends ConsumerState<SettingsSafetyScreen> {
  bool _shareTrip = true;
  bool _marketing = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _shareTrip = prefs.getBool('safety_share_trip') ?? true;
      _marketing = prefs.getBool('safety_marketing') ?? false;
      _loading = false;
    });
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('safety_share_trip', _shareTrip);
    await prefs.setBool('safety_marketing', _marketing);
  }

  Future<void> _dialEmergency() async {
    final uri = Uri.parse('tel:112');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      showSnack(context, 'Unable to open phone dialer', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings & safety')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Privacy', style: Theme.of(context).textTheme.titleMedium),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Share trip status with host'),
                  subtitle: const Text('Helps hosts prepare arrival logistics'),
                  value: _shareTrip,
                  onChanged: (v) {
                    setState(() => _shareTrip = v);
                    _persist();
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Travel tips & offers'),
                  subtitle: const Text('Occasional emails about stays and culture'),
                  value: _marketing,
                  onChanged: (v) {
                    setState(() => _marketing = v);
                    _persist();
                  },
                ),
                const SizedBox(height: 16),
                Text('Mountain safety', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.sos, color: AppColors.dhakaRed),
                    title: const Text('Emergency dial'),
                    subtitle: const Text('Call local emergency services (112)'),
                    onTap: _dialEmergency,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'For trail SOS and altitude support, Himalayan Concierge will connect here when that API ships.',
                  style: TextStyle(color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
    );
  }
}

class IdentityVerificationScreen extends StatelessWidget {
  const IdentityVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Identity verification')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Icon(Icons.verified_user_outlined, size: 56, color: AppColors.dhakaRed.withValues(alpha: 0.85)),
          const SizedBox(height: 16),
          Text('Verify your identity', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          const Text(
            'KYC for guests and hosts is not available on the mobile API yet. '
            'When enabled, you will upload a government ID and selfie here for review.',
          ),
          const SizedBox(height: 24),
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.badge_outlined),
            title: Text('Government ID'),
            subtitle: Text('Coming soon'),
          ),
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.face_retouching_natural),
            title: Text('Selfie match'),
            subtitle: Text('Coming soon'),
          ),
          const SizedBox(height: 24),
          NhPrimaryButton(label: 'Notify me when ready', onPressed: () {
            showSnack(context, 'We will announce KYC in a future update');
          }),
        ],
      ),
    );
  }
}

class ReferralProgramScreen extends StatelessWidget {
  const ReferralProgramScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Referral program')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('Invite friends to the hearth', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          const Text(
            'Referral codes and rewards are not wired to v1 APIs yet. '
            'This screen will show your personal code and progress once the backend lands.',
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Your code', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Text(
                    'HEARTH—SOON',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: AppColors.dhakaRed,
                          letterSpacing: 1.2,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
