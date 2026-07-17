import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Three intro / splash slides using frontend hero assets.
class OnboardingSplashScreen extends StatefulWidget {
  const OnboardingSplashScreen({super.key});

  @override
  State<OnboardingSplashScreen> createState() => _OnboardingSplashScreenState();
}

class _OnboardingSplashScreenState extends State<OnboardingSplashScreen> {
  final _page = PageController();
  int _index = 0;

  static const _slides = [
    (
      image: 'assets/brand/splash_1.jpg',
      title: 'Stay with local families',
      body: 'Discover authentic Nepali homestays from the mountains to the Terai.',
    ),
    (
      image: 'assets/brand/splash_2.jpg',
      title: 'Book with confidence',
      body: 'Secure bookings, clear pricing, and hosts who welcome you home.',
    ),
    (
      image: 'assets/brand/splash_3.jpg',
      title: 'Host your hearth',
      body: 'Share your home, manage guests, and grow with Nepali Homestays.',
    ),
  ];

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_done', true);
    if (!mounted) return;
    context.go('/login');
  }

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: _page,
            itemCount: _slides.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) {
              final slide = _slides[i];
              return Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(slide.image, fit: BoxFit.cover),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.15),
                          Colors.black.withValues(alpha: 0.72),
                        ],
                      ),
                    ),
                  ),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(28, 24, 28, 120),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Image.asset('assets/brand/logo.png', height: 56),
                          const Spacer(),
                          Text(
                            slide.title,
                            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                                  color: Colors.white,
                                ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            slide.body,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.92),
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 36,
            child: SafeArea(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _slides.length,
                      (i) => Container(
                        width: _index == i ? 22 : 8,
                        height: 8,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: _index == i ? AppColors.secondaryContainer : Colors.white54,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      TextButton(
                        onPressed: _finish,
                        child: const Text('Skip', style: TextStyle(color: Colors.white)),
                      ),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: () {
                          if (_index >= _slides.length - 1) {
                            _finish();
                          } else {
                            _page.nextPage(
                              duration: const Duration(milliseconds: 320),
                              curve: Curves.easeOut,
                            );
                          }
                        },
                        child: Text(_index >= _slides.length - 1 ? 'GET STARTED' : 'NEXT'),
                      ),
                    ],
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
