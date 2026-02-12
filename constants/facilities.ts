/**
 * Amenities (free inclusions) and extra service options for add/edit listing.
 */
export type FacilityOption = { id: string; label: string };
export type FacilityGroup = {
  id: string;
  label: string;
  type: 'single' | 'multi';
  options: FacilityOption[];
  hasCapacity?: boolean;
  hasPriceType?: boolean;
};

/** Predefined free amenities – multi-select, stored as listing_amenities. */
export const AMENITIES_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'breakfast', label: 'Breakfast', icon: 'cafe' },
  { id: 'veg_meals', label: 'Veg Meals', icon: 'leaf' },
  { id: 'non_veg_meals', label: 'Non-Veg Meals', icon: 'restaurant' },
  { id: 'parking', label: 'Parking', icon: 'car' },
  { id: 'hot_water', label: 'Hot Water', icon: 'water' },
  { id: 'garden', label: 'Garden', icon: 'flower' },
  { id: 'terrace', label: 'Terrace', icon: 'home' },
  { id: 'mountain_view', label: 'Mountain View', icon: 'trending-up' },
  { id: 'ac', label: 'AC', icon: 'snow' },
  { id: 'heater', label: 'Heater', icon: 'flame' },
  { id: 'washing_machine', label: 'Washing Machine', icon: 'shirt' },
];

/** Extra service unit for paid add-ons */
export const EXTRA_SERVICE_UNITS: { id: string; label: string }[] = [
  { id: 'per_person', label: 'Per person' },
  { id: 'per_group', label: 'Per group' },
  { id: 'fixed', label: 'Fixed' },
];

export type ExtraServiceFormItem = {
  name: string;
  price_npr: number;
  unit: string;
  description?: string;
};

export const HOMESTAY_TYPES = ['individual', 'community'] as const;
export const HOMESTAY_CATEGORIES = ['rural', 'urban', 'eco', 'cultural', 'farmstay'] as const;

export const SECTION_KEYS: Record<string, string> = {
  history: 'Our History',
  owners_story: 'Our Story',
  about_us: 'About Us',
  their_community: 'Our Community',
};

export const PRICE_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: 'per_person', label: 'Per person' },
  { id: 'per_group', label: 'Per group' },
  { id: 'other', label: 'Other' },
];

export const WARD_NUMBERS = Array.from({ length: 40 }, (_, i) => i + 1);

/** @deprecated Use AMENITIES_OPTIONS for new listings. Kept for backward compatibility. */
export const FACILITY_GROUPS: FacilityGroup[] = [
  { id: 'water', label: 'Water', type: 'multi', options: [{ id: 'water_hot', label: 'Hot' }, { id: 'water_cold', label: 'Cold' }] },
  { id: 'internet', label: 'Internet', type: 'single', options: [{ id: 'wifi', label: 'Yes' }] },
  { id: 'food', label: 'Food', type: 'single', options: [{ id: 'food_veg', label: 'Vegetarian' }, { id: 'food_nonveg', label: 'Non-vegetarian' }, { id: 'food_both', label: 'Veg & Non-veg' }] },
  { id: 'bathroom', label: 'Bathroom', type: 'single', options: [{ id: 'bathroom_common', label: 'Common' }, { id: 'bathroom_private', label: 'Private' }] },
  { id: 'community_hall', label: 'Community Hall', type: 'single', options: [{ id: 'community_hall', label: 'Yes' }], hasCapacity: true },
  { id: 'community_museum', label: 'Community Museum', type: 'single', options: [{ id: 'community_museum', label: 'Yes' }] },
  { id: 'gift_shop', label: 'Gift Shop', type: 'single', options: [{ id: 'gift_shop', label: 'Yes' }] },
  { id: 'cultural_program', label: 'Cultural Program', type: 'single', options: [{ id: 'cultural_program', label: 'Yes' }], hasPriceType: true },
  { id: 'hiking', label: 'Hiking', type: 'single', options: [{ id: 'hiking', label: 'Yes' }], hasPriceType: true },
  { id: 'sightseeing', label: 'Sight-Seeing', type: 'single', options: [{ id: 'sightseeing', label: 'Yes' }], hasPriceType: true },
  { id: 'boating', label: 'Boating', type: 'single', options: [{ id: 'boating', label: 'Yes' }], hasPriceType: true },
  { id: 'farming', label: 'Farming', type: 'single', options: [{ id: 'farming', label: 'Yes' }], hasPriceType: true },
  { id: 'cooking', label: 'Cooking', type: 'single', options: [{ id: 'cooking', label: 'Yes' }], hasPriceType: true },
  { id: 'jungle_safari', label: 'Jungle Safari', type: 'single', options: [{ id: 'jungle_safari', label: 'Yes' }], hasPriceType: true },
  { id: 'yoga', label: 'Yoga', type: 'single', options: [{ id: 'yoga', label: 'Yes' }], hasPriceType: true },
  { id: 'meditation', label: 'Meditation', type: 'single', options: [{ id: 'meditation', label: 'Yes' }], hasPriceType: true },
  { id: 'parking', label: 'Parking', type: 'single', options: [{ id: 'parking', label: 'Yes' }] },
  { id: 'kitchen', label: 'Kitchen', type: 'single', options: [{ id: 'kitchen', label: 'Yes' }] },
  { id: 'garden', label: 'Garden', type: 'single', options: [{ id: 'garden', label: 'Yes' }] },
  { id: 'meals', label: 'Meals included', type: 'single', options: [{ id: 'meals', label: 'Yes' }] },
];
