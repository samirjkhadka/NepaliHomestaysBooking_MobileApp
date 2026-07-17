class User {
  User({
    required this.id,
    required this.email,
    required this.role,
    this.name,
    this.phone,
    this.mustChangePassword = false,
  });

  final int id;
  final String email;
  final String role;
  final String? name;
  final String? phone;
  final bool mustChangePassword;

  bool get isHost => role == 'host';
  bool get isGuest => role == 'guest';
  bool get isAdmin => role == 'admin';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] as num?)?.toInt() ?? 0,
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'guest',
      name: json['name']?.toString(),
      phone: json['phone']?.toString(),
      mustChangePassword: json['must_change_password'] == true ||
          json['mustChangePassword'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
        'name': name,
        'phone': phone,
        'must_change_password': mustChangePassword,
      };
}

class Listing {
  Listing({
    required this.id,
    required this.title,
    required this.pricePerNight,
    this.type,
    this.category,
    this.location,
    this.maxGuests,
    this.description,
    this.imageUrls = const [],
    this.provinceId,
    this.districtId,
    this.latitude,
    this.longitude,
    this.isActive,
    this.status,
    this.averageRating,
    this.reviewCount,
    this.provinceName,
    this.districtName,
    this.amenities = const [],
    this.wayToGetThere,
    this.sections = const {},
    this.hosts = const [],
    this.badge,
    this.extraServices = const [],
  });

  final int id;
  final String title;
  final double pricePerNight;
  final String? type;
  final String? category;
  final String? location;
  final int? maxGuests;
  final String? description;
  final List<String> imageUrls;
  final int? provinceId;
  final int? districtId;
  final double? latitude;
  final double? longitude;
  final bool? isActive;
  final String? status;
  final double? averageRating;
  final int? reviewCount;
  final String? provinceName;
  final String? districtName;
  final List<String> amenities;
  final String? wayToGetThere;
  final Map<String, String> sections;
  final List<Map<String, dynamic>> hosts;
  /// Comma-separated: recommended,featured,new
  final String? badge;
  final List<ListingExtraService> extraServices;

  String? get coverImage => imageUrls.isNotEmpty ? imageUrls.first : null;

  List<String> get badgeKeys {
    final raw = badge?.trim();
    if (raw == null || raw.isEmpty) return const [];
    return raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  /// Cultural / eco chips from `sections.experience_badges` (web parity).
  /// Defaults to both when the CMS field is empty or not a badge-key list.
  List<String> get experienceBadgeKeys {
    const known = {'cultural-heritage', 'eco-certified'};
    final raw = sections['experience_badges']?.trim();
    if (raw == null || raw.isEmpty) {
      return const ['cultural-heritage', 'eco-certified'];
    }
    final tokens = raw
        .toLowerCase()
        .replaceAll(RegExp(r'<[^>]+>'), ' ')
        .split(RegExp(r'[,;\s]+'))
        .map((e) => e.trim())
        .where((e) => known.contains(e))
        .toList();
    if (tokens.isEmpty) {
      // Placeholder CMS HTML (e.g. "<p>Experience</p>") — use web default.
      return const ['cultural-heritage', 'eco-certified'];
    }
    return tokens;
  }

  factory Listing.fromJson(Map<String, dynamic> json) {
    final images = <String>[];
    final raw = json['image_urls'] ?? json['images'];
    if (raw is List) {
      for (final i in raw) {
        if (i is String) {
          images.add(i);
        } else if (i is Map && i['url'] != null) {
          images.add(i['url'].toString());
        }
      }
    }
    // v1 list/hero/featured rows expose singular `image_url` (see ListingsV1Controller.MapRow)
    final singular = json['image_url']?.toString().trim();
    if (singular != null && singular.isNotEmpty && images.isEmpty) {
      if (singular.contains(',')) {
        images.addAll(
          singular.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty),
        );
      } else {
        images.add(singular);
      }
    }
    final sections = <String, String>{};
    final sec = json['sections'];
    if (sec is Map) {
      sec.forEach((k, v) {
        if (v != null) sections[k.toString()] = v.toString();
      });
    }
    final amenities = <String>[];
    final am = json['amenities'];
    if (am is List) {
      for (final a in am) {
        amenities.add(a.toString());
      }
    }
    final hosts = <Map<String, dynamic>>[];
    final h = json['hosts'];
    if (h is List) {
      for (final item in h) {
        if (item is Map<String, dynamic>) hosts.add(item);
      }
    }
    final extraServices = <ListingExtraService>[];
    final extras = json['extra_services'];
    if (extras is List) {
      for (final item in extras) {
        if (item is Map) {
          extraServices.add(
            ListingExtraService.fromJson(Map<String, dynamic>.from(item)),
          );
        }
      }
    }
    return Listing(
      id: (json['id'] as num?)?.toInt() ?? 0,
      title: json['title']?.toString() ?? '',
      pricePerNight: (json['price_per_night'] as num?)?.toDouble() ?? 0,
      type: json['type']?.toString(),
      category: json['category']?.toString(),
      location: json['location']?.toString(),
      maxGuests: (json['max_guests'] as num?)?.toInt(),
      description: json['description']?.toString(),
      imageUrls: images,
      provinceId: (json['province_id'] as num?)?.toInt(),
      districtId: (json['district_id'] as num?)?.toInt(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      isActive: json['is_active'] as bool?,
      status: json['status']?.toString(),
      averageRating: (json['average_rating'] as num?)?.toDouble(),
      reviewCount: (json['review_count'] as num?)?.toInt(),
      provinceName: json['province_name']?.toString(),
      districtName: json['district_name']?.toString(),
      amenities: amenities,
      wayToGetThere: json['way_to_get_there']?.toString(),
      sections: sections,
      hosts: hosts,
      badge: json['badge']?.toString(),
      extraServices: extraServices,
    );
  }
}

class ListingExtraService {
  const ListingExtraService({
    required this.id,
    required this.name,
    required this.priceNpr,
    required this.unit,
    this.description,
  });

