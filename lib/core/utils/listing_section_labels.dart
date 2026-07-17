/// Human-readable labels for listing CMS section keys (web parity).
const listingSectionLabels = <String, String>{
  'owners_story': "Homestay owner's story",
  'history': 'History',
  'about_us': 'About Us',
  'their_community': 'Their community',
  'whats_included_in_price': "What's included in the price",
  'place_history': 'Place history',
  'attractions': 'Attractions',
  'homestay_highlights': 'Homestay highlights',
  'things_to_do_nearby': 'Things to do near the homestay',
  'impact_in_community': 'Impact in the community',
  'how_to_get_there': 'How to get there',
  'nearby_homestays': 'Nearby homestays',
  'faqs': 'FAQs',
  'itinerary': 'What to Expect',
  'host_video_intro': 'Host video introduction',
  'local_experiences': 'Local experiences',
  'meet_the_community': 'Meet the community',
  'price_transparency': 'Price transparency',
  'weather_best_time': 'Best time to visit',
  'village_stories': 'Stories from the village',
  'guest_photo_wall': 'Guest photo wall',
  'experience_badges': 'Experience',
};

String listingSectionTitle(String key) {
  final known = listingSectionLabels[key];
  if (known != null) return known;
  return key
      .split('_')
      .where((p) => p.isNotEmpty)
      .map((p) => '${p[0].toUpperCase()}${p.substring(1).toLowerCase()}')
      .join(' ');
}
