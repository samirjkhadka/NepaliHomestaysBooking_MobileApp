# Nepali Homestays (Flutter)

Guest and host mobile app for Nepali Homestays. Replaces the previous Expo/React Native client.

## Stack

- Flutter 3.x + Dart
- Riverpod, go_router, Dio
- Secure JWT storage (`X-Client: mobile` against the ASP.NET **v1** API)
- UI tokens from `screens/nepal_homestay_booking_screens/himalayan_hearth/DESIGN.md`
- Brand assets from `frontend/assets` (copied under `assets/brand/`)

## Roles

- **Guest** and **Host** only
- **Admin** accounts are rejected at login (use the web admin)

## Setup

1. Run the v1 API locally (default HTTP port **5113**). Ensure it listens on `0.0.0.0` / LAN, not only localhost, when using a physical phone.
2. From this directory:

```bash
flutter pub get
flutter run
```

### API base URL

Defaults:

- **Android emulator:** `http://10.0.2.2:5113`
- **iOS Simulator:** `http://localhost:5113`

**USB debugging (recommended):**

```bash
# API must be running on the Mac at :5113
chmod +x scripts/run_usb_device.sh
./scripts/run_usb_device.sh
```

That runs `adb reverse tcp:5113 tcp:5113` and starts the app with `DEV_HOST=127.0.0.1`.

**LAN IP override:**

```bash
flutter run --dart-define=DEV_HOST=192.168.1.100
# or
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:5113
```

**Android emulator:**

```bash
flutter run --dart-define=DEV_HOST=10.0.2.2
```

All requests use `/api/v1/...`.

### Deep links

Payment return scheme: `nepalhomestays://`

## Features (web guest/host parity)

- Brand splash + 3 onboarding slides, logo on auth screens
- Auth (login, signup with confirm password, OTP, forgot/reset, forced password change)
- Home, search, map, listing detail, favorites on cards
- Booking + payment WebView / browser (full or partial when API allows)
- Guest trips: bookings, wishlist, messages, payment history, reviews, modify unpaid booking, check-in guide, itinerary
- Host: dashboard, multi-step listing create + success, calendar block/unblock, earnings report, booking actions, wallet utilities, reviews, public host profile
- Profile, EN/NE, settings & safety, identity/referral placeholders, help/about/contact

USP design screens under `screens/` (marketplace, flavor map, etc.) are preview-only via **Explore more** in Profile — no live v1 data yet. Apply DB migration `059_sp_unblock_dates.sql` for calendar unblock.

## Push (optional)

```bash
flutter run --dart-define=ENABLE_PUSH=true --dart-define=PUSH_TOKEN=<fcm-or-apns-token>
```

Without these defines, push registration is skipped.

## Design reference

Stitch HTML mocks live in `screens/nepal_homestay_booking_screens/`.