  final int id;
  final String name;
  final double priceNpr;
  final String unit;
  final String? description;

  factory ListingExtraService.fromJson(Map<String, dynamic> json) {
    return ListingExtraService(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '',
      priceNpr: (json['price_npr'] as num?)?.toDouble() ?? 0,
      unit: json['unit']?.toString() ?? 'fixed',
      description: json['description']?.toString(),
    );
  }
}

class Booking {
  Booking({
    required this.id,
    required this.listingId,
    required this.guestId,
    required this.checkIn,
    required this.checkOut,
    required this.guests,
    required this.status,
    this.totalAmount,
    this.message,
    this.listing,
    this.paidAmount,
    this.currency,
  });

  final int id;
  final int listingId;
  final int guestId;
  final String checkIn;
  final String checkOut;
  final int guests;
  final String status;
  final double? totalAmount;
  final String? message;
  final Listing? listing;
  final double? paidAmount;
  final String? currency;

  factory Booking.fromJson(Map<String, dynamic> json) {
    Listing? listing;
    if (json['listing'] is Map<String, dynamic>) {
      listing = Listing.fromJson(json['listing'] as Map<String, dynamic>);
    } else if (json['listing_title'] != null) {
      listing = Listing(
        id: (json['listing_id'] as num?)?.toInt() ?? 0,
        title: json['listing_title']?.toString() ?? '',
        pricePerNight: (json['listing_price'] as num?)?.toDouble() ?? 0,
        location: json['listing_location']?.toString(),
      );
    }
    return Booking(
      id: (json['id'] as num?)?.toInt() ?? 0,
      listingId: (json['listing_id'] as num?)?.toInt() ?? 0,
      guestId: (json['guest_id'] as num?)?.toInt() ?? 0,
      checkIn: json['check_in']?.toString() ?? '',
      checkOut: json['check_out']?.toString() ?? '',
      guests: (json['guests'] as num?)?.toInt() ?? 1,
      status: json['status']?.toString() ?? '',
      totalAmount: (json['total_amount'] as num?)?.toDouble(),
      message: json['message']?.toString(),
      listing: listing,
      paidAmount: (json['paid_amount'] as num?)?.toDouble() ??
          (json['amount_paid'] as num?)?.toDouble(),
      currency: json['currency']?.toString(),
    );
  }
}

class FavoriteRow {
  FavoriteRow({
    required this.id,
    required this.listingId,
    required this.listingTitle,
    required this.listingLocation,
    this.imageUrl,
  });

  final int id;
  final int listingId;
  final String listingTitle;
  final String listingLocation;
  final String? imageUrl;

  factory FavoriteRow.fromJson(Map<String, dynamic> json) {
    return FavoriteRow(
      id: (json['id'] as num?)?.toInt() ?? 0,
      listingId: (json['listing_id'] as num?)?.toInt() ?? 0,
      listingTitle: json['listing_title']?.toString() ?? '',
      listingLocation: json['listing_location']?.toString() ?? '',
      imageUrl: json['image_url']?.toString(),
    );
  }
}

class Conversation {
  Conversation({
    required this.bookingId,
    required this.listingTitle,
    required this.listingId,
    required this.otherName,
    required this.otherUserId,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
  });

