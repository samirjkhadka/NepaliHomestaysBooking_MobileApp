/// Fallback blog cards when `/news/feed` is empty (mirrors web HOMESTAY_NEWS).
const homeNewsSourceUrl = 'https://homestaykhabar.com/';

const homeNewsFallback = <Map<String, String>>[
  {
    'id': '1',
    'title': 'Unified homestay workshop in Nawalpur: 300 leaders from Nepal to Sikkim',
    'excerpt':
        'National workshop on homestay brings together 300 leaders from Nepal and Sikkim for capacity building and best practices.',
    'category': 'News',
    'date': '2025-01-15',
    'url': homeNewsSourceUrl,
  },
  {
    'id': '2',
    'title': 'Simple homestay in Chitwan Shripur: Rural life and organic farming',
    'excerpt':
        'Experience village life and organic farming at a simple homestay in Shripur, Chitwan.',
    'category': 'Lifestyle',
    'date': '2025-01-10',
    'url': homeNewsSourceUrl,
  },
  {
    'id': '3',
    'title': 'Homestay tourism: Community hospitality across the hills',
    'excerpt':
        'How community-run stays are shaping authentic travel across Nepal’s hills and valleys.',
    'category': 'Travel',
    'date': '2025-01-05',
    'url': homeNewsSourceUrl,
  },
];

/// Illustrative province stay counts (same spirit as web InteractiveProvinceMap).
const provinceHomestayCounts = <String, int>{
  'koshi': 45,
  'madhesh': 32,
  'bagmati': 89,
  'gandaki': 120,
  'lumbini': 56,
  'karnali': 28,
  'sudurpashchim': 35,
};

const provinceSignatures = <String, String>{
  'koshi': 'Everest & Ilam tea',
  'madhesh': 'Janakpur & plains',
  'bagmati': 'Kathmandu Valley',
  'gandaki': 'Annapurna & Pokhara',
  'lumbini': 'Birthplace of Buddha',
  'karnali': 'Rara Lake & Dolpo',
  'sudurpashchim': 'Khaptad National Park',
};
