/** Parsed row from `bookings.amenity_charges_json` (chargeable add-ons). */
export type AmenityLine = { name: string; quantity: number; unit_price: number; total: number };

export function parseAmenityChargesJson(raw: string | null | undefined): AmenityLine[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AmenityLine[]) : [];
  } catch {
    return [];
  }
}

export function sumAmenityTotals(lines: AmenityLine[]): number {
  return lines.reduce((s, l) => s + (Number(l.total) || 0), 0);
}

export function preFeeTotalNpr(subtotalNpr: number | null | undefined, amenityLines: AmenityLine[]): number {
  const sub = subtotalNpr != null && Number.isFinite(Number(subtotalNpr)) ? Number(subtotalNpr) : 0;
  return sub + sumAmenityTotals(amenityLines);
}

export function bookingFeeDelta(
  subtotalNpr: number | null | undefined,
  amenityLines: AmenityLine[],
  totalNpr: number | null | undefined
): { serviceChargeNpr: number | null; discountNpr: number | null; preFeeTotalNpr: number } {
  const pre = preFeeTotalNpr(subtotalNpr, amenityLines);
  if (totalNpr == null || !Number.isFinite(Number(totalNpr))) {
    return { serviceChargeNpr: null, discountNpr: null, preFeeTotalNpr: pre };
  }
  const total = Number(totalNpr);
  const diff = total - pre;
  const eps = 0.005;
  if (diff > eps) return { serviceChargeNpr: diff, discountNpr: null, preFeeTotalNpr: pre };
  if (diff < -eps) return { serviceChargeNpr: null, discountNpr: -diff, preFeeTotalNpr: pre };
  return { serviceChargeNpr: null, discountNpr: null, preFeeTotalNpr: pre };
}