  final int bookingId;
  final String listingTitle;
  final int listingId;
  final String otherName;
  final int otherUserId;
  final String? lastMessage;
  final String? lastMessageAt;
  final int unreadCount;

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      bookingId: (json['booking_id'] as num?)?.toInt() ?? 0,
      listingTitle: json['listing_title']?.toString() ?? '',
      listingId: (json['listing_id'] as num?)?.toInt() ?? 0,
      otherName: json['other_name']?.toString() ?? '',
      otherUserId: (json['other_user_id'] as num?)?.toInt() ?? 0,
      lastMessage: json['last_message']?.toString(),
      lastMessageAt: json['last_message_at']?.toString(),
      unreadCount: (json['unread_count'] as num?)?.toInt() ?? 0,
    );
  }
}

class ChatMessage {
  ChatMessage({
    required this.id,
    required this.bookingId,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.createdAt,
    this.senderName,
  });

  final int id;
  final int bookingId;
  final int senderId;
  final int receiverId;
  final String message;
  final String createdAt;
  final String? senderName;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: (json['id'] as num?)?.toInt() ?? 0,
      bookingId: (json['booking_id'] as num?)?.toInt() ?? 0,
      senderId: (json['sender_id'] as num?)?.toInt() ?? 0,
      receiverId: (json['receiver_id'] as num?)?.toInt() ?? 0,
      message: json['message']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      senderName: json['sender_name']?.toString(),
    );
  }
}

class Province {
  Province({required this.id, required this.name, this.slug});
  final int id;
  final String name;
  final String? slug;
  factory Province.fromJson(Map<String, dynamic> json) => Province(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name']?.toString() ?? '',
        slug: json['slug']?.toString(),
      );
}

class District {
  District({required this.id, required this.name, required this.provinceId});
  final int id;
  final String name;
  final int provinceId;
  factory District.fromJson(Map<String, dynamic> json) => District(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name']?.toString() ?? '',
        provinceId: (json['province_id'] as num?)?.toInt() ?? 0,
      );
}

class BookingPreview {
  BookingPreview({
    required this.nights,
    required this.pricePerNight,
    required this.subtotal,
    required this.total,
    required this.currency,
    this.feeLabel,
    this.feeAmount = 0,
    this.guests,
    this.partialPaymentMinPercent,
    this.paymentGatewayEnabled = false,
    this.npxAvailable = false,
    this.himalpayAvailable = false,
    this.extraServiceLines = const [],
    this.extraServicesTotal = 0,
  });

  final int nights;
  final double pricePerNight;
  final double subtotal;
  final double total;
  final String currency;
  final String? feeLabel;
  final double feeAmount;
  final int? guests;
  final double? partialPaymentMinPercent;
  final bool paymentGatewayEnabled;
  final bool npxAvailable;
  final bool himalpayAvailable;
  final List<Map<String, dynamic>> extraServiceLines;
  final double extraServicesTotal;

  bool get showPaymentMethodPicker =>
      paymentGatewayEnabled && (npxAvailable || himalpayAvailable);

  factory BookingPreview.fromJson(Map<String, dynamic> json) {
    var npx = json['payment_npx_enabled'] == true;
    var himalpay = json['payment_himalpay_enabled'] == true;
    final methods = json['payment_methods_available'];
    if (methods is Map) {
      if (methods.containsKey('npx')) npx = methods['npx'] == true;
      if (methods.containsKey('himalpay')) himalpay = methods['himalpay'] == true;
    }
    final gateway = json['payment_gateway_enabled'] == true || npx || himalpay;
    return BookingPreview(
      nights: (json['nights'] as num?)?.toInt() ?? 0,
      pricePerNight: (json['price_per_night'] as num?)?.toDouble() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      currency: json['currency']?.toString() ?? 'NPR',
      feeLabel: json['fee_label']?.toString(),
      feeAmount: (json['fee_amount'] as num?)?.toDouble() ?? 0,
      guests: (json['guests'] as num?)?.toInt(),
      partialPaymentMinPercent: (json['partial_payment_min_percent'] as num?)?.toDouble(),
      paymentGatewayEnabled: gateway,
      npxAvailable: npx,
      himalpayAvailable: himalpay,
      extraServiceLines: (json['extra_services_lines'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
      extraServicesTotal:
          (json['extra_services_total'] as num?)?.toDouble() ?? 0,
    );
  }
}

class Review {
  Review({
    required this.id,
    required this.rating,
    this.title,
    this.comment,
    this.guestName,
    this.createdAt,
  });

  final int id;
  final int rating;
  final String? title;
  final String? comment;
  final String? guestName;
  final String? createdAt;

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: (json['id'] as num?)?.toInt() ?? 0,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      title: json['title']?.toString(),
      comment: json['comment']?.toString(),
      guestName: json['guest_name']?.toString() ?? json['user_name']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}

class AppException implements Exception {
  AppException(this.message, {this.statusCode, this.code});
  final String message;
  final int? statusCode;
  final String? code;
  @override
  String toString() => message;
}
