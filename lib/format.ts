/** Format amount as Rs 1,000.00 (comma-separated, 2 decimals) */
export function formatRs(amount: number | undefined | null): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs 0.00';
  return 'Rs ' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format date/time as YYYY-MM-DD HH:MM:SS */
export function formatDateTime(date: Date | string | number | undefined | null): string {
  if (date == null) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}
