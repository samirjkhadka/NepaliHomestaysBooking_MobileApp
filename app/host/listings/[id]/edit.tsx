import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, type Listing, type Province, type District, type Municipality, type CreateListingBody } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import {
  FACILITY_GROUPS,
  HOMESTAY_TYPES,
  HOMESTAY_CATEGORIES,
  SECTION_KEYS,
  PRICE_TYPE_OPTIONS,
  WARD_NUMBERS,
} from '@/constants/facilities';

function parseSectionsAndExtras(sections?: Record<string, string> | null): { sections: Record<string, string>; facilityExtras: Record<string, string> } {
  const contentSections: Record<string, string> = {};
  const facilityExtras: Record<string, string> = {};
  if (!sections || typeof sections !== 'object') return { sections: contentSections, facilityExtras };
  Object.entries(sections).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    if (key.startsWith('facility_')) {
      facilityExtras[key.slice('facility_'.length)] = value;
    } else {
      contentSections[key] = value;
    }
  });
  return { sections: contentSections, facilityExtras };
}

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lid = parseInt(String(id ?? ''), 10);
  const router = useRouter();
  const { token } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(false);
  const [municipalityDropdownOpen, setMunicipalityDropdownOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'individual' | 'community'>('individual');
  const [category, setCategory] = useState('');
  const [communityHouses, setCommunityHouses] = useState('');
  const [location, setLocation] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [street, setStreet] = useState('');
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [description, setDescription] = useState('');
  const [wayToGetThere, setWayToGetThere] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [facilityExtras, setFacilityExtras] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Record<string, string>>({
    history: '',
    owners_story: '',
    about_us: '',
    their_community: '',
  });
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Number.isNaN(lid) || !token) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.getListing(lid),
      api.getProvinces().then((p) => (Array.isArray(p) ? p : [])),
    ]).then(([l, p]) => {
      const list = l as Listing;
      setListing(list);
      setProvinces(p as Province[]);
      if (list) {
        setTitle(list.title ?? '');
        const t = (list.type as string) ?? 'individual';
        setType(t === 'community' ? 'community' : 'individual');
        setCategory((list.category as string) ?? '');
        setLocation(list.location ?? '');
        setPricePerNight(String(list.price_per_night ?? ''));
        setMaxGuests(String(list.max_guests ?? 2));
        setDescription(list.description ?? '');
        setWayToGetThere((list.way_to_get_there as string) ?? '');
        setProvinceId(list.province_id ?? null);
        setDistrictId(list.district_id ?? null);
        setLatitude(list.latitude != null ? String(list.latitude) : '');
        setLongitude(list.longitude != null ? String(list.longitude) : '');
        const am = list.amenities;
        setAmenities(Array.isArray(am) ? am : []);
        setIsActive(list.is_active !== false && (list.status as string) !== 'disabled');
        const rawSections = list.sections as Record<string, string> | undefined;
        const { sections: content, facilityExtras: extras } = parseSectionsAndExtras(rawSections);
        setSections((prev) => ({ ...prev, ...content }));
        setFacilityExtras(extras);
      }
    }).catch(() => setListing(null)).finally(() => setLoading(false));
  }, [lid, token]);

  useEffect(() => {
    if (provinceId) {
      api.getDistricts(provinceId).then((d) => setDistricts(Array.isArray(d) ? d : [])).catch(() => setDistricts([]));
    } else setDistricts([]);
  }, [provinceId]);

  useEffect(() => {
    if (districtId) {
      setMunicipalitiesLoading(true);
      api.getMunicipalities(districtId)
        .then((r) => setMunicipalities(r.municipalities ?? []))
        .catch(() => setMunicipalities([]))
        .finally(() => setMunicipalitiesLoading(false));
    } else {
      setMunicipalities([]);
      setMunicipalitiesLoading(false);
    }
  }, [districtId]);

  function toggleAmenity(optId: string, groupId: string, groupType: 'single' | 'multi') {
    const group = FACILITY_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    const optionIds = group.options.map((o) => o.id);
    if (groupType === 'single') {
      const already = amenities.includes(optId);
      const withoutGroup = amenities.filter((a) => !optionIds.includes(a));
      setAmenities(already ? withoutGroup : [...withoutGroup, optId]);
    } else {
      setAmenities(amenities.includes(optId) ? amenities.filter((x) => x !== optId) : [...amenities, optId]);
    }
  }

  async function save() {
    if (!token || !listing) return;
    if (!title.trim() || !location.trim() || !pricePerNight.trim() || !maxGuests.trim()) {
      Alert.alert('Required fields', 'Fill in title, location, price per night, and max guests.');
      return;
    }
    if (districtId && !municipalityId) {
      Alert.alert('Required', 'Please select a municipality when a district is selected.');
      return;
    }
    if (type === 'community') {
      const n = parseInt(communityHouses, 10);
      if (Number.isNaN(n) || n < 1) {
        Alert.alert('Invalid', 'Enter number of houses (at least 1) for community homestay.');
        return;
      }
    }
    const price = parseFloat(pricePerNight);
    const guests = parseInt(maxGuests, 10);
    if (isNaN(price) || price <= 0 || isNaN(guests) || guests < 1) {
      Alert.alert('Invalid', 'Price and max guests must be positive numbers.');
      return;
    }
    setSaving(true);
    try {
      const locationParts = [
        street.trim(),
        wardNo ? `Ward ${wardNo}` : null,
        municipalityId && municipalities.length ? (municipalities.find((m) => m.id === municipalityId)?.name ?? '') : null,
        location.trim(),
      ].filter(Boolean);
      const locationStr = locationParts.length ? locationParts.join(', ') : location.trim();
      let desc = description.trim();
      if (type === 'community' && communityHouses.trim()) {
        const n = communityHouses.trim();
        desc = `Community homestay (${n} house${n === '1' ? '' : 's'}). ${desc}`.trim();
      }
      const sectionsFiltered: Record<string, string> = {};
      Object.entries(sections).forEach(([k, v]) => {
        if (v?.trim()) sectionsFiltered[k] = v.trim();
      });
      Object.entries(facilityExtras).forEach(([k, v]) => {
        if (v?.trim()) sectionsFiltered[`facility_${k}`] = v.trim();
      });
      const body: Partial<CreateListingBody> = {
        title: title.trim(),
        type,
        location: locationStr,
        price_per_night: price,
        max_guests: guests,
        description: desc || undefined,
        way_to_get_there: wayToGetThere.trim() || undefined,
        province_id: provinceId ?? undefined,
        district_id: districtId ?? undefined,
        latitude: latitude.trim() ? parseFloat(latitude) : undefined,
        longitude: longitude.trim() ? parseFloat(longitude) : undefined,
        category: category.trim() || undefined,
        amenities: amenities.length ? amenities : undefined,
        sections: Object.keys(sectionsFiltered).length ? sectionsFiltered : undefined,
      };
      await api.updateListing(token, listing.id, body);
      await api.setListingStatus(token, listing.id, isActive ? 'approved' : 'disabled');
      Alert.alert('Saved', 'Listing updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to update';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }
  if (!listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Listing not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHead}>Basics</Text>
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Homestay name" placeholderTextColor={colors.text.muted} />
      <Text style={styles.label}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {HOMESTAY_TYPES.map((t) => (
          <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {type === 'community' && (
        <>
          <Text style={styles.label}>Number of houses *</Text>
          <TextInput style={styles.input} value={communityHouses} onChangeText={setCommunityHouses} keyboardType="number-pad" placeholder="e.g. 5" placeholderTextColor={colors.text.muted} />
        </>
      )}
      <Text style={styles.label}>Category (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable style={[styles.chip, !category && styles.chipActive]} onPress={() => setCategory('')}>
          <Text style={[styles.chipText, !category && styles.chipTextActive]}>None</Text>
        </Pressable>
        {HOMESTAY_CATEGORIES.map((c) => (
          <Pressable key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionHead}>Location</Text>
      <Text style={styles.label}>Province</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable style={[styles.chip, !provinceId && styles.chipActive]} onPress={() => setProvinceId(null)}>
          <Text style={[styles.chipText, !provinceId && styles.chipTextActive]}>None</Text>
        </Pressable>
        {provinces.map((p) => (
          <Pressable key={p.id} style={[styles.chip, provinceId === p.id && styles.chipActive]} onPress={() => setProvinceId(p.id)}>
            <Text style={[styles.chipText, provinceId === p.id && styles.chipTextActive]}>{p.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {districts.length > 0 && (
        <>
          <Text style={styles.label}>District</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <Pressable style={[styles.chip, !districtId && styles.chipActive]} onPress={() => { setDistrictId(null); setMunicipalityId(null); }}>
              <Text style={[styles.chipText, !districtId && styles.chipTextActive]}>None</Text>
            </Pressable>
            {districts.map((d) => (
              <Pressable key={d.id} style={[styles.chip, districtId === d.id && styles.chipActive]} onPress={() => setDistrictId(d.id)}>
                <Text style={[styles.chipText, districtId === d.id && styles.chipTextActive]}>{d.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
      <Text style={styles.label}>Municipality {districtId ? '* (required when district selected)' : ''}</Text>
      {!districtId ? (
        <Text style={styles.placeholder}>Select a district above to choose municipality</Text>
      ) : municipalitiesLoading ? (
        <ActivityIndicator size="small" color={colors.accent[500]} style={styles.loaderInline} />
      ) : (
        <>
          <Pressable
            style={styles.dropdown}
            onPress={() => setMunicipalityDropdownOpen(true)}
          >
            <Text style={[styles.dropdownText, municipalityId == null && styles.dropdownPlaceholder]}>
              {municipalityId != null ? (municipalities.find((m) => m.id === municipalityId)?.name ?? 'Select municipality') : 'Select municipality'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.text.muted} />
          </Pressable>
          <Modal
            visible={municipalityDropdownOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setMunicipalityDropdownOpen(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setMunicipalityDropdownOpen(false)}>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                  <Pressable
                    style={[styles.modalOption, municipalityId === null && styles.modalOptionActive]}
                    onPress={() => { setMunicipalityId(null); setMunicipalityDropdownOpen(false); }}
                  >
                    <Text style={[styles.modalOptionText, municipalityId === null && styles.modalOptionTextActive]}>None</Text>
                  </Pressable>
                  {municipalities.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[styles.modalOption, municipalityId === m.id && styles.modalOptionActive]}
                      onPress={() => { setMunicipalityId(m.id); setMunicipalityDropdownOpen(false); }}
                    >
                      <Text style={[styles.modalOptionText, municipalityId === m.id && styles.modalOptionTextActive]}>{m.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        </>
      )}
      <Text style={styles.label}>Ward no. (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable style={[styles.chip, !wardNo && styles.chipActive]} onPress={() => setWardNo('')}>
          <Text style={[styles.chipText, !wardNo && styles.chipTextActive]}>None</Text>
        </Pressable>
        {WARD_NUMBERS.map((n) => (
          <Pressable key={n} style={[styles.chip, wardNo === String(n) && styles.chipActive]} onPress={() => setWardNo(String(n))}>
            <Text style={[styles.chipText, wardNo === String(n) && styles.chipTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.label}>Street / area name</Text>
      <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="e.g. Thamel" placeholderTextColor={colors.text.muted} />
      <Text style={styles.label}>Location (city/area) *</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Kathmandu" placeholderTextColor={colors.text.muted} />
      <Text style={styles.label}>Map (optional) – Latitude</Text>
      <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="e.g. 27.7172" placeholderTextColor={colors.text.muted} />
      <Text style={styles.label}>Longitude</Text>
      <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="e.g. 85.324" placeholderTextColor={colors.text.muted} />

      <Text style={styles.sectionHead}>Pricing & capacity</Text>
      <Text style={styles.label}>Price per night (Rs) *</Text>
      <TextInput style={styles.input} value={pricePerNight} onChangeText={setPricePerNight} keyboardType="number-pad" placeholder="2000" placeholderTextColor={colors.text.muted} />
      <Text style={styles.label}>Max guests *</Text>
      <TextInput style={styles.input} value={maxGuests} onChangeText={setMaxGuests} keyboardType="number-pad" placeholder="4" placeholderTextColor={colors.text.muted} />

      <Text style={styles.sectionHead}>Description & directions</Text>
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your homestay" placeholderTextColor={colors.text.muted} multiline />
      <Text style={styles.label}>Way to get there</Text>
      <TextInput style={[styles.input, styles.textArea]} value={wayToGetThere} onChangeText={setWayToGetThere} placeholder="Directions, transport options" placeholderTextColor={colors.text.muted} multiline />

      <Text style={styles.sectionHead}>Facilities (checkboxes)</Text>
      {FACILITY_GROUPS.map((group) => {
        const isYes = group.options.some((o) => amenities.includes(o.id));
        return (
          <View key={group.id} style={styles.facilityGroup}>
            <Text style={styles.facilityLabel}>{group.label}</Text>
            <View style={styles.facilityRow}>
              {group.options.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={[styles.amenityChip, amenities.includes(opt.id) && styles.amenityChipActive]}
                  onPress={() => toggleAmenity(opt.id, group.id, group.type)}
                >
                  <Text style={[styles.amenityChipText, amenities.includes(opt.id) && styles.amenityChipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            {group.hasCapacity && isYes && (
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Capacity (e.g. 50)"
                placeholderTextColor={colors.text.muted}
                value={facilityExtras[`${group.id}_capacity`] ?? ''}
                onChangeText={(t) => setFacilityExtras((prev) => ({ ...prev, [`${group.id}_capacity`]: t }))}
              />
            )}
            {group.hasPriceType && isYes && (
              <View style={styles.facilityExtras}>
                <Text style={styles.label}>Price type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {PRICE_TYPE_OPTIONS.map((o) => (
                    <Pressable
                      key={o.id}
                      style={[styles.chip, (facilityExtras[`${group.id}_price_type`] ?? '') === o.id && styles.chipActive]}
                      onPress={() => setFacilityExtras((prev) => ({ ...prev, [`${group.id}_price_type`]: o.id }))}
                    >
                      <Text style={[styles.chipText, (facilityExtras[`${group.id}_price_type`] ?? '') === o.id && styles.chipTextActive]}>{o.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.label}>Price (NPR)</Text>
                <TextInput
                  style={[styles.input, styles.inputSmall]}
                  keyboardType="number-pad"
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.text.muted}
                  value={facilityExtras[`${group.id}_price`] ?? ''}
                  onChangeText={(t) => setFacilityExtras((prev) => ({ ...prev, [`${group.id}_price`]: t }))}
                />
              </View>
            )}
          </View>
        );
      })}

      <Text style={styles.sectionHead}>About your homestay (optional)</Text>
      {Object.entries(SECTION_KEYS).map(([key, label]) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, styles.textAreaSmall]}
            value={sections[key] ?? ''}
            onChangeText={(t) => setSections((prev) => ({ ...prev, [key]: t }))}
            placeholder={`Write about ${label.toLowerCase()}...`}
            placeholderTextColor={colors.text.muted}
            multiline
          />
        </View>
      ))}

      <View style={styles.switchRow}>
        <Text style={styles.label}>Listing active (visible to guests)</Text>
        <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: colors.surface.card, true: colors.accent[500] }} thumbColor="#fff" />
      </View>

      <Pressable style={styles.button} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : (
          <View style={styles.buttonInner}>
            <Ionicons name="save-outline" size={20} color={colors.text.primary} style={styles.btnIcon} />
            <Text style={styles.buttonText}>Save changes</Text>
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted },
  sectionHead: { ...typography.subtitle, color: colors.accentAlt[500], marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { color: colors.text.secondary, marginBottom: 4 },
  input: { backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, color: colors.text.primary, marginBottom: spacing.md },
  inputSmall: { marginBottom: spacing.sm },
  textArea: { minHeight: 80 },
  textAreaSmall: { minHeight: 60 },
  chipRow: { marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface.card, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: colors.accent[500] },
  chipText: { color: colors.text.secondary, fontSize: 14 },
  chipTextActive: { color: colors.text.primary, fontWeight: '600' },
  placeholder: { color: colors.text.muted, fontSize: 14, marginBottom: spacing.md },
  loaderInline: { marginBottom: spacing.md },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  dropdownText: { color: colors.text.primary, fontSize: 16 },
  dropdownPlaceholder: { color: colors.text.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface.card, borderRadius: radius.md, maxHeight: 320 },
  modalScroll: { maxHeight: 300 },
  modalOption: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surface.input },
  modalOptionActive: { backgroundColor: colors.accent[500] },
  modalOptionText: { color: colors.text.primary, fontSize: 16 },
  modalOptionTextActive: { color: colors.text.primary, fontWeight: '600' },
  facilityGroup: { marginBottom: spacing.lg },
  facilityLabel: { fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs },
  facilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  facilityExtras: { marginTop: spacing.sm },
  amenityChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.surface.card, marginRight: spacing.xs, marginBottom: spacing.xs },
  amenityChipActive: { backgroundColor: colors.accent[500] },
  amenityChipText: { color: colors.text.secondary, fontSize: 14 },
  amenityChipTextActive: { color: colors.text.primary, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  btnIcon: { marginRight: spacing.sm },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
});
