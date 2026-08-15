import { getAvailableSlots, localDateStr, toMinutes, toHHMM, getDayKey } from '../availability.js';

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

const weekdayHours = [
  { day_key: 'mon', closed: false, open_time: '10:00', close_time: '19:00', lunch_start: '13:00', lunch_end: '14:00' },
  { day_key: 'sun', closed: true, open_time: null, close_time: null, lunch_start: null, lunch_end: null },
];

// --- Timezone fix: the actual bug found and fixed this round ---
const almatyEarlyMorning = new Date('2026-08-16T02:00:00+06:00');
assertEqual(localDateStr(almatyEarlyMorning), '2026-08-16', 'localDateStr gives the correct LOCAL date at 2am Almaty time (was returning 2026-08-15 via toISOString before the fix)');

// --- Basic slot generation, no lunch, no bookings ---
const basicHours = [{ day_key: 'mon', closed: false, open_time: '10:00', close_time: '12:00', lunch_start: null, lunch_end: null }];
assertEqual(
  getAvailableSlots({ hours: basicHours, existingBookings: [], dateStr: '2026-08-17', durationMinutes: 30, now: new Date('2026-08-01T00:00:00') }),
  ['10:00', '10:30', '11:00', '11:30'],
  'basic 30-min slots from 10:00-12:00, no lunch — last slot is 11:30 (11:30+30=12:00, fits exactly)'
);

// --- Lunch break excludes slots that would actually overlap it ---
// 12:30-13:00 ends exactly as lunch begins — not an overlap, correctly included.
assertEqual(
  getAvailableSlots({ hours: weekdayHours, existingBookings: [], dateStr: '2026-08-17', durationMinutes: 30, now: new Date('2026-08-01T00:00:00') }),
  ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'],
  'lunch 13:00-14:00: 13:00 and 13:30 excluded (genuinely overlap), 12:30 correctly included (ends exactly as lunch starts, not an overlap), resumes cleanly at 14:00'
);

// --- Closed day returns nothing ---
assertEqual(
  getAvailableSlots({ hours: weekdayHours, existingBookings: [], dateStr: '2026-08-16', durationMinutes: 30, now: new Date('2026-08-01T00:00:00') }),
  [],
  'closed day (sunday, 2026-08-16) returns no slots at all'
);

// --- Duration that would run past closing is excluded ---
assertEqual(
  getAvailableSlots({ hours: basicHours, existingBookings: [], dateStr: '2026-08-17', durationMinutes: 45, now: new Date('2026-08-01T00:00:00') }),
  ['10:00', '10:30', '11:00'],
  '45-min service against a 10:00-12:00 window — 11:30 correctly excluded since 11:30+45=12:15 runs past closing'
);

// --- Existing booking blocks the overlapping slot (double-booking prevention) ---
const oneBooking = [{ booking_date: '2026-08-17', booking_time: '10:30', duration_minutes: 30 }];
assertEqual(
  getAvailableSlots({ hours: basicHours, existingBookings: oneBooking, dateStr: '2026-08-17', durationMinutes: 30, now: new Date('2026-08-01T00:00:00') }),
  ['10:00', '11:00', '11:30'],
  '10:30 is already booked — correctly excluded from the results, everything else stays'
);

// --- A longer new-service duration correctly excludes a slot that would overlap a short existing booking ---
assertEqual(
  getAvailableSlots({ hours: basicHours, existingBookings: oneBooking, dateStr: '2026-08-17', durationMinutes: 60, now: new Date('2026-08-01T00:00:00') }),
  ['11:00'],
  '60-min service: 10:00 would run into the 10:30 booking (10:00-11:00 overlaps 10:30-11:00), correctly excluded; only 11:00 fits'
);

// --- Past times today are excluded, future times today are not ---
const todayNoon = new Date('2026-08-17T12:15:00');
assertEqual(
  getAvailableSlots({ hours: basicHours, existingBookings: [], dateStr: '2026-08-17', durationMinutes: 30, now: todayNoon }),
  [],
  'if it is 12:15 today and the shop closes at 12:00, nothing is left today (also confirms nothing after closing leaks through)'
);
const todayMorning = new Date('2026-08-17T10:45:00');
assertEqual(
  getAvailableSlots({ hours: basicHours, existingBookings: [], dateStr: '2026-08-17', durationMinutes: 30, now: todayMorning }),
  ['11:00', '11:30'],
  'at 10:45 today, 10:00 and 10:30 are in the past and excluded; 11:00 and 11:30 remain'
);

// --- A future date is unaffected by "now" being later in the day ---
const basicHoursTwoDays = [
  ...basicHours,
  { day_key: 'tue', closed: false, open_time: '10:00', close_time: '12:00', lunch_start: null, lunch_end: null },
];
assertEqual(
  getAvailableSlots({ hours: basicHoursTwoDays, existingBookings: [], dateStr: '2026-08-18', durationMinutes: 30, now: todayMorning }),
  ['10:00', '10:30', '11:00', '11:30'],
  'booking for tomorrow (2026-08-18, a Tuesday) while it is currently mid-morning today (Monday) — all slots available, past-time filter does not leak across dates'
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
