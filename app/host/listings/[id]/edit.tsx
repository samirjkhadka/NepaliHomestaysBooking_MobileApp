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
  AMENITIES_OPTIONS,
  EXTRA_SERVICE_UNITS,
  HOMESTAY_TYPES,
  HOMESTAY_CATEGORIES,
  SECTION_KEYS,
  WARD_NUMBERS,
  type ExtraServiceFormItem,
} from '@/constants/facilities';

function parseSections(sections?: Record<string, string> | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!sections || typeof sections !== 'object') return out;
  Object.entries(sections).forEach(([key, value]) => {
    if (typeof value === 'string' && !key.startsWith('facility_')) out[key] = value;
  });
  return out;
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
  const [extraServices, setExtraServices] = useState<ExtraServiceFormItem[]>([]);
  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [extraEditingIndex, setExtraEditingIndex] = useState<number | null>(null);
  const [extraForm, setExtraForm] = useState<ExtraServiceFormItem>({ name: '', price_npr: 0, unit: 'fixed', description: '' });
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
        const rawExtra = (list as { extra_services?: { name: string; price_npr: number; unit: string; description?: string | null }[] }).extra_services;
        setExtraServices(Array.isArray(rawExtra) ? rawExtra.map((e) => ({ name: e.name, price_npr: e.price_npr, unit: e.unit, description: e.description ?? undefined })) : []);
        setIsActive(list.is_active !== false && (list.status as string) !== 'disabled');
        const rawSections = list.sections as Record<string, string> | undefined;
        setSections((prev) => ({ ...prev, ...parseSections(rawSections) }));
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

  function toggleAmenity(id: string) {
    if (amenities.includes(id)) setAmenities(amenities.filter((a) => a !== id));
    else setAmenities([...amenities, id]);
  }

  function openExtraModal(index: number | null) {
    setExtraEditingIndex(index);
    setExtraForm(index !== null ? { ...extraServices[index] } : { name: '', price_npr: 0, unit: 'fixed', description: '' });
    setExtraModalOpen(true);
  }

  function saveExtra() {
    if (!extraForm.name.trim()) return;
    const item: ExtraServiceFormItem = {
      name: extraForm.name.trim(),
      price_npr: Number(extraForm.price_npr) || 0,
      unit: extraForm.unit,
      description: extraForm.description?.trim() || undefined,
    };
    if (extraEditingIndex !== null) {
      setExtraServices((prev) => prev.map((s, i) => (i === extraEditingIndex ? item : s)));
    } else {
      setExtraServices((prev) => [...prev, item]);
    }
    setExtraModalOpen(false);
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
        extra_services: extraServices.length ? extraServices.map((s) => ({ name: s.name, price_npr: s.price_npr, unit: s.unit, description: s.description ?? undefined })) : undefined,
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
      <View style={styles.inputRow}>
        <Ionicons name="pricetag-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Homestay name" placeholderTextColor={colors.text.muted} />
      </View>
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
          <View style={styles.inputRow}>
            <Ionicons name="business-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput style={styles.input} value={communityHouses} onChangeText={setCommunityHouses} keyboardType="number-pad" placeholder="e.g. 5" placeholderTextColor={colors.text.muted} />
          </View>
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
      <View style={styles.inputRow}>
        <Ionicons name="navigate-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="e.g. Thamel" placeholderTextColor={colors.text.muted} />
      </View>
      <Text style={styles.label}>Location (city/area) *</Text>
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Kathmandu" placeholderTextColor={colors.text.muted} />
      </View>
      <Text style={styles.label}>Map (optional) – Latitude</Text>
      <View style={styles.inputRow}>
        <Ionicons name="compass-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="e.g. 27.7172" placeholderTextColor={colors.text.muted} />
      </View>
      <Text style={styles.label}>Longitude</Text>
      <View style={styles.inputRow}>
        <Ionicons name="compass-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="e.g. 85.324" placeholderTextColor={colors.text.muted} />
      </View>

      <Text style={styles.sectionHead}>Pricing & capacity</Text>
      <Text style={styles.label}>Price per night (Rs) *</Text>
      <View style={styles.inputRow}>
        <Ionicons name="cash-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={pricePerNight} onChangeText={setPricePerNight} keyboardType="number-pad" placeholder="2000" placeholderTextColor={colors.text.muted} />
      </View>
      <Text style={styles.label}>Max guests *</Text>
      <View style={styles.inputRow}>
        <Ionicons name="people-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput style={styles.input} value={maxGuests} onChangeText={setMaxGuests} keyboardType="number-pad" placeholder="4" placeholderTextColor={colors.text.muted} />
      </View>

      <Text style={styles.sectionHead}>Description & directions</Text>
      <Text style={styles.label}>Description</Text>
      <View style={[styles.inputRow, styles.inputRowMultiline]}>
        <Ionicons name="document-text-outline" size={20} color={colors.text.muted} style={styles.inputIconTop} />
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your homestay" placeholderTextColor={colors.text.muted} multiline />
      </View>
      <Text style={styles.label}>Way to get there</Text>
      <View style={[styles.inputRow, styles.inputRowMultiline]}>
        <Ionicons name="car-outline" size={20} color={colors.text.muted} style={styles.inputIconTop} />
        <TextInput style={[styles.input, styles.textArea]} value={wayToGetThere} onChangeText={setWayToGetThere} placeholder="Directions, transport options" placeholderTextColor={colors.text.muted} multiline />
      </View>

      <Text style={styles.sectionHead}>Amenities (free inclusions)</Text>
      <View style={styles.amenityGrid}>
        {AMENITIES_OPTIONS.map((opt) => {
          const selected = amenities.includes(opt.id);
          const iconName = `${opt.icon}-outline` as keyof typeof Ionicons.glyphMap;
          return (
            <Pressable
              key={opt.id}
              style={[styles.amenityChip, selected && styles.amenityChipActive]}
              onPress={() => toggleAmenity(opt.id)}
            >
              <Ionicons name={iconName in Ionicons.glyphMap ? iconName : 'ellipse-outline'} size={20} color={selected ? colors.text.primary : colors.text.muted} style={styles.amenityIcon} />
              <Text style={[styles.amenityChipText, selected && styles.amenityChipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionHead}>Extra services (paid add-ons)</Text>
      <Pressable style={styles.imageBtn} onPress={() => openExtraModal(null)}>
        <Ionicons name="add-circle-outline" size={20} color={colors.accentAlt[500]} style={styles.btnIcon} />
        <Text style={styles.imageBtnText}>Add Extra Service</Text>
      </Pressable>
      {extraServices.length > 0 && (
        <View style={styles.extraList}>
          {extraServices.map((s, i) => (
            <View key={i} style={styles.extraCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.extraCardName}>{s.name}</Text>
                <Text style={styles.extraCardPrice}>NPR {Number(s.price_npr).toLocaleString()} ({EXTRA_SERVICE_UNITS.find((u) => u.id === s.unit)?.label ?? s.unit})</Text>
                {s.description ? <Text style={styles.extraCardDesc} numberOfLines={2}>{s.description}</Text> : null}
              </View>
              <Pressable onPress={() => openExtraModal(i)} style={styles.extraCardBtn}><Ionicons name="pencil-outline" size={20} color={colors.text.secondary} /></Pressable>
              <Pressable onPress={() => setExtraServices((prev) => prev.filter((_, j) => j !== i))} style={styles.extraCardBtn}><Ionicons name="trash-outline" size={20} color={colors.error} /></Pressable>
            </View>
          ))}
        </View>
      )}

      <Modal visible={extraModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setExtraModalOpen(false)}>
          <Pressable style={styles.extraModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sectionHead}>{extraEditingIndex !== null ? 'Edit' : 'Add'} Extra Service</Text>
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.modalInput} value={extraForm.name} onChangeText={(t) => setExtraForm((f) => ({ ...f, name: t }))} placeholder="e.g. Airport pickup" placeholderTextColor={colors.text.muted} />
            <Text style={styles.label}>Price (NPR) *</Text>
            <TextInput style={styles.modalInput} keyboardType="number-pad" value={String(extraForm.price_npr || '')} onChangeText={(t) => setExtraForm((f) => ({ ...f, price_npr: Number(t) || 0 }))} placeholder="0" placeholderTextColor={colors.text.muted} />
            <Text style={styles.label}>Unit</Text>
            <View style={styles.chipRow}>
              {EXTRA_SERVICE_UNITS.map((u) => (
                <Pressable key={u.id} style={[styles.chip, extraForm.unit === u.id && styles.chipActive]} onPress={() => setExtraForm((f) => ({ ...f, unit: u.id }))}>
                  <Text style={[styles.chipText, extraForm.unit === u.id && styles.chipTextActive]}>{u.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput style={[styles.modalInput, { minHeight: 60 }]} value={extraForm.description ?? ''} onChangeText={(t) => setExtraForm((f) => ({ ...f, description: t }))} placeholder="Short description" placeholderTextColor={colors.text.muted} multiline />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setExtraModalOpen(false)}><Text style={styles.modalBtnCancelText}>Cancel</Text></Pressable>
              <Pressable style={styles.modalBtnSave} onPress={saveExtra}><Text style={styles.buttonText}>Save</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={styles.sectionHead}>About your homestay (optional)</Text>
      {Object.entries(SECTION_KEYS).map(([key, label]) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.inputRow, styles.inputRowMultiline]}>
            <Ionicons name="book-outline" size={20} color={colors.text.muted} style={styles.inputIconTop} />
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={sections[key] ?? ''}
              onChangeText={(t) => setSections((prev) => ({ ...prev, [key]: t }))}
              placeholder={`Write about ${label.toLowerCase()}...`}
              placeholderTextColor={colors.text.muted}
              multiline
            />
          </View>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.input, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  inputRowMultiline: { alignItems: 'flex-start' },
  inputIcon: { marginRight: spacing.sm },
  inputIconTop: { marginRight: spacing.sm, marginTop: spacing.md },
  input: { flex: 1, color: colors.text.primary, fontSize: 16, paddingVertical: spacing.sm, minHeight: 24 },
  inputSmall: { marginBottom: spacing.sm },
  textArea: { minHeight: 80, paddingTop: spacing.sm },
  textAreaSmall: { minHeight: 60, paddingTop: spacing.sm },
  chipRow: { marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface.card, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: colors.accent[500] },
  chipText: { color: colors.text.secondary, fontSize: 14 },
  chipTextActive: { color: colors.text.primary, fontWeight: '600' },
  placeholder: { color: colors.text.muted, fontSize: 14, marginBottom: spacing.md },
  loaderInline: { marginBottom: spacing.md },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  dropdownText: { color: colors.text.primary, fontSize: 16 },
  dropdownPlaceholder: { color: colors.text.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface.card, borderRadius: radius.md, maxHeight: 320 },
  modalScroll: { maxHeight: 300 },
  modalOption: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surface.input },
  modalOptionActive: { backgroundColor: colors.accent[500] },
  modalOptionText: { color: colors.text.primary, fontSize: 16 },
  modalOptionTextActive: { color: colors.text.primary, fontWeight: '600' },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  amenityIcon: { marginRight: spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surface.card, marginRight: spacing.xs, marginBottom: spacing.xs, maxWidth: '100%' },
  amenityChipActive: { backgroundColor: colors.accent[500] },
  amenityChipText: { color: colors.text.secondary, fontSize: 14, flex: 1, textAlign: 'justify' as const },
  amenityChipTextActive: { color: colors.text.primary, fontWeight: '600' },
  extraList: { marginBottom: spacing.md },
  extraCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  extraCardName: { color: colors.text.primary, fontWeight: '600', marginBottom: 2 },
  extraCardPrice: { color: colors.text.muted, fontSize: 13, marginBottom: 2 },
  extraCardDesc: { color: colors.text.secondary, fontSize: 13 },
  extraCardBtn: { padding: spacing.sm, marginLeft: spacing.xs },
  extraModalContent: { backgroundColor: colors.primary[600], borderRadius: radius.md, padding: spacing.lg, maxWidth: 400, width: '100%' },
  modalInput: { backgroundColor: colors.surface.input, borderRadius: radius.sm, padding: spacing.md, color: colors.text.primary, fontSize: 16, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  modalBtnCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalBtnCancelText: { color: colors.text.muted },
  modalBtnSave: { backgroundColor: colors.accent[500], borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  imageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  imageBtnText: { color: colors.accentAlt[500] },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  btnIcon: { marginRight: spacing.sm },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
});
