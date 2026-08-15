import { bookingErrorMessage } from '../booking-errors.js';

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

assertEqual(
  bookingErrorMessage({ message: 'slot_taken: This time slot was just taken' }),
  'This time was just taken — please pick another slot.',
  'maps slot_taken to friendly message'
);

assertEqual(
  bookingErrorMessage({ message: 'rate_limited: Too many bookings' }),
  'Too many booking attempts — please wait a few minutes and try again.',
  'maps rate_limited to friendly message'
);

assertEqual(
  bookingErrorMessage({ message: 'random database error' }),
  'Something went wrong — please try again.',
  'falls back for unknown errors'
);

assertEqual(bookingErrorMessage(null), 'Something went wrong — please try again.', 'handles null error');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
