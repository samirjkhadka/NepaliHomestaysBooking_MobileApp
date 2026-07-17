/// Turn API snake_case / underscore statuses into human-readable labels.
String humanReadableStatus(String? raw) {
  if (raw == null || raw.trim().isEmpty) return '';
  final key = raw.trim().toLowerCase().replaceAll('-', '_');
  const known = {
    'paid': 'Paid',
    'pending_payment': 'Pending payment',
    'pending': 'Pending',
    'approved': 'Approved',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
    'completed': 'Completed',
    'confirmed': 'Confirmed',
    'rejected': 'Rejected',
    'refunded': 'Refunded',
    'partially_paid': 'Partially paid',
    'unpaid': 'Unpaid',
    'active': 'Active',
    'inactive': 'Inactive',
    'draft': 'Draft',
  };
  if (known.containsKey(key)) return known[key]!;
  return key
      .split('_')
      .where((p) => p.isNotEmpty)
      .map((p) => '${p[0].toUpperCase()}${p.substring(1)}')
      .join(' ');
}
