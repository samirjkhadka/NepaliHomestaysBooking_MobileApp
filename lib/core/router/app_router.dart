import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_screens.dart';
import 'package:nepali_homestays/features/auth/presentation/onboarding_splash.dart';
import 'package:nepali_homestays/features/guest/presentation/booking_extra_screens.dart';
import 'package:nepali_homestays/features/guest/presentation/guest_screens.dart';
import 'package:nepali_homestays/features/home/presentation/home_search_screens.dart';
import 'package:nepali_homestays/features/home/presentation/public_content_screens.dart';
import 'package:nepali_homestays/features/host/presentation/host_extra_screens.dart';
import 'package:nepali_homestays/features/host/presentation/host_screens.dart';
import 'package:nepali_homestays/features/listing/presentation/listing_booking_screens.dart';
import 'package:nepali_homestays/features/payments/presentation/payment_screens.dart';
import 'package:nepali_homestays/features/profile/presentation/extra_profile_screens.dart';
import 'package:nepali_homestays/features/profile/presentation/profile_screens.dart';
import 'package:nepali_homestays/features/usp/presentation/usp_screens.dart';

final _rootKey = GlobalKey<NavigatorState>();

class GuestShell extends ConsumerStatefulWidget {
  const GuestShell({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<GuestShell> createState() => _GuestShellState();
}

class _GuestShellState extends ConsumerState<GuestShell> {
  int _indexFromLocation(String loc) {
    if (loc.startsWith('/search')) return 1;
    if (loc.startsWith('/trips')) return 2;
    if (loc.startsWith('/profile')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final loc = GoRouterState.of(context).uri.toString();
    final index = _indexFromLocation(loc);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/home');
            case 1:
              context.go('/search');
            case 2:
              context.go('/trips');
            case 3:
              context.go('/profile');
          }
        },
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: s.home),
          NavigationDestination(icon: const Icon(Icons.search), label: s.search),
          NavigationDestination(icon: const Icon(Icons.luggage_outlined), selectedIcon: const Icon(Icons.luggage), label: s.trips),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: s.profile),
        ],
      ),
    );
  }
}

