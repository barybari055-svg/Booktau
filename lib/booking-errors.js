// Maps Postgres/Supabase RPC errors to user-facing messages.
export function bookingErrorMessage(error) {
  if (!error) return 'Something went wrong — please try again.';

  const msg = error.message || '';
  const detail = error.details || '';

  if (msg.includes('slot_taken') || detail.includes('slot_taken')) {
    return 'This time was just taken — please pick another slot.';
  }
  if (msg.includes('rate_limited') || detail.includes('rate_limited')) {
    return 'Too many booking attempts — please wait a few minutes and try again.';
  }
  if (msg.includes('blocked_date') || msg.includes('shop_closed') || msg.includes('outside_hours') || msg.includes('lunch_break')) {
    return 'That time is no longer available — please go back and pick another date or time.';
  }
  if (msg.includes('past_date') || msg.includes('past_time')) {
    return 'That time has already passed — please pick a future slot.';
  }
  if (msg.includes('invalid_service') || msg.includes('invalid_input')) {
    return 'Please check your details and try again.';
  }

  return 'Something went wrong — please try again.';
}
