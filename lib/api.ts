import { API_BASE_URL, getImageUrl } from '@/constants/config';

export { getImageUrl };

export type User = { id: number; email: string; role: string };

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(typeof (fetchOptions.headers as Record<string, string>) === 'object'
      ? (fetchOptions.headers as Record<string, string>)
      : {}),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(url, { ...fetchOptions, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network request failed';
    throw new Error(`${msg}. URL: ${url}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { message?: string })?.message || res.statusText || 'Request failed') as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

// Auth
export type LoginResponse = {
  requireOtp?: boolean;
  token?: string;
  user?: User;
  message?: string;
  email?: string;
};
export type SignupBody = { email: string; password: string; name: string; phone: string; role?: 'guest' | 'host' };
export type SignupResponse = { message: string; userId?: number };
export type VerifyBody = { email: string; otp: string };
export type VerifyResponse = { token: string; user: User };

// Listings
export type Listing = {
  id: number;
  title: string;
  type?: string;
  location?: string;
  price_per_night: number;
  max_guests?: number;
  description?: string;
  image_urls?: string[];
  province_id?: number;
  district_id?: number;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  owner_id?: number;
  average_rating?: number;
  review_count?: number;
  province_name?: string;
  district_name?: string;
  [key: string]: unknown;
};
export type ListingsResponse = { listings: Listing[]; total?: number };
export type ListingDetailResponse = Listing;
export type ReviewsResponse = { reviews: unknown[]; total?: number };
export type BlockedDatesResponse = string[] | { blocked_dates?: string[] };
export type CreateListingBody = {
  title: string;
  type: string;
  location: string;
  price_per_night: number;
  max_guests: number;
  description?: string;
  way_to_get_there?: string;
  province_id?: number | null;
  district_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  amenities?: string[];
  image_urls?: string[];
  sections?: Record<string, string>;
};

// Bookings
export type Booking = {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_amount?: number;
  message?: string;
  listing?: Listing;
  [key: string]: unknown;
};
export type BookingsResponse = { bookings: Booking[] };

// Favorites
export type FavoritesResponse = { favorites: { listing_id: number; listing?: Listing }[] };

// Profile
export type Profile = { id: number; email: string; name?: string; phone?: string; role?: string; [key: string]: unknown };

// Provinces
export type Province = { id: number; name: string };
export type District = { id: number; name: string; province_id: number };
export type Municipality = { id: number; name: string };
export type MunicipalitiesResponse = { municipalities: Municipality[] };

// Host
export type HostDashboardResponse = {
  listings_count?: number;
  bookings_count?: number;
  earnings?: number;
  listings?: Listing[];
  bookings?: Booking[];
  reviews?: unknown[];
};

// Messages
export type Message = { id: number; booking_id: number; sender_id: number; receiver_id: number; message: string; created_at: string; sender_name?: string; [key: string]: unknown };
export type Conversation = { booking_id: number; listing_title: string; listing_id: number; other_name: string; other_user_id: number; last_message: string | null; last_message_at: string | null; unread_count: number };
export type MessagesListResponse = { conversations: Conversation[] };
export type MessagesThreadResponse = { messages: Message[] };

// Payment
export type InitiatePaymentResponse = { redirect_url?: string; redirect_form?: Record<string, string>; booking?: Booking };

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (body: SignupBody) =>
    apiRequest<SignupResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body: VerifyBody) =>
    apiRequest<VerifyResponse>('/api/auth/verify', { method: 'POST', body: JSON.stringify(body) }),
  resendOtp: (email: string) =>
    apiRequest<{ message: string }>('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('/api/auth/change-password', {
      token,
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Profile
  getProfile: (token: string) => apiRequest<Profile>('/api/profile', { token }),
  updateProfile: (token: string, body: Partial<Profile>) =>
    apiRequest<{ profile: Profile }>('/api/profile', { token, method: 'PATCH', body: JSON.stringify(body) }),

  // Listings
  getHero: () => apiRequest<ListingsResponse>('/api/listings/hero'),
  getFeatured: () => apiRequest<ListingsResponse>('/api/listings/featured'),
  getListings: (params: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    province_id?: number;
    district_id?: number;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
    return apiRequest<ListingsResponse>(`/api/listings?${q.toString()}`);
  },
  getListing: (id: number) => apiRequest<Listing>(`/api/listings/${id}`),
  getBookingPreview: (listingId: number, checkIn: string, checkOut: string) =>
    apiRequest<{ nights: number; price_per_night: number; subtotal: number; fee_label: string | null; fee_amount: number; total: number; currency: string }>(
      `/api/listings/${listingId}/booking-preview?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}`
    ),
  getListingReviews: (id: number, page?: number) =>
    apiRequest<ReviewsResponse>(`/api/listings/${id}/reviews${page != null ? `?page=${page}` : ''}`),
  getBlockedDates: (id: number) => apiRequest<{ blocked_dates?: string[] }>(`/api/listings/${id}/blocked-dates`),
  createListing: (token: string, body: CreateListingBody) =>
    apiRequest<{ message: string; listing: Listing }>('/api/listings', { token, method: 'POST', body: JSON.stringify(body) }),
  updateListing: (token: string, id: number, body: Partial<CreateListingBody>) =>
    apiRequest<{ message: string; listing: Listing }>(`/api/listings/${id}`, { token, method: 'PATCH', body: JSON.stringify(body) }),
  setListingStatus: (token: string, id: number, status: 'approved' | 'disabled') =>
    apiRequest<{ message: string; listing: Listing }>(`/api/listings/${id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) }),
  uploadListingImages: async (token: string, formData: FormData): Promise<{ urls: string[] }> => {
    const url = `${API_BASE_URL.replace(/\/$/, '')}/api/listings/images`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string })?.message || 'Upload failed');
    return data as { urls: string[] };
  },

  // Favorites
  getFavorites: (token: string) => apiRequest<FavoritesResponse>('/api/favorites', { token }),
  addFavorite: (token: string, listingId: number) =>
    apiRequest<{ message: string }>('/api/favorites', { token, method: 'POST', body: JSON.stringify({ listing_id: listingId }) }),
  removeFavorite: (token: string, listingId: number) =>
    apiRequest<{ message: string }>(`/api/favorites/${listingId}`, { token, method: 'DELETE' }),

  // Bookings
  getBookings: (token: string) => apiRequest<BookingsResponse>('/api/bookings', { token }),
  createBooking: (token: string, body: { listing_id: number; check_in: string; check_out: string; guests: number; message?: string }) =>
    apiRequest<{ booking: Booking; message?: string }>('/api/bookings', { token, method: 'POST', body: JSON.stringify(body) }),
  initiatePayment: (token: string, body: { listing_id: number; check_in: string; check_out: string; guests: number; message?: string }) =>
    apiRequest<InitiatePaymentResponse>('/api/bookings/initiate-payment', { token, method: 'POST', body: JSON.stringify(body) }),
  getResumePayment: (token: string, bookingId: number) =>
    apiRequest<InitiatePaymentResponse>(`/api/bookings/${bookingId}/resume-payment`, { token }),
  updateBookingStatus: (token: string, bookingId: number, status: 'approved' | 'declined') =>
    apiRequest<{ booking?: Booking }>(`/api/bookings/${bookingId}`, { token, method: 'PATCH', body: JSON.stringify({ status }) }),

  // Provinces
  getProvinces: () => apiRequest<Province[]>('/api/provinces'),
  getDistricts: (provinceId: number) => apiRequest<District[]>(`/api/provinces/${provinceId}/districts`),
  getMunicipalities: async (districtId: number): Promise<MunicipalitiesResponse> => {
    const res = await apiRequest<Municipality[] | { municipalities?: Municipality[] }>(`/api/provinces/districts/${districtId}/municipalities`);
    const raw = Array.isArray(res) ? res : (res?.municipalities ?? []);
    const municipalities: Municipality[] = raw.map((m, i) =>
      typeof m === 'object' && m !== null && 'name' in m
        ? { id: (m as Municipality).id ?? i, name: (m as Municipality).name }
        : { id: i, name: String(m) }
    );
    return { municipalities };
  },

  // Host
  getHostDashboard: (token: string) => apiRequest<HostDashboardResponse>('/api/host/dashboard', { token }),
  getHostReviews: (token: string) => apiRequest<{ reviews: unknown[] }>('/api/host/reviews', { token }),

  // Reviews
  createReview: (token: string, body: { booking_id: number; rating: number; title?: string; comment?: string }) =>
    apiRequest<{ message: string; review: unknown }>('/api/reviews', { token, method: 'POST', body: JSON.stringify(body) }),

  // Messages
  getMessages: (token: string) => apiRequest<MessagesListResponse>('/api/messages', { token }),
  getMessagesThread: (token: string, bookingId: number, markRead?: boolean) =>
    apiRequest<MessagesThreadResponse>(`/api/messages/${bookingId}${markRead ? '?mark_read=true' : ''}`, { token }),
  sendMessage: (token: string, body: { booking_id: number; receiver_id: number; message: string }) =>
    apiRequest<{ message: string; created: Message }>('/api/messages', { token, method: 'POST', body: JSON.stringify(body) }),

  // Blocked dates (host)
  blockDates: (token: string, listingId: number, dates: string[]) =>
    apiRequest<{ message: string; blocked_dates?: string[] }>('/api/blocked-dates', {
      token,
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId, dates }),
    }),

  // Settings (optional)
  getBookingFee: () => apiRequest<{ booking_fee?: unknown }>('/api/settings/booking-fee'),

  // News / Blogs
  getNewsFeed: () => apiRequest<{ items?: { id: string; title: string; excerpt?: string; url: string; date?: string; category?: string }[] }>('/api/news/feed'),

  // Videos (YouTube)
  getSettingsLanding: () => apiRequest<{ landing_youtube_url?: string | null }>('/api/settings/landing'),
  getSettingsVideos: () => apiRequest<{ videos: { url: string; title?: string }[] }>('/api/settings/videos'),

  // CMS
  getCmsSections: (place: string) => apiRequest<{ sections: { section_key: string; content: string | null; title?: string | null }[] }>(`/api/cms/sections?place=${encodeURIComponent(place)}`),
  getCmsSection: (key: string) => apiRequest<{ title: string | null; content: string | null }>(`/api/cms/sections/${key}`),
};