class GoRouterRefresh extends ChangeNotifier {
  GoRouterRefresh(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = GoRouterRefresh(ref);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;
      final loggingIn = loc == '/login' ||
          loc == '/signup' ||
          loc == '/verify' ||
          loc == '/forgot-password' ||
          loc == '/reset-password' ||
          loc == '/onboarding' ||
          loc == '/';

      if (auth.status == AuthStatus.unknown) {
        return loc == '/' ? null : '/';
      }
      if (auth.status == AuthStatus.mustChangePassword && loc != '/change-password') {
        return '/change-password';
      }
      if (auth.status == AuthStatus.unauthenticated && !loggingIn && loc != '/change-password') {
        // Allow public discovery? Plan says auth for booking; home can require login for simplicity for protected routes only
        final public = loc.startsWith('/listing') ||
            loc.startsWith('/search') ||
            loc.startsWith('/host-profile') ||
            loc.startsWith('/usp') ||
            loc == '/home' ||
            loc == '/about' ||
            loc == '/help' ||
            loc == '/contact' ||
            loc == '/videos' ||
            loc == '/blogs' ||
            loc == '/festivals' ||
            loc == '/trip-planner' ||
            loc == '/safety' ||
            loc == '/faqs' ||
            loc == '/privacy' ||
            loc == '/terms' ||
            loc == '/cancellation' ||
            loc == '/cookies' ||
            loc == '/destinations' ||
            loc == '/experiences' ||
            loc == '/packages' ||
            loc == '/team' ||
            loc == '/careers' ||
            loc == '/press' ||
            loc == '/usp' ||
            loc.startsWith('/usp/') ||
            loc.startsWith('/cms');
        // Require auth for trips/profile/booking/host
        final needsAuth = loc.startsWith('/trips') ||
            loc.startsWith('/profile') ||
            loc.startsWith('/booking') ||
            loc.startsWith('/check-in') ||
            loc.startsWith('/itinerary') ||
            loc == '/host' ||
            loc.startsWith('/host/') ||
            loc.startsWith('/messages') ||
            loc.startsWith('/pay') ||
            loc.startsWith('/review') ||
            loc.startsWith('/notifications') ||
            loc.startsWith('/settings-safety') ||
            loc.startsWith('/identity') ||
            loc.startsWith('/referral') ||
            loc.startsWith('/change-password');
        if (needsAuth) return '/login';
        if (!public && !loggingIn) return null;
      }
      if (auth.status == AuthStatus.authenticated &&
          (loc == '/login' || loc == '/signup' || loc == '/' || loc == '/onboarding')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingSplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(
        path: '/verify',
        builder: (_, state) => VerifyScreen(email: state.uri.queryParameters['email'] ?? ''),
      ),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordScreen(email: state.uri.queryParameters['email'] ?? ''),
      ),
      GoRoute(path: '/change-password', builder: (_, __) => const ChangePasswordScreen()),
      ShellRoute(
        builder: (context, state, child) => GuestShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(
            path: '/search',
            builder: (context, state) {
              final pid = int.tryParse(state.uri.queryParameters['provinceId'] ?? '');
              return SearchScreen(
                key: ValueKey('search-${pid ?? 'all'}'),
                initialProvinceId: pid,
              );
            },
          ),
          GoRoute(path: '/trips', builder: (_, __) => const TripsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(path: '/search/map', builder: (_, __) => const SearchMapScreen()),
      GoRoute(
        path: '/listing/:id',
        builder: (_, state) => ListingDetailScreen(id: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/booking/:listingId',
        builder: (_, state) => BookingFlowScreen(listingId: int.parse(state.pathParameters['listingId']!)),
      ),
      GoRoute(
        path: '/pay',
        builder: (_, state) {
          final extra = state.extra is Map ? Map<String, dynamic>.from(state.extra as Map) : null;
          final form = extra?['redirectForm'];
          return PaymentWebViewScreen(
            url: state.uri.queryParameters['url'] ?? extra?['url']?.toString(),
            bookingId: state.uri.queryParameters['bookingId'],
            redirectForm: form is Map ? Map<String, dynamic>.from(form) : null,
          );
        },
      ),
      GoRoute(
        path: '/booking-confirm',
        builder: (_, state) => BookingConfirmScreen(bookingId: state.uri.queryParameters['id']),
      ),
      GoRoute(
        path: '/booking-detail/:id',
        builder: (_, state) => BookingDetailScreen(bookingId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/booking-modify/:id',
        builder: (_, state) => ModifyBookingScreen(bookingId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/check-in/:id',
        builder: (_, state) => CheckInInstructionsScreen(bookingId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/itinerary/:id',
        builder: (_, state) => TripItineraryScreen(bookingId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/review/:bookingId',
        builder: (_, state) => ReviewScreen(bookingId: int.parse(state.pathParameters['bookingId']!)),
      ),
      GoRoute(
        path: '/messages/:bookingId',
        builder: (_, state) => MessageThreadScreen(
          bookingId: int.parse(state.pathParameters['bookingId']!),
          receiverId: int.tryParse(state.uri.queryParameters['receiverId'] ?? '') ?? 0,
          name: state.uri.queryParameters['name'] ?? 'Chat',
        ),
      ),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/host', builder: (_, __) => const HostShellScreen()),
      GoRoute(path: '/host/listings/new', builder: (_, __) => const HostListingFormScreen()),
      GoRoute(
        path: '/host/listings/success',
        builder: (_, state) => HostListingSuccessScreen(
          listingId: int.tryParse(state.uri.queryParameters['id'] ?? ''),
          title: state.uri.queryParameters['title'],
        ),
      ),
      GoRoute(
        path: '/host/listings/:id/edit',
        builder: (_, state) => HostListingFormScreen(listingId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/host/calendar/:id',
        builder: (_, state) => HostCalendarScreen(listingId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(path: '/host/utilities', builder: (_, __) => const HostUtilitiesScreen()),
      GoRoute(path: '/host/earnings', builder: (_, __) => const HostEarningsReportScreen()),
      GoRoute(path: '/host/reviews', builder: (_, __) => const HostReviewsScreen()),
      GoRoute(
        path: '/host/messages',
        builder: (_, __) => const HostMessagesScreen(),
      ),
      GoRoute(
        path: '/host-profile/:id',
        builder: (_, state) => HostProfileScreen(
          hostId: int.parse(state.pathParameters['id']!),
          listingId: int.tryParse(state.uri.queryParameters['listingId'] ?? ''),
        ),
      ),
      GoRoute(path: '/settings-safety', builder: (_, __) => const SettingsSafetyScreen()),
      GoRoute(path: '/identity', builder: (_, __) => const IdentityVerificationScreen()),
      GoRoute(path: '/referral', builder: (_, __) => const ReferralProgramScreen()),
      GoRoute(path: '/usp', builder: (_, __) => const UspHubScreen()),
      GoRoute(
        path: '/usp/:slug',
        builder: (_, state) => UspPlaceholderScreen(slug: state.pathParameters['slug'] ?? ''),
      ),
      ...[
        'destinations',
        'experiences',
        'packages',
        'team',
        'careers',
        'press',
      ].map(
        (slug) => GoRoute(
          path: '/$slug',
          builder: (_, __) => UspPlaceholderScreen(slug: slug),
        ),
      ),
      GoRoute(path: '/help', builder: (_, __) => const HelpScreen()),
      GoRoute(path: '/about', builder: (_, __) => const AboutScreen()),
      GoRoute(path: '/contact', builder: (_, __) => const ContactScreen()),
      GoRoute(path: '/videos', builder: (_, __) => const VideosScreen()),
      GoRoute(path: '/blogs', builder: (_, __) => const BlogsScreen()),
      GoRoute(
        path: '/festivals',
        builder: (_, __) => const SettingsContentScreen(
          settingKey: 'festivals',
          title: 'Festivals',
          icon: Icons.celebration_outlined,
        ),
      ),
      GoRoute(
        path: '/trip-planner',
        builder: (_, __) => const SettingsContentScreen(
          settingKey: 'trip-planner',
          title: 'Trip planner',
          icon: Icons.route_outlined,
        ),
      ),
      GoRoute(
        path: '/safety',
        builder: (_, __) => const PublicCmsPageScreen(keyName: 'safety'),
      ),
      GoRoute(
        path: '/faqs',
        builder: (_, __) => const PublicCmsPageScreen(keyName: 'faqs'),
      ),
      GoRoute(
        path: '/privacy',
        builder: (_, __) =>
            const PublicCmsPageScreen(keyName: 'privacy_policy'),
      ),
      GoRoute(
        path: '/terms',
        builder: (_, __) =>
            const PublicCmsPageScreen(keyName: 'terms_of_service'),
      ),
      GoRoute(
        path: '/cancellation',
        builder: (_, __) =>
            const PublicCmsPageScreen(keyName: 'cancellation'),
      ),
      GoRoute(
        path: '/cookies',
        builder: (_, __) => const PublicCmsPageScreen(keyName: 'cookies'),
      ),
      GoRoute(path: '/cms', builder: (_, __) => const CmsPagesScreen()),
      GoRoute(
        path: '/cms/:key',
        builder: (_, state) => CmsSectionScreen(sectionKey: state.pathParameters['key'] ?? ''),
      ),
    ],
  );
});
