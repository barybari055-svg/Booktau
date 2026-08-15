// Same rules as the chat demo: respects working hours, lunch breaks, blocked dates,
// past times today, won't offer a start time that runs past closing, and never
// double-books a slot that's already taken.

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(mins) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

export function getDayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[d.getDay()];
}

// toISOString() converts to UTC before formatting — for Kazakhstan (UTC+5/+6),
// that silently returns yesterday's date during the early-morning local hours.
// getFullYear/getMonth/getDate all read the LOCAL calendar date instead.
export function localDateStr(d) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * hours: array of { day_key, closed, open_time, close_time, lunch_start, lunch_end }
 * existingBookings: array of { booking_date, booking_time, duration_minutes }
 * dateStr: 'YYYY-MM-DD'
 * durationMinutes: number
 * now: Date (defaults to real current time — pass a fixed Date in tests)
 */
export function getAvailableSlots({ hours, existingBookings, dateStr, durationMinutes, now = new Date() }) {
  const dayKey = getDayKey(dateStr);
  const dayHours = hours.find((h) => h.day_key === dayKey);
  if (!dayHours || dayHours.closed || !dayHours.open_time || !dayHours.close_time) return [];

  const openMin = toMinutes(dayHours.open_time);
  const closeMin = toMinutes(dayHours.close_time);
  const lunchStart = dayHours.lunch_start ? toMinutes(dayHours.lunch_start) : null;
  const lunchEnd = dayHours.lunch_end ? toMinutes(dayHours.lunch_end) : null;

  const todayStr = localDateStr(now);
  const isToday = dateStr === todayStr;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const dayBookings = existingBookings.filter((b) => b.booking_date === dateStr);

  const slots = [];
  for (let start = openMin; start + durationMinutes <= closeMin; start += 30) {
    const end = start + durationMinutes;
    if (lunchStart !== null && lunchEnd !== null && start < lunchEnd && end > lunchStart) continue;
    if (isToday && start <= nowMin) continue;
    const overlap = dayBookings.some((b) => {
      const bs = toMinutes(b.booking_time);
      const be = bs + b.duration_minutes;
      return start < be && end > bs;
    });
    if (overlap) continue;
    slots.push(toHHMM(start));
  }
  return slots;
}
