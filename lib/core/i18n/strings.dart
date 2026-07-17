import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppStrings {
  AppStrings(this.locale);

  final Locale locale;

  static const supported = [Locale('en'), Locale('ne')];

  bool get isNe => locale.languageCode == 'ne';

  String get appName => isNe ? 'नेपाली होमस्टे' : 'Nepali Homestays';
  String get home => isNe ? 'गृह' : 'Home';
  String get search => isNe ? 'खोज' : 'Search';
  String get trips => isNe ? 'यात्रा' : 'Trips';
  String get profile => isNe ? 'प्रोफाइल' : 'Profile';
  String get login => isNe ? 'लगइन' : 'Log in';
  String get signup => isNe ? 'साइन अप' : 'Sign up';
  String get email => isNe ? 'इमेल' : 'Email';
  String get password => isNe ? 'पासवर्ड' : 'Password';
  String get name => isNe ? 'नाम' : 'Name';
  String get phone => isNe ? 'फोन' : 'Phone';
  String get guest => isNe ? 'अतिथि' : 'Guest';
  String get host => isNe ? 'होस्ट' : 'Host';
  String get continueLabel => isNe ? 'जारी राख्नुहोस्' : 'Continue';
  String get logout => isNe ? 'लगआउट' : 'Log out';
  String get bookings => isNe ? 'बुकिङ' : 'Bookings';
  String get wishlist => isNe ? 'इच्छा सूची' : 'Wishlist';
  String get messages => isNe ? 'सन्देश' : 'Messages';
  String get notifications => isNe ? 'सूचना' : 'Notifications';
  String get listings => isNe ? 'लिस्टिङ' : 'Listings';
  String get calendar => isNe ? 'पात्रो' : 'Calendar';
  String get utilities => isNe ? 'उपयोगिता' : 'Utilities';
  String get reviews => isNe ? 'समीक्षा' : 'Reviews';
  String get overview => isNe ? 'अवलोकन' : 'Overview';
  String get bookNow => isNe ? 'अहिले बुक गर्नुहोस्' : 'Book now';
  String get perNight => isNe ? '/रात' : '/night';
  String get help => isNe ? 'मद्दत' : 'Help';
  String get about => isNe ? 'बारेमा' : 'About';
  String get contact => isNe ? 'सम्पर्क' : 'Contact';
  String get becomeHost => isNe ? 'होस्ट बन्नुहोस्' : 'Become a host';
  String get hostDashboard => isNe ? 'होस्ट ड्यासबोर्ड' : 'Host dashboard';
  String get forgotPassword => isNe ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?';
  String get verifyOtp => isNe ? 'OTP प्रमाणित गर्नुहोस्' : 'Verify OTP';
  String get changePassword => isNe ? 'पासवर्ड परिवर्तन' : 'Change password';
  String get pay => isNe ? 'भुक्तानी' : 'Pay';
  String get cancel => isNe ? 'रद्द' : 'Cancel';
  String get save => isNe ? 'बचत' : 'Save';
  String get loading => isNe ? 'लोड हुँदै…' : 'Loading…';
  String get errorGeneric => isNe ? 'केही गलत भयो' : 'Something went wrong';
  String get emptyListings => isNe ? 'कुनै होमस्टे भेटिएन' : 'No homestays found';
  String get featured => isNe ? 'विशेष' : 'Featured';
  String get explore => isNe ? 'अन्वेषण' : 'Explore Nepal';
  String get map => isNe ? 'नक्सा' : 'Map';
  String get filter => isNe ? 'फिल्टर' : 'Filters';
  String get more => isNe ? 'थप' : 'More';
  String get paymentHistory => isNe ? 'भुक्तानी इतिहास' : 'Payment history';
  String get checkIn => isNe ? 'चेक-इन' : 'Check-in';
  String get checkOut => isNe ? 'चेक-आउट' : 'Check-out';
  String get guests => isNe ? 'अतिथिहरू' : 'Guests';
  String get total => isNe ? 'जम्मा' : 'Total';
  String get send => isNe ? 'पठाउनुहोस्' : 'Send';
  String get createListing => isNe ? 'लिस्टिङ थप्नुहोस्' : 'Add listing';
}

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('locale') ?? 'en';
    state = Locale(code);
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('locale', locale.languageCode);
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

final stringsProvider = Provider<AppStrings>((ref) {
  return AppStrings(ref.watch(localeProvider));
});
