// Fires two GENUINELY simultaneous create_booking() calls (two separate DB
// connections, raced with Promise.all) at the identical shop/date/time slot,
// repeated across several slots, and checks that exactly one succeeds per
// slot. This is the one property that reading the SQL can't confirm on its
// own -- it has to be tested under real concurrent load.
//
// Requires supabase/tests/run.sh to have set up the database first (it
// creates the `booktau_test_client` role this script connects as).
const { Client } = require('pg');

const DB = process.env.BOOKTAU_TEST_DB || 'booktau_test';
const CONN = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: DB,
  user: 'booktau_test_client',
  password: 'local-test-only',
};

const SHOP_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SERVICE_ID = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';

async function attemptBooking(time, customerName) {
  const client = new Client(CONN);
  await client.connect();
  await client.query('set role anon');
  try {
    const res = await client.query(
      `select (create_booking($1,$2,$3,$4,$5,$6)).booking_time as booked_time`,
      [SHOP_ID, SERVICE_ID, '2026-09-07', time, customerName, '+77001110000']
    );
    return { ok: true, row: res.rows[0] };
  } catch (err) {
    return { ok: false, message: err.message };
  } finally {
    await client.end();
  }
}

async function runRound(time) {
  const [a, b] = await Promise.all([
    attemptBooking(time, 'Customer A'),
    attemptBooking(time, 'Customer B'),
  ]);
  const successes = [a, b].filter((r) => r.ok);
  const slotTakenFailures = [a, b].filter((r) => !r.ok && r.message.includes('slot_taken'));
  const roundOk = successes.length === 1 && slotTakenFailures.length === 1;

  console.log(`\n--- Round @ ${time} ---`);
  console.log('A:', a.ok ? `SUCCESS (${a.row.booked_time})` : `REJECTED (${a.message})`);
  console.log('B:', b.ok ? `SUCCESS (${b.row.booked_time})` : `REJECTED (${b.message})`);
  console.log(roundOk ? 'PASS' : 'FAIL — double booking or unexpected error');
  return roundOk;
}

async function main() {
  const times = ['13:00', '13:30', '14:00', '14:30', '15:00'];
  const results = [];
  for (const t of times) results.push(await runRound(t));

  // Dedicated BYPASSRLS role (created by run.sh) so this check sees every
  // row regardless of ownership -- confirming the real, unfiltered state.
  const admin = new Client({ ...CONN, user: 'booktau_test_admin' });
  await admin.connect();
  const check = await admin.query(
    `select booking_time, count(*) as row_count from bookings
     where shop_id = $1 and booking_date = '2026-09-07' and booking_time = any($2::text[])
     group by booking_time order by booking_time`,
    [SHOP_ID, times]
  );
  await admin.end();

  console.log('\n=== Row counts per contested slot, verified directly in the database ===');
  console.table(check.rows);
  const anyDoubleBooked = check.rows.some((r) => Number(r.row_count) !== 1);

  console.log(`\n${results.filter(Boolean).length}/${results.length} concurrency rounds passed.`);
  console.log(anyDoubleBooked ? 'DB CHECK: FAIL — a slot has more than one row!' : 'DB CHECK: PASS — every contested slot has exactly 1 row.');

  process.exit(results.every(Boolean) && !anyDoubleBooked ? 0 : 1);
}

main().catch((e) => { console.error('Fatal test error:', e); process.exit(1); });
