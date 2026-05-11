/** Align guest/host messaging rules with web GuestDashboard / HostDashboard. */

export function bookingStatusNorm(s: string | undefined): string {
  return (s || '').toLowerCase().trim();
}

/** True when guest or host may send messages for this booking status. */
export function canSendMessagesForBookingStatus(status: string | undefined): boolean {
  const s = bookingStatusNorm(status);
  return ['pending_payment', 'approved', 'partial_paid', 'paid'].includes(s);
}
