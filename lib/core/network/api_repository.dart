import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/core/config/env.dart';
import 'package:nepali_homestays/core/debug/agent_debug_log.dart';
import 'package:nepali_homestays/core/storage/token_store.dart';
import 'package:nepali_homestays/shared/models/models.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final dioProvider = Provider<Dio>((ref) {
  final tokenStore = ref.watch(tokenStoreProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: '${Env.apiBaseUrl}/api/v1',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client': 'mobile',
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await tokenStore.getAccessToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (options.path.contains('/auth/login')) {
          // #region agent log
          await agentDebugLog(
            hypothesisId: 'P1-P3',
            location: 'api_repository.dart:physical-login-request',
            message: 'Physical device login request prepared',
            data: {
              'uri': options.uri.toString(),
              'method': options.method,
              'contentType': options.contentType,
              'connectTimeoutMs':
                  options.connectTimeout?.inMilliseconds,
              'receiveTimeoutMs':
                  options.receiveTimeout?.inMilliseconds,
            },
          );
          // #endregion
        }
        handler.next(options);
      },
      onResponse: (response, handler) async {
        if (response.requestOptions.path.contains('/auth/login')) {
          final body = response.data;
          // #region agent log
          await agentDebugLog(
            hypothesisId: 'P4',
            location: 'api_repository.dart:physical-login-response',
            message: 'Physical device login received HTTP success',
            data: {
              'uri': response.requestOptions.uri.toString(),
              'statusCode': response.statusCode,
              'responseType': body.runtimeType.toString(),
              'responseKeys': body is Map
                  ? body.keys.map((key) => '$key').toList()
                  : <String>[],
            },
          );
          // #endregion
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        if (error.requestOptions.path.contains('/auth/login')) {
          final body = error.response?.data;
          // #region agent log
          await agentDebugLog(
            hypothesisId: 'P1-P4',
            location: 'api_repository.dart:physical-login-error',
            message: 'Physical device login transport failed',
            data: {
              'uri': error.requestOptions.uri.toString(),
              'statusCode': error.response?.statusCode,
              'dioType': error.type.name,
              'dioMessage': error.message,
              'underlyingErrorType': error.error.runtimeType.toString(),
              'underlyingError': error.error?.toString(),
              'responseType': body.runtimeType.toString(),
              'serverCode': body is Map ? body['code']?.toString() : null,
              'serverMessage':
                  body is Map ? body['message']?.toString() : null,
            },
          );
          // #endregion
        }
        if (error.response?.statusCode == 401 &&
            !(error.requestOptions.extra['retried'] == true) &&
            !error.requestOptions.path.contains('/auth/refresh') &&
            !error.requestOptions.path.contains('/auth/login')) {
          try {
            final refresh = await tokenStore.getRefreshToken();
            if (refresh == null || refresh.isEmpty) {
              return handler.next(error);
            }
            final refreshDio = Dio(
              BaseOptions(
                baseUrl: '${Env.apiBaseUrl}/api/v1',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Client': 'mobile',
                  'Authorization': 'Bearer $refresh',
                },
              ),
            );
            // Mobile refresh may send refresh token in body or cookie; try body-friendly path
            final res = await refreshDio.post(
              '/auth/refresh',
              data: {'refreshToken': refresh},
              options: Options(headers: {'Authorization': 'Bearer $refresh'}),
            );
            final data = res.data as Map<String, dynamic>?;
            final access = data?['token']?.toString();
            final newRefresh = data?['refreshToken']?.toString();
            if (access == null || access.isEmpty) {
              await tokenStore.clear();
              return handler.next(error);
            }
            await tokenStore.saveTokens(access: access, refresh: newRefresh ?? refresh);
            final req = error.requestOptions;
            req.headers['Authorization'] = 'Bearer $access';
            req.extra['retried'] = true;
            final clone = await dio.fetch(req);
            return handler.resolve(clone);
          } catch (_) {
            await tokenStore.clear();
            return handler.next(error);
          }
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

final apiRepositoryProvider = Provider<ApiRepository>((ref) {
  return ApiRepository(ref.watch(dioProvider), ref.watch(tokenStoreProvider));
});

class ApiRepository {
  ApiRepository(this._dio, this._tokens);

  final Dio _dio;
  final TokenStore _tokens;

  Never _throwDio(DioException e) {
    final data = e.response?.data;
    String message = e.message ?? 'Request failed';
    String? code;
    if (data is Map) {
      message = data['message']?.toString() ?? data['error']?.toString() ?? message;
      code = data['code']?.toString();
    }
    throw AppException(message, statusCode: e.response?.statusCode, code: code);
  }

  Future<T> _get<T>(String path, T Function(dynamic) parse, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      return parse(res.data);
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  Future<T> _post<T>(String path, T Function(dynamic) parse, {Object? data}) async {
    try {
      final res = await _dio.post(path, data: data);
      return parse(res.data);
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  Future<T> _patch<T>(String path, T Function(dynamic) parse, {Object? data}) async {
    try {
      final res = await _dio.patch(path, data: data);
      return parse(res.data);
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  Future<void> _voidPost(String path, {Object? data}) async {
    try {
      await _dio.post(path, data: data);
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  Future<void> _voidPatch(String path, {Object? data}) async {
    try {
      await _dio.patch(path, data: data);
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  Future<void> _voidDelete(String path, {Object? data}) async {
    try {
      await _dio.delete(path, data: data);
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  // --- Auth ---
  Future<Map<String, dynamic>> login(String email, String password) =>
      _post('/auth/login', (d) => Map<String, dynamic>.from(d as Map), data: {
        'email': email,
        'password': password,
      });

  Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String name,
    required String phone,
    String role = 'guest',
  }) =>
      _post('/auth/signup', (d) => Map<String, dynamic>.from(d as Map), data: {
        'email': email,
        'password': password,
        'name': name,
        'phone': phone,
        'role': role,
      });

  Future<Map<String, dynamic>> verify({required String email, required String otp}) =>
      _post('/auth/verify', (d) => Map<String, dynamic>.from(d as Map), data: {
        'email': email,
        'otp': otp,
      });

  Future<void> resendOtp(String email) => _voidPost('/auth/resend-otp', data: {'email': email});

  Future<void> forgotPassword(String email) =>
      _voidPost('/auth/forgot-password', data: {'email': email});

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) =>
      _voidPost('/auth/reset-password', data: {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      });

  Future<void> changePassword({String? currentPassword, required String newPassword}) =>
      _voidPost('/auth/change-password', data: {
        if (currentPassword != null) 'currentPassword': currentPassword,
        'newPassword': newPassword,
      });

  Future<User> me() => _get('/auth/me', (d) {
        final map = d as Map<String, dynamic>;
        final user = map['user'] as Map<String, dynamic>? ?? map;
        return User.fromJson(user);
      });

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {}
    await _tokens.clear();
  }

  // --- Profile ---
  Future<Map<String, dynamic>> getProfile() =>
      _get('/profile', (d) => Map<String, dynamic>.from(d as Map));

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> body) =>
      _patch('/profile', (d) => Map<String, dynamic>.from(d as Map), data: body);

  Future<void> becomeHost() => _voidPost('/profile/become-host', data: {});

  // --- Listings ---
  Future<List<Listing>> getHero() => _get('/listings/hero', _parseListings);
  Future<List<Listing>> getFeatured() => _get('/listings/featured', _parseListings);

  Future<List<Listing>> getListings({
    String? location,
    String? title,
    String? category,
    String? type,
    num? minPrice,
    num? maxPrice,
    int? guests,
    int? provinceId,
    int? districtId,
    int page = 1,
    int limit = 20,
  }) {
    final q = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (location != null && location.isNotEmpty) 'location': location,
      if (title != null && title.isNotEmpty) 'title': title,
      if (category != null) 'category': category,
      if (type != null) 'type': type,
      if (minPrice != null) 'minPrice': minPrice,
      if (maxPrice != null) 'maxPrice': maxPrice,
      if (guests != null) 'guests': guests,
      if (provinceId != null) 'province_id': provinceId,
      if (districtId != null) 'district_id': districtId,
    };
    return _get('/listings', _parseListings, query: q);
  }

  Future<({List<Listing> listings, int total})> getListingsPage({
    String? location,
    String? title,
    String? category,
    String? type,
    String? sort,
    num? minPrice,
    num? maxPrice,
    int? guests,
    int? provinceId,
    int? districtId,
    int page = 1,
    int limit = 20,
  }) {
    final q = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (location != null && location.isNotEmpty) 'location': location,
      if (title != null && title.isNotEmpty) 'title': title,
      if (category != null && category.isNotEmpty) 'category': category,
      if (type != null && type.isNotEmpty) 'type': type,
      if (sort != null && sort != 'default') 'sort': sort,
      if (minPrice != null) 'minPrice': minPrice,
      if (maxPrice != null) 'maxPrice': maxPrice,
      if (guests != null) 'guests': guests,
      if (provinceId != null) 'province_id': provinceId,
      if (districtId != null) 'district_id': districtId,
    };
    return _get('/listings', (d) {
      final map = d as Map<String, dynamic>;
      final listings = (map['listings'] as List? ?? [])
          .map((e) => Listing.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return (listings: listings, total: (map['total'] as num?)?.toInt() ?? listings.length);
    }, query: q);
  }

  Future<Listing> getListing(int id) =>
      _get('/listings/$id', (d) => Listing.fromJson(Map<String, dynamic>.from(d as Map)));

  Future<BookingPreview> getBookingPreview({
    required int listingId,
    required String checkIn,
    required String checkOut,
    int? guests,
    List<Map<String, dynamic>> extraServices = const [],
  }) {
    return _get(
      '/listings/$listingId/booking-preview',
      (d) => BookingPreview.fromJson(Map<String, dynamic>.from(d as Map)),
      query: {
        'check_in': checkIn,
        'check_out': checkOut,
        if (guests != null) 'guests': guests,
        if (extraServices.isNotEmpty) 'extra_services': jsonEncode(extraServices),
      },
    );
  }

  Future<List<Review>> getListingReviews(int id, {int page = 1}) => _get(
        '/listings/$id/reviews',
        (d) {
          final map = d as Map<String, dynamic>;
          final list = map['reviews'] as List? ?? [];
          return list
              .map((e) => Review.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        },
        query: {'page': page},
      );

  Future<List<String>> getBlockedDates(int listingId) => _get(
        '/listings/$listingId/blocked-dates',
        (d) {
          if (d is List) return d.map((e) => e.toString()).toList();
          final map = d as Map<String, dynamic>;
          final list = map['blocked_dates'] as List? ?? [];
          return list.map((e) => e.toString()).toList();
        },
      );

  Future<Listing> createListing(Map<String, dynamic> body) => _post(
        '/listings',
        (d) {
          final map = d as Map<String, dynamic>;
          return Listing.fromJson(Map<String, dynamic>.from(map['listing'] as Map? ?? map));
        },
        data: body,
      );

  Future<void> updateListing(int id, Map<String, dynamic> body) =>
      _voidPatch('/listings/$id', data: body);

  Future<void> setListingStatus(int id, String status) =>
      _voidPatch('/listings/$id/status', data: {'status': status});

  Future<List<String>> uploadListingImages(List<MultipartFile> files) async {
    try {
      final form = FormData.fromMap({'images': files});
      final res = await _dio.post(
        '/listings/images',
        data: form,
        options: Options(contentType: 'multipart/form-data'),
      );
      final data = res.data as Map<String, dynamic>;
      final urls = data['urls'] as List? ?? [];
      return urls.map((e) => e.toString()).toList();
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  // --- Favorites ---
  Future<List<FavoriteRow>> getFavorites() => _get('/favorites', (d) {
        final map = d as Map<String, dynamic>;
        final list = map['favorites'] as List? ?? [];
        return list
            .map((e) => FavoriteRow.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });

  Future<void> addFavorite(int listingId) =>
      _voidPost('/favorites', data: {'listing_id': listingId});

  Future<void> removeFavorite(int listingId) => _voidDelete('/favorites/$listingId');

  // --- Bookings ---
  Future<List<Booking>> getBookings() => _get('/bookings', (d) {
        final map = d as Map<String, dynamic>;
        final list = map['bookings'] as List? ?? [];
        return list
            .map((e) => Booking.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });

  Future<Map<String, dynamic>> initiatePayment(Map<String, dynamic> body) =>
      _post('/bookings/initiate-payment', (d) => Map<String, dynamic>.from(d as Map), data: body);

  Future<Map<String, dynamic>> resumePayment(int bookingId) =>
      _get('/bookings/$bookingId/resume-payment', (d) => Map<String, dynamic>.from(d as Map));

  Future<Map<String, dynamic>> createStripePayment(int bookingId) =>
      _post(
        '/payments',
        (d) => Map<String, dynamic>.from(d as Map),
        data: {'booking_id': bookingId},
      );

  Future<void> cancelBooking(int bookingId) => _voidPost('/bookings/$bookingId/cancel');

  Future<void> updateBookingStatus(int bookingId, String status) =>
      _voidPatch('/bookings/$bookingId', data: {'status': status});

  // --- Messages ---
  Future<List<Conversation>> getConversations() => _get('/messages', (d) {
        final map = d as Map<String, dynamic>;
        final list = map['conversations'] as List? ?? [];
        return list
            .map((e) => Conversation.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });

  Future<List<ChatMessage>> getThread(int bookingId, {bool markRead = true}) => _get(
        '/messages/$bookingId',
        (d) {
          final map = d as Map<String, dynamic>;
          final list = map['messages'] as List? ?? [];
          return list
              .map((e) => ChatMessage.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        },
        query: {if (markRead) 'mark_read': 'true'},
      );

  Future<void> sendMessage({
    required int bookingId,
    required int receiverId,
    required String message,
  }) =>
      _voidPost('/messages', data: {
        'booking_id': bookingId,
        'receiver_id': receiverId,
        'message': message,
      });

  // --- Reviews ---
  Future<void> createReview({
    required int bookingId,
    required int rating,
    String? title,
    String? comment,
  }) =>
      _voidPost('/reviews', data: {
        'booking_id': bookingId,
        'rating': rating,
        if (title != null) 'title': title,
        if (comment != null) 'comment': comment,
      });

  // --- Provinces ---
  Future<List<Province>> getProvinces() => _get('/provinces', (d) {
        final list = d is List ? d : (d as Map)['provinces'] as List? ?? [];
        return list
            .map((e) => Province.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });

  Future<List<District>> getDistricts(int provinceId) => _get(
        '/provinces/$provinceId/districts',
        (d) {
          final list = d is List ? d : (d as Map)['districts'] as List? ?? [];
          return list
              .map((e) => District.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        },
      );

  // --- Host ---
  Future<Map<String, dynamic>> getHostDashboard() =>
      _get('/host/dashboard', (d) => Map<String, dynamic>.from(d as Map));

  Future<List<Review>> getHostReviews({int page = 1, int limit = 50}) => _get(
        '/host/reviews',
        (d) {
          final map = d as Map<String, dynamic>;
          final list = map['reviews'] as List? ?? [];
          return list
              .map((e) => Review.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        },
        query: {'page': page, 'limit': limit},
      );

  Future<void> addCoHost(int listingId, Map<String, dynamic> body) =>
      _voidPost('/host/listings/$listingId/hosts', data: body);

  Future<void> removeCoHost(int listingId, int userId) =>
      _voidDelete('/host/listings/$listingId/hosts/$userId');

  Future<Map<String, dynamic>> getWalletCatalog() =>
      _get('/host/wallet-services/catalog', (d) => Map<String, dynamic>.from(d as Map));

  Future<Map<String, dynamic>> getNeaCounters() =>
      _get('/host/wallet-services/nea/counters', (d) => Map<String, dynamic>.from(d as Map));

  Future<Map<String, dynamic>> getNeaBills(Map<String, dynamic> body) =>
      _post('/host/wallet-services/nea/bills', (d) => Map<String, dynamic>.from(d as Map),
          data: body);

  Future<Map<String, dynamic>> previewWalletService(Map<String, dynamic> body) =>
      _post('/host/wallet-services/preview', (d) => Map<String, dynamic>.from(d as Map),
          data: body);

  Future<Map<String, dynamic>> checkoutWalletService(Map<String, dynamic> body) =>
      _post('/host/wallet-services/checkout', (d) => Map<String, dynamic>.from(d as Map),
          data: body);

  Future<List<Map<String, dynamic>>> getWalletTransactions({int page = 1, int limit = 20}) =>
      _get(
        '/host/wallet-services/transactions',
        (d) {
          final map = d as Map<String, dynamic>;
          final list = map['transactions'] as List? ?? [];
          return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        },
        query: {'page': page, 'limit': limit},
      );

  Future<void> blockDates(int listingId, List<String> dates) =>
      _voidPost('/blocked-dates', data: {
        'listing_id': listingId,
        'dates': dates,
      });

  Future<void> unblockDates(int listingId, List<String> dates) =>
      _voidDelete('/blocked-dates', data: {
        'listing_id': listingId,
        'dates': dates,
      });

  // --- Notifications / CMS / News ---
  Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      return await _get('/notifications', (d) {
        if (d is List) {
          return d.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        }
        final map = d as Map<String, dynamic>;
        final list = map['notifications'] as List? ?? map['items'] as List? ?? [];
        return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {
      return [];
    }
  }

  Future<void> registerPushToken(String token, String platform) =>
      _voidPost('/notifications/register', data: {
        'token': token,
        'platform': platform,
      });

  Future<Map<String, dynamic>?> getCmsSection(String key) async {
    try {
      return await _get(
        '/cms/sections/$key',
        (d) => Map<String, dynamic>.from(d as Map),
      );
    } catch (_) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getCmsSections({String? place}) async {
    try {
      return await _get('/cms/sections', (d) {
        if (d is List) {
          return d.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        }
        final map = d as Map<String, dynamic>;
        final list = map['sections'] as List? ?? [];
        return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }, query: {
        if (place != null && place.isNotEmpty) 'place': place,
      });
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getCurrencyRates() => _get(
        '/settings/currency',
        (d) => Map<String, dynamic>.from(d as Map? ?? {}),
      );

  Future<Map<String, dynamic>> getLandingSettings() async {
    try {
      return await _get(
        '/settings/landing',
        (d) => Map<String, dynamic>.from(d as Map? ?? {}),
      );
    } catch (_) {
      return {};
    }
  }

  Future<List<Map<String, dynamic>>> getVideos() async {
    try {
      return await _get('/settings/videos', (d) {
        final map = d as Map<String, dynamic>;
        final list = map['videos'] as List? ?? [];
        return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getPublicSetting(String key) async {
    try {
      return await _get(
        '/settings/$key',
        (d) => Map<String, dynamic>.from(d as Map? ?? {}),
      );
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, dynamic>> getHomeContent() => getPublicSetting('home-content');

  Future<Map<String, dynamic>> getImpactStats() async {
    try {
      return await _get(
        '/stats/impact',
        (d) => Map<String, dynamic>.from(d as Map? ?? {}),
      );
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, dynamic>> getMarketingPage(String page) =>
      getPublicSetting(page);

  Future<List<Map<String, dynamic>>> getNewsFeed() async {
    try {
      return await _get('/news/feed', (d) {
        final map = d as Map<String, dynamic>;
        final list = map['items'] as List? ?? [];
        return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {
      return [];
    }
  }

  Future<void> contact({
    required String name,
    required String email,
    required String message,
    String? subject,
    MultipartFile? image,
  }) async {
    try {
      final form = FormData.fromMap({
        'name': name,
        'email': email,
        'subject': (subject == null || subject.trim().isEmpty) ? 'Mobile app inquiry' : subject.trim(),
        'message': message,
        if (image != null) 'image': image,
      });
      await _dio.post(
        '/contact',
        data: form,
        options: Options(contentType: 'multipart/form-data'),
      );
    } on DioException catch (e) {
      _throwDio(e);
    }
  }

  List<Listing> _parseListings(dynamic d) {
    if (d is List) {
      return d.map((e) => Listing.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
    final map = d as Map<String, dynamic>;
    final list = map['listings'] as List? ?? [];
    return list.map((e) => Listing.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }
}
