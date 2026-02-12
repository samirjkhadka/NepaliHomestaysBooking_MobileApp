/**
 * Facility/amenity groups and options – aligned with frontend src/data/districts.ts
 * Used for add/edit listing checkboxes.
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
