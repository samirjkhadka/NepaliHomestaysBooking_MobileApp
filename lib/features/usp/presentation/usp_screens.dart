import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';

class UspHubScreen extends StatelessWidget {
  const UspHubScreen({super.key});

  static const items = <_UspItem>[
    _UspItem(
      'destinations',
      'Destinations',
      'From Himalayan trails to the Terai plains',
      Icons.explore_outlined,
      ['Everest & eastern hills', 'Kathmandu Valley', 'Annapurna & Pokhara', 'Lumbini & the Terai'],
    ),
    _UspItem(
      'experiences',
      'Experiences',
      'Live, cook, celebrate, and learn with local families',
      Icons.local_activity_outlined,
      ['Farm and tea experiences', 'Traditional cooking', 'Craft and heritage walks', 'Festivals and village life'],
    ),
    _UspItem(
      'packages',
      'Packages',
      'Curated stays for meaningful journeys',
      Icons.luggage_outlined,
      ['Weekend village escape', 'Culture and cuisine trail', 'Community trekking circuit'],
    ),
    _UspItem(
      'team',
      'Our team',
      'People connecting travelers and communities',
      Icons.groups_outlined,
      ['Community partnerships', 'Guest support', 'Host success and safety'],
    ),
    _UspItem(
      'careers',
      'Careers',
      'Build better community tourism with us',
      Icons.work_outline,
      ['Technology', 'Community operations', 'Travel and partnerships'],
    ),
    _UspItem(
      'press',
      'Press',
      'News and resources from Nepali Homestays',
      Icons.campaign_outlined,
      ['Company updates', 'Community stories', 'Media inquiries'],
    ),
    _UspItem(
      'himalayan-concierge',
      'Himalayan Concierge',
      'Practical planning, trail support, weather, and safety',
      Icons.hiking,
      ['Build a local itinerary', 'Keep host contacts handy', 'Check weather and transport with your host'],
    ),
    _UspItem(
      'local-impact',
      'Local Impact',
      'See how community tourism supports rural livelihoods',
      Icons.park_outlined,
      ['Income stays with host families', 'Local food and guides benefit', 'Culture and traditions are valued'],
    ),
    _UspItem(
      'immersion-tracker',
      'Immersion Tracker',
      'Collect memories from cultural activities',
      Icons.military_tech_outlined,
      ['Cook a regional dish', 'Learn a local greeting', 'Join a farm or craft activity'],
    ),
    _UspItem(
      'village-marketplace',
      'Village Marketplace',
      'Discover artisan goods, teas, and local produce',
      Icons.storefront_outlined,
      ['Handmade crafts', 'Tea, coffee, and spices', 'Seasonal village products'],
    ),
    _UspItem(
      'flavor-map',
      'Flavor Map',
      'Taste Nepal one region at a time',
      Icons.restaurant_outlined,
      ['Newari feasts in Bagmati', 'Thakali kitchens in Gandaki', 'Tharu flavors in the Terai', 'Tea traditions in Koshi'],
    ),
    _UspItem(
      'community-hearth',
      'Community Hearth',
      'Traveler moments and stories from host families',
      Icons.forum_outlined,
      ['Share meals', 'Listen to village stories', 'Travel with respect and curiosity'],
    ),
    _UspItem(
      'group-hearth',
      'Group Hearth',
      'Coordinate meaningful trips for friends and teams',
      Icons.group_work_outlined,
      ['Choose group-friendly stays', 'Plan shared activities', 'Coordinate dates and transport'],
    ),
    _UspItem(
      'cultural-guide',
      'Cultural Guide',
      'Simple customs and phrases for respectful travel',
      Icons.menu_book_outlined,
      ['Namaste — a respectful greeting', 'Ask before photographing people', 'Dress modestly at sacred places'],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Explore more')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Unique experiences',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 6),
          Text(
            'Discover Nepal through local stays, regional flavors, community stories, and curated journeys.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          ...items.map(
            (item) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: Icon(item.icon, color: AppColors.dhakaRed),
                title: Text(item.title),
                subtitle: Text(item.subtitle),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/usp/${item.slug}'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class UspPlaceholderScreen extends StatelessWidget {
  const UspPlaceholderScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    final item = UspHubScreen.items.firstWhere(
      (e) => e.slug == slug,
      orElse: () => const _UspItem(
        'usp',
        'Explore Nepal',
        'Authentic community travel',
        Icons.auto_awesome,
        ['Browse verified homestays', 'Meet local hosts', 'Plan a meaningful trip'],
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(item.title)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadii.xl),
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.15),
                  AppColors.secondaryContainer.withValues(alpha: 0.5),
                ],
              ),
            ),
            child: Icon(item.icon,
                size: 72,
                color: AppColors.dhakaRed.withValues(alpha: 0.85)),
          ),
          const SizedBox(height: 20),
          Text(item.title, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            item.subtitle,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 20),
          ...item.highlights.map(
            (highlight) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: const Icon(Icons.check_circle_outline,
                    color: AppColors.dhakaRed),
                title: Text(highlight),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (slug == 'careers' || slug == 'press')
            OutlinedButton.icon(
              onPressed: () => context.push('/contact'),
              icon: const Icon(Icons.mail_outline),
              label: Text(slug == 'careers'
                  ? 'Contact us about opportunities'
                  : 'Contact our press team'),
            )
          else
            FilledButton.icon(
              onPressed: () => context.push('/search'),
              icon: const Icon(Icons.search),
              label: const Text('Find a homestay'),
            ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Back to Explore more'),
          ),
        ],
      ),
    );
  }
}

class _UspItem {
  const _UspItem(
    this.slug,
    this.title,
    this.subtitle,
    this.icon,
    this.highlights,
  );
  final String slug;
  final String title;
  final String subtitle;
  final IconData icon;
  final List<String> highlights;
}
