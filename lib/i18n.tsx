/**
 * Simple i18n: en / ne with device locale detection (expo-localization).
 * Use t(key) for translated strings; useLocale() for current locale and setLocale.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const STORAGE_KEY = '@nepali_homestays_locale';

export type Locale = 'en' | 'ne';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Tabs & nav
    nav_home: 'Home',
    nav_search: 'Search',
    nav_dashboard: 'Dashboard',
    nav_messages: 'Messages',
    nav_profile: 'Profile',
    nav_homestay: 'Homestay',
    nav_booking: 'Booking',
    nav_new_booking: 'New booking',
    nav_leave_review: 'Leave review',
    nav_add_listing: 'Add listing',
    nav_edit_listing: 'Edit listing',
    nav_blocked_dates: 'Blocked dates',
    nav_conversation: 'Conversation',
    nav_my_bookings: 'My Bookings',
    nav_host_dashboard: 'Host Dashboard',

    // Home
    home_discover: 'Discover homestays',
    home_featured: 'Featured',
    home_empty_featured: 'No featured homestays right now. Try search.',
    home_search_cta: 'Search homestays',
    home_error_load: 'Could not load. Pull to retry.',
    home_retry: 'Retry',
    home_per_night: '/night',
    no_reviews_yet: 'No reviews yet',
    reviews: 'reviews',
    view_homestay: 'View homestay',
    explore_homestays: 'Explore Homestays',

    // Splash
    splash_discover: 'Discover authentic Nepal',
    splash_book_title: 'Book Your Stay',
    splash_book_subtitle: 'Easy & secure',
    splash_book_desc: 'Search homestays, book with confidence, and pay securely. Your adventure starts here.',
    splash_tagline: 'Stay with local families in the heart of the Himalayas',
    splash_skip: 'Skip',
    splash_next: 'Next',
    splash_get_started: 'Get started',
    splash_experiences: 'Authentic Experiences',
    splash_experiences_desc: 'Experience village life, traditional meals, and warm Nepali hospitality.',
    common_ok: 'OK',
    common_success: 'Success',
    common_sign_up_failed: 'Sign up failed',
    auth_account_created: 'Account created. Please sign in.',
    auth_back_to_login: 'Back to Login',
    auth_verify: 'Verify',
    auth_use_different_email: 'Use a different email',
    auth_email_missing: 'Email missing. Please try logging in again.',
    auth_invalid_code: 'Invalid code',
    auth_verification_failed: 'Verification failed',
    auth_send_reset_code: 'Send reset code',
    auth_continue_to_reset: 'Continue to reset password',
    auth_request_new_code: 'Request new code',
    auth_reset_password_btn: 'Reset password',
    auth_password_reset_success: 'You can now sign in with your new password.',
    auth_reset_failed: 'Reset failed',
    auth_password_reset_title: 'Password reset',

    // Auth
    auth_welcome_back: 'Welcome back',
    auth_sign_in_to: 'Sign in to Nepali Homestays',
    auth_create_account: 'Create account',
    auth_join: 'Join Nepali Homestays',
    auth_email: 'Email',
    auth_password: 'Password',
    auth_name: 'Name',
    auth_phone: 'Phone',
    auth_sign_in: 'Sign in',
    auth_sign_up: 'Sign up',
    auth_forgot_password: 'Forgot password?',
    auth_no_account: "Don't have an account? Sign up",
    auth_have_account: 'Already have an account? Sign in',
    auth_check_email: 'Check your email',
    auth_code_sent_to: 'We sent a 6-digit code to',
    auth_reset_sent_to: 'We sent a password reset code to',
    auth_enter_code_next: 'Enter it on the next screen.',
    auth_forgot_title: 'Forgot password?',
    auth_forgot_subtitle: "Enter your email and we'll send you a reset code.",
    auth_set_new_password: 'Set new password',
    auth_set_new_password_sub: 'Enter the 6-digit code from your email and choose a new password.',
    auth_enter_code: 'Enter code',
    auth_6digit_code: '6-digit code',
    auth_new_password: 'New password',
    auth_invalid_input: 'Invalid input',
    auth_login_failed: 'Login failed',
    auth_required_fields: 'Required fields',
    auth_fill_required: 'Fill in title, location, price per night, and max guests.',
    auth_password_placeholder: 'Password (min 8, upper, lower, number, special)',

    // Listing
    listing_sign_in_to_fav: 'Sign in to save favorites.',
    listing_sign_in_to_book: 'Sign in to book.',
    listing_book_now: 'Book now',
    listing_rs: 'Rs',
    listing_how_to_get_there: 'How to get there',
    listing_amenities: 'Amenities',

    // Search
    search_placeholder: 'City or area',
    search_guests: 'Guests',
    search_guests_placeholder: 'e.g. 2',
    search_min_price: 'Min price',
    search_max_price: 'Max price',
    search_any: 'Any',
    search_button: 'Search',
    search_no_results: 'No results',

    // Dashboard
    dashboard_guest: 'Guest',
    dashboard_host: 'Host',

    // Messages
    messages_empty: 'Sign in to view messages.',
    messages_placeholder: 'Message...',

    // Profile
    profile_current_password: 'Current password',
    profile_new_password: 'New password',
    profile_sign_out: 'Sign out',
    profile_language: 'Language',
    profile_change_password: 'Change password',
    profile_update: 'Update',
    profile_are_you_sure: 'Are you sure?',
    profile_password_updated: 'Password updated.',
    profile_name: 'Name',
    profile_section_account: 'Account',
    profile_section_security: 'Security',
    profile_section_preferences: 'Preferences',
    profile_section_biometric: 'Biometric',
    profile_biometric_use: 'Use biometrics to sign in',
    profile_biometric_desc: 'Use Face ID or fingerprint for faster sign-in',
    profile_biometric_enabled: 'Biometrics enabled',
    profile_biometric_disabled: 'Biometrics disabled',
    profile_section_info: 'About & support',
    profile_about_us: 'About Us',
    profile_contact: 'Contact',
    profile_blogs: 'Blogs & News',
    profile_videos: 'Videos',
    profile_privacy: 'Privacy policy',
    profile_terms: 'Terms of service',
    profile_help: 'Help center',

    // Booking
    booking_check_in: 'Check-in',
    booking_check_out: 'Check-out',
    booking_guests: 'Guests',
    booking_message_to_host: 'Message to host',
    booking_review_placeholder: 'Share your experience...',
    booking_review_title: 'Review title (optional)',
    booking_continue: 'Continue',
    booking_pay: 'Pay',
    booking_submit_review: 'Submit review',

    // Host form
    host_homestay_name: 'Homestay name',
    host_type_placeholder: 'homestay',
    host_location: 'City or area',
    host_price_placeholder: '2000',
    host_max_guests_placeholder: '4',
    host_describe: 'Describe your homestay',
    host_amenities: 'WiFi, Parking, Kitchen',
    host_blocked_date_placeholder: '2026-03-15',
    host_save: 'Save',
    host_add_listing: 'Add listing',
    listing_error_load: 'Could not load listing.',
    listing_not_found: 'Listing not found.',
    common_cancel: 'Cancel',
  },
  ne: {
    nav_home: 'गृह',
    nav_search: 'खोज',
    nav_dashboard: 'ड्यासबोर्ड',
    nav_messages: 'सन्देश',
    nav_profile: 'प्रोफाइल',
    nav_homestay: 'होमस्टे',
    nav_booking: 'बुकिङ',
    nav_new_booking: 'नयाँ बुकिङ',
    nav_leave_review: 'समीक्षा लेख्नुहोस्',
    nav_add_listing: 'सूची थप्नुहोस्',
    nav_edit_listing: 'सूची सम्पादन',
    nav_blocked_dates: 'ब्लक मितिहरू',
    nav_conversation: 'कुराकानी',
    nav_my_bookings: 'मेरो बुकिङहरू',
    nav_host_dashboard: 'होस्ट ड्यासबोर्ड',

    home_discover: 'होमस्टेहरू खोज्नुहोस्',
    home_featured: 'विशेष',
    home_empty_featured: 'अहिले विशेष होमस्टे छैन। खोज्नुहोस्।',
    home_search_cta: 'होमस्टे खोज्नुहोस्',
    home_error_load: 'लोड गर्न सकिएन। पुन: प्रयास गर्न स्वाइप गर्नुहोस्।',
    home_retry: 'पुन: प्रयास',
    home_per_night: '/रात',
    no_reviews_yet: 'अहिलेसम्म कुनै समीक्षा छैन',
    reviews: 'समीक्षाहरू',
    view_homestay: 'होमस्टे हेर्नुहोस्',
    explore_homestays: 'होमस्टेहरू अन्वेषण गर्नुहोस्',

    splash_discover: 'वास्तविक नेपाल अन्वेषण गर्नुहोस्',
    splash_book_title: 'तपाईंको बसाइ बुक गर्नुहोस्',
    splash_book_subtitle: 'सजिलो र सुरक्षित',
    splash_book_desc: 'होमस्टे खोज्नुहोस्, विश्वाससाथ बुक गर्नुहोस् र सुरक्षित भुक्तानी गर्नुहोस्। तपाईंको साहस यहींबाट सुरु हुन्छ।',
    splash_tagline: 'हिमालयको हृदयमा स्थानीय परिवारहरूसँग बस्नुहोस्',
    splash_skip: 'छोड्नुहोस्',
    splash_next: 'अर्को',
    splash_get_started: 'सुरु गर्नुहोस्',
    splash_experiences: 'वास्तविक अनुभवहरू',
    splash_experiences_desc: 'गाउँ जीवन, पारंपरिक खाना र नेपाली आतिथ्य अनुभव गर्नुहोस्।',
    common_ok: 'ठीक छ',
    common_success: 'सफलता',
    common_sign_up_failed: 'साइन अप असफल',
    auth_account_created: 'खाता सिर्जना भयो। कृपया साइन इन गर्नुहोस्।',
    auth_back_to_login: 'लगइनमा फर्कनुहोस्',
    auth_verify: 'पुष्टि गर्नुहोस्',
    auth_use_different_email: 'अर्को इमेल प्रयोग गर्नुहोस्',
    auth_email_missing: 'इमेल छैन। कृपया पुन: लगइन गर्नुहोस्।',
    auth_invalid_code: 'अवैध कोड',
    auth_verification_failed: 'पुष्टि असफल',
    auth_send_reset_code: 'रिसेट कोड पठाउनुहोस्',
    auth_continue_to_reset: 'पासवर्ड रिसेटमा जानुहोस्',
    auth_request_new_code: 'नयाँ कोड अनुरोध गर्नुहोस्',
    auth_reset_password_btn: 'पासवर्ड रिसेट गर्नुहोस्',
    auth_password_reset_success: 'तपाईं अब नयाँ पासवर्डले साइन इन गर्न सक्नुहुन्छ।',
    auth_reset_failed: 'रिसेट असफल',
    auth_password_reset_title: 'पासवर्ड रिसेट',

    auth_welcome_back: 'पुन: स्वागत छ',
    auth_sign_in_to: 'नेपाली होमस्टेमा साइन इन गर्नुहोस्',
    auth_create_account: 'खाता खोल्नुहोस्',
    auth_join: 'नेपाली होमस्टेमा सामेल हुनुहोस्',
    auth_email: 'इमेल',
    auth_password: 'पासवर्ड',
    auth_name: 'नाम',
    auth_phone: 'फोन',
    auth_sign_in: 'साइन इन',
    auth_sign_up: 'साइन अप',
    auth_forgot_password: 'पासवर्ड बिर्सनुभयो?',
    auth_no_account: 'खाता छैन? साइन अप गर्नुहोस्',
    auth_have_account: 'पहिले नै खाता छ? साइन इन गर्नुहोस्',
    auth_check_email: 'इमेल जाँच गर्नुहोस्',
    auth_code_sent_to: 'हामीले ६ अंक कोड पठायौं',
    auth_reset_sent_to: 'हामीले पासवर्ड रिसेट कोड पठायौं',
    auth_enter_code_next: 'अर्को स्क्रिनमा प्रविष्ट गर्नुहोस्।',
    auth_forgot_title: 'पासवर्ड बिर्सनुभयो?',
    auth_forgot_subtitle: 'इमेल प्रविष्ट गर्नुहोस् र हामी रिसेट कोड पठाउँछौं।',
    auth_set_new_password: 'नयाँ पासवर्ड सेट गर्नुहोस्',
    auth_set_new_password_sub: 'इमेलबाट ६ अंक कोड र नयाँ पासवर्ड प्रविष्ट गर्नुहोस्।',
    auth_enter_code: 'कोड प्रविष्ट गर्नुहोस्',
    auth_6digit_code: '६ अंक कोड',
    auth_new_password: 'नयाँ पासवर्ड',
    auth_invalid_input: 'अवैध इनपुट',
    auth_login_failed: 'लगइन असफल',
    auth_required_fields: 'आवश्यक फिल्डहरू',
    auth_fill_required: 'शीर्षक, स्थान, प्रति रात मूल्य र अधिकतम अतिथि भर्नुहोस्।',
    auth_password_placeholder: 'पासवर्ड (कम्ती ८, ठूलो, सानो, अंक, विशेष)',

    listing_sign_in_to_fav: 'मनपर्ने सेभ गर्न साइन इन गर्नुहोस्।',
    listing_sign_in_to_book: 'बुक गर्न साइन इन गर्नुहोस्।',
    listing_book_now: 'अहिले बुक गर्नुहोस्',
    listing_rs: 'रु',
    listing_how_to_get_there: 'कसरी पुग्ने',
    listing_amenities: 'सुविधाहरू',

    search_placeholder: 'शहर वा क्षेत्र',
    search_guests: 'अतिथिहरू',
    search_guests_placeholder: 'जस्तै २',
    search_min_price: 'न्यूनतम मूल्य',
    search_max_price: 'अधिकतम मूल्य',
    search_any: 'कुनै पनि',
    search_button: 'खोज्नुहोस्',
    search_no_results: 'नतिजा छैन',

    dashboard_guest: 'अतिथि',
    dashboard_host: 'होस्ट',

    messages_empty: 'सन्देश हेर्न साइन इन गर्नुहोस्।',
    messages_placeholder: 'सन्देश...',

    profile_current_password: 'हालको पासवर्ड',
    profile_new_password: 'नयाँ पासवर्ड',
    profile_sign_out: 'साइन आउट',
    profile_language: 'भाषा',
    profile_change_password: 'पासवर्ड परिवर्तन गर्नुहोस्',
    profile_update: 'अपडेट गर्नुहोस्',
    profile_are_you_sure: 'तपाईं निश्चित हुनुहुन्छ?',
    profile_password_updated: 'पासवर्ड अपडेट भयो।',
    profile_name: 'नाम',
    profile_section_account: 'खाता',
    profile_section_security: 'सुरक्षा',
    profile_section_preferences: 'प्राथमिकताहरू',
    profile_section_biometric: 'बायोमेट्रिक',
    profile_biometric_use: 'साइन इन गर्न बायोमेट्रिक प्रयोग गर्नुहोस्',
    profile_biometric_desc: 'छिटो साइन इनको लागि Face ID वा फिङ्गरप्रिन्ट प्रयोग गर्नुहोस्',
    profile_biometric_enabled: 'बायोमेट्रिक सक्षम',
    profile_biometric_disabled: 'बायोमेट्रिक अक्षम',
    profile_section_info: 'बारेमा र सहयोग',
    profile_about_us: 'हाम्रो बारेमा',
    profile_contact: 'सम्पर्क',
    profile_blogs: 'ब्लग र समाचार',
    profile_videos: 'भिडियोहरू',
    profile_privacy: 'गोपनीयता नीति',
    profile_terms: 'सेवा सर्तहरू',
    profile_help: 'सहयोग केन्द्र',

    booking_check_in: 'चेक-इन',
    booking_check_out: 'चेक-आउट',
    booking_guests: 'अतिथिहरू',
    booking_message_to_host: 'होस्टलाई सन्देश',
    booking_review_placeholder: 'तपाईंको अनुभव साझा गर्नुहोस्...',
    booking_review_title: 'समीक्षा शीर्षक (वैकल्पिक)',
    booking_continue: 'जारी राख्नुहोस्',
    booking_pay: 'भुक्तानी गर्नुहोस्',
    booking_submit_review: 'समीक्षा पेश गर्नुहोस्',

    host_homestay_name: 'होमस्टेको नाम',
    host_type_placeholder: 'होमस्टे',
    host_location: 'शहर वा क्षेत्र',
    host_price_placeholder: '२०००',
    host_max_guests_placeholder: '४',
    host_describe: 'तपाईंको होमस्टे वर्णन गर्नुहोस्',
    host_amenities: 'वाइफाइ, पार्किङ, किचन',
    host_blocked_date_placeholder: '२०२६-०३-१५',
    host_save: 'सेभ गर्नुहोस्',
    host_add_listing: 'सूची थप्नुहोस्',
    listing_error_load: 'सूची लोड गर्न सकिएन।',
    listing_not_found: 'सूची भेटिएन।',
    common_cancel: 'रद्द गर्नुहोस्',
  },
};

function getDeviceLocale(): Locale {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode ?? 'en';
    return code.startsWith('ne') ? 'ne' : 'en';
  } catch {
    return 'en';
  }
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getDeviceLocale());

  const setLocale = useCallback(async (l: Locale) => {
    setLocaleState(l);
    await AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const map = translations[locale];
      return map[key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'ne') setLocaleState(stored);
    });
  }, []);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale } = useLocale();
  return { t, locale, setLocale };
}
